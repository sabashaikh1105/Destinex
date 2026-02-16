import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AI_PROMPT, SelectBudgetOptions, SelectTravelesList, TravelPreferences } from '@/constants/options';
import { chatSession } from '@/service/AIModal';
import React, { useEffect, useState, useRef } from 'react'

import { toast } from 'sonner';
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineLocationMarker, HiOutlineCalendar, HiOutlineUserGroup, HiSparkles } from 'react-icons/hi';
import { RiCompass3Line, RiRobot2Line, RiRoadMapLine, RiMapPinLine } from "react-icons/ri";
import { FiArrowRight, FiMapPin, FiDollarSign, FiSearch, FiClock, FiInfo } from 'react-icons/fi';
import { MdOutlineTravelExplore, MdAutoAwesome, MdFlightTakeoff } from "react-icons/md";
import { FaPlaneDeparture } from "react-icons/fa";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useSEO } from '@/context/SEOContext';
import { tryParseTripData } from '@/utils/parseTripData';
import { createOrUpdateTrip } from '@/service/backendApi';

const LOCAL_TRIPS_KEY = "destinex.localTrips";

const readLocalTrips = () => {
  try {
    const raw = localStorage.getItem(LOCAL_TRIPS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const upsertLocalTrip = (tripPayload) => {
  if (!tripPayload?.id) return;
  const trips = readLocalTrips();
  const nextTrips = [
    {
      ...tripPayload,
      createdAtMs: tripPayload?.createdAtMs || Date.now(),
      createdAt: tripPayload?.createdAt || null,
    },
    ...trips.filter((trip) => trip?.id !== tripPayload.id),
  ];
  localStorage.setItem(LOCAL_TRIPS_KEY, JSON.stringify(nextTrips.slice(0, 100)));
};

const generateTripId = () =>
  (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const buildNominatimLabel = (item) => {
  const address = item?.address || {};
  const city =
    address.city ||
    address.town ||
    address.village ||
    address.hamlet ||
    address.county ||
    "";
  const state = address.state || address.region || "";
  const country = address.country || "";

  const parts = [city, state, country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : (item?.display_name || "");
};

const getLocationPreviewImage = (location) => {
  const lat = Number(location?.lat);
  const lon = Number(location?.lon);
  const label = location?.label || location?.display_name || "destination";

  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    const zoom = 11;
    const latRad = (lat * Math.PI) / 180;
    const n = 2 ** zoom;
    const x = Math.floor(((lon + 180) / 360) * n);
    const y = Math.floor(
      ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
    );
    return `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
  }

  return `https://picsum.photos/seed/${encodeURIComponent(label)}/600/260`;
};

function CreateTrip() {
  const [place, setPlace] = useState();
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [animationComplete, setAnimationComplete] = useState(false);
  const progressBarRef = useRef(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const { currentUser } = useAuth();
  const [showDurationWarning, setShowDurationWarning] = useState(false);
  const { pageSEO } = useSEO();
  const [locationQuery, setLocationQuery] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [isFetchingLocations, setIsFetchingLocations] = useState(false);
  
  const steps = [
    { id: 'destination', title: 'Destination', icon: <HiOutlineLocationMarker className="h-6 w-6" /> },
    { id: 'days', title: 'Trip Duration', icon: <HiOutlineCalendar className="h-6 w-6" /> },
    { id: 'budget', title: 'Budget', icon: <FiDollarSign className="h-6 w-6" /> },
    { id: 'preferences', title: 'Preferences', icon: <RiCompass3Line className="h-6 w-6" /> },
    { id: 'travelers', title: 'Travelers', icon: <HiOutlineUserGroup className="h-6 w-6" /> },
  ];

  const navigate = useNavigate();
  
  const handleInputChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value
    });
  }

  useEffect(() => {
    const nextQuery =
      typeof formData?.location === "string"
        ? formData.location
        : (formData?.location?.label || "");

    setLocationQuery(nextQuery);
  }, [formData?.location]);

  useEffect(() => {
    const query = (locationQuery || "").trim();
    if (query.length < 3) {
      setLocationSuggestions([]);
      setIsFetchingLocations(false);
      return;
    }

    let cancelled = false;
    setIsFetchingLocations(true);

    const timer = setTimeout(async () => {
      try {
        const url =
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&accept-language=en&q=${encodeURIComponent(
            query
          )}`;
        const res = await fetch(url);
        const data = await res.json().catch(() => []);
        if (cancelled) return;

        const normalized = (Array.isArray(data) ? data : [])
          .filter((x) => x && x.address)
          .map((x) => ({
            place_id: x.place_id,
            lat: x.lat,
            lon: x.lon,
            label: buildNominatimLabel(x),
            display_name: x.display_name,
            address: x.address,
          }));

        setLocationSuggestions(normalized);
      } catch {
        if (!cancelled) setLocationSuggestions([]);
      } finally {
        if (!cancelled) setIsFetchingLocations(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [locationQuery]);



  useEffect(() => {
    // Start processing animation after component loads
    const timer = setTimeout(() => {
      setAnimationComplete(true);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  // Show duration warning toast when user reaches the Trip Duration step
  useEffect(() => {
    if (activeStep === 1 && !showDurationWarning) {
      setShowDurationWarning(true);
      toast(
        <div className="flex items-start">
          <FiInfo className="text-blue-500 mt-1 mr-2 flex-shrink-0" />
          <div>
            <p className="font-medium mb-1">Recommended Trip Duration</p>
            <p className="text-sm">For the best trip recommendations, please select a duration of 3 to 4 days. Choosing more than 4 days may occasionally cause errors, as the AI currently has limitations when generating large travel plans.</p>
          </div>
        </div>,
        {
          duration: 8000,
          position: "top-center",
          className: "bg-blue-50 border border-blue-200 text-gray-800"
        }
      );
    }
  }, [activeStep, showDurationWarning]);

  // Flight animation progress for loading
  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setLoadingProgress((prev) => {
          const newProgress = prev + 1;
          return newProgress > 100 ? 0 : newProgress;
        });
      }, 100);
    } else {
      setLoadingProgress(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const OnGenerateTrip = async () => {
    if (!formData?.location || !formData?.noOfDays || !formData?.budget || !formData?.traveler) {
      toast("Please fill all details");
      return;
    }
    
    setLoading(true);
    toast('Our AI is crafting your perfect trip...');

    try {
      // Get all selected preference titles to create a comma-separated string
      const preferencesString = [
        ...(formData?.preferences?.locationTypes || []),
        ...(formData?.preferences?.learning || []),
        ...(formData?.preferences?.activities || []),
        ...(formData?.preferences?.relaxation || [])
      ].join(', ');
      
      const FINAL_PROMPT = AI_PROMPT
        .replace('{location}', formData?.location.label)
        .replace('{totalDays}', formData?.noOfDays)
        .replace('{traveler}', formData?.traveler)
        .replace('{budget}', formData?.budget)
        .replace('{preferences}', preferencesString)
        .replace('{totalDays}', formData?.noOfDays);
      
      const result = await chatSession.sendMessage(FINAL_PROMPT);
      await SaveAiTrip(result?.response?.text());
    } catch (error) {
      console.error('Failed to generate trip:', error);
      toast.error(error?.message || 'Trip generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

	  const SaveAiTrip = async (TripData) => {
    try {
      setLoading(true);

      const user = JSON.parse(localStorage.getItem("user") || "null");
      const userEmail =
        [currentUser?.email, user?.email].find(
          (email) => typeof email === "string" && email.trim().length > 0
        ) || null;
      const resolvedUserId =
        [currentUser?.uid, user?.uid].find(
          (uid) => typeof uid === "string" && uid.trim().length > 0
        ) || null;

      const tripId = generateTripId();
      const parsedTripData = tryParseTripData(TripData);
      const tripPayload = {
        id: tripId,
        userId: resolvedUserId,
        userSelection: formData,
        tripData: parsedTripData ?? TripData,
        tripDataRaw: parsedTripData ? null : TripData,
        userEmail,
        syncedToMongo: false,
        createdAtMs: Date.now(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const localTripPayload = { ...tripPayload, createdAt: null };

      // Always keep a local copy and move user to trip page immediately.
      upsertLocalTrip(localTripPayload);
      navigate(`/view-trip/${tripId}`, { state: { trip: localTripPayload } });

      if (!resolvedUserId && !userEmail) {
        toast("Trip saved locally. Sign in to sync across devices.");
        return;
      }

      try {
        await createOrUpdateTrip(tripPayload);
        upsertLocalTrip({ ...localTripPayload, syncedToMongo: true });
        toast.success("Trip created successfully.");
      } catch (saveErr) {
        console.error("Failed to save trip to backend:", saveErr);
        toast.error(
          `Saved locally only. ${saveErr?.message || "Backend sync failed."} You'll still see it in My Trips.`
        );
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to save trip");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const prevStep = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const isStepComplete = (stepIndex) => {
    switch (stepIndex) {
      case 0: return !!formData?.location;
      case 1: return !!formData?.noOfDays;
      case 2: return !!formData?.budget;
      case 3: return !!formData?.preferences;
      case 4: return !!formData?.traveler;
      default: return false;
    }
  };

  const isFormComplete = () => {
    return !!formData?.location && 
           !!formData?.noOfDays && 
           !!formData?.budget &&
           !!formData?.preferences &&
           !!formData?.traveler;
  };

  // Flight path animation for loading
  const flightPath = {
    curve: {
      x: [0, 50, 100, 150, 200, 220, 200],
      y: [0, -10, -15, -10, -5, 0, 10],
      scale: [1, 1.1, 1.2, 1.1, 1, 0.9, 1],
      rotate: [0, 10, 15, 10, 5, 0, -5],
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pt-24 pb-20 px-4 sm:px-6 overflow-hidden">
      {pageSEO.createTrip()}
      
      <div className="max-w-6xl mx-auto">
        {/* Header with AI processing animation */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          
          
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[#2b2685] to-[#f79577]">
            Design Your Dream Adventure
          </h1>
          
          <p className="text-xl text-black-600 max-w-3xl mx-auto">
            Tell us your preferences, and our AI travel planner will craft a personalized itinerary just for you.
          </p>
        </motion.div>

        {/* AI Processing Indicator */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: animationComplete ? 0 : 1, scale: animationComplete ? 0.9 : 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.5 }}
          className={`${animationComplete ? 'hidden' : 'block'} max-w-md mx-auto bg-white rounded-xl shadow-lg p-6 mb-12`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-2">
                <RiRobot2Line className="text-purple-600" />
              </div>
              <span className="font-medium">AI Trip Planner</span>
            </div>
            <span className="text-sm text-gray-500">Initializing...</span>
          </div>
          
          <div className="space-y-3">
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.5 }}
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                ref={progressBarRef}
              ></motion.div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Loading travel intelligence</span>
              <span>Please wait</span>
            </div>
          </div>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: animationComplete ? 1 : 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mb-10"
        >
          <div className="flex justify-between items-center max-w-3xl mx-auto px-4 sm:px-0">
            {steps.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center relative">
                <button
                  onClick={() => isStepComplete(index) && setActiveStep(index)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${
                    activeStep === index
                      ? 'bg-gradient-to-r from-[#131583] to-[#f79577] text-white shadow-lg'
                      : index < activeStep || isStepComplete(index)
                      ? 'bg-green-100 text-black-600 border border-green-200'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {step.icon}
                </button>
                <span className={`text-xs font-medium ${activeStep === index ? 'text-[#410d94]' : 'text-gray-500'}`}>
                  {step.title}
                </span>
                
                {index < steps.length - 1 && (
                  <div className="absolute h-[2px] w-[calc(100%-4rem)] bg-gray-200 top-6 left-12 -z-10">
                    <div 
                      className="h-full bg-gradient-to-r from-[#131583] to-[#f79577] transition-all duration-500"
                      style={{ width: index < activeStep ? '100%' : '0%' }}
                    ></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Form Steps */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white p-8 rounded-2xl shadow-lg max-w-4xl mx-auto relative overflow-hidden"
          >
            {/* Decorative background elements */}
            <div className="absolute -z-10 top-0 right-0 w-64 h-64 bg-purple-300 rounded-full filter blur-3xl opacity-10"></div>
            <div className="absolute -z-10 bottom-0 left-0 w-64 h-64 bg-blue-300 rounded-full filter blur-3xl opacity-10"></div>
            
            {/* Step 1: Destination */}
            {activeStep === 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <HiOutlineLocationMarker className="mr-2 text-[#131583]" />
                  Where would you like to go?
                </h2>
                <p className="text-gray-600 mb-8">
                  Enter your dream destination and our AI will craft the perfect itinerary for you.
                </p>
                
                <div className="mb-6 relative">
                  <label htmlFor="trip-location-input" className="sr-only">
                    Destination
                  </label>
                  <div className="flex items-center absolute left-3 top-3 text-gray-400">
                    <FiSearch />
                  </div>
                 
                </div>
                
	                {formData?.location && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-blue-50 p-4 rounded-lg flex items-start gap-4 mb-6"
                  >
                    <div className="w-28 h-20 sm:w-40 sm:h-24 rounded-lg overflow-hidden bg-blue-100 shrink-0">
                      <img
                        src={getLocationPreviewImage(formData?.location)}
                        alt={formData?.location?.label || formData?.location || "Selected destination"}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          const label = formData?.location?.label || formData?.location || "destination";
                          e.currentTarget.src = `https://picsum.photos/seed/${encodeURIComponent(label)}/600/260`;
                        }}
                      />
                    </div>
	                    <div>
                        <div className="bg-blue-100 p-2 rounded-full mr-3 w-fit mb-2">
                          <RiMapPinLine className="text-blue-600" />
                        </div>
	                      <h3 className="font-medium">Selected Destination</h3>
	                    <p className="text-gray-700">{formData?.location?.label || formData.location}</p>

	                    </div>
	                  </motion.div>
	                )}
                  <div className="relative">
                    <Input
                      id="trip-location-input"
                      name="location"
                      autoComplete="off"
                      placeholder="Type a city (e.g. San Francisco, CA)"
                      value={locationQuery}
                      onChange={(e) => {
                        const next = e.target.value;
                        setLocationQuery(next);
                        handleInputChange("location", { label: next });
                      }}
                      className="pl-10 py-6 text-lg rounded-xl"
                    />

                    {(isFetchingLocations || locationSuggestions.length > 0) && (
                      <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                        {isFetchingLocations && (
                          <div className="px-4 py-3 text-sm text-gray-500">
                            Searching locations…
                          </div>
                        )}
                        {locationSuggestions.map((s) => (
                          <button
                            key={s.place_id}
                            type="button"
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                            onClick={() => {
                              setLocationQuery(s.label);
                              setLocationSuggestions([]);
                              handleInputChange("location", {
                                label: s.label,
                                place_id: s.place_id,
                                lat: s.lat,
                                lon: s.lon,
                                address: s.address,
                              });
                            }}
                          >
                            <div className="text-sm font-medium text-gray-800">
                              {s.label}
                            </div>
                            {s.display_name && s.display_name !== s.label && (
                              <div className="text-xs text-gray-500 mt-0.5">
                                {s.display_name}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

	                <div className="flex justify-between mt-10">
	                  <div></div> {/* Empty div for spacing */}
                  <Button 
                    onClick={nextStep}
                    disabled={!locationQuery?.trim()}
                    className={`rounded-full px-6 ${
                      locationQuery?.trim()
                        ? 'bg-gradient-to-r from-[#131583] to-[#f79577] hover:opacity-90' 
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    } group`}
                  >
                    Continue <FiArrowRight className="ml-2 transition-transform duration-200 group-hover:translate-x-1" />
                  </Button>
                </div>
              </div>
            )}
            
            {/* Step 2: Trip Duration */}
            {activeStep === 1 && (
              <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <HiOutlineCalendar className="mr-2 text-[#f56551]" />
                  How many days are you planning to travel?
                </h2>
                <p className="text-gray-600 mb-8">
                  Tell us the duration of your trip so we can plan the perfect daily itinerary.
                </p>
                
                <div className="mb-6">
                  <label htmlFor="trip-days-input" className="sr-only">
                    Number of travel days
                  </label>
                  <div className="relative">
                    <div className="flex items-center absolute left-3 top-3 text-gray-400">
                      <FiClock />
                    </div>
                    <Input 
                      id="trip-days-input"
                      name="noOfDays"
                      placeholder="Number of days (e.g. 3)" 
                      type="number" 
                      value={formData?.noOfDays || ''}
                      onChange={(e) => handleInputChange('noOfDays', e.target.value)}
                      className="pl-10 py-6 text-lg rounded-xl"
                    />
                  </div>
                </div>
                
                {formData?.noOfDays && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-50 p-4 rounded-lg flex items-start mb-6"
                  >
                    <div className="bg-green-100 p-2 rounded-full mr-3">
                      <HiOutlineCalendar className="text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Trip Duration</h3>
                      <p className="text-gray-700">{formData.noOfDays} {parseInt(formData.noOfDays) === 1 ? 'day' : 'days'}</p>
                    </div>
                  </motion.div>
                )}
                
                <div className="flex justify-between mt-10">
                  <Button 
                    onClick={prevStep}
                    variant="outline" 
                    className="rounded-full px-6"
                  >
                    Back
                  </Button>
                  
                  <Button 
                    onClick={nextStep}
                    disabled={!formData?.noOfDays}
                    className={`rounded-full px-6 ${
                      formData?.noOfDays 
                        ? 'bg-gradient-to-r from-[#f56551] to-[#f79577] hover:opacity-90' 
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    } group`}
                  >
                    Continue <FiArrowRight className="ml-2 transition-transform duration-200 group-hover:translate-x-1" />
                  </Button>
                </div>
              </div>
            )}
            
            {/* Step 3: Budget */}
            {activeStep === 2 && (
              <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <FiDollarSign className="mr-2 text-[#f56551]" />
                  What's your budget for this trip?
                </h2>
                <p className="text-gray-600 mb-8">
                  Select your budget range to help us suggest appropriate accommodations and activities.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {SelectBudgetOptions.map((item, index) => (
                    <motion.div 
                      key={index}
                      whileHover={{ y: -5, transition: { duration: 0.2 } }}
                      onClick={() => handleInputChange('budget', item.title)}
                      className={`p-6 rounded-xl cursor-pointer transition-all duration-300 ${
                        formData?.budget === item.title 
                          ? 'bg-gradient-to-br from-white to-gray-50 border-[#f56551] border-2 shadow-lg' 
                          : 'bg-white border border-gray-200 hover:shadow-md'
                      }`}
                    >
                      <div className="text-4xl mb-4">{item.icon}</div>
                      <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                      <p className="text-gray-500 text-sm">{item.desc}</p>
                      
                      {formData?.budget === item.title && (
                        <div className="mt-3 inline-flex items-center text-[#f56551] text-sm">
                          <HiSparkles className="mr-1" /> Selected
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
                
                <div className="flex justify-between mt-10">
                  <Button 
                    onClick={prevStep}
                    variant="outline" 
                    className="rounded-full px-6"
                  >
                    Back
                  </Button>
                  
                  <Button 
                    onClick={nextStep}
                    disabled={!formData?.budget}
                    className={`rounded-full px-6 ${
                      formData?.budget 
                        ? 'bg-gradient-to-r from-[#f56551] to-[#f79577] hover:opacity-90' 
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    } group`}
                  >
                    Continue <FiArrowRight className="ml-2 transition-transform duration-200 group-hover:translate-x-1" />
                  </Button>
                </div>
              </div>
            )}
            
            {/* Step 4: Preferences */}
            {activeStep === 3 && (
              <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <RiCompass3Line className="mr-2 text-[#f56551]" />
                  What are your travel preferences?
                </h2>
                <p className="text-gray-600 mb-8">
                  Select your preferences to customize your trip experience.
                </p>

                {/* Preferences Categories */}
                <div className="space-y-6">
                  {/* Location Types */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <FiMapPin className="mr-2 text-[#f56551]" />
                      Location Types
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {TravelPreferences.locationTypes.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            const currentPrefs = formData?.preferences || {};
                            const locationTypes = currentPrefs.locationTypes || [];
                            
                            // Toggle selection
                            const newLocationTypes = locationTypes.includes(item.title)
                              ? locationTypes.filter(type => type !== item.title)
                              : [...locationTypes, item.title];
                            
                            handleInputChange('preferences', {
                              ...currentPrefs,
                              locationTypes: newLocationTypes
                            });
                          }}
                          className={`p-3 rounded-lg cursor-pointer transition-all ${
                            formData?.preferences?.locationTypes?.includes(item.title)
                              ? 'bg-gradient-to-r from-[#f56551]/20 to-[#f79577]/20 border border-[#f56551]/30'
                              : 'bg-gray-50 hover:bg-gray-100 border border-gray-100'
                          }`}
                        >
                          <div className="flex items-center">
                            <span className="text-xl mr-2">{item.icon}</span>
                            <div>
                              <div className="font-medium">{item.title}</div>
                              <div className="text-xs text-gray-500">{item.desc}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Learning Preferences */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <HiSparkles className="mr-2 text-[#f56551]" />
                      Learning Preferences
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
                      {TravelPreferences.learning.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            const currentPrefs = formData?.preferences || {};
                            const learning = currentPrefs.learning || [];
                            
                            // Toggle selection
                            const newLearning = learning.includes(item.title)
                              ? learning.filter(type => type !== item.title)
                              : [...learning, item.title];
                            
                            handleInputChange('preferences', {
                              ...currentPrefs,
                              learning: newLearning
                            });
                          }}
                          className={`p-3 rounded-lg cursor-pointer transition-all ${
                            formData?.preferences?.learning?.includes(item.title)
                              ? 'bg-gradient-to-r from-[#f56551]/20 to-[#f79577]/20 border border-[#f56551]/30'
                              : 'bg-gray-50 hover:bg-gray-100 border border-gray-100'
                          }`}
                        >
                          <div className="flex items-center">
                            <span className="text-xl mr-2">{item.icon}</span>
                            <div>
                              <div className="font-medium">{item.title}</div>
                              <div className="text-xs text-gray-500">{item.desc}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Activities */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <MdOutlineTravelExplore className="mr-2 text-[#f56551]" />
                      Physical Activities
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
                      {TravelPreferences.activities.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            const currentPrefs = formData?.preferences || {};
                            const activities = currentPrefs.activities || [];
                            
                            // Toggle selection
                            const newActivities = activities.includes(item.title)
                              ? activities.filter(type => type !== item.title)
                              : [...activities, item.title];
                            
                            handleInputChange('preferences', {
                              ...currentPrefs,
                              activities: newActivities
                            });
                          }}
                          className={`p-3 rounded-lg cursor-pointer transition-all ${
                            formData?.preferences?.activities?.includes(item.title)
                              ? 'bg-gradient-to-r from-[#f56551]/20 to-[#f79577]/20 border border-[#f56551]/30'
                              : 'bg-gray-50 hover:bg-gray-100 border border-gray-100'
                          }`}
                        >
                          <div className="flex items-center">
                            <span className="text-xl mr-2">{item.icon}</span>
                            <div>
                              <div className="font-medium">{item.title}</div>
                              <div className="text-xs text-gray-500">{item.desc}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Relaxation */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <FiClock className="mr-2 text-[#f56551]" />
                      Relaxation Options
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
                      {TravelPreferences.relaxation.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            const currentPrefs = formData?.preferences || {};
                            const relaxation = currentPrefs.relaxation || [];
                            
                            // Toggle selection
                            const newRelaxation = relaxation.includes(item.title)
                              ? relaxation.filter(type => type !== item.title)
                              : [...relaxation, item.title];
                            
                            handleInputChange('preferences', {
                              ...currentPrefs,
                              relaxation: newRelaxation
                            });
                          }}
                          className={`p-3 rounded-lg cursor-pointer transition-all ${
                            formData?.preferences?.relaxation?.includes(item.title)
                              ? 'bg-gradient-to-r from-[#f56551]/20 to-[#f79577]/20 border border-[#f56551]/30'
                              : 'bg-gray-50 hover:bg-gray-100 border border-gray-100'
                          }`}
                        >
                          <div className="flex items-center">
                            <span className="text-xl mr-2">{item.icon}</span>
                            <div>
                              <div className="font-medium">{item.title}</div>
                              <div className="text-xs text-gray-500">{item.desc}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between mt-10">
                  <Button 
                    onClick={prevStep}
                    variant="outline" 
                    className="rounded-full px-6"
                  >
                    Back
                  </Button>
                  
                  <Button 
                    onClick={nextStep}
                    disabled={!formData?.preferences || 
                             (!formData?.preferences?.locationTypes?.length && 
                              !formData?.preferences?.learning?.length && 
                              !formData?.preferences?.activities?.length && 
                              !formData?.preferences?.relaxation?.length)}
                    className={`rounded-full px-6 ${
                      formData?.preferences &&
                      (formData?.preferences?.locationTypes?.length ||
                       formData?.preferences?.learning?.length ||
                       formData?.preferences?.activities?.length ||
                       formData?.preferences?.relaxation?.length)
                        ? 'bg-gradient-to-r from-[#f56551] to-[#f79577] hover:opacity-90' 
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    } group`}
                  >
                    Continue <FiArrowRight className="ml-2 transition-transform duration-200 group-hover:translate-x-1" />
                  </Button>
                </div>
              </div>
            )}
            
            {/* Step 5: Travelers */}
            {activeStep === 4 && (
              <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <HiOutlineUserGroup className="mr-2 text-[#f56551]" />
                  Who's traveling with you?
                </h2>
                <p className="text-gray-600 mb-8">
                  Select your travel group to help us tailor activities and accommodations.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {SelectTravelesList.map((item, index) => (
                    <motion.div 
                      key={index}
                      whileHover={{ y: -5, transition: { duration: 0.2 } }}
                      onClick={() => handleInputChange('traveler', item.people)}
                      className={`p-6 rounded-xl cursor-pointer transition-all duration-300 ${
                        formData?.traveler === item.people 
                          ? 'bg-gradient-to-br from-white to-gray-50 border-[#f56551] border-2 shadow-lg' 
                          : 'bg-white border border-gray-200 hover:shadow-md'
                      }`}
                    >
                      <div className="text-4xl mb-4">{item.icon}</div>
                      <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                      <p className="text-gray-500 text-sm">{item.desc}</p>
                      
                      {formData?.traveler === item.people && (
                        <div className="mt-3 inline-flex items-center text-[#f56551] text-sm">
                          <HiSparkles className="mr-1" /> Selected
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
                
                <div className="flex justify-between mt-10">
                  <Button 
                    onClick={prevStep}
                    variant="outline" 
                    className="rounded-full px-6"
                  >
                    Back
                  </Button>
                  
                  <Button 
                    onClick={OnGenerateTrip}
                    disabled={!isFormComplete() || loading}
                    className="rounded-full px-8 py-6 bg-gradient-to-r from-[#f56551] to-[#f79577] hover:opacity-90 transition-all duration-300 relative overflow-hidden"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="relative w-36 h-8">
                          {/* Flight path with dot trail */}
                          <div className="absolute left-0 top-4 w-full h-[2px] bg-white/30 rounded"></div>
                          
                          {/* Flight icon that moves along the path */}
                          <motion.div 
                            className="absolute"
                            animate={{
                              x: [0, 150],
                              y: [0, -5, 0, 5, 0],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "linear"
                            }}
                            style={{ left: "0%", top: "50%" }}
                          >
                            <FaPlaneDeparture className="text-white h-5 w-5" />
                          </motion.div>
                          
                          {/* Animated dots for the flight path */}
                          {[...Array(6)].map((_, i) => (
                            <motion.div 
                              key={i}
                              className="absolute w-1.5 h-1.5 bg-white rounded-full"
                              style={{ 
                                left: `${(i + 1) * 20}%`, 
                                top: "50%",
                                opacity: 0.7 - (i * 0.1)
                              }}
                              animate={{
                                opacity: [0.7 - (i * 0.1), 0.3, 0.7 - (i * 0.1)]
                              }}
                              transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                delay: i * 0.2
                              }}
                            />
                          ))}
                          
                          <span className="absolute right-0 whitespace-nowrap text-white">
                            Crafting your trip...
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <MdFlightTakeoff className="mr-2 text-xl" />
                        Generate Your Trip
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      
    </div>
  )
};
export default CreateTrip;
