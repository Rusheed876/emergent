# PULSE OF THE CITY
## Product Overview & Feature Documentation
---

### 📍 Executive Summary

**Pulse of the City** is a real-time nightlife discovery and social engagement platform designed for the Caribbean diaspora and nightlife enthusiasts. The app serves as the go-to digital hub for discovering what's happening now in Kingston (Jamaica), Miami (USA), and New York City (USA).

**Live URL:** https://citybeat-4.preview.emergentagent.com

---

## 🎯 Core Features

### 1. City Selection (Landing Page)
- Immersive city cards for Kingston, Miami, and NYC
- Each city displays country flag, tagline, and vibe description
- Smooth hover animations with "Enter" call-to-action
- City selection persists across sessions

### 2. What's Happening Now (Events)
Real-time event discovery with powerful filtering:

| Filter Type | Options |
|-------------|---------|
| **Time** | All Events, Tonight, This Weekend |
| **Genre** | Dancehall, Hip-Hop, R&B, Soca, Afrobeat, EDM, Reggae, Latin |
| **Vibe** | Lit, Chill, Upscale, Street, Underground, Rooftop |

**Event Cards Display:**
- Featured badge for promoted events
- Attendee count
- Venue name & location
- Date & time
- Price information
- Genre/vibe tags

### 3. Event Details
- Full event description
- Venue information with address
- Date, time, and pricing
- "I'm Going" attendance button
- Share functionality
- Ticket link (when available)

### 4. City Feed (Social)
Instagram Stories meets Twitter for nightlife:

| Post Type | Description |
|-----------|-------------|
| **Updates** | General nightlife updates |
| **Flyers** | Event promotional images |
| **Announcements** | Official promoter posts |
| **Vibe Checks** | Real-time crowd reports |

**Features:**
- Like posts
- Create new posts (authenticated users)
- Verified user badges
- Timestamp display

### 5. Live City Chat Rooms
Real-time WebSocket-powered chat for each city:

- **Pulse: Kingston** - Jamaica nightlife discussion
- **Pulse: Miami** - Magic City vibes
- **Pulse: NYC** - Never sleeps conversation

**Features:**
- Live connection indicator
- Online user count
- Message timestamps
- User avatars
- Instant message delivery

### 6. User Profiles
Personalized user experience:

- Username & email display
- City affiliation
- Bio section
- Favorite genres selection
- Favorite vibes selection
- Verified/Promoter badges
- Profile editing

### 7. Authentication
Secure JWT-based authentication:

- Email/password registration
- Login with session persistence
- City selection during signup
- Profile management

---

## 🎨 Design System

### Color Palette
| Color | Hex | Usage |
|-------|-----|-------|
| Background | #050505 | Primary dark background |
| Primary (Cyan) | #00F0FF | CTAs, highlights, active states |
| Secondary (Pink) | #FF0055 | Accents, badges, alerts |
| Accent (Lime) | #CCFF00 | Featured items, prices |
| Card | #121212 | Card backgrounds |
| Muted | #1A1A1A | Input fields, secondary elements |

### Typography
- **Headings:** Unbounded (Black/ExtraBold)
- **Body:** Manrope (Regular/SemiBold)
- **Mono:** JetBrains Mono (labels, timestamps)

### UI Components
- Glass-morphism headers with backdrop blur
- Neon glow effects on hover
- Pill-shaped buttons
- Rounded cards with subtle borders
- Bottom navigation bar
- Floating action buttons

---

## 🛠 Technical Architecture

### Frontend Stack
```
React 19 + React Router
Tailwind CSS + Custom CSS
Framer Motion (animations)
Axios (API calls)
WebSocket (real-time chat)
Shadcn/UI components
```

### Backend Stack
```
FastAPI (Python)
MongoDB (database)
Motor (async MongoDB driver)
JWT (authentication)
WebSocket (chat)
Pydantic (data validation)
```

### API Structure
```
/api/auth/*        - Authentication endpoints
/api/events/*      - Event management
/api/feed/*        - City feed posts
/api/chat/*        - Chat messages
/api/venues/*      - Venue management
/api/notifications - User notifications
/ws/chat/{city}    - WebSocket chat
```

---

## 📱 Page Structure

```
/                  → Landing (City Selection)
/events            → Events Feed
/events/:id        → Event Details
/feed              → City Social Feed
/chat              → Live Chat Room
/profile           → User Profile
/auth              → Login/Register
```

---

## 📊 Database Collections

| Collection | Purpose |
|------------|---------|
| `users` | User accounts & preferences |
| `events` | Nightlife events |
| `venues` | Venue profiles |
| `feed_posts` | City feed content |
| `chat_messages` | Chat history |
| `notifications` | User notifications |

---

## 🚀 Seeded Demo Data

The app comes pre-loaded with:
- **6 Events** across all three cities
- **3 Venues** (Fiction Kingston, E11even Miami, Marquee NYC)
- **3 Feed Posts** from official city accounts
- Various genres: Dancehall, Hip-Hop, R&B, Soca, Afrobeat, Reggae

---

## 📈 Success Metrics (KPIs)

| Metric | Target |
|--------|--------|
| Daily Active Users | Track city engagement |
| Events Posted | Promoter adoption |
| Chat Messages | Community activity |
| Event Attendance | Conversion rate |
| Time in App | User engagement |

---

## 🔮 Roadmap (Future Features)

### Phase 2
- [ ] Image uploads for posts/events
- [ ] Browser push notifications
- [ ] Event search functionality
- [ ] Promoter verification system

### Phase 3
- [ ] Stripe ticket integration
- [ ] Venue check-ins
- [ ] User following system
- [ ] Event reviews/ratings

### Phase 4
- [ ] Multi-city expansion
- [ ] Brand partnerships
- [ ] Premium features
- [ ] Analytics dashboard

---

## 👥 Team Access

**Live App:** https://citybeat-4.preview.emergentagent.com

**Test Credentials:** Create a new account via the Register page

**API Documentation:** Available at `/api/docs` (FastAPI Swagger)

---

*Document Generated: January 2026*
*Version: 1.0.0 MVP*
