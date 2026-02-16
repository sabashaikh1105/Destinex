import axios from "axios"
import { apiMonitor } from './APIMonitoring';

const BASE_URL='https://places.googleapis.com/v1/places:searchText'
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const PLACE_API_KEY = import.meta.env.VITE_GOOGLE_PLACE_API_KEY;
const FIELD_MASK = [
  'places.photos',
  'places.displayName',
  'places.id',
  'places.location',
  'places.formattedAddress',
  'places.internationalPhoneNumber',
  'places.rating'
].join(',');

// Cache for place details and photos
const placeCache = {};
const photoCache = {};

const getConfig = () => ({
  headers: {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': PLACE_API_KEY,
    // Must be a comma-separated string for Places API (New).
    'X-Goog-FieldMask': FIELD_MASK,
  },
  timeout: 15000,
});

export const GetPlaceDetails = async (data) => {
  if (!PLACE_API_KEY) {
    throw new Error('Missing VITE_GOOGLE_PLACE_API_KEY');
  }

  // Create a cache key from the query
  const cacheKey = data.textQuery;
  
  // Check if we have a valid cached response
  if (placeCache[cacheKey] && 
      (Date.now() - placeCache[cacheKey].timestamp < CACHE_DURATION)) {
    console.log('Using cached place details for:', cacheKey);
    return placeCache[cacheKey].data;
  }
  
  // If not in cache or expired, make the API call
  try {
    const response = await axios.post(BASE_URL, data, getConfig());
    
    // Track the API call
    apiMonitor.trackRequest('placeDetails');
    
    // Cache the response with a timestamp
    placeCache[cacheKey] = {
      data: response,
      timestamp: Date.now()
    };
    
    return response;
  } catch (error) {
    const status = error?.response?.status;
    if (status === 403) {
      throw new Error(
        'Google Places API rejected the request (403). Check API key, billing, and referrer/API restrictions.'
      );
    }
    throw new Error(error?.message || 'Failed to fetch place details');
  }
};

// For photos, add a function that checks cache
export const GetPlacePhoto = async (photoRef) => {
  if (photoCache[photoRef] && 
      (Date.now() - photoCache[photoRef].timestamp < CACHE_DURATION)) {
    console.log('Using cached photo for:', photoRef);
    return photoCache[photoRef].url;
  }
  
  // Track the API call
  apiMonitor.trackRequest('placePhotos');
  
  const photoUrl = PHOTO_REF_URL.replace('{NAME}', photoRef);
  
  // Cache the photo URL
  photoCache[photoRef] = {
    url: photoUrl,
    timestamp: Date.now()
  };
  
  return photoUrl;
};

export const PHOTO_REF_URL='https://places.googleapis.com/v1/{NAME}/media?maxHeightPx=1000&maxWidthPx=1000&key='+PLACE_API_KEY
