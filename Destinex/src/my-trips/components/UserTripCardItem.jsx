import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom';
import { usePlacePhoto } from '@/context/PlacePhotoContext';

function UserTripCardItem({trip}) {
    const [photoUrl, setPhotoUrl] = useState();
    const [loading, setLoading] = useState(false);
    const { getPhotoUrl, photoCache } = usePlacePhoto();
    
    useEffect(() => {
      const locationName = trip?.userSelection?.location?.label;
      if (locationName) {
        // If already in cache, use it immediately
        if (photoCache[locationName]) {
          setPhotoUrl(photoCache[locationName]);
          return;
        }
        
        // Otherwise fetch it (with debounce)
        setLoading(true);
        const timer = setTimeout(() => {
          fetchPhoto(locationName);
        }, 100); // Small delay to prevent request spikes
        
        return () => clearTimeout(timer);
      }
    }, [trip, photoCache]);
    
    const fetchPhoto = async (locationName) => {
      try {
        const url = await getPhotoUrl(locationName);
        setPhotoUrl(url);
      } catch (error) {
        console.error('Error fetching photo:', error);
      } finally {
        setLoading(false);
      }
    };
    
    const isBooked = trip?.booking?.status === 'booked';
    const bookedAmount = Number(trip?.booking?.packageAmount || 0);

    return (
      <Link to={'/view-trip/'+trip?.id}>
        <div className='hover:scale-105 transition-all'>
          <div className='rounded-xl h-[220px] relative overflow-hidden'>
            {loading ? (
              <div className='h-full w-full rounded-xl bg-gray-200 animate-pulse'></div>
            ) : (
              <img 
                src={photoUrl || '/placeholder.jpg'} 
                className='object-cover rounded-xl h-full w-full'
                loading='lazy'
              />
            )}
            {isBooked && (
              <div className='absolute top-3 left-3 rounded-full bg-emerald-600 text-white text-xs font-semibold px-3 py-1'>
                Booked Package
              </div>
            )}
          </div>
          <div>
            <h2 className='font-bold text-lg'>{trip?.userSelection?.location?.label}</h2>
            <h2 className='text-sm text-gray-500'>{trip?.userSelection.noOfDays} Days trip with {trip?.userSelection?.budget} Budget</h2>
            {isBooked && (
              <h3 className='text-xs text-emerald-700 font-medium mt-1'>
                Paid: INR {bookedAmount.toLocaleString('en-IN')} | Txn: {trip?.booking?.payment?.transactionId || 'N/A'}
              </h3>
            )}
          </div>
        </div>
      </Link>
    )
}

export default UserTripCardItem
