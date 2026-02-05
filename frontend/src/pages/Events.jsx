import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCity } from "@/App";
import { API } from "@/App";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Filter, 
  X,
  ChevronDown,
  Star,
  Flame,
  Music
} from "lucide-react";
import Navigation from "@/components/Navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const genres = [
  { id: "all", label: "All Genres" },
  { id: "dancehall", label: "Dancehall" },
  { id: "hiphop", label: "Hip-Hop" },
  { id: "rnb", label: "R&B" },
  { id: "soca", label: "Soca" },
  { id: "afrobeat", label: "Afrobeat" },
  { id: "edm", label: "EDM" },
  { id: "reggae", label: "Reggae" },
  { id: "latin", label: "Latin" }
];

const vibes = [
  { id: "all", label: "All Vibes" },
  { id: "lit", label: "Lit" },
  { id: "chill", label: "Chill" },
  { id: "upscale", label: "Upscale" },
  { id: "street", label: "Street" },
  { id: "underground", label: "Underground" },
  { id: "rooftop", label: "Rooftop" }
];

const timeFilters = [
  { id: "all", label: "All Events" },
  { id: "tonight", label: "Tonight" },
  { id: "weekend", label: "This Weekend" }
];

const cityNames = {
  kingston: "Kingston",
  miami: "Miami",
  nyc: "New York City"
};

export default function Events() {
  const navigate = useNavigate();
  const { selectedCity, selectCity } = useCity();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    genre: "all",
    vibe: "all",
    time: "all"
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!selectedCity) {
      navigate("/");
      return;
    }
    fetchEvents();
  }, [selectedCity, filters]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("city", selectedCity);
      if (filters.genre !== "all") params.append("genre", filters.genre);
      if (filters.vibe !== "all") params.append("vibe", filters.vibe);
      if (filters.time !== "all") params.append("date_filter", filters.time);

      const response = await axios.get(`${API}/events?${params.toString()}`);
      setEvents(response.data);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Tonight";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] pb-safe">
      {/* Header */}
      <header className="sticky top-0 z-40 glass">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-[#00F0FF] mb-1">
                What's Happening Now
              </p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button 
                    data-testid="city-selector-dropdown"
                    className="flex items-center gap-2 text-2xl font-black uppercase tracking-tight"
                  >
                    {cityNames[selectedCity]}
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-[#121212] border-[#262626]">
                  {Object.entries(cityNames).map(([id, name]) => (
                    <DropdownMenuItem
                      key={id}
                      data-testid={`city-option-${id}`}
                      onClick={() => selectCity(id)}
                      className={`text-white hover:bg-[#1A1A1A] cursor-pointer ${selectedCity === id ? 'text-[#00F0FF]' : ''}`}
                    >
                      {name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <button
              data-testid="filter-toggle-btn"
              onClick={() => setShowFilters(!showFilters)}
              className={`p-3 rounded-full transition-colors ${showFilters ? 'bg-[#00F0FF] text-black' : 'bg-[#1A1A1A] text-white'}`}
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>

          {/* Time Filter Pills */}
          <div className="flex gap-2 mb-4">
            {timeFilters.map((filter) => (
              <button
                key={filter.id}
                data-testid={`time-filter-${filter.id}`}
                onClick={() => setFilters(f => ({ ...f, time: filter.id }))}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  filters.time === filter.id
                    ? 'bg-[#00F0FF] text-black'
                    : 'bg-[#1A1A1A] text-gray-300 hover:bg-[#262626]'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Expanded Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="py-4 border-t border-[#262626]">
                  {/* Genre */}
                  <div className="mb-4">
                    <p className="text-xs font-mono uppercase tracking-wider text-gray-500 mb-2">
                      Genre
                    </p>
                    <ScrollArea className="w-full">
                      <div className="flex gap-2 pb-2">
                        {genres.map((genre) => (
                          <button
                            key={genre.id}
                            data-testid={`genre-filter-${genre.id}`}
                            onClick={() => setFilters(f => ({ ...f, genre: genre.id }))}
                            className={`tag whitespace-nowrap ${filters.genre === genre.id ? 'active' : ''}`}
                          >
                            {genre.label}
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Vibe */}
                  <div>
                    <p className="text-xs font-mono uppercase tracking-wider text-gray-500 mb-2">
                      Vibe
                    </p>
                    <ScrollArea className="w-full">
                      <div className="flex gap-2 pb-2">
                        {vibes.map((vibe) => (
                          <button
                            key={vibe.id}
                            data-testid={`vibe-filter-${vibe.id}`}
                            onClick={() => setFilters(f => ({ ...f, vibe: vibe.id }))}
                            className={`tag whitespace-nowrap ${filters.vibe === vibe.id ? 'active' : ''}`}
                          >
                            {vibe.label}
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Events List */}
      <main className="px-4 py-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-64 rounded-xl" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="empty-state py-20">
            <Music className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <h3 className="text-xl font-bold mb-2">No Events Found</h3>
            <p className="text-gray-500">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <EventCard event={event} onClick={() => navigate(`/events/${event.id}`)} />
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <Navigation />
    </div>
  );
}

function EventCard({ event, onClick }) {
  const isTonight = event.date === new Date().toISOString().split('T')[0];

  return (
    <button
      data-testid={`event-card-${event.id}`}
      onClick={onClick}
      className="w-full text-left bg-[#121212] border border-[#262626] rounded-xl overflow-hidden card-hover group"
    >
      {/* Image */}
      <div className="relative aspect-[2/1] overflow-hidden">
        <img
          src={event.image_url || "https://images.unsplash.com/photo-1574155331040-87b9dae81218?w=800"}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 event-overlay" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {event.is_featured && (
            <span className="badge-featured flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold">
              <Star className="w-3 h-3" /> Featured
            </span>
          )}
          {isTonight && (
            <span className="badge-live flex items-center gap-1">
              <Flame className="w-3 h-3" /> Tonight
            </span>
          )}
        </div>

        {/* Attendees */}
        {event.attendee_count > 0 && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur px-2 py-1 rounded-full">
            <Users className="w-3 h-3 text-[#00F0FF]" />
            <span className="text-xs font-semibold">{event.attendee_count}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Genre Tags */}
        <div className="flex flex-wrap gap-1 mb-2">
          {event.genre.slice(0, 2).map((g) => (
            <span key={g} className="text-[#00F0FF] text-xs font-semibold uppercase tracking-wider">
              {g}
            </span>
          ))}
          <span className="text-gray-500 text-xs">•</span>
          <span className="text-gray-400 text-xs uppercase tracking-wider">
            {event.vibe}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold mb-2 group-hover:text-[#00F0FF] transition-colors">
          {event.title}
        </h3>

        {/* Details */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>{new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>{event.time}</span>
          </div>
        </div>

        {/* Venue */}
        <div className="flex items-center gap-1.5 mt-2 text-sm text-gray-500">
          <MapPin className="w-4 h-4" />
          <span>{event.venue_name}</span>
        </div>

        {/* Price */}
        {event.price && (
          <div className="mt-3 pt-3 border-t border-[#262626]">
            <span className="text-[#CCFF00] font-bold">{event.price}</span>
          </div>
        )}
      </div>
    </button>
  );
}
