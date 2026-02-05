import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCity } from "@/App";
import { motion } from "framer-motion";
import { MapPin, ArrowRight, Zap } from "lucide-react";

const cities = [
  {
    id: "kingston",
    name: "Kingston",
    country: "Jamaica",
    flag: "🇯🇲",
    tagline: "Dancehall Capital",
    image: "https://images.unsplash.com/photo-1615422079250-5d9aa901ef1b?w=800&q=80",
    vibe: "Authentic Caribbean energy"
  },
  {
    id: "miami",
    name: "Miami",
    country: "USA",
    flag: "🇺🇸",
    tagline: "Magic City",
    image: "https://images.unsplash.com/photo-1759352642227-dc9587d569a3?w=800&q=80",
    vibe: "Where cultures collide"
  },
  {
    id: "nyc",
    name: "New York City",
    country: "USA",
    flag: "🇺🇸",
    tagline: "The City That Never Sleeps",
    image: "https://images.unsplash.com/photo-1731331215550-1c1f6b82daaa?w=800&q=80",
    vibe: "Underground to upscale"
  }
];

export default function Landing() {
  const navigate = useNavigate();
  const { selectCity } = useCity();
  const [hoveredCity, setHoveredCity] = useState(null);

  const handleCitySelect = (cityId) => {
    selectCity(cityId);
    navigate("/events");
  };

  return (
    <div className="min-h-screen bg-[#050505] overflow-hidden">
      {/* Hero Section */}
      <div className="relative min-h-screen flex flex-col">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, #00F0FF 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }} />
        </div>

        {/* Header */}
        <header className="relative z-10 p-6 md:p-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-2"
          >
            <Zap className="w-6 h-6 text-[#00F0FF]" />
            <span className="font-bold text-lg tracking-wider text-white">PULSE</span>
          </motion.div>
        </header>

        {/* Main Content */}
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12">
          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center mb-12 md:mb-16"
          >
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter uppercase leading-none mb-4">
              <span className="text-white">PULSE OF</span>
              <br />
              <span className="gradient-text">THE CITY</span>
            </h1>
            <p className="text-gray-400 text-lg md:text-xl mt-6 max-w-md mx-auto">
              Where the city comes alive. Real-time nightlife discovery.
            </p>
          </motion.div>

          {/* City Selection */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="w-full max-w-5xl"
          >
            <p className="text-center text-xs font-mono uppercase tracking-[0.3em] text-gray-500 mb-8">
              Select Your City
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {cities.map((city, index) => (
                <motion.button
                  key={city.id}
                  data-testid={`city-card-${city.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                  whileHover={{ y: -8 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleCitySelect(city.id)}
                  onMouseEnter={() => setHoveredCity(city.id)}
                  onMouseLeave={() => setHoveredCity(null)}
                  className="relative aspect-[3/4] md:aspect-[2/3] overflow-hidden rounded-2xl group cursor-pointer"
                >
                  {/* Background Image */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                    style={{ backgroundImage: `url(${city.image})` }}
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 city-overlay" />
                  
                  {/* Hover Glow */}
                  <div className={`absolute inset-0 transition-opacity duration-500 ${hoveredCity === city.id ? 'opacity-100' : 'opacity-0'}`}
                    style={{
                      background: 'radial-gradient(circle at center, rgba(0,240,255,0.15) 0%, transparent 70%)'
                    }}
                  />

                  {/* Content */}
                  <div className="absolute inset-0 p-6 flex flex-col justify-end">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{city.flag}</span>
                      <span className="text-xs font-mono uppercase tracking-wider text-gray-400">
                        {city.country}
                      </span>
                    </div>
                    
                    <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-white mb-1">
                      {city.name}
                    </h2>
                    
                    <p className="text-[#00F0FF] text-sm font-semibold uppercase tracking-wider mb-3">
                      {city.tagline}
                    </p>
                    
                    <p className="text-gray-400 text-sm mb-4">
                      {city.vibe}
                    </p>

                    {/* Enter Button */}
                    <div className={`flex items-center gap-2 transition-all duration-300 ${hoveredCity === city.id ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
                      <span className="text-[#00F0FF] text-sm font-bold uppercase tracking-wider">
                        Enter
                      </span>
                      <ArrowRight className="w-4 h-4 text-[#00F0FF]" />
                    </div>
                  </div>

                  {/* Border Effect */}
                  <div className={`absolute inset-0 rounded-2xl border transition-all duration-300 ${hoveredCity === city.id ? 'border-[#00F0FF]/50' : 'border-white/5'}`} />
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Live Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="mt-12 flex items-center gap-3"
          >
            <span className="w-2 h-2 rounded-full bg-[#FF0055] live-indicator" />
            <span className="text-xs font-mono uppercase tracking-wider text-gray-500">
              Live updates happening now
            </span>
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 p-6 text-center">
          <p className="text-xs text-gray-600">
            Caribbean & Diaspora Nightlife
          </p>
        </footer>
      </div>
    </div>
  );
}
