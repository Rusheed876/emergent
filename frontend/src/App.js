import { useEffect, useState, createContext, useContext } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";

// Pages
import Landing from "@/pages/Landing";
import Events from "@/pages/Events";
import CityFeed from "@/pages/CityFeed";
import Chat from "@/pages/Chat";
import Profile from "@/pages/Profile";
import Auth from "@/pages/Auth";
import EventDetail from "@/pages/EventDetail";
import Subscriptions from "@/pages/Subscriptions";
import BoostEvent from "@/pages/BoostEvent";

// Context
const AuthContext = createContext(null);
const CityContext = createContext(null);

export const useAuth = () => useContext(AuthContext);
export const useCity = () => useContext(CityContext);

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Axios interceptor for auth
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("pulse_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState(() => {
    return localStorage.getItem("pulse_city") || null;
  });

  useEffect(() => {
    // Check for existing auth
    const token = localStorage.getItem("pulse_token");
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
    
    // Seed data on first load
    seedData();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem("pulse_token");
    } finally {
      setLoading(false);
    }
  };

  const seedData = async () => {
    try {
      await axios.post(`${API}/seed`);
    } catch (error) {
      // Ignore seed errors
    }
  };

  const login = (token, userData) => {
    localStorage.setItem("pulse_token", token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("pulse_token");
    setUser(null);
  };

  const selectCity = (city) => {
    setSelectedCity(city);
    localStorage.setItem("pulse_city", city);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#00F0FF] animate-pulse">PULSE</h1>
          <p className="text-gray-500 mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, fetchUser }}>
      <CityContext.Provider value={{ selectedCity, selectCity }}>
        <div className="noise">
          <BrowserRouter>
            <Routes>
              {/* Landing - City Selection */}
              <Route 
                path="/" 
                element={selectedCity ? <Navigate to="/events" replace /> : <Landing />} 
              />
              
              {/* Main App Routes */}
              <Route path="/events" element={<Events />} />
              <Route path="/events/:eventId" element={<EventDetail />} />
              <Route path="/feed" element={<CityFeed />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/auth" element={<Auth />} />
              
              {/* Catch all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
          <Toaster 
            position="top-center" 
            toastOptions={{
              style: {
                background: '#121212',
                border: '1px solid #262626',
                color: '#EDEDED',
              },
            }}
          />
        </div>
      </CityContext.Provider>
    </AuthContext.Provider>
  );
}

export default App;
