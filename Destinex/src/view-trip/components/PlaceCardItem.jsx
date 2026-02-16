import { Button } from '@/components/ui/button'
import React, { useEffect, useState } from 'react'
import { usePlacePhoto } from '@/context/PlacePhotoContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FaMapLocationDot } from "react-icons/fa6";

function PlaceCardItem({place, onCoordinatesFound}) {
  const [photoUrl, setPhotoUrl] = useState();
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
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

  const mapsQuery = encodeURIComponent(
    [place?.placeName, place?.placeAddress].filter(Boolean).join(', ')
  );
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;
  const hint = place?.placeAddress || place?.address || '';
  const cacheKey = buildCacheKey?.(place?.placeName, hint);
  
  useEffect(() => {
    if (place?.placeName) {
      const providedImage = place?.placeImageUrl || place?.imageUrl || place?.photoUrl;
      if (!isGooglePlacesConfigured && isLikelyUrl(providedImage)) {
        setPhotoUrl(providedImage);
      }

      if (cacheKey && photoCache[cacheKey]) {
        setPhotoUrl(photoCache[cacheKey]);
        return;
      }

      if (isLikelyUrl(providedImage)) {
        // Temporary image while requesting a more relevant place photo.
        setPhotoUrl(providedImage);
      }
      
      setLoading(true);
      const timer = setTimeout(() => {
        fetchPhoto();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [place, photoCache, cacheKey, isGooglePlacesConfigured]);
  
  const fetchPhoto = async () => {
    try {
      const url = await getPhotoUrl(place.placeName, hint);
      setPhotoUrl(url);
      
      if (onCoordinatesFound && !place.geoCoordinates && photoCache._lastPlaceResponse) {
        const placeResponse = photoCache._lastPlaceResponse;
        
        if (placeResponse?.data?.places?.[0]?.location) {
          const location = placeResponse.data.places[0].location;
          if (location.latitude && location.longitude) {
            const coordinates = `${location.latitude},${location.longitude}`;
            onCoordinatesFound(place.placeName, coordinates);
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
    <>
      <button
        type='button'
        onClick={() => setIsOpen(true)}
        className='w-full text-left border rounded-xl p-3 mt-2 flex gap-5 hover:scale-105 transition-all hover:shadow-md cursor-pointer'
      >
        <div className='w-[130px] h-[130px] relative'>
          {loading ? (
            <div className='w-full h-full rounded-xl bg-gray-200 animate-pulse'></div>
          ) : (
            <img
              src={photoUrl || place?.placeImageUrl || place?.imageUrl || '/placeholder.jpg'}
              className='w-full h-full rounded-xl object-cover'
              loading='lazy'
              alt={place?.placeName || 'Place'}
              onError={(e) => {
                const query = place?.placeName || place?.placeAddress || 'travel destination';
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
        <div>
          <h2 className='font-bold text-lg'>{place?.placeName || 'Place'}</h2>
          <p className='text-sm text-gray-400 line-clamp-2'>{place?.placeDetails || 'No details available.'}</p>
          <h2 className='mt-2'>Travel: {place?.timeToTravel || 'Not available'}</h2>
          <h2 className='mt-2'>Ticket: {place?.ticketPricing || 'Not available'}</h2>
          {place?.geoCoordinates && <div className="mt-1 text-xs text-gray-400">Coordinates available</div>}
        </div>
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className='sm:max-w-2xl max-h-[85vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>{place?.placeName || 'Place details'}</DialogTitle>
            <DialogDescription>
              {place?.time || 'Best time not specified'}
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            <img
              src={photoUrl || place?.placeImageUrl || place?.imageUrl || '/placeholder.jpg'}
              className='w-full h-60 object-cover rounded-xl'
              alt={place?.placeName || 'Place'}
              onError={(e) => {
                const query = place?.placeName || place?.placeAddress || 'travel destination';
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

            <div className='grid gap-3 text-sm text-gray-700'>
              <p><span className='font-semibold text-gray-900'>Details:</span> {place?.placeDetails || 'No description available.'}</p>
              <p><span className='font-semibold text-gray-900'>Address:</span> {place?.placeAddress || 'Address not available.'}</p>
              <p><span className='font-semibold text-gray-900'>Travel Time:</span> {place?.timeToTravel || 'Not available'}</p>
              <p><span className='font-semibold text-gray-900'>Ticket:</span> {place?.ticketPricing || 'Not available'}</p>
              {place?.geoCoordinates && (
                <p><span className='font-semibold text-gray-900'>Coordinates:</span> {place.geoCoordinates}</p>
              )}
            </div>

            <div className='flex justify-end'>
              <Button asChild className='bg-gradient-to-r from-[#f56551] to-[#f79577] hover:opacity-90'>
                <a href={mapsUrl} target='_blank' rel='noreferrer'>
                  <FaMapLocationDot className='mr-2' />
                  Open in Google Maps
                </a>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default PlaceCardItem
