import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth, API } from "@/App";
import axios from "axios";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  ExternalLink,
  Share2,
  Star,
  CheckCircle,
  Ticket,
  Zap,
  Minus,
  Plus
} from "lucide-react";
import { toast } from "sonner";

export default function EventDetail() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attending, setAttending] = useState(false);
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    fetchEvent();
    
    // Check for payment success
    const paymentStatus = searchParams.get("payment");
    const sessionId = searchParams.get("session_id");
    
    if (paymentStatus === "success" && sessionId) {
      pollPaymentStatus(sessionId);
    }
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      const response = await axios.get(`${API}/events/${eventId}`);
      setEvent(response.data);
    } catch (error) {
      toast.error("Event not found");
      navigate("/events");
    } finally {
      setLoading(false);
    }
  };

  const pollPaymentStatus = async (sessionId, attempts = 0) => {
    if (attempts >= 5) {
      toast.error("Could not verify payment. Check your tickets in profile.");
      return;
    }

    try {
      const response = await axios.get(`${API}/payments/status/${sessionId}`);
      if (response.data.payment_status === "paid") {
        toast.success("Ticket purchased successfully!");
        fetchEvent(); // Refresh event data
      } else {
        setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), 2000);
      }
    } catch (error) {
      console.error("Error checking payment:", error);
    }
  };

  const handleBuyTicket = async () => {
    if (!user) {
      toast.error("Please login to buy tickets");
      navigate("/auth");
      return;
    }

    setPurchasing(true);
    try {
      const response = await axios.post(`${API}/payments/ticket`, {
        event_id: eventId,
        quantity: ticketQuantity,
        origin_url: window.location.origin
      });
      
      window.location.href = response.data.checkout_url;
    } catch (error) {
      toast.error("Failed to start checkout");
      setPurchasing(false);
    }
  };

  const handleAttend = async () => {
    if (!user) {
      toast.error("Please login to attend events");
      navigate("/auth");
      return;
    }

    try {
      await axios.post(`${API}/events/${eventId}/attend`);
      setAttending(true);
      setEvent(prev => ({ ...prev, attendee_count: prev.attendee_count + 1 }));
      toast.success("You're attending this event!");
    } catch (error) {
      toast.error("Failed to register attendance");
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: event.title,
        text: `Check out ${event.title} at ${event.venue_name}`,
        url: window.location.href
      });
    } catch (error) {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  const isPromoter = user && event && user.id === event.promoter_id;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505]">
        <div className="skeleton h-72 w-full" />
        <div className="p-4 space-y-4">
          <div className="skeleton h-8 w-3/4" />
          <div className="skeleton h-4 w-1/2" />
          <div className="skeleton h-32 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!event) return null;

  const formattedDate = new Date(event.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  // Parse price for display
  const priceNum = parseFloat(event.price?.replace(/[^0-9.]/g, '') || '0');
  const totalPrice = (priceNum * ticketQuantity).toFixed(2);

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Hero Image */}
      <div className="relative h-72 md:h-96">
        <img
          src={event.image_url || "https://images.unsplash.com/photo-1574155331040-87b9dae81218?w=800"}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
        
        {/* Back Button */}
        <button
          data-testid="event-back-btn"
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white hover:bg-black/70 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Share Button */}
        <button
          data-testid="share-event-btn"
          onClick={handleShare}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white hover:bg-black/70 transition-colors"
        >
          <Share2 className="w-5 h-5" />
        </button>

        {/* Badges */}
        <div className="absolute bottom-4 left-4 flex gap-2">
          {event.is_featured && (
            <span className="badge-featured flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold">
              <Star className="w-3 h-3" /> Featured
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <main className="px-4 py-6 -mt-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Genre Tags */}
          <div className="flex flex-wrap gap-2 mb-3">
            {event.genre.map((g) => (
              <span key={g} className="text-[#00F0FF] text-xs font-semibold uppercase tracking-wider">
                {g}
              </span>
            ))}
            <span className="text-gray-500">•</span>
            <span className="text-[#CCFF00] text-xs font-semibold uppercase tracking-wider">
              {event.vibe}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-4">
            {event.title}
          </h1>

          {/* Promoter */}
          {event.promoter_name && (
            <div className="flex items-center gap-2 mb-6">
              <span className="text-gray-400">Presented by</span>
              <span className="text-white font-semibold">{event.promoter_name}</span>
              <CheckCircle className="w-4 h-4 text-[#00F0FF]" />
            </div>
          )}

          {/* Promoter Actions */}
          {isPromoter && (
            <div className="mb-6 p-4 bg-[#121212] rounded-xl border border-[#CCFF00]/30">
              <p className="text-sm text-[#CCFF00] mb-3 font-semibold">Promoter Actions</p>
              <button
                data-testid="boost-event-btn"
                onClick={() => navigate(`/boost?event=${eventId}`)}
                className="flex items-center gap-2 px-4 py-2 bg-[#CCFF00] text-black rounded-full font-bold text-sm hover:shadow-[0_0_20px_rgba(204,255,0,0.4)] transition-all"
              >
                <Zap className="w-4 h-4" />
                Boost This Event
              </button>
            </div>
          )}

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Date & Time */}
            <div className="bg-[#121212] rounded-xl p-4 border border-[#262626]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-[#00F0FF]" />
                </div>
                <div>
                  <p className="text-xs font-mono uppercase tracking-wider text-gray-500">Date</p>
                  <p className="font-semibold">{formattedDate}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center">
                  <Clock className="w-5 h-5 text-[#FF0055]" />
                </div>
                <div>
                  <p className="text-xs font-mono uppercase tracking-wider text-gray-500">Time</p>
                  <p className="font-semibold">{event.time}</p>
                </div>
              </div>
            </div>

            {/* Venue */}
            <div className="bg-[#121212] rounded-xl p-4 border border-[#262626]">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-[#CCFF00]" />
                </div>
                <div>
                  <p className="text-xs font-mono uppercase tracking-wider text-gray-500">Venue</p>
                  <p className="font-semibold">{event.venue_name}</p>
                  <p className="text-sm text-gray-400 mt-1">{event.venue_address}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Attendees */}
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-5 h-5 text-[#00F0FF]" />
            <span className="text-gray-300">
              <strong className="text-white">{event.attendee_count}</strong> people attending
            </span>
          </div>

          {/* Description */}
          <div className="mb-8">
            <h2 className="text-sm font-mono uppercase tracking-wider text-gray-500 mb-3">
              About This Event
            </h2>
            <p className="text-gray-300 leading-relaxed">
              {event.description}
            </p>
          </div>

          {/* Ticket Purchase Section */}
          {priceNum > 0 && (
            <div className="mb-8 p-6 bg-[#121212] rounded-xl border border-[#262626]">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-[#00F0FF]" />
                Get Tickets
              </h2>
              
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-gray-400">General Admission</p>
                  <p className="text-2xl font-bold text-[#CCFF00]">{event.price}</p>
                </div>
                
                {/* Quantity Selector */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setTicketQuantity(Math.max(1, ticketQuantity - 1))}
                    className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center hover:bg-[#262626] transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-xl font-bold w-8 text-center">{ticketQuantity}</span>
                  <button
                    onClick={() => setTicketQuantity(Math.min(10, ticketQuantity + 1))}
                    className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center hover:bg-[#262626] transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#262626]">
                <span className="text-gray-400">Total</span>
                <span className="text-2xl font-black text-white">${totalPrice}</span>
              </div>

              <button
                data-testid="buy-ticket-btn"
                onClick={handleBuyTicket}
                disabled={purchasing}
                className="w-full mt-4 btn-primary disabled:opacity-50"
              >
                {purchasing ? "Processing..." : "Buy Tickets"}
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="fixed bottom-0 left-0 right-0 bg-[#050505] border-t border-[#262626] p-4 z-40">
            <div className="max-w-lg mx-auto flex items-center gap-4">
              {/* Price (if no ticket section above) */}
              {priceNum === 0 && event.price && (
                <div className="flex-shrink-0">
                  <p className="text-xs text-gray-500">Price</p>
                  <p className="text-xl font-bold text-[#CCFF00]">{event.price}</p>
                </div>
              )}

              <div className="flex-1 flex gap-3">
                {/* Attend Button */}
                <button
                  data-testid="attend-event-btn"
                  onClick={handleAttend}
                  disabled={attending}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full font-bold uppercase tracking-wider transition-all ${
                    attending
                      ? 'bg-[#1A1A1A] text-[#CCFF00] border border-[#CCFF00]'
                      : 'btn-primary'
                  }`}
                >
                  {attending ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Attending
                    </>
                  ) : (
                    <>
                      <Users className="w-5 h-5" />
                      I'm Going
                    </>
                  )}
                </button>

                {/* Ticket Link */}
                {event.ticket_url && (
                  <a
                    href={event.ticket_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-full btn-secondary"
                  >
                    <Ticket className="w-5 h-5" />
                    <span className="hidden sm:inline">Tickets</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Spacer for fixed bottom bar */}
          <div className="h-24" />
        </motion.div>
      </main>
    </div>
  );
}
