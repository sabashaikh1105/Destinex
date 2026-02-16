import React, { useState, useEffect, useRef } from 'react'
import { Button } from '../ui/button'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { HiOutlineLocationMarker, HiOutlineCalendar, HiOutlineLightBulb, HiOutlineMicrophone } from 'react-icons/hi'
import { FiArrowRight, FiMapPin, FiSearch } from 'react-icons/fi'
import { RiCompass3Line, RiMapPinTimeLine, RiRoadMapLine, RiRobot2Line } from 'react-icons/ri'
import { MdClose, MdOutlineAutoAwesome, MdOutlineTravelExplore } from 'react-icons/md'
import { HiSparkles } from 'react-icons/hi2'
import { AiFillStar } from 'react-icons/ai'

function Hero() {
  const [searchInput, setSearchInput] = useState('')
  const [activeTab, setActiveTab] = useState('popular')
  const [isVisible, setIsVisible] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [aiMoodScore, setAiMoodScore] = useState(89)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSuggestion, setShowSuggestion] = useState(false)
  
  // AI Predicted locations based on user behavior
  const aiPredictions = [
    { location: "Boston, MA, USA", confidence: 92, reason: "Based on your interest in cultural experiences" },
    { location: "New York, USA", confidence: 87, reason: "Based on your searches for eco-tourism" },
    { location: "Delhi, IN", confidence: 85, reason: "Similar to your past trips" },
  ]

  // Popular destinations data
  const destinations = [
    { name: 'Chicago, IL, USA', image: 'https://images.unsplash.com/photo-1494522855154-9297ac14b55f?q=80&w=2940&auto=format&fit=crop', tags: ['3 Days', '3 to 5 People Travelers'], link: '/view-trip/1745958781034' },
    { name: 'Bali, Indonesia', image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=2938&auto=format&fit=crop', tags: ['Beach', 'Culture'], link: '/view-trip/1745958877022' },
    { name: 'Kyoto, Japan', image: 'https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?q=80&w=2940&auto=format&fit=crop', tags: ['Historic', 'Culture'], link: '/view-trip/1745958964696' },
  ]

  useEffect(() => {
    // Animation trigger on component mount
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)
    
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Show AI suggestion after 5 seconds
    const timer = setTimeout(() => {
      setShowSuggestion(true)
    }, 5000)
    
    return () => clearTimeout(timer)
  }, [])

  // Simulated AI voice recognition
  const handleVoiceSearch = () => {
    setIsListening(true)
    setIsProcessing(true)
    
    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false)
      setIsListening(false)
      setSearchInput("New York City in autumn with Central Park's fall foliage.")
    }, 2000)
  }

  const fadeInUpVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({ 
      opacity: 1, 
      y: 0, 
      transition: { 
        delay: i * 0.2,
        duration: 0.7,
        ease: "easeOut"
      } 
    })
  }

  const scaleIn = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        delay: 0.8,
        duration: 0.5,
        ease: "easeOut"
      } 
    }
  }

  const featureItems = [
    {
      icon: <HiOutlineLightBulb className="w-6 h-6 text-purple-600" />,
      title: "AI-Powered Suggestions",
      description: "Get personalized recommendations based on your preferences and past trips"
    },
    {
      icon: <HiOutlineCalendar className="w-6 h-6 text-blue-600" />,
      title: "Smart Itineraries",
      description: "Plan your perfect day with AI-optimized schedules and routes"
    },
    {
      icon: <RiRoadMapLine className="w-6 h-6 text-orange-600" />,
      title: "Local Experiences",
      description: "Discover hidden gems and authentic local experiences"
    }
  ]

  return (
    
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pt-24 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Hero Main Section */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-12">

          <motion.div
  className= "relative w-[1400px]  px-10 ml-6 mr-6 mt-0 p-10 rounded-[40px] overflow-hidden shadow-2xl bg-white/85 backdrop-blur-md border border-black/10"
  initial={{ opacity: 0, y: 40 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
          {/* Left Column - Hero Text */}
          <div className="lg:w-full space-y-8">
 
          
            
            <motion.h1
              initial="hidden"
              animate={isVisible ? "visible" : "hidden"}
              custom={1}
              variants={fadeInUpVariants}
              className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight"
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#0b0464] to-[#f79577] text-2xl sm:text-3xl lg:text-4xl ">
                Plan Your Next Adventure
              </span>
              <br /> with the Power of AI
            </motion.h1>
            
          

            
            
            
            {/* Search Bar */}
            <motion.div
              initial="hidden"
              animate={isVisible ? "visible" : "hidden"}
              custom={3}
              variants={fadeInUpVariants}
              className="mt-6 max-w-full"
            >
              <div className="flex items-center w-full overflow-hidden rounded-full border bg-white shadow-md">
                <div className="flex items-center pl-4">
                  <FiSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Where do you want to go?"
                  className="flex-1 py-4 px-6 outline-none"
                />
                <div className="flex">
                  <button 
                    onClick={handleVoiceSearch}
                    className={`flex items-center justify-center h-10 w-10 rounded-full transition-all ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                  >
                    <HiOutlineMicrophone className="h-5 w-5" />
                  </button>
                  <Link to={'/create-trip'}>
                    <Button className="px-6 py-3 ml-2 rounded-full bg-gradient-to-r from-[#061568] to-[#6a8dd8] hover:opacity-90 ">
                      <FiArrowRight className="mr-2" /> Plan Trip
                    </Button>
                  </Link>
                </div>
              </div>
              
              {/* Voice processing indicator */}
              <AnimatePresence>
                {isProcessing && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 mt-2 bg-white p-3 rounded-lg shadow-md w-full"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "0s" }}></div>
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                      </div>
                      <span className="text-sm text-gray-600">Processing your voice input...</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
            
             
            </motion.div>
            
            {/* Popular Searches Tags */}
            <motion.div
              initial="hidden"
              animate={isVisible ? "visible" : "hidden"}
              custom={4}
              variants={fadeInUpVariants}
              className="flex flex-wrap gap-2 mt-4"
            >
              <span className="text-sm text-gray-500">Popular:</span>
              {['Boston', 'Paris', 'New York', 'Chicago', 'Delhi'].map((item, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 bg-white border rounded-full text-sm hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  {item}
                </span>
              ))}
            </motion.div>
          </div>
          
            </motion.div>
            {/* Background decorative elements */}
            <div className="absolute -z-10 top-1/3 right-1/4 w-64 h-64 bg-purple-300 rounded-full filter blur-3xl opacity-20 animate-pulse"></div>
            <div className="absolute -z-10 bottom-1/3 left-1/4 w-64 h-64 bg-blue-300 rounded-full filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: '1s'}}></div>
          
        </div>
   
      
      
      
      {/* Features Section */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6, duration: 0.7 }}
        className="max-w-7xl mx-auto mt-24"
      >
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Why Plan with AI</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">Experience the power of artificial intelligence in creating the perfect travel itinerary tailored just for you.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featureItems.map((item, index) => (
            <motion.div 
              key={index}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                {item.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              <p className="text-gray-600">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
      
      {/* Popular Destinations */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8, duration: 0.7 }}
        className="max-w-7xl mx-auto mt-24"
      >
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Popular Destinations</h2>
          
          <div className="flex gap-4">
            {['popular', 'recommended', 'trending'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full text-sm transition-colors ${
                  activeTab === tab 
                    ? 'bg-gray-900 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {destinations.map((destination, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -10, transition: { duration: 0.2 } }}
              className="rounded-xl overflow-hidden shadow-lg group relative"
            >
              <div className="h-72 w-full overflow-hidden">
                <img 
                  src={destination.image} 
                  alt={destination.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80"></div>
              <div className="absolute bottom-0 left-0 p-6 text-white">
                <div className="flex gap-2 mb-2">
                  {destination.tags.map((tag, i) => (
                    <span key={i} className="px-2 py-1 bg-white/20 rounded-full text-xs backdrop-blur-sm">{tag}</span>
                  ))}
                </div>
                <h3 className="text-xl font-bold mb-1">{destination.name}</h3>
                <Link to={destination.link || '/create-trip'}>
                  <button className="mt-3 flex items-center gap-1 text-sm text-white/90 hover:text-white group-hover:underline">
                    <span>Plan your trip</span>
                    <FiArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="text-center mt-10">
      <Link to={'/create-trip'}>
            <Button 
              variant="outline" 
              className="px-8 py-6 rounded-full border-gray-300 hover:bg-gray-50 text-gray-700"
            >
              Explore More Destinations <FiArrowRight className="ml-2" />
            </Button>
      </Link>
        </div>
      </motion.div>
      
      {/* Call to action */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2, duration: 0.7 }}
        className="max-w-7xl mx-auto mt-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl overflow-hidden shadow-xl"
      >
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/2 p-12 text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to explore the world?</h2>
            <p className="mb-8 text-blue-100">Start planning your dream trip today with our AI-powered itinerary generator.</p>
            <Link to={'/create-trip'}>
              <Button className="rounded-full bg-white text-blue-600 hover:bg-blue-50 px-8 py-6">
                Get Started, It's Free <FiArrowRight className="ml-2" />
              </Button>
            </Link>
          </div>
          <div className="md:w-1/2 relative">
            <img 
              src="https://images.unsplash.com/photo-1468078809804-4c7b3e60a478?q=80&w=2940&auto=format&fit=crop" 
              alt="Travel" 
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-blue-900/20"></div>
          </div>
        </div>
       </motion.div>
     </div>
    </div>
  )
}

export default Hero
