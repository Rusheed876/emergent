import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth, API } from "@/App";
import axios from "axios";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Rocket,
  Star,
  Zap,
  TrendingUp,
  Clock,
  Check
} from "lucide-react";
import { toast } from "sonner";

const boostPackages = {
  featured_24h: {
    icon: Star,
    color: "#00F0FF",
    description: "Pin your event to the top of the feed for 24 hours"
  },
  weekend_spotlight: {
    icon: TrendingUp,
    color: "#CCFF00",
    description: "Featured placement all weekend (Fri-Sun)"
  },
  city_takeover: {
    icon: Rocket,
    color: "#FF0055",
    description: "Banner + push notification to all city users"
  }
};

export default function BoostEvent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get("event");
  const { user } = useAuth();
  const [boosts, setBoosts] = useState({});
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);

  useEffect(() => {
    if (!eventId) {
      navigate("/events");
      return;
    }
    fetchData();
  }, [eventId]);

  const fetchData = async () => {
    try {
      const [boostRes, eventRes] = await Promise.all([
        axios.get(`${API}/pricing/boosts`),
        axios.get(`${API}/events/${eventId}`)
      ]);
      setBoosts(boostRes.data.boosts);
      setEvent(eventRes.data);
    } catch (error) {
      toast.error("Failed to load data");
      navigate("/events");
    } finally {
      setLoading(false);
    }
  };

  const handleBoost = async (packageId) => {
    if (!user) {
      toast.error("Please login first");
      navigate("/auth");
      return;
    }

    setPurchasing(packageId);
    try {
      const response = await axios.post(`${API}/payments/boost`, {
        event_id: eventId,
        package_id: packageId,
        origin_url: window.location.origin
      });
      
      window.location.href = response.data.checkout_url;
    } catch (error) {
      const message = error.response?.data?.detail || "Failed to start checkout";
      toast.error(message);
      setPurchasing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="animate-pulse text-[#00F0FF]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Header */}
      <header className="p-4">
        <button
          data-testid="boost-back-btn"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
      </header>

      <main className="px-4 py-8 max-w-2xl mx-auto">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Zap className="w-12 h-12 text-[#CCFF00] mx-auto mb-4" />
          <h1 className="text-3xl font-black uppercase tracking-tight mb-2">
            Boost Your Event
          </h1>
          <p className="text-gray-400">
            Get more eyes on your event
          </p>
        </motion.div>

        {/* Event Preview */}
        {event && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-[#121212] rounded-xl border border-[#262626]"
          >
            <div className="flex gap-4">
              <img
                src={event.image_url || "https://images.unsplash.com/photo-1574155331040-87b9dae81218?w=200"}
                alt={event.title}
                className="w-20 h-20 rounded-lg object-cover"
              />
              <div>
                <h3 className="font-bold text-lg">{event.title}</h3>
                <p className="text-sm text-gray-400">{event.venue_name}</p>
                <p className="text-sm text-[#00F0FF]">
                  {new Date(event.date).toLocaleDateString()} · {event.time}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Boost Packages */}
        <div className="space-y-4">
          {Object.entries(boosts).map(([packageId, pkg], index) => {
            const meta = boostPackages[packageId] || { icon: Star, color: "#00F0FF" };
            const Icon = meta.icon;
            
            return (
              <motion.div
                key={packageId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-[#121212] rounded-xl border border-[#262626] overflow-hidden hover:border-[#00F0FF]/30 transition-colors"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${meta.color}20` }}
                      >
                        <Icon className="w-6 h-6" style={{ color: meta.color }} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{pkg.name}</h3>
                        <p className="text-sm text-gray-400 mt-1">
                          {meta.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          <span>{pkg.duration_hours} hours</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black" style={{ color: meta.color }}>
                        ${pkg.price}
                      </p>
                    </div>
                  </div>

                  <button
                    data-testid={`boost-${packageId}-btn`}
                    onClick={() => handleBoost(packageId)}
                    disabled={purchasing}
                    className="w-full mt-4 py-3 rounded-full font-bold uppercase tracking-wider transition-all bg-[#1A1A1A] hover:bg-[#262626] border border-[#262626] disabled:opacity-50"
                    style={{ 
                      borderColor: purchasing === packageId ? meta.color : undefined,
                      color: purchasing === packageId ? meta.color : undefined
                    }}
                  >
                    {purchasing === packageId ? "Processing..." : "Select Package"}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 p-6 bg-[#121212] rounded-xl border border-[#262626]"
        >
          <h3 className="font-bold mb-4">What You Get</h3>
          <ul className="space-y-3">
            <li className="flex items-center gap-3 text-sm text-gray-300">
              <Check className="w-4 h-4 text-[#CCFF00]" />
              Featured badge on your event
            </li>
            <li className="flex items-center gap-3 text-sm text-gray-300">
              <Check className="w-4 h-4 text-[#CCFF00]" />
              Priority placement in search results
            </li>
            <li className="flex items-center gap-3 text-sm text-gray-300">
              <Check className="w-4 h-4 text-[#CCFF00]" />
              More visibility = more attendees
            </li>
          </ul>
        </motion.div>
      </main>
    </div>
  );
}
