import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth, useCity, API } from "@/App";
import axios from "axios";
import { motion } from "framer-motion";
import { 
  User, 
  MapPin, 
  Music, 
  Sparkles, 
  LogOut, 
  Settings,
  ChevronRight,
  Bell,
  Heart,
  Calendar,
  Edit2,
  CheckCircle,
  Rocket,
  Ticket,
  Crown
} from "lucide-react";
import Navigation from "@/components/Navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const genres = ["dancehall", "hiphop", "rnb", "soca", "afrobeat", "edm", "reggae", "latin"];
const vibes = ["lit", "chill", "upscale", "street", "underground", "rooftop"];
const cityOptions = [
  { id: "kingston", name: "Kingston", flag: "🇯🇲" },
  { id: "miami", name: "Miami", flag: "🇺🇸" },
  { id: "nyc", name: "New York City", flag: "🇺🇸" }
];

export default function Profile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout, fetchUser } = useAuth();
  const { selectedCity, selectCity } = useCity();
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editData, setEditData] = useState({
    username: "",
    city: "",
    bio: "",
    favorite_genres: [],
    favorite_vibes: []
  });
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    setEditData({
      username: user.username || "",
      city: user.city || selectedCity || "miami",
      bio: user.bio || "",
      favorite_genres: user.favorite_genres || [],
      favorite_vibes: user.favorite_vibes || []
    });

    fetchNotifications();
    fetchTickets();
    
    // Check for subscription success
    const subscriptionStatus = searchParams.get("subscription");
    const sessionId = searchParams.get("session_id");
    
    if (subscriptionStatus === "success" && sessionId) {
      pollPaymentStatus(sessionId);
    }
  }, [user]);

  const pollPaymentStatus = async (sessionId, attempts = 0) => {
    if (attempts >= 5) return;
    
    try {
      const response = await axios.get(`${API}/payments/status/${sessionId}`);
      if (response.data.payment_status === "paid") {
        toast.success("Subscription activated! You're now a verified promoter.");
        fetchUser();
      } else {
        setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), 2000);
      }
    } catch (error) {
      console.error("Error checking payment:", error);
    }
  };

  const fetchTickets = async () => {
    try {
      const response = await axios.get(`${API}/user/tickets`);
      setTickets(response.data.tickets || []);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const [notifResponse, countResponse] = await Promise.all([
        axios.get(`${API}/notifications`),
        axios.get(`${API}/notifications/unread-count`)
      ]);
      setNotifications(notifResponse.data);
      setUnreadCount(countResponse.data.count);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/auth/me`, editData);
      await fetchUser();
      if (editData.city !== selectedCity) {
        selectCity(editData.city);
      }
      setShowEditProfile(false);
      toast.success("Profile updated!");
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const toggleGenre = (genre) => {
    setEditData(prev => ({
      ...prev,
      favorite_genres: prev.favorite_genres.includes(genre)
        ? prev.favorite_genres.filter(g => g !== genre)
        : [...prev.favorite_genres, genre]
    }));
  };

  const toggleVibe = (vibe) => {
    setEditData(prev => ({
      ...prev,
      favorite_vibes: prev.favorite_vibes.includes(vibe)
        ? prev.favorite_vibes.filter(v => v !== vibe)
        : [...prev.favorite_vibes, vibe]
    }));
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (!user) {
    return null;
  }

  const currentCity = cityOptions.find(c => c.id === user.city);

  return (
    <div className="min-h-screen bg-[#050505] pb-safe">
      {/* Header */}
      <header className="glass">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black uppercase tracking-tight">Profile</h1>
            <button
              data-testid="logout-btn"
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-[#FF0055] transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#121212] rounded-2xl p-6 border border-[#262626]"
        >
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#00F0FF] to-[#FF0055] flex items-center justify-center flex-shrink-0">
              <span className="text-3xl font-black text-white">
                {user.username.charAt(0).toUpperCase()}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold truncate">{user.username}</h2>
                {user.is_verified && (
                  <CheckCircle className="w-5 h-5 text-[#00F0FF] flex-shrink-0" />
                )}
                {user.is_promoter && (
                  <span className="px-2 py-0.5 rounded-full bg-[#CCFF00] text-black text-xs font-bold">
                    Promoter
                  </span>
                )}
              </div>
              
              <p className="text-gray-400 text-sm truncate">{user.email}</p>
              
              <div className="flex items-center gap-1.5 mt-2 text-sm">
                <MapPin className="w-4 h-4 text-[#00F0FF]" />
                <span className="text-gray-300">
                  {currentCity?.flag} {currentCity?.name}
                </span>
              </div>

              {user.bio && (
                <p className="text-gray-400 text-sm mt-3">{user.bio}</p>
              )}
            </div>
          </div>

          {/* Edit Button */}
          <button
            data-testid="edit-profile-btn"
            onClick={() => setShowEditProfile(true)}
            className="w-full mt-6 btn-secondary flex items-center justify-center gap-2"
          >
            <Edit2 className="w-4 h-4" />
            Edit Profile
          </button>
        </motion.div>

        {/* Preferences */}
        {(user.favorite_genres?.length > 0 || user.favorite_vibes?.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#121212] rounded-2xl p-6 border border-[#262626]"
          >
            <h3 className="text-sm font-mono uppercase tracking-wider text-gray-500 mb-4">
              Your Preferences
            </h3>

            {user.favorite_genres?.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2 text-sm text-gray-400">
                  <Music className="w-4 h-4" />
                  <span>Favorite Genres</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {user.favorite_genres.map((genre) => (
                    <span key={genre} className="tag active">
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {user.favorite_vibes?.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2 text-sm text-gray-400">
                  <Sparkles className="w-4 h-4" />
                  <span>Favorite Vibes</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {user.favorite_vibes.map((vibe) => (
                    <span key={vibe} className="tag active">
                      {vibe}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-2"
        >
          <button
            data-testid="notifications-btn"
            className="w-full flex items-center justify-between p-4 bg-[#121212] rounded-xl border border-[#262626] hover:border-[#00F0FF]/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center">
                <Bell className="w-5 h-5 text-[#00F0FF]" />
              </div>
              <div className="text-left">
                <p className="font-semibold">Notifications</p>
                <p className="text-sm text-gray-500">
                  {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <span className="w-6 h-6 rounded-full bg-[#FF0055] flex items-center justify-center text-xs font-bold">
                {unreadCount}
              </span>
            )}
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>

          <button
            onClick={() => navigate("/events")}
            className="w-full flex items-center justify-between p-4 bg-[#121212] rounded-xl border border-[#262626] hover:border-[#00F0FF]/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center">
                <Calendar className="w-5 h-5 text-[#CCFF00]" />
              </div>
              <div className="text-left">
                <p className="font-semibold">Browse Events</p>
                <p className="text-sm text-gray-500">Find what's happening</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </motion.div>

        {/* Logout Button (Mobile) */}
        <button
          onClick={handleLogout}
          className="w-full btn-ghost text-[#FF0055] py-4"
        >
          Sign Out
        </button>
      </main>

      {/* Edit Profile Dialog */}
      <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
        <DialogContent className="bg-[#121212] border-[#262626] max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit Profile</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 pt-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-mono uppercase tracking-wider text-gray-500 mb-2">
                Username
              </label>
              <input
                data-testid="edit-username-input"
                type="text"
                value={editData.username}
                onChange={(e) => setEditData(prev => ({ ...prev, username: e.target.value }))}
                className="input-dark"
              />
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-mono uppercase tracking-wider text-gray-500 mb-2">
                Home City
              </label>
              <div className="grid grid-cols-3 gap-2">
                {cityOptions.map((city) => (
                  <button
                    key={city.id}
                    onClick={() => setEditData(prev => ({ ...prev, city: city.id }))}
                    className={`p-3 rounded-xl text-center transition-all ${
                      editData.city === city.id
                        ? 'bg-[#00F0FF] text-black'
                        : 'bg-[#1A1A1A] text-gray-300 hover:bg-[#262626]'
                    }`}
                  >
                    <span className="text-xl block mb-1">{city.flag}</span>
                    <span className="text-xs font-semibold">{city.name.split(" ")[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-mono uppercase tracking-wider text-gray-500 mb-2">
                Bio
              </label>
              <textarea
                data-testid="edit-bio-input"
                value={editData.bio}
                onChange={(e) => setEditData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell us about yourself..."
                className="input-dark h-24 resize-none"
              />
            </div>

            {/* Favorite Genres */}
            <div>
              <label className="block text-sm font-mono uppercase tracking-wider text-gray-500 mb-2">
                Favorite Genres
              </label>
              <div className="flex flex-wrap gap-2">
                {genres.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => toggleGenre(genre)}
                    className={`tag ${editData.favorite_genres.includes(genre) ? 'active' : ''}`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            {/* Favorite Vibes */}
            <div>
              <label className="block text-sm font-mono uppercase tracking-wider text-gray-500 mb-2">
                Favorite Vibes
              </label>
              <div className="flex flex-wrap gap-2">
                {vibes.map((vibe) => (
                  <button
                    key={vibe}
                    onClick={() => toggleVibe(vibe)}
                    className={`tag ${editData.favorite_vibes.includes(vibe) ? 'active' : ''}`}
                  >
                    {vibe}
                  </button>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <button
              data-testid="save-profile-btn"
              onClick={handleSaveProfile}
              disabled={saving}
              className="w-full btn-primary disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Navigation />
    </div>
  );
}
