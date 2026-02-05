import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, useCity, API } from "@/App";
import axios from "axios";
import { motion } from "framer-motion";
import { 
  Mail, 
  Lock, 
  User, 
  ArrowLeft, 
  Eye, 
  EyeOff,
  Zap,
  MapPin
} from "lucide-react";
import { toast } from "sonner";

const cities = [
  { id: "kingston", name: "Kingston", flag: "🇯🇲" },
  { id: "miami", name: "Miami", flag: "🇺🇸" },
  { id: "nyc", name: "NYC", flag: "🇺🇸" }
];

export default function Auth() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { selectedCity, selectCity } = useCity();
  const [mode, setMode] = useState("login"); // login or register
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
    city: selectedCity || "miami"
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "login") {
        const response = await axios.post(`${API}/auth/login`, {
          email: formData.email,
          password: formData.password
        });
        login(response.data.token, response.data.user);
        toast.success("Welcome back!");
        navigate(selectedCity ? "/events" : "/");
      } else {
        const response = await axios.post(`${API}/auth/register`, formData);
        login(response.data.token, response.data.user);
        selectCity(formData.city);
        toast.success("Account created!");
        navigate("/events");
      }
    } catch (error) {
      const message = error.response?.data?.detail || "Something went wrong";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col">
      {/* Header */}
      <header className="p-4">
        <button
          data-testid="auth-back-btn"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Zap className="w-8 h-8 text-[#00F0FF]" />
              <span className="text-2xl font-black tracking-wider">PULSE</span>
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight mb-2">
              {mode === "login" ? "Welcome Back" : "Join the Pulse"}
            </h1>
            <p className="text-gray-500">
              {mode === "login" 
                ? "Sign in to continue" 
                : "Create an account to get started"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username (Register only) */}
            {mode === "register" && (
              <div>
                <label className="block text-sm font-mono uppercase tracking-wider text-gray-500 mb-2">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    data-testid="register-username-input"
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="Choose a username"
                    required
                    className="w-full bg-[#1A1A1A] border border-[#262626] rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-gray-600 focus:border-[#00F0FF] focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-mono uppercase tracking-wider text-gray-500 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  data-testid="auth-email-input"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="your@email.com"
                  required
                  className="w-full bg-[#1A1A1A] border border-[#262626] rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-gray-600 focus:border-[#00F0FF] focus:outline-none"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-mono uppercase tracking-wider text-gray-500 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  data-testid="auth-password-input"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full bg-[#1A1A1A] border border-[#262626] rounded-xl pl-12 pr-12 py-3 text-white placeholder:text-gray-600 focus:border-[#00F0FF] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* City (Register only) */}
            {mode === "register" && (
              <div>
                <label className="block text-sm font-mono uppercase tracking-wider text-gray-500 mb-2">
                  Home City
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {cities.map((city) => (
                    <button
                      key={city.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, city: city.id }))}
                      className={`p-3 rounded-xl text-center transition-all ${
                        formData.city === city.id
                          ? 'bg-[#00F0FF] text-black'
                          : 'bg-[#1A1A1A] text-gray-300 hover:bg-[#262626]'
                      }`}
                    >
                      <span className="text-xl block mb-1">{city.flag}</span>
                      <span className="text-xs font-semibold">{city.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              data-testid="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full btn-primary mt-6 disabled:opacity-50"
            >
              {loading 
                ? "Loading..." 
                : mode === "login" 
                  ? "Sign In" 
                  : "Create Account"}
            </button>
          </form>

          {/* Toggle Mode */}
          <div className="text-center mt-6">
            <p className="text-gray-500">
              {mode === "login" ? "Don't have an account?" : "Already have an account?"}
            </p>
            <button
              data-testid="toggle-auth-mode-btn"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="text-[#00F0FF] font-semibold hover:underline mt-1"
            >
              {mode === "login" ? "Create one" : "Sign in"}
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
