(function () {
  const AIRPORT_DATA = {
    ATL: {
      code: "ATL",
      name: "Hartsfield-Jackson Atlanta International Airport",
      city: "Atlanta, GA",
      lat: 33.6407,
      lon: -84.4277,
      trafficIndex: 6,
      tracked: true,
      topRoutes: [
        { code: "LGA", share: 0.12 },
        { code: "MCO", share: 0.11 },
        { code: "LAX", share: 0.08 }
      ]
    },
    LAX: {
      code: "LAX",
      name: "Los Angeles International Airport",
      city: "Los Angeles, CA",
      lat: 33.9416,
      lon: -118.4085,
      trafficIndex: 5,
      tracked: true,
      topRoutes: [
        { code: "SFO", share: 0.1 },
        { code: "JFK", share: 0.08 },
        { code: "SEA", share: 0.07 }
      ]
    },
    ORD: {
      code: "ORD",
      name: "O'Hare International Airport",
      city: "Chicago, IL",
      lat: 41.9742,
      lon: -87.9073,
      trafficIndex: 5,
      tracked: true,
      topRoutes: [
        { code: "LGA", share: 0.09 },
        { code: "DEN", share: 0.08 },
        { code: "MSP", share: 0.07 }
      ]
    },
    DFW: {
      code: "DFW",
      name: "Dallas/Fort Worth International Airport",
      city: "Dallas-Fort Worth, TX",
      lat: 32.8998,
      lon: -97.0403,
      trafficIndex: 5,
      tracked: true,
      topRoutes: [
        { code: "LAX", share: 0.08 },
        { code: "ORD", share: 0.07 },
        { code: "DEN", share: 0.07 }
      ]
    },
    DEN: {
      code: "DEN",
      name: "Denver International Airport",
      city: "Denver, CO",
      lat: 39.8561,
      lon: -104.6737,
      trafficIndex: 5,
      tracked: true,
      topRoutes: [
        { code: "ORD", share: 0.08 },
        { code: "LAX", share: 0.07 },
        { code: "PHX", share: 0.06 }
      ]
    },
    JFK: {
      code: "JFK",
      name: "John F. Kennedy International Airport",
      city: "New York, NY",
      lat: 40.6413,
      lon: -73.7781,
      trafficIndex: 4,
      tracked: true,
      topRoutes: [
        { code: "LAX", share: 0.09 },
        { code: "SFO", share: 0.08 },
        { code: "MCO", share: 0.07 }
      ]
    },
    SFO: {
      code: "SFO",
      name: "San Francisco International Airport",
      city: "San Francisco, CA",
      lat: 37.6213,
      lon: -122.379,
      trafficIndex: 4,
      tracked: true,
      topRoutes: [
        { code: "LAX", share: 0.14 },
        { code: "SEA", share: 0.07 },
        { code: "DEN", share: 0.07 }
      ]
    },
    SEA: {
      code: "SEA",
      name: "Seattle-Tacoma International Airport",
      city: "Seattle, WA",
      lat: 47.4502,
      lon: -122.3088,
      trafficIndex: 4,
      tracked: true,
      topRoutes: [
        { code: "SFO", share: 0.11 },
        { code: "LAX", share: 0.09 },
        { code: "DEN", share: 0.06 }
      ]
    },
    MCO: {
      code: "MCO",
      name: "Orlando International Airport",
      city: "Orlando, FL",
      lat: 28.4312,
      lon: -81.3081,
      trafficIndex: 3,
      tracked: true,
      topRoutes: [
        { code: "ATL", share: 0.13 },
        { code: "JFK", share: 0.09 },
        { code: "EWR", share: 0.07 }
      ]
    },
    LAS: {
      code: "LAS",
      name: "Harry Reid International Airport",
      city: "Las Vegas, NV",
      lat: 36.084,
      lon: -115.1537,
      trafficIndex: 3,
      tracked: true,
      topRoutes: [
        { code: "LAX", share: 0.09 },
        { code: "DEN", share: 0.08 },
        { code: "SFO", share: 0.07 }
      ]
    },
    BOS: {
      code: "BOS",
      name: "Logan International Airport",
      city: "Boston, MA",
      lat: 42.3656,
      lon: -71.0096,
      trafficIndex: 3,
      tracked: true,
      topRoutes: [
        { code: "JFK", share: 0.1 },
        { code: "DCA", share: 0.08 },
        { code: "ORD", share: 0.07 }
      ]
    },
    MIA: {
      code: "MIA",
      name: "Miami International Airport",
      city: "Miami, FL",
      lat: 25.7959,
      lon: -80.287,
      trafficIndex: 3,
      tracked: true,
      topRoutes: [
        { code: "JFK", share: 0.11 },
        { code: "ATL", share: 0.09 },
        { code: "LGA", share: 0.07 }
      ]
    },
    MSP: {
      code: "MSP",
      name: "Minneapolis–Saint Paul International Airport",
      city: "Minneapolis, MN",
      lat: 44.8848,
      lon: -93.2223,
      trafficIndex: 3,
      tracked: true,
      topRoutes: [
        { code: "DEN", share: 0.08 },
        { code: "ORD", share: 0.08 },
        { code: "ATL", share: 0.06 }
      ]
    },
    DTW: {
      code: "DTW",
      name: "Detroit Metropolitan Wayne County Airport",
      city: "Detroit, MI",
      lat: 42.2162,
      lon: -83.3554,
      trafficIndex: 3,
      tracked: true,
      topRoutes: [
        { code: "ORD", share: 0.08 },
        { code: "JFK", share: 0.07 },
        { code: "ATL", share: 0.06 }
      ]
    },
    PHX: {
      code: "PHX",
      name: "Phoenix Sky Harbor International Airport",
      city: "Phoenix, AZ",
      lat: 33.4342,
      lon: -112.0116,
      trafficIndex: 3,
      tracked: true,
      topRoutes: [
        { code: "DEN", share: 0.09 },
        { code: "LAX", share: 0.08 },
        { code: "SFO", share: 0.06 }
      ]
    },
    PHL: {
      code: "PHL",
      name: "Philadelphia International Airport",
      city: "Philadelphia, PA",
      lat: 39.8744,
      lon: -75.2424,
      trafficIndex: 3,
      tracked: true,
      topRoutes: [
        { code: "ATL", share: 0.09 },
        { code: "BOS", share: 0.08 },
        { code: "MCO", share: 0.07 }
      ]
    },
    EWR: {
      code: "EWR",
      name: "Newark Liberty International Airport",
      city: "Newark, NJ",
      lat: 40.6895,
      lon: -74.1745,
      trafficIndex: 3,
      tracked: true,
      topRoutes: [
        { code: "MCO", share: 0.08 },
        { code: "ATL", share: 0.08 },
        { code: "SFO", share: 0.07 }
      ]
    },
    CLT: {
      code: "CLT",
      name: "Charlotte Douglas International Airport",
      city: "Charlotte, NC",
      lat: 35.2144,
      lon: -80.9473,
      trafficIndex: 4,
      tracked: true,
      topRoutes: [
        { code: "ATL", share: 0.12 },
        { code: "JFK", share: 0.07 },
        { code: "MCO", share: 0.07 }
      ]
    },
    IAH: {
      code: "IAH",
      name: "George Bush Intercontinental Airport",
      city: "Houston, TX",
      lat: 29.9902,
      lon: -95.3368,
      trafficIndex: 4,
      tracked: true,
      topRoutes: [
        { code: "DEN", share: 0.08 },
        { code: "ATL", share: 0.07 },
        { code: "ORD", share: 0.07 }
      ]
    },
    LGA: {
      code: "LGA",
      name: "LaGuardia Airport",
      city: "New York, NY",
      lat: 40.7769,
      lon: -73.874,
      trafficIndex: 3,
      tracked: true,
      topRoutes: [
        { code: "ATL", share: 0.12 },
        { code: "ORD", share: 0.09 },
        { code: "MIA", share: 0.08 }
      ]
    },
    DCA: {
      code: "DCA",
      name: "Ronald Reagan Washington National Airport",
      city: "Washington, DC",
      lat: 38.8512,
      lon: -77.0402,
      trafficIndex: 2,
      tracked: false,
      topRoutes: []
    }
  };

  const FALLBACK_DELAY_SNAPSHOT = {
    ATL: {
      delay: true,
      avgDelayMinutes: 32,
      maxDelayMinutes: 58,
      minDelayMinutes: 18,
      reason: "Ground delay program from thunderstorms across northern Georgia.",
      trend: "Improving",
      weather: {
        summary: "Thunderstorms",
        temperature: "82°F",
        wind: "SW 12 kt",
        visibility: "3 mi"
      },
      fetchedAt: "2023-07-18T23:05:00Z"
    },
    LAX: {
      delay: true,
      avgDelayMinutes: 12,
      maxDelayMinutes: 25,
      minDelayMinutes: 6,
      reason: "Low marine layer is slowing arrivals on the south complex.",
      trend: "Steady",
      weather: {
        summary: "Low clouds",
        temperature: "67°F",
        wind: "W 9 kt",
        visibility: "6 mi"
      },
      fetchedAt: "2023-07-18T22:45:00Z"
    },
    ORD: {
      delay: true,
      avgDelayMinutes: 24,
      maxDelayMinutes: 44,
      minDelayMinutes: 12,
      reason: "Low ceilings and traffic volume creating an arrival metering program.",
      trend: "Rising",
      weather: {
        summary: "Overcast",
        temperature: "71°F",
        wind: "NE 8 kt",
        visibility: "5 mi"
      },
      fetchedAt: "2023-07-18T23:15:00Z"
    },
    DFW: {
      delay: true,
      avgDelayMinutes: 16,
      maxDelayMinutes: 34,
      minDelayMinutes: 8,
      reason: "Thunderstorm cells in the departure corridor.",
      trend: "Improving",
      weather: {
        summary: "Scattered storms",
        temperature: "86°F",
        wind: "S 14 kt",
        visibility: "8 mi"
      },
      fetchedAt: "2023-07-18T22:58:00Z"
    },
    DEN: {
      delay: true,
      avgDelayMinutes: 8,
      maxDelayMinutes: 18,
      minDelayMinutes: 4,
      reason: "Gusty winds are extending taxi-out times.",
      trend: "Steady",
      weather: {
        summary: "Windy",
        temperature: "79°F",
        wind: "NW 18 kt",
        visibility: "10 mi"
      },
      fetchedAt: "2023-07-18T22:40:00Z"
    },
    JFK: {
      delay: true,
      avgDelayMinutes: 28,
      maxDelayMinutes: 52,
      minDelayMinutes: 16,
      reason: "Ground delay program because of evening thunderstorms over Long Island.",
      trend: "Rising",
      weather: {
        summary: "Thunderstorms",
        temperature: "79°F",
        wind: "S 11 kt",
        visibility: "4 mi"
      },
      fetchedAt: "2023-07-18T23:10:00Z"
    },
    SFO: {
      delay: true,
      avgDelayMinutes: 35,
      maxDelayMinutes: 62,
      minDelayMinutes: 20,
      reason: "Low ceilings require single runway operations.",
      trend: "Steady",
      weather: {
        summary: "Fog",
        temperature: "61°F",
        wind: "W 16 kt",
        visibility: "2 mi"
      },
      fetchedAt: "2023-07-18T21:55:00Z"
    },
    SEA: {
      delay: true,
      avgDelayMinutes: 6,
      maxDelayMinutes: 14,
      minDelayMinutes: 3,
      reason: "Low clouds and runway construction reducing capacity.",
      trend: "Improving",
      weather: {
        summary: "Low clouds",
        temperature: "64°F",
        wind: "S 6 kt",
        visibility: "7 mi"
      },
      fetchedAt: "2023-07-18T22:30:00Z"
    },
    MCO: {
      delay: true,
      avgDelayMinutes: 18,
      maxDelayMinutes: 36,
      minDelayMinutes: 10,
      reason: "Pop-up storms south of Orlando slowing departures.",
      trend: "Steady",
      weather: {
        summary: "Thunderstorms",
        temperature: "84°F",
        wind: "SE 9 kt",
        visibility: "5 mi"
      },
      fetchedAt: "2023-07-18T22:20:00Z"
    },
    LAS: {
      delay: true,
      avgDelayMinutes: 10,
      maxDelayMinutes: 21,
      minDelayMinutes: 5,
      reason: "High winds producing occasional ground stops.",
      trend: "Improving",
      weather: {
        summary: "Windy",
        temperature: "96°F",
        wind: "SW 22 kt",
        visibility: "10 mi"
      },
      fetchedAt: "2023-07-18T22:05:00Z"
    },
    BOS: {
      delay: true,
      avgDelayMinutes: 22,
      maxDelayMinutes: 41,
      minDelayMinutes: 12,
      reason: "Low ceilings and volume creating arrival metering.",
      trend: "Steady",
      weather: {
        summary: "Low clouds",
        temperature: "68°F",
        wind: "NE 10 kt",
        visibility: "4 mi"
      },
      fetchedAt: "2023-07-18T22:55:00Z"
    },
    MIA: {
      delay: true,
      avgDelayMinutes: 14,
      maxDelayMinutes: 30,
      minDelayMinutes: 7,
      reason: "Tropical showers south of the field slowing departures.",
      trend: "Steady",
      weather: {
        summary: "Showers",
        temperature: "86°F",
        wind: "E 13 kt",
        visibility: "6 mi"
      },
      fetchedAt: "2023-07-18T22:12:00Z"
    },
    MSP: {
      delay: true,
      avgDelayMinutes: 7,
      maxDelayMinutes: 15,
      minDelayMinutes: 3,
      reason: "Northwest winds forcing longer taxi routes.",
      trend: "Improving",
      weather: {
        summary: "Windy",
        temperature: "72°F",
        wind: "NW 17 kt",
        visibility: "10 mi"
      },
      fetchedAt: "2023-07-18T22:18:00Z"
    },
    DTW: {
      delay: true,
      avgDelayMinutes: 9,
      maxDelayMinutes: 19,
      minDelayMinutes: 4,
      reason: "Tower staffing program moderating departures.",
      trend: "Steady",
      weather: {
        summary: "Overcast",
        temperature: "73°F",
        wind: "NE 9 kt",
        visibility: "5 mi"
      },
      fetchedAt: "2023-07-18T22:24:00Z"
    },
    PHX: {
      delay: true,
      avgDelayMinutes: 5,
      maxDelayMinutes: 12,
      minDelayMinutes: 2,
      reason: "Summer heat slowing ramp operations.",
      trend: "Steady",
      weather: {
        summary: "Hot",
        temperature: "103°F",
        wind: "SW 6 kt",
        visibility: "8 mi"
      },
      fetchedAt: "2023-07-18T21:58:00Z"
    },
    PHL: {
      delay: true,
      avgDelayMinutes: 19,
      maxDelayMinutes: 37,
      minDelayMinutes: 9,
      reason: "Thunderstorms west of the airport creating reroutes.",
      trend: "Rising",
      weather: {
        summary: "Storms nearby",
        temperature: "78°F",
        wind: "SW 15 kt",
        visibility: "5 mi"
      },
      fetchedAt: "2023-07-18T23:02:00Z"
    },
    EWR: {
      delay: true,
      avgDelayMinutes: 30,
      maxDelayMinutes: 55,
      minDelayMinutes: 18,
      reason: "Arrival holding due to thunderstorms over New Jersey.",
      trend: "Rising",
      weather: {
        summary: "Thunderstorms",
        temperature: "78°F",
        wind: "S 14 kt",
        visibility: "3 mi"
      },
      fetchedAt: "2023-07-18T23:07:00Z"
    },
    CLT: {
      delay: true,
      avgDelayMinutes: 12,
      maxDelayMinutes: 25,
      minDelayMinutes: 6,
      reason: "Flow control from convective activity in the Carolinas.",
      trend: "Steady",
      weather: {
        summary: "Storms",
        temperature: "83°F",
        wind: "SW 12 kt",
        visibility: "6 mi"
      },
      fetchedAt: "2023-07-18T22:35:00Z"
    },
    IAH: {
      delay: true,
      avgDelayMinutes: 8,
      maxDelayMinutes: 17,
      minDelayMinutes: 4,
      reason: "Gulf moisture and ramp restrictions.",
      trend: "Improving",
      weather: {
        summary: "Humid",
        temperature: "88°F",
        wind: "SE 10 kt",
        visibility: "7 mi"
      },
      fetchedAt: "2023-07-18T22:08:00Z"
    },
    LGA: {
      delay: true,
      avgDelayMinutes: 27,
      maxDelayMinutes: 48,
      minDelayMinutes: 14,
      reason: "Evening thunderstorms causing ground delay programs.",
      trend: "Rising",
      weather: {
        summary: "Thunderstorms",
        temperature: "77°F",
        wind: "S 16 kt",
        visibility: "4 mi"
      },
      fetchedAt: "2023-07-18T23:12:00Z"
    }
  };

  window.AIRPORT_DATA = AIRPORT_DATA;
  window.TRACKED_AIRPORT_CODES = Object.values(AIRPORT_DATA)
    .filter((entry) => entry.tracked)
    .map((entry) => entry.code);
  window.FALLBACK_DELAY_SNAPSHOT = FALLBACK_DELAY_SNAPSHOT;
})();
