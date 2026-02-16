import { Button } from '@/components/ui/button'
import React, { useEffect, useState, useRef } from 'react'
import { IoCalendar, IoWallet, IoPeople } from "react-icons/io5";
import { motion } from 'framer-motion';
import { MdDownload, MdContentCopy } from 'react-icons/md';
import { toast } from 'sonner';
import { FiDownload, FiLink, FiMail } from 'react-icons/fi';
import { downloadTripAsPDF, copyTripLink, shareTripViaEmail } from '@/utils/trip-sharing';
import { useNavigate } from 'react-router-dom';

function InfoSection({trip, tripId}) {
  const [photoUrl, setPhotoUrl] = useState();
  const [loading, setLoading] = useState(true);
  const [processingAction, setProcessingAction] = useState('');
  const tripSectionRef = useRef(null);
  const navigate = useNavigate();
  const isBooked = trip?.booking?.status === 'booked';
  
  useEffect(() => {
    trip && GetPlacePhoto();
  }, [trip])

  const hashString = (value) => {
    const input = String(value || '');
    let hash = 0;
    for (let i = 0; i < input.length; i += 1) {
      hash = ((hash << 5) - hash) + input.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  };

  const buildFallbackImageUrl = (query) => {
    const q = encodeURIComponent(query || 'destination');
    const sig = hashString(q) % 1000;
    return `https://picsum.photos/seed/${q}-${sig}/1600/900`;
  };

  const GetPlacePhoto = async () => {
    setLoading(true);
    const destinationLabel = trip?.userSelection?.location?.label || trip?.tripData?.destination || 'destination';
    try {
      setPhotoUrl(buildFallbackImageUrl(destinationLabel));
    } catch (error) {
      console.warn("Trip header photo unavailable, using fallback:", error?.message || error);
      setPhotoUrl(buildFallbackImageUrl(destinationLabel));
    } finally {
      setLoading(false);
    }
  }
  
  /**
   * Downloads trip information as a PDF
   */
  const handleDownload = async () => {
    setProcessingAction('download');
    try {
      const destinationName = trip?.userSelection?.location?.label || trip?.tripData?.destination || 'trip';
      const success = await downloadTripAsPDF('trip-download-content', `${destinationName} itinerary.pdf`);
      if (success) {
        toast.success("Trip details downloaded as PDF");
      } else {
        toast.error("Could not download trip details. Please try again.");
      }
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Could not download trip details. Please try again.");
    } finally {
      setProcessingAction('');
    }
  };
  
  /**
   * Copies the current URL to clipboard
   */
  const handleShare = async () => {
    setProcessingAction('share');
    try {
      const success = await copyTripLink();
      if (success) {
        toast.success("Trip link copied to clipboard!");
      } else {
        toast.error("Couldn't copy link. Please copy manually from your address bar.");
      }
    } catch (error) {
      console.error("Copy failed:", error);
      toast.error("Couldn't copy link. Please copy manually from your address bar.");
    } finally {
      setProcessingAction('');
    }
  };
  
  const handleBookNow = () => {
    if (!tripId) {
      toast.error("Trip ID is missing.");
      return;
    }
    const bookingPath = `/booking/${encodeURIComponent(tripId)}`;
    try {
      navigate(bookingPath);
    } catch {
      window.location.assign(bookingPath);
    }
  };
  
  return (
    <div id="trip-content" className="bg-white rounded-2xl shadow-md overflow-hidden" ref={tripSectionRef}>
      <div className="relative">
        {/* Image skeleton loader */}
        {loading && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse"></div>
        )}
        
        {/* Main image */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative h-[340px] w-full"
        >
          <img 
            src={photoUrl ? photoUrl : '/placeholder.jpg'} 
            className="h-full w-full object-cover"
            alt={trip?.userSelection?.location?.label || "Destination"}
            onLoad={() => setLoading(false)}
            onError={(e) => {
              e.currentTarget.onerror = null;
              const destinationLabel = trip?.userSelection?.location?.label || trip?.tripData?.destination || 'destination';
              e.currentTarget.src = buildFallbackImageUrl(destinationLabel);
            }}
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          
          {/* Location name overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <h1 className="text-3xl sm:text-4xl font-bold">
              {trip?.userSelection?.location?.label || "Your Destination"}
            </h1>
          </div>
        </motion.div>
      </div>

      <div className="p-6">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          {/* Trip details */}
          <div className="flex flex-wrap gap-3">
            <motion.div 
              whileHover={{ y: -3 }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-gray-700"
            >
              <IoCalendar className="text-[#f56551]" />
              <span>{trip?.userSelection?.noOfDays || "0"} {trip?.userSelection?.noOfDays === 1 ? 'Day' : 'Days'}</span>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -3 }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-gray-700"
            >
              <IoWallet className="text-[#f56551]" />
              <span>{trip?.userSelection?.budget || "Budget"}</span>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -3 }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-gray-700"
            >
              <IoPeople className="text-[#f56551]" />
              <span>{trip?.userSelection?.traveler || "0"} {trip?.userSelection?.traveler === 1 ? 'Traveler' : 'Travelers'}</span>
            </motion.div>
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-3">
            <Button 
              variant="outline"
              className="flex items-center gap-2 rounded-full"
              disabled={processingAction === 'download'}
              onClick={handleDownload}
            >
              {processingAction === 'download' ? (
                <div className="flex items-center">
                  <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-gray-600 rounded-full mr-2"></div>
                  <span className="hidden sm:inline">Processing...</span>
                </div>
              ) : (
                <>
                  <MdDownload />
                  <span className="hidden sm:inline">Download</span>
                </>
              )}
            </Button>
            
            <Button 
              variant="outline"
              className="flex items-center gap-2 rounded-full"
              disabled={processingAction === 'share'}
              onClick={handleShare}
            >
              {processingAction === 'share' ? (
                <div className="flex items-center">
                  <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-gray-600 rounded-full mr-2"></div>
                  <span className="hidden sm:inline">Processing...</span>
                </div>
              ) : (
                <>
                  <MdContentCopy className="sm:mr-1" />
                  <span className="hidden sm:inline">Copy Link</span>
                </>
              )}
            </Button>
            
            {!isBooked && (
              <Button
                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#f56551] to-[#f79577] hover:from-[#f56551]/90 hover:to-[#f79577]/90"
                onClick={handleBookNow}
              >
                <span className="hidden sm:inline">Book Now</span>
                <span className="sm:hidden">Book</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const TripShareButtons = ({ tripData, tripId }) => {
  return (
    <div className="flex items-center space-x-2">
      <Button 
        variant="outline" 
        size="sm"
        className="flex items-center gap-2 transition-all hover:bg-indigo-50"
        onClick={() => downloadTripAsPDF(tripData, tripId)}
      >
        <FiDownload className="w-4 h-4" />
        <span className="hidden sm:inline">Download PDF</span>
      </Button>
      
      <Button 
        variant="outline" 
        size="sm"
        className="flex items-center gap-2 transition-all hover:bg-indigo-50"
        onClick={() => copyTripLink(tripId)}
      >
        <FiLink className="w-4 h-4" />
        <span className="hidden sm:inline">Copy Link</span>
      </Button>
      
      <Button 
        variant="outline" 
        size="sm"
        className="flex items-center gap-2 transition-all hover:bg-indigo-50"
        onClick={() => shareTripViaEmail(tripData, tripId)}
      >
        <FiMail className="w-4 h-4" />
        <span className="hidden sm:inline">Share via Email</span>
      </Button>
    </div>
  );
};

export default InfoSection
