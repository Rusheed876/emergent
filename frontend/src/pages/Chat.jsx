import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCity, useAuth, API } from "@/App";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, 
  Users, 
  Wifi,
  WifiOff,
  ChevronDown,
  CheckCircle
} from "lucide-react";
import Navigation from "@/components/Navigation";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

const cityNames = {
  kingston: "Kingston",
  miami: "Miami",
  nyc: "NYC"
};

export default function Chat() {
  const navigate = useNavigate();
  const { selectedCity, selectCity } = useCity();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!selectedCity) {
      navigate("/");
      return;
    }
    
    fetchMessages();
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [selectedCity]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/chat/${selectedCity}/messages`);
      setMessages(response.data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const connectWebSocket = () => {
    const wsUrl = process.env.REACT_APP_BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://');
    const ws = new WebSocket(`${wsUrl}/ws/chat/${selectedCity}`);

    ws.onopen = () => {
      setConnected(true);
      // Random online count for demo
      setOnlineCount(Math.floor(Math.random() * 50) + 10);
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setMessages(prev => [...prev, message]);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setConnected(false);
    };

    ws.onclose = () => {
      setConnected(false);
      // Try to reconnect after 3 seconds
      setTimeout(() => {
        if (selectedCity) {
          connectWebSocket();
        }
      }, 3000);
    };

    wsRef.current = ws;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    if (!user) {
      toast.error("Please login to chat");
      navigate("/auth");
      return;
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        user_id: user.id,
        username: user.username,
        user_avatar: user.avatar_url,
        content: newMessage.trim()
      }));
      setNewMessage("");
      inputRef.current?.focus();
    } else {
      toast.error("Connection lost. Reconnecting...");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const handleCityChange = (newCity) => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    selectCity(newCity);
  };

  return (
    <div className="h-screen bg-[#050505] flex flex-col">
      {/* Header */}
      <header className="glass flex-shrink-0 z-40">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-[#CCFF00] mb-1">
                Live Chat
              </p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button 
                    data-testid="chat-city-selector"
                    className="flex items-center gap-2 text-2xl font-black uppercase tracking-tight"
                  >
                    Pulse: {cityNames[selectedCity]}
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-[#121212] border-[#262626]">
                  {Object.entries(cityNames).map(([id, name]) => (
                    <DropdownMenuItem
                      key={id}
                      onClick={() => handleCityChange(id)}
                      className={`text-white hover:bg-[#1A1A1A] cursor-pointer ${selectedCity === id ? 'text-[#CCFF00]' : ''}`}
                    >
                      Pulse: {name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center gap-3">
              {/* Online Count */}
              <div className="flex items-center gap-1.5 text-sm text-gray-400">
                <Users className="w-4 h-4" />
                <span>{onlineCount}</span>
              </div>
              
              {/* Connection Status */}
              <div className={`flex items-center gap-1.5 text-sm ${connected ? 'text-[#CCFF00]' : 'text-[#FF0055]'}`}>
                {connected ? (
                  <>
                    <Wifi className="w-4 h-4" />
                    <span className="hidden sm:inline">Live</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4" />
                    <span className="hidden sm:inline">Offline</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton h-16 rounded-xl" />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <div className="w-16 h-16 rounded-full bg-[#1A1A1A] flex items-center justify-center mb-4">
              <Send className="w-6 h-6 text-gray-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">Start the Conversation</h3>
            <p className="text-gray-500 max-w-xs">
              Be the first to drop a message in Pulse: {cityNames[selectedCity]}
            </p>
          </div>
        ) : (
          <div className="space-y-3 pb-4">
            <AnimatePresence initial={false}>
              {messages.map((msg, index) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChatMessage 
                    message={msg} 
                    isOwn={user?.id === msg.user_id}
                    formatTime={formatTime}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <div className="flex-shrink-0 glass border-t border-[#262626]">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <input
              ref={inputRef}
              data-testid="chat-input"
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={user ? "What's good tonight?" : "Login to chat"}
              disabled={!user}
              className="flex-1 bg-[#1A1A1A] border border-[#262626] rounded-full px-5 py-3 text-white placeholder:text-gray-600 focus:border-[#CCFF00] focus:outline-none disabled:opacity-50"
            />
            <button
              data-testid="send-message-btn"
              onClick={sendMessage}
              disabled={!newMessage.trim() || !user}
              className="w-12 h-12 rounded-full bg-[#CCFF00] text-black flex items-center justify-center hover:bg-[#b8e600] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          
          {!user && (
            <p className="text-center text-sm text-gray-500 mt-2">
              <button 
                onClick={() => navigate("/auth")}
                className="text-[#00F0FF] hover:underline"
              >
                Login
              </button>
              {" "}to join the conversation
            </p>
          )}
        </div>
        
        {/* Safe area for navigation */}
        <div className="h-16" />
      </div>

      <Navigation />
    </div>
  );
}

function ChatMessage({ message, isOwn, formatTime }) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`} data-testid={`chat-message-${message.id}`}>
      <div className={`flex gap-2 max-w-[85%] ${isOwn ? 'flex-row-reverse' : ''}`}>
        {/* Avatar */}
        {!isOwn && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00F0FF] to-[#FF0055] flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-white">
              {message.username.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* Bubble */}
        <div className={`${isOwn ? 'chat-bubble own' : 'chat-bubble'} px-4 py-2.5`}>
          {!isOwn && (
            <div className="flex items-center gap-1.5 mb-1">
              <span className={`text-xs font-semibold ${isOwn ? 'text-black/70' : 'text-[#00F0FF]'}`}>
                {message.username}
              </span>
            </div>
          )}
          <p className={`text-sm ${isOwn ? 'text-black' : 'text-white'}`}>
            {message.content}
          </p>
          <span className={`text-xs mt-1 block ${isOwn ? 'text-black/50' : 'text-gray-500'}`}>
            {formatTime(message.created_at)}
          </span>
        </div>
      </div>
    </div>
  );
}
