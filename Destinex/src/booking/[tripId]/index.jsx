import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { MdVerified, MdOutlineArrowBack } from 'react-icons/md';
import { FaFileInvoiceDollar, FaMoneyCheckAlt } from 'react-icons/fa';
import { calculateBudgetFromTrip } from '@/utils/budgetCalculator';
import { getTripById, updateTrip } from '@/service/backendApi';
import { tryParseTripData } from '@/utils/parseTripData';
import { normalizeTrip } from '@/utils/normalizeTripData';
import { downloadBookingBillAsPDF } from '@/utils/trip-sharing';

const LOCAL_TRIPS_KEY = 'destinex.localTrips';

const safeParse = (value, fallback = null) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const updateLocalTripBooking = (tripId, booking) => {
  if (!tripId) return;
  const localTrips = safeParse(localStorage.getItem(LOCAL_TRIPS_KEY), []);
  if (!Array.isArray(localTrips) || localTrips.length === 0) return;

  const nextLocalTrips = localTrips.map((trip) =>
    trip?.id === tripId
      ? { ...trip, booking, updatedAt: new Date().toISOString(), syncedToMongo: false }
      : trip
  );

  localStorage.setItem(LOCAL_TRIPS_KEY, JSON.stringify(nextLocalTrips));
};

const readLocalTripById = (tripId) => {
  if (!tripId) return null;
  const localTrips = safeParse(localStorage.getItem(LOCAL_TRIPS_KEY), []);
  if (!Array.isArray(localTrips)) return null;
  return localTrips.find((item) => item?.id === tripId) || null;
};

const generateReference = (prefix) => {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${datePart}-${randomPart}`;
};

function BookingPage() {
  const { tripId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [transactionStep, setTransactionStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDownloadingBill, setIsDownloadingBill] = useState(false);
  const loadedTripIdRef = useRef(null);

  const booking = trip?.booking || null;
  const isBooked = booking?.status === 'booked';

  const budgetResult = useMemo(() => calculateBudgetFromTrip(trip || {}), [trip]);
  const packageAmount = Number(budgetResult?.calculatedTotal || budgetResult?.estimatedBudget || 0);
  const destination = useMemo(() => {
    const userSelected = trip?.userSelection?.location?.label || trip?.userSelection?.location;
    const tripDestination = trip?.tripData?.destination;
    const locationList = Array.isArray(trip?.tripData?.locations) ? trip.tripData.locations : [];
    const firstLocation =
      locationList.find((item) => item?.location || item?.name)?.location ||
      locationList.find((item) => item?.location || item?.name)?.name;
    return userSelected || tripDestination || firstLocation || 'Destination';
  }, [trip]);

  const packageDetails = useMemo(() => {
    const hotels = Array.isArray(trip?.tripData?.hotels) ? trip.tripData.hotels : [];
    const itinerary = Array.isArray(trip?.tripData?.itinerary) ? trip.tripData.itinerary : [];
    const placesCount = itinerary.reduce((count, day) => {
      const plan = Array.isArray(day?.plan) ? day.plan : [];
      return count + plan.length;
    }, 0);

    const preferences = trip?.userSelection?.preferences || {};
    const prefValues = [
      ...(Array.isArray(preferences.locationTypes) ? preferences.locationTypes : []),
      ...(Array.isArray(preferences.learning) ? preferences.learning : []),
      ...(Array.isArray(preferences.activities) ? preferences.activities : []),
      ...(Array.isArray(preferences.relaxation) ? preferences.relaxation : []),
    ].filter(Boolean);

    return {
      budgetType: trip?.userSelection?.budget || 'N/A',
      hotelsCount: hotels.length,
      itineraryDays: itinerary.length || Number(trip?.userSelection?.noOfDays || 0),
      placesCount,
      preferences: prefValues.slice(0, 6),
    };
  }, [trip]);

  const inrFormatter = useMemo(
    () =>
      new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }),
    []
  );

  useEffect(() => {
    if (!tripId) return;
    if (loadedTripIdRef.current === tripId) return;
    loadedTripIdRef.current = tripId;

    const loadTrip = async () => {
      setIsLoading(true);
      let fallbackTrip = null;
      try {
        const stateTrip = location?.state?.trip;
        if (stateTrip) {
          const parsed =
            typeof stateTrip?.tripData === 'string'
              ? tryParseTripData(stateTrip.tripData)
              : stateTrip.tripData;
          const normalized = normalizeTrip(parsed ? { ...stateTrip, tripData: parsed } : stateTrip);
          setTrip(normalized);
          fallbackTrip = normalized;
        } else {
          const localTrip = readLocalTripById(tripId);
          if (localTrip) {
            const parsed =
              typeof localTrip?.tripData === 'string'
                ? tryParseTripData(localTrip.tripData)
                : localTrip.tripData;
            const normalized = normalizeTrip(parsed ? { ...localTrip, tripData: parsed } : localTrip);
            setTrip(normalized);
            fallbackTrip = normalized;
          }
        }

        const data = await getTripById(tripId);
        if (data) {
          const parsed = typeof data?.tripData === 'string' ? tryParseTripData(data.tripData) : data?.tripData;
          const normalized = normalizeTrip(parsed ? { ...data, tripData: parsed } : data);
          setTrip(normalized);
        }
      } catch (error) {
        const message = String(error?.message || '').toLowerCase();
        const isNotFound = message.includes('trip not found') || message.includes('404');
        if (!fallbackTrip && !isNotFound) {
          toast.error(`Could not load trip for booking. ${error?.message || ''}`);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadTrip();
  }, [tripId]);

  const runTransactionAnimation = async () => {
    const steps = [1, 2, 3];
    for (const step of steps) {
      setTransactionStep(step);
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
  };

  const handleBookPackage = async () => {
    if (!tripId) {
      toast.error('Trip ID missing.');
      return;
    }
    if (!Number.isFinite(packageAmount) || packageAmount <= 0) {
      toast.error('Could not compute package amount.');
      return;
    }

    setIsProcessing(true);
    setTransactionStep(0);
    await runTransactionAnimation();

    const timestamp = new Date().toISOString();
    const bookingPayload = {
      status: 'booked',
      packageAmount: Math.round(packageAmount),
      currency: 'INR',
      bookedAt: timestamp,
      payment: {
        status: 'paid',
        method: paymentMethod,
        paidAt: timestamp,
        transactionId: generateReference('TXN'),
      },
      bill: {
        billNumber: generateReference('BILL'),
        issuedAt: timestamp,
      },
    };

    try {
      const updatedTrip = await updateTrip(tripId, { booking: bookingPayload });
      const normalized = normalizeTrip(updatedTrip || { ...trip, booking: bookingPayload });
      setTrip(normalized);
      updateLocalTripBooking(tripId, bookingPayload);
      toast.success('Payment successful. Package booked.');
    } catch (error) {
      updateLocalTripBooking(tripId, bookingPayload);
      setTrip((prev) => ({ ...(prev || {}), booking: bookingPayload }));
      toast.error(`Booked locally only. ${error?.message || 'Could not sync with backend.'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadBill = async () => {
    if (!trip || !booking) return;
    setIsDownloadingBill(true);
    try {
      const success = await downloadBookingBillAsPDF({ trip, booking });
      if (!success) toast.error('Failed to download bill.');
    } finally {
      setIsDownloadingBill(false);
    }
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gradient-to-b from-blue-50 to-white pt-28 pb-20 px-5 sm:px-8'>
        <div className='max-w-4xl mx-auto bg-white rounded-2xl shadow-md p-10 text-center text-gray-600'>
          Loading booking details...
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-b from-blue-50 to-white pt-28 pb-20 px-5 sm:px-8'>
      <div className='max-w-4xl mx-auto space-y-6'>
        <button
          type='button'
          className='inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-black'
          onClick={() => navigate(-1)}
        >
          <MdOutlineArrowBack />
          Back
        </button>

        <div className='bg-white rounded-2xl shadow-md p-6 sm:p-8'>
          <h1 className='text-3xl font-bold text-gray-900'>Book Trip Package</h1>
          <p className='text-gray-600 mt-1'>Complete payment and confirm your booking.</p>

          <div className='mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div className='rounded-lg border p-4'>
              <p className='text-sm text-gray-500'>Destination</p>
              <p className='font-semibold text-gray-900'>{destination}</p>
            </div>
            <div className='rounded-lg border p-4'>
              <p className='text-sm text-gray-500'>Duration</p>
              <p className='font-semibold text-gray-900'>{trip?.userSelection?.noOfDays || 0} day(s)</p>
            </div>
            <div className='rounded-lg border p-4'>
              <p className='text-sm text-gray-500'>Traveler Type</p>
              <p className='font-semibold text-gray-900'>{trip?.userSelection?.traveler || 'N/A'}</p>
            </div>
            <div className='rounded-lg border p-4'>
              <p className='text-sm text-gray-500'>Total Package Amount</p>
              <p className='font-semibold text-gray-900'>{inrFormatter.format(packageAmount)}</p>
            </div>
            <div className='rounded-lg border p-4'>
              <p className='text-sm text-gray-500'>Budget Plan</p>
              <p className='font-semibold text-gray-900'>{packageDetails.budgetType}</p>
            </div>
            <div className='rounded-lg border p-4'>
              <p className='text-sm text-gray-500'>Hotels Included</p>
              <p className='font-semibold text-gray-900'>{packageDetails.hotelsCount}</p>
            </div>
            <div className='rounded-lg border p-4'>
              <p className='text-sm text-gray-500'>Itinerary Days</p>
              <p className='font-semibold text-gray-900'>{packageDetails.itineraryDays}</p>
            </div>
            <div className='rounded-lg border p-4'>
              <p className='text-sm text-gray-500'>Activities Included</p>
              <p className='font-semibold text-gray-900'>{packageDetails.placesCount}</p>
            </div>
            <div className='rounded-lg border p-4 sm:col-span-2'>
              <p className='text-sm text-gray-500'>Package Preferences</p>
              <p className='font-semibold text-gray-900'>
                {packageDetails.preferences.length > 0 ? packageDetails.preferences.join(', ') : 'Standard package'}
              </p>
            </div>
          </div>
        </div>

        {!isBooked ? (
          <div className='bg-white rounded-2xl shadow-md p-6 sm:p-8 space-y-5'>
            <h2 className='text-2xl font-bold text-gray-900'>Payment</h2>
            <div>
              <label htmlFor='payment-method' className='text-sm font-medium text-gray-700'>
                Payment Method
              </label>
              <select
                id='payment-method'
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
                className='mt-2 w-full sm:w-72 rounded-lg border border-gray-300 px-3 py-2 text-sm'
              >
                <option value='UPI'>UPI</option>
                <option value='Card'>Card</option>
                <option value='Net Banking'>Net Banking</option>
              </select>
            </div>

            {(isProcessing || transactionStep > 0) && (
              <div className='rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-2'>
                <p className='text-sm font-semibold text-blue-800'>Transaction Process</p>
                <p className='text-sm text-blue-700'>
                  {transactionStep === 1 && 'Step 1/3: Initiating payment...'}
                  {transactionStep === 2 && 'Step 2/3: Verifying transaction...'}
                  {transactionStep === 3 && 'Step 3/3: Confirming booking...'}
                </p>
              </div>
            )}

            <button
              type='button'
              onClick={handleBookPackage}
              disabled={isProcessing}
              className='inline-flex items-center gap-2 rounded-full px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold hover:opacity-90 disabled:opacity-70'
            >
              <FaMoneyCheckAlt />
              {isProcessing ? 'Processing...' : `Pay ${inrFormatter.format(packageAmount)} & Book`}
            </button>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className='bg-white rounded-2xl shadow-md p-6 sm:p-8 space-y-4'>
            <div className='rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-2 text-emerald-800 font-semibold'>
              <MdVerified className='text-lg' />
              Booking Confirmed
            </div>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm'>
              <div className='rounded-lg border p-3'>
                <p className='text-gray-500'>Transaction ID</p>
                <p className='font-semibold text-gray-900 break-all'>{booking?.payment?.transactionId || 'N/A'}</p>
              </div>
              <div className='rounded-lg border p-3'>
                <p className='text-gray-500'>Bill Number</p>
                <p className='font-semibold text-gray-900 break-all'>{booking?.bill?.billNumber || 'N/A'}</p>
              </div>
              <div className='rounded-lg border p-3'>
                <p className='text-gray-500'>Payment Method</p>
                <p className='font-semibold text-gray-900'>{booking?.payment?.method || 'N/A'}</p>
              </div>
              <div className='rounded-lg border p-3'>
                <p className='text-gray-500'>Amount Paid</p>
                <p className='font-semibold text-gray-900'>{inrFormatter.format(Number(booking?.packageAmount || 0))}</p>
              </div>
              <div className='rounded-lg border p-3 sm:col-span-2'>
                <p className='text-gray-500'>Paid At</p>
                <p className='font-semibold text-gray-900'>{new Date(booking?.payment?.paidAt || booking?.bookedAt).toLocaleString()}</p>
              </div>
            </div>

            <button
              type='button'
              onClick={handleDownloadBill}
              disabled={isDownloadingBill}
              className='inline-flex items-center gap-2 rounded-full px-5 py-2.5 bg-gradient-to-r from-[#f56551] to-[#f79577] text-white font-medium hover:opacity-90 disabled:opacity-70'
            >
              <FaFileInvoiceDollar />
              {isDownloadingBill ? 'Preparing Bill...' : 'Download Bill'}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default BookingPage;
