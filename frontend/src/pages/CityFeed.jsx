import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCity, useAuth, API } from "@/App";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Image as ImageIcon,
  Send,
  CheckCircle,
  MoreHorizontal,
  X
} from "lucide-react";
import Navigation from "@/components/Navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const cityNames = {
  kingston: "Kingston",
  miami: "Miami",
  nyc: "NYC"
};

const postTypes = [
  { id: "all", label: "All" },
  { id: "update", label: "Updates" },
  { id: "flyer", label: "Flyers" },
  { id: "announcement", label: "Announcements" },
  { id: "vibe_check", label: "Vibe Checks" }
];

export default function CityFeed() {
  const navigate = useNavigate();
  const { selectedCity } = useCity();
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState("all");
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostType, setNewPostType] = useState("update");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!selectedCity) {
      navigate("/");
      return;
    }
    fetchPosts();
  }, [selectedCity]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/feed/${selectedCity}`);
      setPosts(response.data);
    } catch (error) {
      console.error("Error fetching feed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      await axios.post(`${API}/feed/${postId}/like`);
      setPosts(posts.map(p => 
        p.id === postId ? { ...p, likes: p.likes + 1 } : p
      ));
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleSubmitPost = async () => {
    if (!user) {
      toast.error("Please login to post");
      navigate("/auth");
      return;
    }

    if (!newPostContent.trim()) {
      toast.error("Please enter some content");
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.post(`${API}/feed`, {
        content: newPostContent,
        city: selectedCity,
        post_type: newPostType
      });
      setPosts([response.data, ...posts]);
      setNewPostContent("");
      setShowNewPost(false);
      toast.success("Posted!");
    } catch (error) {
      toast.error("Failed to post");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  const filteredPosts = selectedType === "all" 
    ? posts 
    : posts.filter(p => p.post_type === selectedType);

  return (
    <div className="min-h-screen bg-[#050505] pb-safe">
      {/* Header */}
      <header className="sticky top-0 z-40 glass">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-[#FF0055] mb-1">
                City Feed
              </p>
              <h1 className="text-2xl font-black uppercase tracking-tight">
                Pulse: {cityNames[selectedCity]}
              </h1>
            </div>
          </div>

          {/* Post Type Tabs */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            {postTypes.map((type) => (
              <button
                key={type.id}
                data-testid={`feed-filter-${type.id}`}
                onClick={() => setSelectedType(type.id)}
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                  selectedType === type.id
                    ? 'bg-[#FF0055] text-white'
                    : 'bg-[#1A1A1A] text-gray-300 hover:bg-[#262626]'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Feed */}
      <main className="px-4 py-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-32 rounded-xl" />
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="empty-state py-20">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <h3 className="text-xl font-bold mb-2">No Posts Yet</h3>
            <p className="text-gray-500">Be the first to share what's happening</p>
          </div>
        ) : (
          <div className="space-y-0">
            {filteredPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <FeedPost 
                  post={post} 
                  onLike={() => handleLike(post.id)} 
                  formatTime={formatTime}
                />
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* New Post FAB */}
      <button
        data-testid="new-post-fab"
        onClick={() => setShowNewPost(true)}
        className="fab"
      >
        <Send className="w-5 h-5" />
      </button>

      {/* New Post Dialog */}
      <Dialog open={showNewPost} onOpenChange={setShowNewPost}>
        <DialogContent className="bg-[#121212] border-[#262626] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Share What's Happening</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            {/* Post Type Selection */}
            <div className="flex flex-wrap gap-2">
              {postTypes.filter(t => t.id !== "all").map((type) => (
                <button
                  key={type.id}
                  onClick={() => setNewPostType(type.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    newPostType === type.id
                      ? 'bg-[#FF0055] text-white'
                      : 'bg-[#1A1A1A] text-gray-400 hover:bg-[#262626]'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            {/* Content Input */}
            <textarea
              data-testid="new-post-content"
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="What's good tonight?"
              className="w-full h-32 bg-[#1A1A1A] border border-[#262626] rounded-xl p-4 text-white placeholder:text-gray-600 resize-none focus:border-[#FF0055] focus:outline-none"
            />

            {/* Submit Button */}
            <button
              data-testid="submit-post-btn"
              onClick={handleSubmitPost}
              disabled={submitting || !newPostContent.trim()}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Posting..." : "Post to Feed"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Navigation />
    </div>
  );
}

function FeedPost({ post, onLike, formatTime }) {
  const [liked, setLiked] = useState(false);

  const handleLike = () => {
    if (!liked) {
      setLiked(true);
      onLike();
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "announcement": return "text-[#CCFF00]";
      case "flyer": return "text-[#FF0055]";
      case "vibe_check": return "text-[#00F0FF]";
      default: return "text-gray-500";
    }
  };

  return (
    <div className="feed-post" data-testid={`feed-post-${post.id}`}>
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00F0FF] to-[#FF0055] flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-white">
            {post.username.charAt(0).toUpperCase()}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-white">{post.username}</span>
            {post.is_verified && (
              <CheckCircle className="w-4 h-4 text-[#00F0FF]" />
            )}
            <span className={`text-xs font-mono uppercase ${getTypeColor(post.post_type)}`}>
              {post.post_type.replace("_", " ")}
            </span>
            <span className="text-gray-600 text-sm">·</span>
            <span className="text-gray-600 text-sm">{formatTime(post.created_at)}</span>
          </div>

          {/* Text */}
          <p className="text-gray-200 whitespace-pre-wrap mb-3">
            {post.content}
          </p>

          {/* Image */}
          {post.image_url && (
            <div className="mb-3 rounded-xl overflow-hidden">
              <img 
                src={post.image_url} 
                alt="" 
                className="w-full aspect-video object-cover"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-6">
            <button
              data-testid={`like-post-${post.id}`}
              onClick={handleLike}
              className={`flex items-center gap-1.5 text-sm transition-colors ${
                liked ? 'text-[#FF0055]' : 'text-gray-500 hover:text-[#FF0055]'
              }`}
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
              <span>{post.likes + (liked ? 1 : 0)}</span>
            </button>

            <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#00F0FF] transition-colors">
              <MessageCircle className="w-4 h-4" />
              <span>Reply</span>
            </button>

            <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#CCFF00] transition-colors">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
