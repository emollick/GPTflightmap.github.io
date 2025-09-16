const MAP_CENTER = [39.8283, -98.5795];
const DEFAULT_ZOOM = 4;
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

const delayScale = [
  { max: 0.12, color: "#4caf50", label: "< 12%" },
  { max: 0.18, color: "#8bc34a", label: "12 - 18%" },
  { max: 0.24, color: "#ffeb3b", label: "18 - 24%" },
  { max: 0.32, color: "#ffc107", label: "24 - 32%" },
  { max: 1, color: "#f44336", label: "> 32%" }
];

let map;
let airportLayer;
let routeLayer;
let airportMarkers = new Map();
let airportData = [];
let selectedAirport = null;
let refreshTimer = null;
let hasInitializedBounds = false;

document.addEventListener("DOMContentLoaded", () => {
  initMap();
  loadData();
  scheduleRefresh();
});

function initMap() {
  map = L.map("map", {
    center: MAP_CENTER,
    zoom: DEFAULT_ZOOM,
    worldCopyJump: true,
    maxBoundsViscosity: 0.75
  });

  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution:
      "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors &copy; <a href='https://carto.com/attributions'>CARTO</a>",
    minZoom: 2,
    maxZoom: 10
  }).addTo(map);

  airportLayer = L.layerGroup().addTo(map);
  routeLayer = L.layerGroup().addTo(map);

  L.control.scale({ position: "bottomleft", imperial: true }).addTo(map);

  buildLegend();
}

async function loadData() {
  toggleLoading(true);

  try {
    const response = await fetch(`data/airport_delays.json?cacheBust=${Date.now()}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch data (${response.status})`);
    }

    const payload = await response.json();
    airportData = Array.isArray(payload.airports) ? payload.airports : [];

    updateSummary(payload);
    renderAirportList();
    plotAirports();

    if (payload.last_updated) {
      const lastUpdated = new Date(payload.last_updated);
      const options = {
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
        month: "short",
        day: "numeric"
      };
      document.getElementById("last-updated").textContent = `Last updated ${lastUpdated.toLocaleString(undefined, options)}`;
    }
  } catch (error) {
    console.error(error);
    showError(error.message || "Unable to retrieve live delay data.");
  } finally {
    toggleLoading(false);
  }
}

function scheduleRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
  refreshTimer = setInterval(loadData, REFRESH_INTERVAL);
}

function plotAirports() {
  airportLayer.clearLayers();
  routeLayer.clearLayers();
  airportMarkers.clear();

  if (!airportData.length) {
    showEmptyState();
    return;
  }

  const bounds = L.latLngBounds([]);

  airportData.forEach((airport) => {
    const delayRatio = airport.delayedFlights / Math.max(airport.totalFlights, 1);
    const marker = L.circleMarker([airport.latitude, airport.longitude], {
      radius: getMarkerRadius(airport.totalFlights),
      color: getDelayColor(delayRatio),
      fillColor: getDelayColor(delayRatio),
      fillOpacity: 0.85,
      opacity: 0.9,
      weight: 1.5
    });

    marker.options.originalRadius = marker.options.radius;

    marker.bindTooltip(
      `<strong>${airport.iata}</strong><br>${airport.name}<br>${formatPercentage(delayRatio)} delayed`
    );

    marker.on("click", () => {
      selectAirport(airport);
      focusMarker(marker);
    });

    marker.addTo(airportLayer);
    airportMarkers.set(airport.iata, { marker, airport });
    bounds.extend([airport.latitude, airport.longitude]);
  });

  if (!bounds.isEmpty() && !hasInitializedBounds) {
    map.fitBounds(bounds.pad(0.25));
    hasInitializedBounds = true;
  }

  const firstAirport = selectedAirport
    ? airportData.find((a) => a.iata === selectedAirport.iata)
    : airportData
        .slice()
        .sort((a, b) => b.delayedFlights / b.totalFlights - a.delayedFlights / a.totalFlights)[0];

  if (firstAirport) {
    selectAirport(firstAirport);
    const { marker } = airportMarkers.get(firstAirport.iata);
    focusMarker(marker);
  }
}

function focusMarker(marker) {
  airportMarkers.forEach(({ marker: otherMarker }) => {
    otherMarker.setStyle({
      weight: 1.5,
      radius: otherMarker.options.originalRadius || otherMarker.options.radius,
      fillOpacity: 0.85
    });
  });

  const highlightRadius = (marker.options.originalRadius || marker.options.radius) * 1.18;
  marker.setStyle({ weight: 3, radius: highlightRadius, fillOpacity: 1 });
}

function selectAirport(airport) {
  selectedAirport = airport;
  renderDetails(airport);
  drawRoutes(airport);
  highlightListItem(airport.iata);
}

function drawRoutes(airport) {
  routeLayer.clearLayers();

  if (!Array.isArray(airport.routes) || !airport.routes.length) {
    return;
  }

  const maxDelayed = Math.max(...airport.routes.map((route) => route.delayedFlights));

  airport.routes.forEach((route) => {
    const arcPoints = buildGreatCircle(
      airport.latitude,
      airport.longitude,
      route.latitude,
      route.longitude,
      128
    );

    const weight = 2 + (route.delayedFlights / Math.max(maxDelayed, 1)) * 6;

    const polyline = L.polyline(arcPoints, {
      color: "#ff7043",
      weight,
      opacity: 0.85,
      className: "route-line"
    }).addTo(routeLayer);

    polyline.bindTooltip(
      `<strong>${airport.iata} → ${route.destination}</strong><br>${route.delayedFlights} delayed flights<br>${route.avgDelayMinutes} min avg delay`,
      { sticky: true }
    );
  });
}

function renderAirportList() {
  const listEl = document.querySelector(".airport-list ul");
  if (!listEl) return;

  listEl.innerHTML = "";

  const sorted = airportData
    .slice()
    .sort((a, b) => b.delayedFlights / b.totalFlights - a.delayedFlights / a.totalFlights)
    .slice(0, 8);

  sorted.forEach((airport) => {
    const li = document.createElement("li");
    li.dataset.iata = airport.iata;
    li.innerHTML = `
      <span class="code">${airport.iata}</span>
      <span class="delay">${formatPercentage(airport.delayedFlights / airport.totalFlights)} delayed</span>
    `;
    li.addEventListener("click", () => {
      selectAirport(airport);
      const record = airportMarkers.get(airport.iata);
      if (record) {
        focusMarker(record.marker);
        map.flyTo([airport.latitude, airport.longitude], Math.max(map.getZoom(), 5), {
          animate: true,
          duration: 0.6
        });
      }
    });
    listEl.appendChild(li);
  });
}

function highlightListItem(iata) {
  document.querySelectorAll(".airport-list li").forEach((item) => {
    item.classList.toggle("active", item.dataset.iata === iata);
  });
}

function renderDetails(airport) {
  const panel = document.getElementById("details-panel");
  if (!panel) return;

  const delayRatio = airport.delayedFlights / Math.max(airport.totalFlights, 1);

  const airlineRows = Array.isArray(airport.mostAffectedAirlines)
    ? airport.mostAffectedAirlines
        .map((airline) => {
          const share = airline.delayedFlights / Math.max(airport.delayedFlights, 1);
          return `
            <div class="airline-row">
              <div class="row-header">
                <span>${airline.name}</span>
                <span>${airline.delayedFlights} flights</span>
              </div>
              <div class="progress-bar"><span style="width:${Math.min(share * 100, 100)}%"></span></div>
              <div class="row-footer">Avg delay ${airline.avgDelayMinutes} min</div>
            </div>
          `;
        })
        .join("")
    : '<div class="empty-state">No airline breakdown available.</div>';

  const routeRows = Array.isArray(airport.routes) && airport.routes.length
    ? airport.routes
        .map((route) => {
          const share = route.delayedFlights / Math.max(airport.delayedFlights, 1);
          return `
            <div class="route-row">
              <div class="row-header">
                <span>${airport.iata} → ${route.destination}</span>
                <span>${route.delayedFlights} flights</span>
              </div>
              <div class="progress-bar"><span style="width:${Math.min(share * 100, 100)}%"></span></div>
              <div class="row-footer">Avg delay ${route.avgDelayMinutes} min · ${route.city}</div>
            </div>
          `;
        })
        .join("")
    : '<div class="empty-state">No impacted routes reported.</div>';

  panel.innerHTML = `
    <div class="details-header">
      <h2>${airport.name} <span class="badge ${getStatusBadgeClass(delayRatio)}">${airport.status || "Normal"}</span></h2>
      <div class="meta">
        <span>${airport.city}, ${airport.state}</span>
        <span>${airport.totalFlights.toLocaleString()} flights tracked</span>
        <span>${airport.delayedFlights.toLocaleString()} delayed (${formatPercentage(delayRatio)})</span>
        <span>Avg delay ${airport.avgDelayMinutes} min</span>
      </div>
    </div>
    <div class="weather">${airport.weather || "No current weather impact reported."}</div>
    <section>
      <h3>Most impacted airlines</h3>
      <div class="airline-list">${airlineRows}</div>
    </section>
    <section>
      <h3>Most delayed routes</h3>
      <div class="route-list">${routeRows}</div>
    </section>
  `;
}

function getStatusBadgeClass(delayRatio) {
  if (delayRatio > 0.32) return "danger";
  if (delayRatio > 0.2) return "warning";
  return "";
}

function updateSummary(payload) {
  if (!Array.isArray(airportData) || !airportData.length) {
    showEmptyState();
    return;
  }

  const totalFlights = airportData.reduce((sum, airport) => sum + (airport.totalFlights || 0), 0);
  const totalDelayed = airportData.reduce((sum, airport) => sum + (airport.delayedFlights || 0), 0);
  const averageDelay =
    airportData.reduce((sum, airport) => sum + (airport.avgDelayMinutes || 0), 0) / airportData.length;

  const worst = airportData
    .slice()
    .sort((a, b) => b.delayedFlights / b.totalFlights - a.delayedFlights / a.totalFlights)[0];
  const best = airportData
    .slice()
    .sort((a, b) => a.delayedFlights / a.totalFlights - b.delayedFlights / b.totalFlights)[0];

  setText("summary-avg-delay", `${Math.round(averageDelay)} min`);
  setText("summary-total-delayed", totalDelayed.toLocaleString());
  setText("summary-total-flights", totalFlights.toLocaleString());
  setText("summary-national-delay", formatPercentage(totalDelayed / Math.max(totalFlights, 1)));
  setText("summary-worst-delay", worst ? formatPercentage(worst.delayedFlights / worst.totalFlights) : "--");
  setText("summary-worst-airport", worst ? `${worst.iata} · ${worst.city}` : "");
  setText("summary-best-delay", best ? formatPercentage(best.delayedFlights / best.totalFlights) : "--");
  setText("summary-best-airport", best ? `${best.iata} · ${best.city}` : "");
}

function buildLegend() {
  const legendContainer = document.querySelector(".legend-scale");
  if (!legendContainer) return;

  legendContainer.innerHTML = delayScale
    .map(
      (step) => `
      <div class="legend-row">
        <span class="legend-swatch" style="background:${step.color}"></span>
        <span>${step.label}</span>
      </div>
    `
    )
    .join("");
}

function buildGreatCircle(lat1, lon1, lat2, lon2, steps = 64) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;

  lat1 = toRad(lat1);
  lon1 = toRad(lon1);
  lat2 = toRad(lat2);
  lon2 = toRad(lon2);

  const delta = 2 * Math.asin(
    Math.sqrt(
      Math.sin((lat2 - lat1) / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin((lon2 - lon1) / 2) ** 2
    )
  );

  if (delta === 0) {
    return [
      [toDeg(lat1), toDeg(lon1)],
      [toDeg(lat2), toDeg(lon2)]
    ];
  }

  const points = [];
  for (let i = 0; i <= steps; i++) {
    const fraction = i / steps;
    const A = Math.sin((1 - fraction) * delta) / Math.sin(delta);
    const B = Math.sin(fraction * delta) / Math.sin(delta);

    const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
    const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
    const z = A * Math.sin(lat1) + B * Math.sin(lat2);

    const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
    const lon = Math.atan2(y, x);
    points.push([toDeg(lat), toDeg(lon)]);
  }

  return points;
}

function getMarkerRadius(totalFlights) {
  const minRadius = 6;
  const maxRadius = 18;
  const flightCounts = airportData.map((airport) => airport.totalFlights || 0);
  const maxFlights = flightCounts.length ? Math.max(...flightCounts) : 0;
  if (!maxFlights) return minRadius;
  const scaled = minRadius + ((totalFlights || 0) / maxFlights) * (maxRadius - minRadius);
  return Math.max(minRadius, Math.min(maxRadius, scaled));
}

function getDelayColor(delayRatio) {
  const ratio = Number.isFinite(delayRatio) ? delayRatio : 0;
  for (const step of delayScale) {
    if (ratio <= step.max) {
      return step.color;
    }
  }
  return delayScale[delayScale.length - 1].color;
}

function formatPercentage(value) {
  if (!Number.isFinite(value)) return "--";
  return `${(value * 100).toFixed(1)}%`;
}

function setText(id, text) {
  const node = document.getElementById(id);
  if (node) {
    node.textContent = text;
  }
}

function showEmptyState() {
  const panel = document.getElementById("details-panel");
  if (panel) {
    panel.innerHTML = '<div class="empty-state">No delay data available.</div>';
  }
}

function showError(message) {
  const panel = document.getElementById("details-panel");
  if (panel) {
    panel.innerHTML = `<div class="empty-state">${message}</div>`;
  }
}

function toggleLoading(isLoading) {
  const loader = document.getElementById("loading-indicator");
  if (loader) {
    loader.style.display = isLoading ? "flex" : "none";
  }
}

