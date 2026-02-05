import { NavLink, useLocation } from "react-router-dom";
import { 
  Flame, 
  Newspaper, 
  MessageCircle, 
  User 
} from "lucide-react";

const navItems = [
  { path: "/events", icon: Flame, label: "Events" },
  { path: "/feed", icon: Newspaper, label: "Feed" },
  { path: "/chat", icon: MessageCircle, label: "Chat" },
  { path: "/profile", icon: User, label: "Profile" }
];

export const Navigation = () => {
  const location = useLocation();

  return (
    <nav className="bottom-nav" data-testid="main-navigation">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path || 
          (item.path === "/events" && location.pathname.startsWith("/events/"));
        
        return (
          <NavLink
            key={item.path}
            to={item.path}
            data-testid={`nav-${item.label.toLowerCase()}`}
            className={`flex flex-col items-center justify-center gap-1 px-4 py-2 transition-colors ${
              isActive ? 'text-[#00F0FF]' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <item.icon className={`w-5 h-5 ${isActive ? 'fill-current' : ''}`} />
            <span className="text-xs font-semibold uppercase tracking-wider">
              {item.label}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
};

export default Navigation;
