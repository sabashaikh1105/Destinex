import React, { useEffect, useState } from 'react';
import UserTripCardItem from './components/UserTripCardItem';
import { useSEO } from '@/context/SEOContext';
import { getTrips } from '@/service/backendApi';

const LOCAL_TRIPS_KEY = 'destinex.localTrips';

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

const mergeById = (remoteTrips = [], localTrips = []) => {
  const byId = new Map();
  [...localTrips, ...remoteTrips].forEach((trip) => {
    if (trip?.id) byId.set(trip.id, trip);
  });

  return Array.from(byId.values()).sort(
    (a, b) =>
      (b?.createdAtMs || b?.createdAt?.seconds || 0) -
      (a?.createdAtMs || a?.createdAt?.seconds || 0)
  );
};

const filterTripsForUser = (trips = [], user = null) => {
  const uid = user?.uid || null;
  const email = user?.email || null;
  return (Array.isArray(trips) ? trips : []).filter((trip) => {
    if (!trip?.id) return false;
    if (!email) return !trip?.userEmail;
    const emailMatch = trip?.userEmail === email;
    const userIdMatch = uid ? trip?.userId === uid : true;
    return emailMatch && userIdMatch;
  });
};

function MyTrips() {
  const { pageSEO } = useSEO();
  const [userTrips, setUserTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const bookedTrips = userTrips.filter((trip) => trip?.booking?.status === 'booked');
  const plannedTrips = userTrips.filter((trip) => trip?.booking?.status !== 'booked');

  useEffect(() => {
    GetUserTrips();
  }, []);

  const GetUserTrips = async () => {
    setLoading(true);
    const user = safeParse(localStorage.getItem('user'), null);
    const userEmail = user?.email || null;
    const localTrips = filterTripsForUser(readLocalTrips(), user);

    if (!userEmail) {
      setUserTrips(localTrips);
      setLoading(false);
      return;
    }

    try {
      const remoteTrips = await getTrips({
        userId: user?.uid || null,
        userEmail,
      });

      const filteredRemoteTrips = filterTripsForUser(remoteTrips, user);
      setUserTrips(mergeById(filteredRemoteTrips, localTrips));
    } catch (error) {
      console.error('Error fetching trips from backend:', error);
      setUserTrips(localTrips);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-b from-blue-50 to-white pt-24 pb-20 sm:px-10 md:px-32 lg:px-56 xl:px-72 px-5'>
      {pageSEO.myTrips()}
      <h2 className='font-bold text-3xl'>My Trips</h2>

      {!loading && bookedTrips.length > 0 && (
        <>
          <h3 className='font-semibold text-xl mt-8'>Your Booked Packages</h3>
          <div className='grid grid-cols-2 mt-4 md:grid-cols-3 gap-5'>
            {bookedTrips.map((trip, index) => (
              <UserTripCardItem trip={trip} key={trip?.id || `booked-${index}`} />
            ))}
          </div>
        </>
      )}

      <h3 className='font-semibold text-xl mt-8'>
        {bookedTrips.length > 0 ? 'Other Trips' : 'All Trips'}
      </h3>
      <div className='grid grid-cols-2 mt-4 md:grid-cols-3 gap-5'>
        {!loading && plannedTrips.length > 0
          ? plannedTrips.map((trip, index) => <UserTripCardItem trip={trip} key={trip?.id || index} />)
          : !loading && bookedTrips.length === 0
            ? <p className='text-gray-500 col-span-2 md:col-span-3'>No trips yet. Create a trip to get started.</p>
          : !loading && bookedTrips.length > 0
            ? <p className='text-gray-500 col-span-2 md:col-span-3'>No unbooked trips available.</p>
            : [1, 2, 3, 4, 5, 6].map((item) => (
                <div key={item} className='h-[220px] w-full bg-slate-200 animate-pulse rounded-xl' />
              ))}
      </div>
    </div>
  );
}

export default MyTrips;
