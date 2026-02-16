import React, { createContext, useContext, useState } from 'react';

const PlacePhotoContext = createContext();

export function PlacePhotoProvider({ children }) {
  const [photoCache, setPhotoCache] = useState({
    _lastPlaceResponse: null
  });
  
  // Google Places removed for photo fetching flow.
  const isGooglePlacesConfigured = false;

  const hashString = (value) => {
    const input = String(value || "");
    let hash = 0;
    for (let i = 0; i < input.length; i += 1) {
      hash = ((hash << 5) - hash) + input.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  };

  const buildPublicPhotoUrl = (query) => {
    const normalizedQuery = encodeURIComponent(String(query || 'travel destination').trim());
    const sig = hashString(normalizedQuery) % 1000;
    return `https://source.unsplash.com/1600x900/?${normalizedQuery}&sig=${sig}`;
  };

  const buildSecondaryPublicPhotoUrl = (query) => {
    const normalizedQuery = encodeURIComponent(String(query || 'travel destination').trim());
    return `https://loremflickr.com/1600/900/${normalizedQuery.replace(/%20/g, ',')}`;
  };

  const buildFallbackImageUrl = (query) => buildPublicPhotoUrl(query);

  const buildFallbackImageCandidates = (query) => [
    buildFallbackImageUrl(query),
    buildSecondaryPublicPhotoUrl(query),
    '/placeholder.jpg',
  ];

  const buildCacheKey = (placeName, hint) =>
    [placeName, hint].filter(Boolean).join(", ").trim();

  const getPhotoUrl = async (placeName, hint) => {
    const query = buildCacheKey(placeName, hint);
    if (!query) return null;

    // Check if already in cache
    if (photoCache[query]) {
      return photoCache[query];
    }

    const fallbackUrl = buildPublicPhotoUrl(query);
    setPhotoCache(prev => ({ ...prev, [query]: fallbackUrl }));
    return fallbackUrl;
  };
  
  return (
    <PlacePhotoContext.Provider value={{ getPhotoUrl, photoCache, buildCacheKey, buildFallbackImageUrl, buildFallbackImageCandidates, isGooglePlacesConfigured }}>
      {children}
    </PlacePhotoContext.Provider>
  );
}

export const usePlacePhoto = () => useContext(PlacePhotoContext); 
