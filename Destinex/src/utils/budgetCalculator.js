const isObject = (value) => Boolean(value) && typeof value === "object";

export const extractAmount = (value) => {
  if (value == null) return 0;

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, "");
    const match = cleaned.match(/-?\d+(\.\d+)?/);
    if (!match) return 0;
    const amount = Number.parseFloat(match[0]);
    return Number.isFinite(amount) ? amount : 0;
  }

  if (Array.isArray(value)) {
    return value.reduce((sum, item) => sum + extractAmount(item), 0);
  }

  if (isObject(value)) {
    const amountKeys = [
      "amount",
      "price",
      "cost",
      "value",
      "ticketPrice",
      "ticketPricing",
      "transportCost",
      "estimatedBudget",
      "totalBudget",
      "budgetEstimate",
      "budget",
    ];

    for (const key of amountKeys) {
      const parsed = extractAmount(value[key]);
      if (parsed > 0) return parsed;
    }

    for (const nested of Object.values(value)) {
      const parsed = extractAmount(nested);
      if (parsed > 0) return parsed;
    }
  }

  return 0;
};

export const normalizeDays = (value) => {
  const days = Number.parseInt(String(value ?? 1), 10);
  if (!Number.isFinite(days) || days <= 0) return 1;
  return days;
};

const toList = (value) => {
  if (Array.isArray(value)) return value;
  if (isObject(value)) return Object.values(value);
  return [];
};

const readEstimatedBudget = (trip) => {
  const candidateFields = [
    trip?.userSelection?.estimatedBudget,
    trip?.userSelection?.budgetEstimate,
    trip?.userSelection?.totalBudget,
    trip?.tripData?.estimatedBudget,
    trip?.tripData?.budgetEstimate,
    trip?.tripData?.totalBudget,
    trip?.tripData?.budget,
  ];

  for (const field of candidateFields) {
    const parsed = extractAmount(field);
    if (parsed > 0) return parsed;
  }

  return 0;
};

export const calculateBudgetFromTrip = (trip) => {
  const budgetCategories = {
    Hotels: 0,
    Food: 0,
    Tickets: 0,
    Transport: 0,
  };

  let calculatedTotal = 0;

  const hotels = toList(trip?.tripData?.hotels);
  hotels.forEach((hotel) => {
    const price = extractAmount(hotel?.price ?? hotel?.cost ?? hotel?.amount);
    if (price > 0) {
      budgetCategories.Hotels += price;
      calculatedTotal += price;
    }
  });

  const itinerary = toList(trip?.tripData?.itinerary);
  itinerary.forEach((day) => {
    const dayPlan = toList(day?.plan);
    dayPlan.forEach((place) => {
      const ticketPrice = extractAmount(place?.ticketPricing ?? place?.ticketPrice);
      if (ticketPrice > 0) {
        budgetCategories.Tickets += ticketPrice;
        calculatedTotal += ticketPrice;
      }

      const transportPrice = extractAmount(place?.transportCost ?? place?.travelCost);
      if (transportPrice > 0) {
        budgetCategories.Transport += transportPrice;
        calculatedTotal += transportPrice;
      }
    });
  });

  const days = normalizeDays(trip?.userSelection?.noOfDays);
  const budgetLevel = String(trip?.userSelection?.budget || "Moderate").toLowerCase();

  let foodCostPerDay = 1200;
  if (budgetLevel.includes("moderate")) foodCostPerDay = 2200;
  if (budgetLevel.includes("luxury")) foodCostPerDay = 4500;
  const foodCost = days * foodCostPerDay;
  budgetCategories.Food = foodCost;
  calculatedTotal += foodCost;

  if (budgetCategories.Transport === 0) {
    let transportCostPerDay = 600;
    if (budgetLevel.includes("moderate")) transportCostPerDay = 1200;
    if (budgetLevel.includes("luxury")) transportCostPerDay = 2500;
    const transportCost = days * transportCostPerDay;
    budgetCategories.Transport = transportCost;
    calculatedTotal += transportCost;
  }

  const categoryBreakdown = Object.entries(budgetCategories).map(([name, value]) => ({
    name,
    value: Math.round(value),
  }));

  const itineraryEstimatedBudget = readEstimatedBudget(trip);
  const estimatedBudget = itineraryEstimatedBudget > 0 ? itineraryEstimatedBudget : Math.round(calculatedTotal);

  return {
    estimatedBudget: Math.round(estimatedBudget),
    calculatedTotal: Math.round(calculatedTotal),
    categoryBreakdown,
    budgetLevel,
    days,
  };
};
