import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePlacePhoto } from '@/context/PlacePhotoContext';

function HotelCardItem({ hotel, onCoordinatesFound }) {
    const [photoUrl, setPhotoUrl] = useState();
    const [loading, setLoading] = useState(false);
    const {
      getPhotoUrl,
      photoCache,
      buildCacheKey,
      buildFallbackImageUrl,
      buildFallbackImageCandidates,
      isGooglePlacesConfigured
    } = usePlacePhoto();

    const isLikelyUrl = (value) =>
      typeof value === 'string' && /^https?:\/\//i.test(value.trim());
    const hint = hotel?.hotelAddress || hotel?.address || '';
    const cacheKey = buildCacheKey?.(hotel?.hotelName, hint);

    useEffect(() => {
      if (hotel?.hotelName) {
        const providedImage = hotel?.hotelImageUrl || hotel?.imageUrl || hotel?.photoUrl;
        if (!isGooglePlacesConfigured && isLikelyUrl(providedImage)) {
          setPhotoUrl(providedImage);
        }

        if (cacheKey && photoCache[cacheKey]) {
          setPhotoUrl(photoCache[cacheKey]);
          return;
        }

        if (isLikelyUrl(providedImage)) {
          setPhotoUrl(providedImage);
        }

        setLoading(true);
        const timer = setTimeout(() => {
          fetchPhoto();
        }, 100);

        return () => clearTimeout(timer);
      }
    }, [hotel, photoCache, cacheKey, isGooglePlacesConfigured]);

    const fetchPhoto = async () => {
      try {
        const url = await getPhotoUrl(hotel.hotelName, hint);
        setPhotoUrl(url);

        if (onCoordinatesFound && !hotel.geoCoordinates && photoCache._lastPlaceResponse) {
          const placeResponse = photoCache._lastPlaceResponse;

          if (placeResponse?.data?.places?.[0]?.location) {
            const location = placeResponse.data.places[0].location;
            if (location.latitude && location.longitude) {
              const coordinates = `${location.latitude},${location.longitude}`;
              onCoordinatesFound(hotel.hotelName, coordinates);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching photo:', error);
      } finally {
        setLoading(false);
      }
    };

    return (
      <Link to={'https://www.google.com/maps/search/?api=1&query=' + hotel.hotelName + ',' + hotel?.hotelAddress} target='_blank' >
        <div className='hover:scale-105 transition-all cursor-pointer'>
          <div className='rounded-xl h-[180px] w-full relative'>
            {loading ? (
              <div className='h-full w-full rounded-xl bg-gray-200 animate-pulse'></div>
            ) : (
              <img
                src={photoUrl || hotel?.hotelImageUrl || hotel?.imageUrl || '/placeholder.jpg'}
                className='rounded-xl h-full w-full object-cover'
                loading='lazy'
                onError={(e) => {
                  const query = hotel?.hotelName || hotel?.hotelAddress || 'hotel';
                  const candidates = buildFallbackImageCandidates?.(query) || [
                    buildFallbackImageUrl?.(query),
                    '/placeholder.jpg',
                  ];
                  const currentAttempt = Number.parseInt(e.currentTarget.dataset.fallbackAttempt || '0', 10);
                  const nextAttempt = Number.isNaN(currentAttempt) ? 0 : currentAttempt + 1;
                  if (nextAttempt >= candidates.length) {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/placeholder.jpg';
                    return;
                  }
                  e.currentTarget.dataset.fallbackAttempt = String(nextAttempt);
                  e.currentTarget.src = candidates[nextAttempt] || '/placeholder.jpg';
                }}
              />
            )}
          </div>
          <div className='my-2 flex flex-col gap-2'>
            {hotel?.day && (
              <span className='text-xs inline-block w-fit px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-100'>
                {hotel.day}
              </span>
            )}
            <h2 className='font-medium '>{hotel?.hotelName}</h2>
            <h2 className='text-xs text-gray-500 '>Address: {hotel?.hotelAddress}</h2>
            <h2 className='text-sm'>Price: {hotel?.price}</h2>
            <h2 className='text-sm'>Rating: {hotel?.rating}</h2>
            {hotel?.descriptions && (
              <p className='text-xs text-gray-600 line-clamp-2'>{hotel.descriptions}</p>
            )}
            {(hotel?.checkIn || hotel?.checkOut) && (
              <p className='text-xs text-gray-500'>
                {hotel?.checkIn ? `Check-in: ${hotel.checkIn}` : ''}
                {hotel?.checkIn && hotel?.checkOut ? ' | ' : ''}
                {hotel?.checkOut ? `Check-out: ${hotel.checkOut}` : ''}
              </p>
            )}
            {hotel.geoCoordinates && <div className='text-xs text-gray-400'>Coordinates available</div>}
          </div>
        </div>
      </Link>
    )
}

export default HotelCardItem
