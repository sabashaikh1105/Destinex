import React, { useState } from 'react'
import HotelCardItem from './HotelCardItem'
import { useInView } from 'react-intersection-observer'
import { updateTrip } from '@/service/backendApi'

function LazyHotelCard({ hotel, onCoordinatesFound }) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
    rootMargin: '100px'
  });

  return (
    <div ref={ref}>
      {inView ? (
        <HotelCardItem hotel={hotel} onCoordinatesFound={onCoordinatesFound} />
      ) : (
        <div className='hover:scale-105 transition-all cursor-pointer'>
          <div className='rounded-xl h-[180px] w-full bg-gray-100 animate-pulse'></div>
          <div className='my-2 flex flex-col gap-2'>
            <div className='bg-gray-100 h-5 w-3/4 rounded animate-pulse'></div>
            <div className='bg-gray-100 h-4 w-full rounded animate-pulse'></div>
            <div className='bg-gray-100 h-4 w-1/2 rounded animate-pulse'></div>
            <div className='bg-gray-100 h-4 w-1/4 rounded animate-pulse'></div>
          </div>
        </div>
      )}
    </div>
  );
}

function Hotels({trip}) {
  const MIN_HOTEL_COUNT = 3;
  // State to track hotels with coordinates added
  const [updatedHotels, setUpdatedHotels] = useState({});
  const hotels = Array.isArray(trip?.tripData?.hotels) ? trip.tripData.hotels : [];
  
  // Handle when coordinates are found for a hotel
  const handleCoordinatesFound = async (hotelName, coordinates) => {
    if (!trip?.id || updatedHotels[hotelName]) return;
    
    // Avoid updating the same hotel multiple times
    setUpdatedHotels(prev => ({
      ...prev,
      [hotelName]: true
    }));
    
    try {
      // Clone the trip data
      const updatedTrip = { ...trip };
      let updated = false;
      
      // Update the coordinates in the trip data
      if (updatedTrip.tripData?.hotels) {
        updatedTrip.tripData.hotels.forEach(hotel => {
          if (hotel.hotelName === hotelName && !hotel.geoCoordinates) {
            hotel.geoCoordinates = coordinates;
            updated = true;
          }
        });
      }
      
      if (updated) {
        // Update the trip in backend MongoDB
        await updateTrip(trip.id, {
          tripData: updatedTrip.tripData
        });
        console.log(`Updated coordinates for hotel ${hotelName}`);
      }
    } catch (error) {
      console.error('Error updating hotel coordinates:', error);
    }
  };
  
  return (
    <div>
        <h2 className='font-bold text-xl mt-5'>Hotel Recommendation</h2>
        {hotels.length === 0 && (
          <div className="mt-3 text-sm text-gray-500">
            No hotel recommendations were generated. Please regenerate the trip.
          </div>
        )}
        {hotels.length > 0 && hotels.length < MIN_HOTEL_COUNT && (
          <div className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Partial hotel data received ({hotels.length}/{MIN_HOTEL_COUNT}). Regenerating may provide more complete results.
          </div>
        )}

        <div className='grid grid-cols-2 my-5 md:grid-cols-3 xl:grid-cols-4 gap-5'>
          {hotels.map((hotel, index) => (
            <LazyHotelCard
              key={`hotel-${index}`}
              hotel={hotel}
              onCoordinatesFound={handleCoordinatesFound}
            />
          ))}
        </div>
    
    </div>
  )
}

export default Hotels
