const normalizeKey = (key) =>
  String(key || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const pickFirst = (obj, keys) => {
  if (!obj) return undefined;
  for (const key of keys) {
    if (obj[key] != null) return obj[key];
  }

  // Fallback: match by normalized key (handles "Hotel Name", "hotel_name", etc.)
  const normalizedToOriginal = new Map(
    Object.keys(obj).map((k) => [normalizeKey(k), k])
  );
  for (const key of keys) {
    const original = normalizedToOriginal.get(normalizeKey(key));
    if (original && obj[original] != null) return obj[original];
  }

  return undefined;
};

const coerceArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") return Object.values(value);
  return [];
};

const isObject = (value) => Boolean(value) && typeof value === "object";

function toLabelText(value) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    return (
      value.label ||
      value.name ||
      value.city ||
      value.destination ||
      value.title ||
      ""
    );
  }
  return "";
}

function toText(value) {
  if (value == null) return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (isObject(value)) {
    const label = toLabelText(value);
    if (label) return label;

    const lat = value.lat ?? value.latitude;
    const lng = value.lng ?? value.longitude;
    if (lat != null && lng != null) return `${lat},${lng}`;
  }
  return undefined;
}

const DAY_META_KEYS = new Set(
  [
    "day",
    "date",
    "title",
    "theme",
    "summary",
    "overview",
    "notes",
    "description",
  ].map(normalizeKey)
);

const looksLikePlaceObject = (value) => {
  if (!isObject(value)) return false;

  return Boolean(
    pickFirst(value, [
      "placeName",
      "name",
      "location",
      "place",
      "attraction",
      "spot",
      "placeAddress",
      "address",
      "ticketPricing",
      "ticketPrice",
      "timeToTravel",
      "travelTime",
      "bestTimeToVisit",
      "bestTime",
      "imageUrl",
      "photoUrl",
      "coordinates",
      "geoCoordinates",
    ])
  );
};

const collectPossiblePlaces = (value, fallbackTime) => {
  if (value == null) return [];

  if (Array.isArray(value)) {
    return value.flatMap((entry) => collectPossiblePlaces(entry, fallbackTime));
  }

  if (!isObject(value)) return [];

  if (looksLikePlaceObject(value)) {
    return [{ value, fallbackTime }];
  }

  return Object.entries(value).flatMap(([key, nested]) =>
    collectPossiblePlaces(nested, fallbackTime || key)
  );
};

const normalizePlace = (place, fallbackTime) => {
  if (!isObject(place)) return null;

  const nestedPlace = isObject(place.place) ? place.place : null;
  const source = nestedPlace ? { ...place, ...nestedPlace } : place;

  return {
    time: toText(pickFirst(source, [
      "time",
      "Time",
      "bestTimeToVisit",
      "best time to visit",
      "bestTime",
      "visitTime",
      "slot",
    ])) || toText(fallbackTime),
    placeName: toText(pickFirst(source, [
      "placeName",
      "PlaceName",
      "name",
      "Name",
      "location",
      "Location",
      "place",
      "attraction",
      "spot",
      "title",
    ])),
    placeDetails: toText(pickFirst(source, [
      "placeDetails",
      "PlaceDetails",
      "details",
      "Description",
      "description",
      "about",
      "info",
      "notes",
    ])),
    placeAddress: toText(pickFirst(source, [
      "placeAddress",
      "PlaceAddress",
      "address",
      "Address",
    ])),
    ticketPricing: toText(pickFirst(source, [
      "ticketPricing",
      "TicketPricing",
      "ticket",
      "price",
      "Ticket Price",
      "ticketPrice",
      "entryFee",
      "cost",
    ])),
    timeToTravel: toText(pickFirst(source, [
      "timeToTravel",
      "TimeToTravel",
      "timeToTravelEachLocation",
      "travelTime",
      "duration",
      "travelDuration",
    ])),
    geoCoordinates: toText(pickFirst(source, [
      "geoCoordinates",
      "GeoCoordinates",
      "coordinates",
      "geo",
      "latLng",
      "latlong",
    ])),
    placeImageUrl: toText(pickFirst(source, [
      "placeImageUrl",
      "placeImageURL",
      "imageUrl",
      "imageURL",
      "photoUrl",
      "Place Image Url",
      "image",
      "photo",
    ])),
    transportCost: toText(pickFirst(source, [
      "transportCost",
      "TransportCost",
      "travelCost",
      "commuteCost",
    ])),
  };
};

const LOCATION_CONTAINER_KEYS = [
  "locations",
  "location",
  "destinations",
  "destination",
  "cities",
  "cityPlans",
  "stops",
  "tripByLocation",
  "locationPlans",
];

const HOTEL_KEYS = [
  "hotels",
  "hotelOptions",
  "hotelOption",
  "hotel",
  "Hotels",
  "stays",
  "accommodations",
  "recommendedHotels",
];

const ITINERARY_KEYS = [
  "itinerary",
  "Itinerary",
  "plan",
  "Plan",
  "days",
  "dayPlan",
  "dayPlans",
  "dayWiseItinerary",
  "dailyItinerary",
  "dailyPlan",
  "schedule",
];

const DAY_KEY_REGEX = /^day[\s_-]*\d+/i;

const normalizeHotel = (hotel) => {
  if (!hotel || typeof hotel !== "object") return null;

  return {
    day: toText(pickFirst(hotel, [
      "day",
      "Day",
      "recommendedDay",
      "recommendedForDay",
      "stayDay",
      "checkInDay",
      "night",
      "nights",
    ])),
    hotelName: toText(pickFirst(hotel, ["hotelName", "HotelName", "name", "Name"])),
    hotelAddress: toText(pickFirst(hotel, [
      "hotelAddress",
      "HotelAddress",
      "address",
      "Address",
      "hotel address",
    ])),
    price: toText(pickFirst(hotel, ["price", "Price", "cost", "Cost"])),
    rating: toText(pickFirst(hotel, ["rating", "Rating", "stars", "Stars"])),
    descriptions: toText(pickFirst(hotel, [
      "descriptions",
      "description",
      "Description",
      "details",
    ])),
    geoCoordinates: toText(pickFirst(hotel, [
      "geoCoordinates",
      "GeoCoordinates",
      "coordinates",
      "geo",
      "geo coordinates",
    ])),
    hotelImageUrl: toText(pickFirst(hotel, [
      "hotelImageUrl",
      "hotelImageURL",
      "imageUrl",
      "imageURL",
      "photoUrl",
      "hotel image url",
    ])),
    checkIn: toText(pickFirst(hotel, ["checkIn", "checkInTime", "check_in"])),
    checkOut: toText(pickFirst(hotel, ["checkOut", "checkOutTime", "check_out"])),
  };
};

const hasAnyHotelFields = (hotel) =>
  Boolean(
    hotel &&
      (hotel.hotelName ||
        hotel.hotelAddress ||
        hotel.price ||
        hotel.rating ||
        hotel.descriptions ||
        hotel.geoCoordinates ||
        hotel.hotelImageUrl)
  );

const dedupeHotels = (hotels) => {
  const seen = new Set();
  return hotels.filter((hotel) => {
    const name = hotel?.hotelName || "";
    const address = hotel?.hotelAddress || "";
    if (!name && !address) return true;

    const key = normalizeKey(`${name}|${address}`);
    if (!key) return true;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const isLikelyLocationContainer = (value) => {
  if (!isObject(value)) return false;

  return Boolean(
    pickFirst(value, ["location", "destination", "city", "name", "label"]) ||
      pickFirst(value, HOTEL_KEYS) ||
      pickFirst(value, ITINERARY_KEYS) ||
      pickFirst(value, ["placesToVisit", "thingsToDo", "activities"])
  );
};

const collectLocationContainers = (tripData) => {
  const containers = [];

  for (const key of LOCATION_CONTAINER_KEYS) {
    const source = pickFirst(tripData, [key]);
    if (source == null) continue;
    coerceArray(source).forEach((entry) => {
      if (isLikelyLocationContainer(entry)) containers.push(entry);
    });
  }

  // Also scan direct child objects for location-specific data not under a known key.
  Object.values(tripData).forEach((value) => {
    if (isLikelyLocationContainer(value)) containers.push(value);
  });

  return containers;
};

const normalizeDay = (day, idx, locationLabel) => {
  if (!day || typeof day !== "object") return day;

  const planRaw = pickFirst(day, [
    "plan",
    "Plan",
    "places",
    "Places",
    "schedule",
    "timeline",
    "activities",
    "thingsToDo",
    "recommendedPlaces",
    "placesToVisit",
  ]);

  let placeCandidates = collectPossiblePlaces(planRaw);

  if (placeCandidates.length === 0) {
    placeCandidates = Object.entries(day)
      .filter(([key]) => !DAY_META_KEYS.has(normalizeKey(key)))
      .flatMap(([key, value]) => collectPossiblePlaces(value, key));
  }

  const plan = placeCandidates
    .map(({ value, fallbackTime }) => normalizePlace(value, fallbackTime))
    .filter(
      (place) =>
        place &&
        (
          place.placeName ||
          place.placeDetails ||
          place.placeAddress ||
          place.ticketPricing ||
          place.timeToTravel ||
          place.placeImageUrl ||
          place.geoCoordinates
        )
    );

  const dayLabel = toText(pickFirst(day, ["day", "Day"])) || `Day ${idx + 1}`;
  return {
    // Keep day labels clean in UI (e.g. "Day 1"), avoid mixing location names in the day title.
    day: dayLabel,
    plan,
  };
};

const normalizeItinerary = (itineraryRaw, locationLabel) =>
  coerceArray(itineraryRaw).map((day, idx) => normalizeDay(day, idx, locationLabel));

const extractDayEntries = (source) => {
  if (!isObject(source)) return [];

  return Object.entries(source)
    .filter(([key]) => DAY_KEY_REGEX.test(String(key || "").trim()))
    .map(([key, value]) => {
      if (isObject(value)) return { day: key, ...value };
      return { day: key, plan: coerceArray(value) };
    });
};

export const getTripDestinationLabel = (trip) => {
  const userLocation = trip?.userSelection?.location;
  if (typeof userLocation === "string" && userLocation.trim()) return userLocation;
  if (userLocation?.label) return userLocation.label;

  const tripData = trip?.tripData;
  const fromTripData =
    (typeof tripData?.destination === "string" && tripData.destination) ||
    (typeof tripData?.location === "string" && tripData.location) ||
    tripData?.location?.label;

  return fromTripData || "";
};

export const normalizeTripData = (tripData) => {
  if (!tripData || typeof tripData !== "object") return tripData;

  const locationContainers = collectLocationContainers(tripData);

  const hotelCandidates = [];
  HOTEL_KEYS.forEach((key) => {
    const found = pickFirst(tripData, [key]);
    if (found != null) hotelCandidates.push(...coerceArray(found));
  });
  locationContainers.forEach((locationEntry) => {
    HOTEL_KEYS.forEach((key) => {
      const found = pickFirst(locationEntry, [key]);
      if (found != null) hotelCandidates.push(...coerceArray(found));
    });
  });

  const hotels = dedupeHotels(
    hotelCandidates.map(normalizeHotel).filter((hotel) => hasAnyHotelFields(hotel))
  );

  const itineraryCandidates = [];
  const rootItinerary = pickFirst(tripData, ITINERARY_KEYS);
  if (rootItinerary != null) itineraryCandidates.push(...normalizeItinerary(rootItinerary));
  if (itineraryCandidates.length === 0) {
    itineraryCandidates.push(...normalizeItinerary(extractDayEntries(tripData)));
  }

  locationContainers.forEach((locationEntry) => {
    const locationLabel = pickFirst(locationEntry, [
      "location",
      "destination",
      "city",
      "name",
      "label",
      "title",
    ]);

    const locationItinerary = pickFirst(locationEntry, ITINERARY_KEYS);
    const foundLocationItinerary = locationItinerary != null;
    if (foundLocationItinerary) {
      itineraryCandidates.push(...normalizeItinerary(locationItinerary, locationLabel));
    }

    // Some models return only places array per location with no day grouping.
    if (!foundLocationItinerary) {
      const dayEntries = extractDayEntries(locationEntry);
      if (dayEntries.length > 0) {
        itineraryCandidates.push(...normalizeItinerary(dayEntries, locationLabel));
        return;
      }

      const placesRaw = pickFirst(locationEntry, [
        "placesToVisit",
        "places",
        "thingsToDo",
        "activities",
        "attractions",
      ]);
      if (placesRaw != null) {
        const syntheticDay = {
          day: "Day 1",
          plan: coerceArray(placesRaw),
        };
        itineraryCandidates.push(normalizeDay(syntheticDay, 0, locationLabel));
      }
    }
  });

  const itinerary = itineraryCandidates.filter(
    (day) => day && Array.isArray(day.plan) && day.plan.length > 0
  );

  return {
    ...tripData,
    hotels,
    itinerary,
    destination:
      typeof tripData.destination === "string" && tripData.destination
        ? tripData.destination
        : undefined,
    location:
      typeof tripData.location === "string" && tripData.location ? tripData.location : tripData.location,
  };
};

export const normalizeTrip = (trip) => {
  if (!trip || typeof trip !== "object") return trip;
  const destinationLabel = getTripDestinationLabel(trip);

  const normalizedTripData = normalizeTripData(trip.tripData);

  return {
    ...trip,
    userSelection: {
      ...(trip.userSelection || {}),
      location:
        typeof trip.userSelection?.location === "object" && trip.userSelection.location?.label
          ? trip.userSelection.location
          : destinationLabel
            ? { label: destinationLabel }
            : trip.userSelection?.location,
    },
    tripData: normalizedTripData,
  };
};
