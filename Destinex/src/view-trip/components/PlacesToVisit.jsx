import React, { useState } from 'react'
import PlaceCardItem from './PlaceCardItem'
import { useInView } from 'react-intersection-observer'
import { updateTrip } from '@/service/backendApi'

function LazyPlaceCard({ place, onCoordinatesFound }) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
    rootMargin: '100px'
  });

  return (
    <div ref={ref} className=''>
      <h2 className='font-medium text-sm text-orange-600'>{place?.time}</h2>
      {inView ? (
        <PlaceCardItem place={place} onCoordinatesFound={onCoordinatesFound} />
      ) : (
        <div className='border rounded-xl p-3 mt-2 flex gap-5 h-[146px]'>
          <div className='w-[130px] h-[130px] bg-gray-100 rounded-xl animate-pulse'></div>
          <div className='flex-1'>
            <div className='bg-gray-100 h-6 w-3/4 rounded animate-pulse'></div>
            <div className='bg-gray-100 h-4 w-full mt-2 rounded animate-pulse'></div>
            <div className='bg-gray-100 h-4 w-1/2 mt-2 rounded animate-pulse'></div>
            <div className='bg-gray-100 h-4 w-1/2 mt-2 rounded animate-pulse'></div>
          </div>
        </div>
      )}
    </div>
  );
}

function PlacesToVisit({trip}) {
  const MIN_PLACES_PER_DAY = 3;
  // State to track places with coordinates added
  const [updatedPlaces, setUpdatedPlaces] = useState({});
  
  // Handle when coordinates are found for a place
  const handleCoordinatesFound = async (placeName, coordinates) => {
    if (!trip?.id || updatedPlaces[placeName]) return;
    
    // Avoid updating the same place multiple times
    setUpdatedPlaces(prev => ({
      ...prev,
      [placeName]: true
    }));
    
    try {
      // Clone the trip data
      const updatedTrip = { ...trip };
      let updated = false;
      
      // Update the coordinates in the trip data
      if (updatedTrip.tripData?.itinerary) {
        updatedTrip.tripData.itinerary.forEach(day => {
          if (day.plan) {
            day.plan.forEach(place => {
              if (place.placeName === placeName && !place.geoCoordinates) {
                place.geoCoordinates = coordinates;
                updated = true;
              }
            });
          }
        });
      }
      
      if (updated) {
        // Update the trip in backend MongoDB
        await updateTrip(trip.id, {
          tripData: updatedTrip.tripData
        });
        console.log(`Updated coordinates for ${placeName}`);
      }
    } catch (error) {
      console.error('Error updating coordinates:', error);
    }
  };
  
  return (
    <div>
        <h2 className='font-bold text-lg'>Places to Visit</h2>
    
        <div>
            {(() => {
              const toCanonicalDay = (dayLabel, index) => {
                const raw = String(dayLabel || '').trim();
                const match = raw.match(/day[\s_-]*(\d+)/i);
                if (match) return `Day ${Number.parseInt(match[1], 10)}`;
                return raw || `Day ${index + 1}`;
              };

              const itineraryRaw = trip?.tripData?.itinerary;
              const itineraryList = Array.isArray(itineraryRaw)
                ? itineraryRaw
                : (itineraryRaw && typeof itineraryRaw === 'object')
                  ? Object.values(itineraryRaw)
                  : [];

              // Merge duplicate day blocks (e.g. multiple "Day 1" entries) into one.
              const itinerary = itineraryList.reduce((acc, item, index) => {
                const day = toCanonicalDay(item?.day, index);
                const existing = acc.find((x) => x.day === day);
                if (!existing) {
                  acc.push({
                    ...item,
                    day,
                    plan: Array.isArray(item?.plan) ? item.plan : [],
                  });
                  return acc;
                }

                const combinedPlan = [
                  ...(Array.isArray(existing.plan) ? existing.plan : []),
                  ...(Array.isArray(item?.plan) ? item.plan : []),
                ];

                // De-duplicate repeated places inside same day.
                const seen = new Set();
                existing.plan = combinedPlan.filter((place) => {
                  const key = String(place?.placeName || '') + '|' + String(place?.placeAddress || '');
                  if (!key.trim()) return true;
                  if (seen.has(key)) return false;
                  seen.add(key);
                  return true;
                });

                return acc;
              }, []);

              if (itinerary.length === 0) {
                return (
                  <div className="mt-4 text-sm text-gray-500">
                    No itinerary data available for this trip.
                  </div>
                );
              }

              return itinerary.map((item, index) => (
                <div className='mt-5' key={`day-${index}`}>
                    <h2 className='font-medium text-lg'>{item.day}</h2>
                    {(!Array.isArray(item?.plan) || item.plan.length === 0) && (
                      <div className="mt-2 text-sm text-gray-500">
                        No places were generated for this day.
                      </div>
                    )}
                    {(Array.isArray(item?.plan) && item.plan.length > 0 && item.plan.length < MIN_PLACES_PER_DAY) && (
                      <div className="mt-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        Partial plan for this day ({item.plan.length}/{MIN_PLACES_PER_DAY} places).
                      </div>
                    )}
                    <div className='grid md:grid-cols-2 gap-5'>
                    {item?.plan?.map((place, placeIndex)=>(
                      <LazyPlaceCard
                        key={`place-${placeIndex}`}
                        place={place}
                        onCoordinatesFound={handleCoordinatesFound}
                      />
                    ))}
                    </div>
                </div>
              ));
            })()}
        </div>
    </div>
  )
}

export default PlacesToVisit
