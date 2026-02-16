import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import "./index.css";

import App from "./App.jsx";
import CreateTrip from "./create-trip/index.jsx";
import Viewtrip from "./view-trip/[tripId]/index.jsx";
import BookingPage from "./booking/[tripId]/index.jsx";
import MyTrips from "./my-trips/index.jsx";
import TripStatsDashboard from "./components/TripStatsDashboard.jsx";
import HowItWorks from "./components/custom/HowItWorks.jsx";
import ContactUs from "./components/custom/Budget.jsx";
import BudgetCalculatorPage from "./budget/index.jsx";
import LoginPage from "./auth/Login.jsx";
import SignupPage from "./auth/Signup.jsx";
import TermsOfService from "./components/custom/TermsOfService.jsx";
import PrivacyPolicy from "./components/custom/PrivacyPolicy.jsx";
import CookiePolicy from "./components/custom/CookiePolicy.jsx";
import UserManual from "./components/custom/UserManual.jsx";

import { AuthProvider } from "./context/AuthContext";
import { PlacePhotoProvider } from "./context/PlacePhotoContext";
import { SEOProvider } from "./context/SEOContext";
import Hero from "./components/custom/Hero.jsx";
import { HelmetProvider } from "react-helmet-async";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

import "leaflet/dist/leaflet.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Hero /> },
      { path: "create-trip", element: <CreateTrip /> },
      { path: "view-trip/:tripId", element: <Viewtrip /> },
      { path: "booking/:tripId", element: <BookingPage /> },
      { path: "my-trips", element: <MyTrips /> },
      { path: "trip-stats", element: <TripStatsDashboard /> },
      { path: "how-it-works", element: <HowItWorks /> },
      { path: "budget", element: <BudgetCalculatorPage /> },
      { path: "contact", element: <ContactUs /> },
      { path: "terms", element: <TermsOfService /> },
      { path: "privacy", element: <PrivacyPolicy /> },
      { path: "cookies", element: <CookiePolicy /> },
      { path: "user-manual", element: <UserManual /> },
      { path: "login", element: <LoginPage /> },
      { path: "signup", element: <SignupPage /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HelmetProvider>
      <AuthProvider>
        <PlacePhotoProvider>
          <SEOProvider>
            <RouterProvider router={router} />
            <Analytics />
            <SpeedInsights />
          </SEOProvider>
        </PlacePhotoProvider>
      </AuthProvider>
    </HelmetProvider>
  </React.StrictMode>
);
