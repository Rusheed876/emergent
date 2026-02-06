import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, API } from "@/App";
import axios from "axios";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Check, 
  Zap, 
  Star, 
  Crown,
  Rocket,
  Bell,
  BarChart3,
  BadgeCheck,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";

export default function Subscriptions() {
  const navigate = useNavigate();
  const { user, fetchUser } = useAuth();
  const [subscriptions, setSubscriptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);

  useEffect(() => {
    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    try {
      const response = await axios.get(`${API}/pricing/subscriptions`);
      setSubscriptions(response.data.subscriptions);
    } catch (error) {
      console.error("Error fetching pricing:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId) => {
    if (!user) {
      toast.error("Please login first");
      navigate("/auth");
      return;
    }

    setPurchasing(planId);
    try {
      const response = await axios.post(`${API}/payments/subscription`, {
        plan_id: planId,
        origin_url: window.location.origin
      });
      
      // Redirect to Stripe checkout
      window.location.href = response.data.checkout_url;
    } catch (error) {
      toast.error("Failed to start checkout");
      setPurchasing(null);
    }
  };

  const planIcons = {
    pro: Star,
    premium: Crown
  };

  const planColors = {
    pro: "from-[#00F0FF] to-[#0080FF]",
    premium: "from-[#FF0055] to-[#FF6B00]"
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
          data-testid="subscriptions-back-btn"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
      </header>

      <main className="px-4 py-8 max-w-4xl mx-auto">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Rocket className="w-8 h-8 text-[#CCFF00]" />
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tight mb-4">
            Become a <span className="gradient-text">Promoter</span>
          </h1>
          <p className="text-gray-400 max-w-md mx-auto">
            Get verified, unlock analytics, and boost your events to reach more people.
          </p>
        </motion.div>

        {/* Current Status */}
        {user?.is_promoter && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-[#121212] rounded-xl border border-[#CCFF00]/30"
          >
            <div className="flex items-center gap-3">
              <BadgeCheck className="w-6 h-6 text-[#CCFF00]" />
              <div>
                <p className="font-semibold text-[#CCFF00]">Active Subscription</p>
                <p className="text-sm text-gray-400">
                  You're on the {user.subscription_plan?.toUpperCase() || "PRO"} plan
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(subscriptions).map(([planId, plan], index) => {
            const Icon = planIcons[planId] || Star;
            const gradientClass = planColors[planId] || "from-gray-500 to-gray-700";
            const isCurrentPlan = user?.subscription_plan === planId;
            
            return (
              <motion.div
                key={planId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative bg-[#121212] rounded-2xl border overflow-hidden ${
                  planId === "premium" ? "border-[#FF0055]/50" : "border-[#262626]"
                }`}
              >
                {/* Popular Badge */}
                {planId === "premium" && (
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 rounded-full bg-[#FF0055] text-white text-xs font-bold uppercase">
                      Popular
                    </span>
                  </div>
                )}

                {/* Header */}
                <div className={`p-6 bg-gradient-to-r ${gradientClass}`}>
                  <Icon className="w-10 h-10 text-white mb-3" />
                  <h2 className="text-2xl font-black text-white uppercase">
                    {plan.name}
                  </h2>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-4xl font-black text-white">
                      ${plan.price}
                    </span>
                    <span className="text-white/70">/month</span>
                  </div>
                </div>

                {/* Features */}
                <div className="p-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-[#CCFF00] flex-shrink-0" />
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <button
                    data-testid={`subscribe-${planId}-btn`}
                    onClick={() => handleSubscribe(planId)}
                    disabled={purchasing || isCurrentPlan}
                    className={`w-full mt-6 py-3 rounded-full font-bold uppercase tracking-wider transition-all ${
                      isCurrentPlan
                        ? "bg-[#1A1A1A] text-gray-500 cursor-not-allowed"
                        : planId === "premium"
                          ? "bg-[#FF0055] text-white hover:shadow-[0_0_25px_rgba(255,0,85,0.5)]"
                          : "bg-[#00F0FF] text-black hover:shadow-[0_0_25px_rgba(0,240,255,0.5)]"
                    }`}
                  >
                    {purchasing === planId 
                      ? "Processing..." 
                      : isCurrentPlan 
                        ? "Current Plan" 
                        : "Get Started"}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-16"
        >
          <h3 className="text-xl font-bold text-center mb-8">
            Why Go <span className="text-[#00F0FF]">Pro</span>?
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-[#121212] rounded-xl border border-[#262626]">
              <BadgeCheck className="w-8 h-8 text-[#00F0FF] mb-3" />
              <h4 className="font-bold mb-2">Verified Badge</h4>
              <p className="text-sm text-gray-400">
                Stand out with a verified checkmark that builds trust.
              </p>
            </div>
            
            <div className="p-6 bg-[#121212] rounded-xl border border-[#262626]">
              <BarChart3 className="w-8 h-8 text-[#CCFF00] mb-3" />
              <h4 className="font-bold mb-2">Analytics Dashboard</h4>
              <p className="text-sm text-gray-400">
                See who's viewing your events and track attendance.
              </p>
            </div>
            
            <div className="p-6 bg-[#121212] rounded-xl border border-[#262626]">
              <Bell className="w-8 h-8 text-[#FF0055] mb-3" />
              <h4 className="font-bold mb-2">Push Notifications</h4>
              <p className="text-sm text-gray-400">
                Reach your audience directly when you post new events.
              </p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
