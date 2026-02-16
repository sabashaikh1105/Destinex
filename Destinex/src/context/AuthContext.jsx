import { createContext, useContext, useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  AUTH_TOKEN_KEY,
  createOrUpdateTrip,
  getCurrentUser,
  loginUser,
  registerUser,
  requestPasswordReset as requestPasswordResetApi,
  resetPassword as resetPasswordApi,
  setAuthToken,
  updateMyProfile,
} from "@/service/backendApi";

export const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

const LOCAL_TRIPS_KEY = "destinex.localTrips";

const safeParse = (value, fallback = null) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const readLocalTrips = () => {
  const parsed = safeParse(localStorage.getItem(LOCAL_TRIPS_KEY), []);
  return Array.isArray(parsed) ? parsed : [];
};

const writeLocalTrips = (trips) => {
  localStorage.setItem(LOCAL_TRIPS_KEY, JSON.stringify(Array.isArray(trips) ? trips : []));
};

const storeUser = (user) => {
  if (!user) {
    localStorage.removeItem("user");
    return;
  }
  localStorage.setItem("user", JSON.stringify(user));
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const syncLocalTripsToMongo = async (userEntity) => {
    const userEmail = userEntity?.email || null;
    if (!userEntity?.uid) return;

    const localTrips = readLocalTrips();
    const pendingTrips = localTrips.filter((trip) => {
      if (!trip?.id) return false;
      const isGuestTrip = !trip?.userEmail;
      const isOwnUnsyncedTrip =
        trip?.userEmail === userEmail &&
        (trip?.userId === userEntity.uid || !trip?.userId) &&
        trip?.syncedToMongo !== true;
      return isGuestTrip || isOwnUnsyncedTrip;
    });
    if (pendingTrips.length === 0) return;

    const syncedTripIds = [];
    for (const trip of pendingTrips) {
      try {
        await createOrUpdateTrip({
          ...trip,
          id: trip.id,
          userId: userEntity.uid,
          userEmail,
          updatedAt: new Date().toISOString(),
        });
        syncedTripIds.push(trip.id);
      } catch {
        // Retry on next login/session restore.
      }
    }

    if (syncedTripIds.length > 0) {
      const nextLocalTrips = localTrips.map((trip) =>
        syncedTripIds.includes(trip?.id)
          ? { ...trip, userId: userEntity.uid, userEmail, syncedToMongo: true }
          : trip
      );
      writeLocalTrips(nextLocalTrips);
    }
  };

  const applyAuthPayload = async (payload) => {
    const token = payload?.token || "";
    const user = payload?.user || null;
    setAuthToken(token);
    setCurrentUser(user);
    storeUser(user);
    if (user) await syncLocalTripsToMongo(user);
    return user;
  };

  const login = async (email, password) => {
    setError("");
    const result = await loginUser({ email, password });
    return applyAuthPayload(result);
  };

  const signup = async (email, password, extraData = {}) => {
    setError("");
    const profile = extraData && typeof extraData === "object" ? extraData : {};
    const result = await registerUser({
      email,
      password,
      firstName: profile.firstName || "",
      lastName: profile.lastName || "",
      gender: profile.gender || "",
      name:
        profile.name ||
        [profile.firstName || "", profile.lastName || ""].filter(Boolean).join(" "),
    });
    await applyAuthPayload(result);
    return { status: "complete" };
  };

  const resetPassword = async (email) => {
    setError("");
    return requestPasswordResetApi({ email });
  };

  const completeResetPassword = async ({ email, code, newPassword }) => {
    setError("");
    const result = await resetPasswordApi({ email, code, newPassword });
    await applyAuthPayload(result);
    return result;
  };

  const updateUserProfile = async (uid, updates) => {
    setError("");
    if (!uid) throw new Error("Missing user id");
    if (!currentUser || currentUser.uid !== uid) {
      throw new Error("User session mismatch. Please login again.");
    }

    const response = await updateMyProfile(updates || {});
    const updatedUser = response?.user || currentUser;
    setCurrentUser(updatedUser);
    storeUser(updatedUser);
  };

  const logout = async () => {
    setError("");
    setAuthToken("");
    setCurrentUser(null);
    storeUser(null);
  };

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        setCurrentUser(null);
        storeUser(null);
        setLoading(false);
        return;
      }

      try {
        const response = await getCurrentUser();
        if (cancelled) return;
        const user = response?.user || null;
        setCurrentUser(user);
        storeUser(user);
        if (user) await syncLocalTripsToMongo(user);
      } catch {
        if (!cancelled) {
          setAuthToken("");
          setCurrentUser(null);
          storeUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!currentUser?.uid) return;
    const syncNow = () => {
      syncLocalTripsToMongo(currentUser);
    };
    syncNow();
    const intervalId = setInterval(syncNow, 15000);
    window.addEventListener("online", syncNow);
    return () => {
      clearInterval(intervalId);
      window.removeEventListener("online", syncNow);
    };
  }, [currentUser]);

  const value = {
    currentUser,
    login,
    signup,
    resetPassword,
    completeResetPassword,
    updateUserProfile,
    logout,
    error,
    setError,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
