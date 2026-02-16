import React from 'react';
import { Check, MapPin, Calendar, Wallet, NotebookPen, Sparkles, Map, PanelLeftClose, Star, User, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { useSEO } from '@/context/SEOContext';

function HowItWorks() {
  const { pageSEO } = useSEO();
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    if (openFaq === index) {
      setOpenFaq(null);
    } else {
      setOpenFaq(index);
    }
  };

  const faqs = [
    {
      question: "How does the AI create travel plans?",
      answer: "Our advanced AI analyzes thousands of data points including travel trends, user reviews, local attractions, seasonal events, and your personal preferences to create a tailored itinerary that maximizes your enjoyment while respecting your budget and time constraints."
    },
    {
      question: "Is the itinerary stored? Can I access it later?",
      answer: "Absolutely. Every trip you create is saved in MyTrip, where you can view you trips and you can share it anytime with your friends and family."
    },
    {
      question: "Is the service completely free?",
      answer: "Yes, all users can use Our AI Travel Guide free of cost for now. If we ever plan to move to a paid model, we'll notify all users via email in advance. Also, our code is open-source you can use in github, so you can always access it freely."
    },
    {
      question: "What data do you use to generate my trip?",
      answer: "We use your selected destination, travel dates, budget, travel style, and preferences like food, activities, and weather to create your perfect plan."
    },
    {
      question: "Sometimes my trip fails to generate—why?",
      answer: "f you select a very long trip (6+ days) or too many preferences, the AI might time out. We're working on breaking longer trips into smaller segments and retrying automatically."
    },
    {
      question: "How accurate are the budget estimates?",
      answer: "Our budget estimates are based on real-time data from various sources and are typically accurate within 10-15%. Prices for attractions, accommodations, and dining are regularly updated to reflect current rates, taxes, and seasonal variations."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pt-24 pb-16">
      {pageSEO.howItWorks()}

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
            How It Works
          </h1>
          <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto">
            Discover how our AI-powered platform makes travel planning effortless,
            personalized, and delightfully simple.
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          

          {/* Feature 2: Explore Itinerary Details */}
          <div className="relative overflow-hidden rounded-2xl shadow-xl bg-white p-6 lg:p-8 group hover:shadow-2xl transition-all duration-300">
            <div className="absolute -left-20 -top-20 h-40 w-40 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full opacity-70 group-hover:scale-150 transition-all duration-500"></div>

            <div className="relative z-10">
              <div className="h-14 w-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-6 shadow-lg">
                <Calendar className="h-7 w-7 text-white" />
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-4">Explore Itinerary Details</h3>

              <p className="text-gray-700 mb-6">
                Dive deep into your personalized travel plan with comprehensive details about each activity, attraction, and recommendation.
              </p>

              <div className="space-y-3">
                <div className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <p className="text-gray-600">Day-by-day itinerary breakdowns</p>
                </div>
                <div className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <p className="text-gray-600">Detailed information about each attraction</p>
                </div>
                <div className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <p className="text-gray-600">Local tips and hidden gems</p>
                </div>
                <div className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <p className="text-gray-600">Estimated timing and duration for each activity</p>
                </div>
              </div>
            </div>

            <div className="mt-10 relative z-10">
              <div className="aspect-video rounded-lg overflow-hidden shadow-lg border border-gray-100">
                <img
                  src="/Screenshot 2025-04-20 at 1.54.59 PM.png"
                  alt="Detailed Itinerary"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          

          {/* Feature 4: Budget & Notes */}
          <div className="relative overflow-hidden rounded-2xl shadow-xl bg-white p-6 lg:p-8 group hover:shadow-2xl transition-all duration-300">
            <div className="absolute -left-20 -top-20 h-40 w-40 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full opacity-70 group-hover:scale-150 transition-all duration-500"></div>

            <div className="relative z-10">
              <div className="h-14 w-14 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg flex items-center justify-center mb-6 shadow-lg">
                <Wallet className="h-7 w-7 text-white" />
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-4">Manage Budget & Notes</h3>

              <p className="text-gray-700 mb-6">
                Keep track of your expenses and capture important travel notes all in one convenient place.
              </p>

              <div className="space-y-3">
                <div className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <p className="text-gray-600">Set and track your travel budget</p>
                </div>
                <div className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <p className="text-gray-600">Log expenses and see spending breakdowns</p>
                </div>
                <div className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <p className="text-gray-600">Add personal notes for each destination</p>
                </div>
                <div className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <p className="text-gray-600">Create packing lists and travel reminders</p>
                </div>
              </div>
            </div>

            <div className="mt-10 relative z-10">
              <div className="aspect-video rounded-lg overflow-hidden shadow-lg border border-gray-100">
                <img
                  src="/money-sheet.png"
                  alt="Budget Management"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

     

      {/* Steps Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Get Started in 3 Simple Steps</h2>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto">
            Our streamlined process makes trip planning easier than ever before.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="bg-white rounded-xl p-8 text-center shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-50">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl font-bold text-blue-600">1</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Create an Account</h3>
            <p className="text-gray-600">
              Sign up in seconds to access our full range of AI-powered travel planning tools.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-xl p-8 text-center shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-50">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl font-bold text-purple-600">2</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Describe Your Dream Trip</h3>
            <p className="text-gray-600">
              Tell us your destination, preferences, budget, and travel style.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-xl p-8 text-center shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-50">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl font-bold text-green-600">3</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Receive Your Itinerary</h3>
            <p className="text-gray-600">
              Get a personalized travel plan you can refine, share, and take with you on your journey.
            </p>
          </div>
        </div>
      </div>

      
     

      {/* CTA Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl overflow-hidden">
          <div className="px-6 py-12 md:p-12 md:flex items-center justify-between">
            <div className="mb-8 md:mb-0 md:max-w-lg">
              <h2 className="text-3xl font-bold text-white mb-4">Ready to Plan Your Next Adventure?</h2>
              <p className="text-blue-100 text-lg mb-6">
                Let our AI create the perfect itinerary for your dream destination.
              </p>
              <a
                href="/create-trip"
                className="inline-block bg-white text-blue-600 font-medium px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
              >
                Create My Trip Now
              </a>
            </div>
            <div className="hidden md:block relative w-64 h-64">
              <div className="absolute inset-0 bg-white/10 rounded-full animate-ping opacity-75"></div>
              <div className="absolute inset-4 bg-white/20 rounded-full animate-ping opacity-75 animation-delay-500"></div>
              <div className="absolute inset-8 bg-white/30 rounded-full animate-ping opacity-75 animation-delay-1000"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <MapPin className="h-12 w-12 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HowItWorks; 
