(function () {
  const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
  const REQUEST_TIMEOUT_MS = 6000;
  const FAA_ENDPOINT_BUILDERS = [
    (code) => `https://services.faa.gov/airport/status/${code}?format=application/json`,
    (code) => `https://cors.isomorphic-git.org/https://services.faa.gov/airport/status/${code}?format=application/json`,
    (code) => `https://thingproxy.freeboard.io/fetch/https://services.faa.gov/airport/status/${code}?format=application/json`
  ];

  const airports = window.AIRPORT_DATA || {};
  const trackedCodes = window.TRACKED_AIRPORT_CODES || [];
  const fallbackSnapshot = window.FALLBACK_DELAY_SNAPSHOT || {};

  const statusCache = new Map();
  const markers = new Map();

  let selectedAirportCode = null;
  let initialSelectionCompleted = false;

  const map = L.map("map", {
    center: [39.5, -98.35],
    zoom: 4,
    minZoom: 3,
    maxZoom: 9,
    zoomSnap: 0.25,
    preferCanvas: true,
    worldCopyJump: false
  });

  const tileLayer = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
    attribution:
      "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors &copy; <a href=\"https://carto.com/attributions\">Carto</a>",
    maxZoom: 19
  });
  tileLayer.addTo(map);

  map.createPane("routes");
  map.getPane("routes").style.zIndex = 350;
  map.createPane("airportMarkers");
  map.getPane("airportMarkers").style.zIndex = 400;

  const routeLayer = L.layerGroup([], { pane: "routes" }).addTo(map);

  L.control.zoom({ position: "topright" }).addTo(map);
  L.control.scale({ position: "bottomleft", maxWidth: 120, imperial: true, metric: false }).addTo(map);

  const refreshButton = document.getElementById("refresh-btn");
  const lastUpdatedEl = document.getElementById("last-updated");
  const liveIndicatorEl = document.getElementById("live-indicator");
  const notificationEl = document.getElementById("notification");
  const airportCodeEl = document.getElementById("airport-code");
  const airportNameEl = document.getElementById("airport-name");
  const airportLocationEl = document.getElementById("airport-location");
  const delayChipEl = document.getElementById("delay-chip");
  const avgDelayEl = document.getElementById("avg-delay");
  const maxDelayEl = document.getElementById("max-delay");
  const minDelayEl = document.getElementById("min-delay");
  const trendEl = document.getElementById("delay-trend");
  const weatherEl = document.getElementById("weather-summary");
  const weatherWindEl = document.getElementById("weather-wind");
  const airportUpdatedEl = document.getElementById("airport-updated");
  const statusReasonEl = document.getElementById("status-reason");
  const routeContainerEl = document.getElementById("route-insight");

  trackedCodes.forEach((code) => {
    const airport = airports[code];
    if (!airport) {
      return;
    }

    const marker = L.circleMarker([airport.lat, airport.lon], {
      radius: computeMarkerRadius(airport),
      color: "#64748b",
      weight: 2,
      opacity: 1,
      fillColor: "#64748b",
      fillOpacity: 0.85,
      pane: "airportMarkers"
    })
      .addTo(map)
      .bindTooltip(buildTooltipContent(airport, null), { direction: "top", sticky: true, opacity: 0.92 });

    marker.on("click", () => focusOnAirport(code, { flyTo: true }));
    markers.set(code, marker);
  });

  fitMapToAirports();
  refreshButton?.addEventListener("click", () => refreshData({ forceSelect: false, userInitiated: true }));
  refreshData({ forceSelect: true });
  setInterval(() => refreshData({ forceSelect: false }), REFRESH_INTERVAL_MS);

  function fitMapToAirports() {
    const bounds = L.latLngBounds([]);
    trackedCodes.forEach((code) => {
      const airport = airports[code];
      if (!airport) return;
      bounds.extend([airport.lat, airport.lon]);
    });
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [36, 36] });
    }
  }

  async function refreshData({ forceSelect = false, userInitiated = false } = {}) {
    if (!trackedCodes.length) {
      return;
    }

    setLoadingState(true);

    const fetchPromises = trackedCodes.map((code) => fetchAirportStatus(code));
    const results = await Promise.allSettled(fetchPromises);

    let liveCount = 0;
    results.forEach((result, index) => {
      const code = trackedCodes[index];
      let status;

      if (result.status === "fulfilled" && result.value) {
        status = result.value;
        liveCount += 1;
      } else {
        status = buildFallbackStatus(code);
      }

      statusCache.set(code, status);
      updateMarkerAppearance(code, status);
    });

    updateDataHealth(liveCount, trackedCodes.length);
    updateLastUpdated(userInitiated);

    if (!initialSelectionCompleted || forceSelect || !selectedAirportCode) {
      selectAirportWithGreatestDelay();
      initialSelectionCompleted = true;
    } else if (selectedAirportCode) {
      focusOnAirport(selectedAirportCode, { flyTo: false });
    }

    setLoadingState(false);
  }

  function setLoadingState(isLoading) {
    if (!refreshButton) return;
    if (isLoading) {
      refreshButton.setAttribute("data-loading", "true");
    } else {
      refreshButton.removeAttribute("data-loading");
    }
  }

  async function fetchAirportStatus(code) {
    for (const builder of FAA_ENDPOINT_BUILDERS) {
      const url = builder(code);
      try {
        const response = await fetchWithTimeout(url, { timeout: REQUEST_TIMEOUT_MS });
        if (!response.ok) {
          continue;
        }
        const data = await response.json();
        return parseFaaStatus(code, data);
      } catch (error) {
        // Try next endpoint
      }
    }
    throw new Error(`Unable to retrieve status for ${code}`);
  }

  function fetchWithTimeout(url, { timeout = REQUEST_TIMEOUT_MS } = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    return fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json"
      }
    }).finally(() => clearTimeout(timer));
  }

  function parseFaaStatus(code, data) {
    const status = data?.status || {};
    const weather = data?.weather || {};
    const avgDelay = parseDelayMinutes(status.avgDelay);
    const maxDelay = parseDelayMinutes(status.maxDelay);
    const minDelay = parseDelayMinutes(status.minDelay);

    const delayFlag = normalizeBoolean(data?.delay) || avgDelay > 0;
    const reason = cleanText(status.reason || status.type) || (delayFlag ? "Delays reported" : "No major delays reported.");
    const trend = cleanText(status.trend);
    const fetchedAt = normalizeTimestamp(status.updateTime) || new Date().toISOString();

    const weatherSummary = cleanText(weather.weather || weather.conditions);
    const temperature = cleanText(weather.temp || weather.temperature);
    const wind = cleanText(weather.wind);
    const visibility = normalizeVisibility(weather.visibility);

    return createStatusObject(code, {
      delay: delayFlag,
      avgDelayMinutes: avgDelay,
      maxDelayMinutes: maxDelay,
      minDelayMinutes: minDelay,
      reason,
      trend,
      weather: {
        summary: weatherSummary,
        temperature,
        wind,
        visibility
      },
      fetchedAt,
      live: true
    });
  }

  function buildFallbackStatus(code) {
    const fallback = fallbackSnapshot[code];
    if (!fallback) {
      return createStatusObject(code, {
        delay: false,
        avgDelayMinutes: 0,
        maxDelayMinutes: 0,
        minDelayMinutes: 0,
        reason: "Live FAA status is unavailable for this airport.",
        trend: "",
        weather: {
          summary: "",
          temperature: "",
          wind: "",
          visibility: ""
        },
        fetchedAt: null,
        live: false
      });
    }

    return createStatusObject(code, {
      delay: fallback.delay,
      avgDelayMinutes: fallback.avgDelayMinutes,
      maxDelayMinutes: fallback.maxDelayMinutes,
      minDelayMinutes: fallback.minDelayMinutes,
      reason: fallback.reason,
      trend: fallback.trend,
      weather: {
        summary: fallback.weather?.summary,
        temperature: fallback.weather?.temperature,
        wind: fallback.weather?.wind,
        visibility: fallback.weather?.visibility
      },
      fetchedAt: fallback.fetchedAt,
      live: false
    });
  }

  function createStatusObject(code, overrides) {
    const delay = Boolean(overrides.delay) || (overrides.avgDelayMinutes || 0) > 0;
    return {
      code,
      delay,
      avgDelayMinutes: normalizeNumber(overrides.avgDelayMinutes),
      maxDelayMinutes: normalizeNumber(overrides.maxDelayMinutes),
      minDelayMinutes: normalizeNumber(overrides.minDelayMinutes),
      reason: cleanText(overrides.reason) || (delay ? "Delays reported." : "No significant delays reported."),
      trend: cleanText(overrides.trend),
      weather: {
        summary: cleanText(overrides.weather?.summary),
        temperature: cleanText(overrides.weather?.temperature),
        wind: cleanText(overrides.weather?.wind),
        visibility: cleanText(overrides.weather?.visibility)
      },
      fetchedAt: overrides.fetchedAt || null,
      live: Boolean(overrides.live)
    };
  }

  function updateMarkerAppearance(code, status) {
    const airport = airports[code];
    const marker = markers.get(code);
    if (!airport || !marker) return;

    const severity = determineSeverity(status);
    const color = colorForSeverity(severity);

    marker.setStyle({
      color,
      fillColor: color,
      fillOpacity: 0.9,
      weight: selectedAirportCode === code ? 4 : 2,
      radius: computeMarkerRadius(airport) + (selectedAirportCode === code ? 1.6 : 0)
    });

    const tooltip = buildTooltipContent(airport, status);
    if (typeof marker.setTooltipContent === "function") {
      marker.setTooltipContent(tooltip);
    } else {
      marker.bindTooltip(tooltip, { direction: "top", sticky: true, opacity: 0.92 });
    }
  }

  function buildTooltipContent(airport, status) {
    const headline = `<strong>${airport.code}</strong> · ${airport.city}`;
    if (!status) {
      return `<div class="tooltip"><div>${headline}</div><div>Loading status…</div></div>`;
    }
    const severityLabel = status.delay
      ? `${status.avgDelayMinutes ? `${status.avgDelayMinutes} min avg delay` : "Delay reported"}`
      : "On time";
    const sourceLabel = status.live ? "Live FAA feed" : "Snapshot";
    return `<div class="tooltip"><div>${headline}</div><div>${escapeHtml(severityLabel)}</div><div>${sourceLabel}</div></div>`;
  }

  function focusOnAirport(code, { flyTo = false } = {}) {
    const airport = airports[code];
    if (!airport) return;
    selectedAirportCode = code;

    const status = statusCache.get(code) || buildFallbackStatus(code);
    updateInfoPanel(airport, status);
    drawRoutesForAirport(airport);

    markers.forEach((marker, markerCode) => {
      const severity = statusCache.get(markerCode) || buildFallbackStatus(markerCode);
      marker.setStyle({
        weight: markerCode === code ? 4 : 2,
        radius: computeMarkerRadius(airports[markerCode]) + (markerCode === code ? 1.6 : 0),
        color: colorForSeverity(determineSeverity(severity)),
        fillColor: colorForSeverity(determineSeverity(severity))
      });
      if (markerCode === code) {
        marker.bringToFront();
      }
    });

    if (flyTo) {
      map.flyTo([airport.lat, airport.lon], Math.max(map.getZoom(), 5.2), { duration: 0.9 });
    }
  }

  function selectAirportWithGreatestDelay() {
    let bestCode = trackedCodes[0];
    let highestDelay = -1;

    trackedCodes.forEach((code) => {
      const status = statusCache.get(code);
      const delay = status?.avgDelayMinutes ?? 0;
      if (delay > highestDelay) {
        highestDelay = delay;
        bestCode = code;
      }
    });

    focusOnAirport(bestCode, { flyTo: false });
  }

  function updateInfoPanel(airport, status) {
    airportCodeEl.textContent = airport.code;
    airportNameEl.textContent = airport.name;
    airportLocationEl.textContent = airport.city;

    const severity = determineSeverity(status);
    delayChipEl.dataset.state = severity;
    delayChipEl.textContent = severityLabel(severity);

    avgDelayEl.textContent = formatMinutes(status.avgDelayMinutes);
    maxDelayEl.textContent = formatMinutes(status.maxDelayMinutes);
    minDelayEl.textContent = formatMinutes(status.minDelayMinutes);
    trendEl.textContent = status.trend || "—";

    const weatherParts = [status.weather.summary, status.weather.temperature, status.weather.visibility]
      .filter(Boolean)
      .join(" · ");
    weatherEl.textContent = weatherParts || "Not reported";
    weatherWindEl.textContent = status.weather.wind ? `Wind ${status.weather.wind}` : "";

    statusReasonEl.textContent = status.reason;

    if (status.fetchedAt) {
      const localTime = formatTimestamp(status.fetchedAt);
      airportUpdatedEl.textContent = status.live ? `Live update ${localTime}` : `Snapshot from ${localTime}`;
    } else {
      airportUpdatedEl.textContent = status.live ? "Live data" : "Snapshot data";
    }

    renderRouteList(airport);
  }

  function renderRouteList(airport) {
    if (!routeContainerEl) return;
    routeContainerEl.innerHTML = "";

    if (!airport.topRoutes || airport.topRoutes.length === 0) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = "No route insight available.";
      routeContainerEl.appendChild(empty);
      return;
    }

    const maxShare = Math.max(...airport.topRoutes.map((route) => route.share));
    airport.topRoutes.forEach((route) => {
      const destination = airports[route.code];
      if (!destination) return;

      const row = document.createElement("div");
      row.className = "route-row";

      const meta = document.createElement("div");
      meta.className = "route-meta";
      const codeEl = document.createElement("span");
      codeEl.className = "route-code";
      codeEl.textContent = `${airport.code} → ${route.code}`;
      const shareEl = document.createElement("span");
      shareEl.className = "route-share";
      shareEl.textContent = `${Math.round(route.share * 100)}% of delays`;
      meta.appendChild(codeEl);
      meta.appendChild(shareEl);

      const bar = document.createElement("div");
      bar.className = "route-bar";
      const fill = document.createElement("span");
      fill.style.width = `${Math.max(12, (route.share / maxShare) * 100)}%`;
      fill.style.background = colorForRouteShare(route.share);
      bar.appendChild(fill);

      row.appendChild(meta);
      row.appendChild(bar);
      routeContainerEl.appendChild(row);
    });
  }

  function drawRoutesForAirport(airport) {
    routeLayer.clearLayers();
    if (!airport.topRoutes || airport.topRoutes.length === 0) return;

    airport.topRoutes.forEach((route) => {
      const destination = airports[route.code];
      if (!destination) return;

      const arcPoints = buildGreatCircleArc(
        [airport.lat, airport.lon],
        [destination.lat, destination.lon],
        64
      );

      const color = colorForRouteShare(route.share);
      L.polyline(arcPoints, {
        color,
        weight: 2.5 + route.share * 8,
        opacity: 0.75,
        pane: "routes"
      }).addTo(routeLayer);
    });
  }

  function updateDataHealth(liveCount, total) {
    if (!liveIndicatorEl) return;
    const fallbackCount = total - liveCount;

    if (liveCount === total) {
      liveIndicatorEl.textContent = "Live FAA feed";
      liveIndicatorEl.className = "badge live";
      hideNotification();
    } else if (liveCount === 0) {
      liveIndicatorEl.textContent = "Offline snapshot";
      liveIndicatorEl.className = "badge offline";
      showNotification(
        "FAA status feed is unreachable. Displaying the latest historical snapshot so you still have situational awareness."
      );
    } else {
      liveIndicatorEl.textContent = `Partial live (${liveCount}/${total})`;
      liveIndicatorEl.className = "badge partial";
      showNotification(
        `${fallbackCount} airport${fallbackCount > 1 ? "s" : ""} are using historical delay data because the live feed is unavailable.`
      );
    }
  }

  function hideNotification() {
    if (!notificationEl) return;
    notificationEl.style.display = "none";
    notificationEl.textContent = "";
  }

  function showNotification(message) {
    if (!notificationEl) return;
    notificationEl.style.display = "block";
    notificationEl.textContent = message;
  }

  function updateLastUpdated(userInitiated) {
    if (!lastUpdatedEl) return;
    const now = new Date();
    const formatted = now.toLocaleString([], {
      hour: "numeric",
      minute: "2-digit",
      month: "short",
      day: "numeric"
    });
    lastUpdatedEl.textContent = `Updated ${formatted}${userInitiated ? " (manual refresh)" : ""}`;
  }

  function computeMarkerRadius(airport) {
    const index = airport?.trafficIndex ?? 3;
    return 6 + Math.min(index, 6) * 1.7;
  }

  function determineSeverity(status) {
    if (!status || !status.delay) {
      return "on-time";
    }
    const avg = status.avgDelayMinutes || 0;
    if (avg < 10) return "minor";
    if (avg < 25) return "moderate";
    return "severe";
  }

  function severityLabel(severity) {
    switch (severity) {
      case "minor":
        return "Minor delays";
      case "moderate":
        return "Moderate delays";
      case "severe":
        return "Severe delays";
      default:
        return "On time";
    }
  }

  function colorForSeverity(severity) {
    switch (severity) {
      case "minor":
        return "#facc15";
      case "moderate":
        return "#fb923c";
      case "severe":
        return "#ef4444";
      default:
        return "#2eb872";
    }
  }

  function colorForRouteShare(share) {
    const clamped = Math.min(Math.max(share, 0.04), 0.18);
    const t = (clamped - 0.04) / (0.18 - 0.04);
    return interpolateColor("#2563eb", "#ef4444", t);
  }

  function interpolateColor(startHex, endHex, t) {
    const start = hexToRgb(startHex);
    const end = hexToRgb(endHex);
    const r = Math.round(start.r + (end.r - start.r) * t);
    const g = Math.round(start.g + (end.g - start.g) * t);
    const b = Math.round(start.b + (end.b - start.b) * t);
    return `rgb(${r}, ${g}, ${b})`;
  }

  function hexToRgb(hex) {
    const normalized = hex.replace("#", "");
    const bigint = parseInt(normalized, 16);
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255
    };
  }

  function formatMinutes(value) {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return "—";
    }
    if (value === 0) {
      return "0 min";
    }
    return `${value} min`;
  }

  function formatTimestamp(isoString) {
    try {
      const date = new Date(isoString);
      if (Number.isNaN(date.getTime())) return isoString;
      return date.toLocaleString([], { hour: "numeric", minute: "2-digit", month: "short", day: "numeric" });
    } catch (error) {
      return isoString;
    }
  }

  function buildGreatCircleArc(start, end, steps = 64) {
    const [lat1, lon1] = start.map(toRadians);
    const [lat2, lon2] = end.map(toRadians);

    const d = 2 * Math.asin(
      Math.sqrt(
        Math.sin((lat2 - lat1) / 2) ** 2 +
          Math.cos(lat1) * Math.cos(lat2) * Math.sin((lon2 - lon1) / 2) ** 2
      )
    );

    if (d === 0) {
      return [start, end];
    }

    const points = [];
    for (let i = 0; i <= steps; i += 1) {
      const f = i / steps;
      const A = Math.sin((1 - f) * d) / Math.sin(d);
      const B = Math.sin(f * d) / Math.sin(d);

      const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
      const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
      const z = A * Math.sin(lat1) + B * Math.sin(lat2);

      const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
      const lon = Math.atan2(y, x);
      points.push([toDegrees(lat), toDegrees(lon)]);
    }
    return points;
  }

  function toRadians(deg) {
    return (deg * Math.PI) / 180;
  }

  function toDegrees(rad) {
    return (rad * 180) / Math.PI;
  }

  function parseDelayMinutes(value) {
    if (value === null || value === undefined) return 0;
    if (typeof value === "number" && !Number.isNaN(value)) return Math.round(value);
    const text = String(value).trim();
    if (!text || text.toLowerCase() === "na" || text.toLowerCase() === "n/a") return 0;
    const match = text.match(/([0-9]+)\s*(min|minute)/i);
    if (match) {
      return parseInt(match[1], 10);
    }
    const numeric = parseInt(text, 10);
    return Number.isNaN(numeric) ? 0 : numeric;
  }

  function normalizeBoolean(value) {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      const lower = value.toLowerCase();
      return lower === "true" || lower === "yes";
    }
    return false;
  }

  function normalizeTimestamp(value) {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString();
  }

  function normalizeVisibility(value) {
    if (!value && value !== 0) return "";
    const text = String(value).trim();
    if (!text) return "";
    if (text.toLowerCase().includes("mi")) return text;
    return `${text} mi`;
  }

  function normalizeNumber(value) {
    if (value === null || value === undefined) return 0;
    const num = Number(value);
    if (Number.isNaN(num)) return 0;
    return Math.round(num);
  }

  function cleanText(value) {
    if (typeof value !== "string") return "";
    return value.replace(/\s+/g, " ").trim();
  }

  function escapeHtml(value) {
    if (typeof value !== "string") return value;
    return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
})();
