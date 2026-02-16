import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { tryParseTripData } from "@/utils/parseTripData";
import { normalizeTrip } from "@/utils/normalizeTripData";
import { calculateBudgetFromTrip, extractAmount } from "@/utils/budgetCalculator";
import { useSEO } from "@/context/SEOContext";
import { getTripById } from "@/service/backendApi";

const COLORS = ["#2563EB", "#10B981", "#F59E0B", "#F97316", "#8B5CF6", "#06B6D4"];
const EXPENSE_CATEGORIES = ["Food", "Transport", "Tickets", "Hotels", "Shopping", "Misc"];

const createExpenseRow = (index = 0) => ({
  id: `${Date.now()}-${index}`,
  name: "",
  category: "Misc",
  amount: "",
  note: "",
});

function BudgetCalculatorPage() {
  const location = useLocation();
  const { pageSEO } = useSEO();
  const searchParams = new URLSearchParams(location.search);
  const tripId = searchParams.get("tripId");

  const [trip, setTrip] = useState(location?.state?.trip || null);
  const [loadingTrip, setLoadingTrip] = useState(false);
  const [estimatedBudget, setEstimatedBudget] = useState(0);
  const [expenses, setExpenses] = useState([createExpenseRow(1), createExpenseRow(2)]);

  useEffect(() => {
    const stateTrip = location?.state?.trip;
    if (stateTrip) {
      const parsed =
        typeof stateTrip?.tripData === "string"
          ? tryParseTripData(stateTrip.tripData)
          : stateTrip?.tripData;
      const normalized = normalizeTrip(parsed ? { ...stateTrip, tripData: parsed } : stateTrip);
      setTrip(normalized);
      return;
    }

    if (!tripId) return;

    const fetchTrip = async () => {
      setLoadingTrip(true);
      try {
        const data = await getTripById(tripId);
        if (!data) return;
        let normalized = data;

        if (typeof data?.tripData === "string") {
          const parsed = tryParseTripData(data.tripData);
          if (parsed) normalized = { ...data, tripData: parsed };
        }

        setTrip(normalizeTrip(normalized));
      } catch (error) {
        console.error("Failed to load trip for budget calculator:", error);
      } finally {
        setLoadingTrip(false);
      }
    };

    fetchTrip();
  }, [location?.state?.trip, tripId]);

  const itineraryBudget = useMemo(() => calculateBudgetFromTrip(trip || {}), [trip]);

  useEffect(() => {
    const base = itineraryBudget.estimatedBudget || itineraryBudget.calculatedTotal || 0;
    setEstimatedBudget(base);
  }, [itineraryBudget.estimatedBudget, itineraryBudget.calculatedTotal]);

  const normalizedExpenses = useMemo(
    () =>
      expenses
        .map((row) => ({
          ...row,
          numericAmount: extractAmount(row.amount),
        }))
        .filter((row) => row.numericAmount > 0),
    [expenses]
  );

  const extraByCategory = useMemo(() => {
    const map = {};
    normalizedExpenses.forEach((row) => {
      map[row.category] = (map[row.category] || 0) + row.numericAmount;
    });
    return map;
  }, [normalizedExpenses]);

  const chartData = useMemo(() => {
    const plannedMap = {};
    itineraryBudget.categoryBreakdown.forEach((item) => {
      plannedMap[item.name] = item.value;
    });

    const categories = Array.from(
      new Set([...Object.keys(plannedMap), ...Object.keys(extraByCategory), ...EXPENSE_CATEGORIES])
    );

    return categories.map((category) => {
      const planned = Math.round(plannedMap[category] || 0);
      const extra = Math.round(extraByCategory[category] || 0);
      return {
        name: category,
        planned,
        extra,
        actual: planned + extra,
      };
    });
  }, [itineraryBudget.categoryBreakdown, extraByCategory]);

  const totalExtra = normalizedExpenses.reduce((sum, row) => sum + row.numericAmount, 0);
  const totalPlanned = itineraryBudget.calculatedTotal || 0;
  const estimate = extractAmount(estimatedBudget);
  const projectedTotal = totalPlanned + totalExtra;
  const budgetDiff = estimate - projectedTotal;

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(value) || 0);

  const updateExpense = (id, key, value) => {
    setExpenses((prev) => prev.map((row) => (row.id === id ? { ...row, [key]: value } : row)));
  };

  const addExpenseRow = () => {
    setExpenses((prev) => [...prev, createExpenseRow(prev.length + 1)]);
  };

  const removeExpenseRow = (id) => {
    setExpenses((prev) => (prev.length > 1 ? prev.filter((row) => row.id !== id) : prev));
  };

  const destination = trip?.userSelection?.location?.label || trip?.tripData?.destination || "Your trip";

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pt-24 pb-16 px-4 sm:px-6">
      {pageSEO.budgetCalculator ? pageSEO.budgetCalculator() : null}

      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Budget Calculator</h1>
          <p className="text-gray-600 mt-2">
            Uses estimated budget from your itinerary and lets you track extra expenses with live graphs.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-5 sm:p-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2">
            <p className="text-sm text-gray-500 mb-1">Trip</p>
            <p className="font-semibold text-gray-900">{destination}</p>
            {trip?.userSelection?.noOfDays ? (
              <p className="text-sm text-gray-500">{trip.userSelection.noOfDays} day itinerary loaded</p>
            ) : (
              <p className="text-sm text-gray-500">Load a trip from View Trip to auto-fill more details.</p>
            )}
          </div>
          <div className="md:col-span-2">
            <label htmlFor="estimatedBudget" className="text-sm text-gray-600 block mb-1">
              Estimated Budget
            </label>
            <input
              id="estimatedBudget"
              type="number"
              min="0"
              value={estimatedBudget}
              onChange={(event) => setEstimatedBudget(event.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>

        {loadingTrip ? (
          <div className="bg-white rounded-2xl shadow-md p-8 text-center text-gray-500">Loading trip budget data...</div>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Estimated Budget</p>
            <p className="text-2xl font-bold text-blue-700">{formatCurrency(estimate)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Planned (Itinerary)</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalPlanned)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Extra Expenses</p>
            <p className="text-2xl font-bold text-amber-600">{formatCurrency(totalExtra)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Budget Remaining</p>
            <p className={`text-2xl font-bold ${budgetDiff >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {formatCurrency(budgetDiff)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <motion.div className="bg-white rounded-2xl shadow-md p-5 sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Planned Allocation</h2>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={itineraryBudget.categoryBreakdown} dataKey="value" cx="50%" cy="50%" outerRadius={110} label>
                    {itineraryBudget.categoryBreakdown.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [formatCurrency(value), "Planned"]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div className="bg-white rounded-2xl shadow-md p-5 sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Planned vs Extra by Category</h2>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="planned" fill="#2563EB" name="Planned" />
                  <Bar dataKey="extra" fill="#F59E0B" name="Extra" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-5 sm:p-6">
          <div className="flex justify-between items-center gap-3 mb-4 flex-wrap">
            <h2 className="text-xl font-semibold text-gray-900">Extra Budget Panel</h2>
            <button
              onClick={addExpenseRow}
              className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Add Expense
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="text-left bg-gray-50">
                  <th className="px-3 py-2">Expense</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Amount</th>
                  <th className="px-3 py-2">Note</th>
                  <th className="px-3 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="px-3 py-2">
                      <input
                        value={row.name}
                        onChange={(event) => updateExpense(row.id, "name", event.target.value)}
                        placeholder="Taxi / Dinner / Tickets"
                        className="w-full border border-gray-300 rounded-md px-2 py-1"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={row.category}
                        onChange={(event) => updateExpense(row.id, "category", event.target.value)}
                        className="w-full border border-gray-300 rounded-md px-2 py-1"
                      >
                        {EXPENSE_CATEGORIES.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={row.amount}
                        onChange={(event) => updateExpense(row.id, "amount", event.target.value)}
                        type="number"
                        min="0"
                        placeholder="0"
                        className="w-full border border-gray-300 rounded-md px-2 py-1"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={row.note}
                        onChange={(event) => updateExpense(row.id, "note", event.target.value)}
                        placeholder="Optional note"
                        className="w-full border border-gray-300 rounded-md px-2 py-1"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => removeExpenseRow(row.id)}
                        className="text-red-600 hover:text-red-700 font-medium"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-sm text-gray-600 flex flex-wrap gap-x-8 gap-y-2">
            <p>Projected Total Spend: <span className="font-semibold text-gray-900">{formatCurrency(projectedTotal)}</span></p>
            <p>Total Extra Spend: <span className="font-semibold text-amber-700">{formatCurrency(totalExtra)}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BudgetCalculatorPage;
