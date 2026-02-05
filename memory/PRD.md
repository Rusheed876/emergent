# Pulse of the City - Product Requirements Document

## Project Overview
**Name:** Pulse of the City  
**Version:** 1.0.0 MVP  
**Last Updated:** January 2026  
**Status:** MVP Complete

## Original Problem Statement
Pulse of the City is a real-time nightlife discovery and social engagement app designed to show what's happening now in major cities across the Caribbean and the diaspora. Launching with Kingston (Jamaica), Miami (USA), and New York City (USA), the platform becomes the go-to digital hub for nightlife culture—blending event discovery, live city feeds, and interactive chat communities.

## User Personas

### Primary Users
1. **Nightlife Enthusiasts (21-35)** - Looking for the hottest events, want real-time updates
2. **Tourists/Visitors** - Need quick discovery of what's happening in a new city
3. **Caribbean Diaspora** - Want to stay connected to cultural events in multiple cities
4. **Event Promoters** - Need platform to share events and build audiences

### Secondary Users
- Venue Owners
- DJs/Artists
- Brand Sponsors

## Core Requirements (Static)

### Must-Have Features
- [x] City Selection (Kingston, Miami, NYC)
- [x] Real-time Event Feed with filters
- [x] City-based Social Feed
- [x] Live Chat Rooms per city
- [x] User Authentication (JWT)
- [x] User Profiles with preferences
- [x] Event Details with attendance tracking
- [x] Dark mode with neon aesthetic

### Technical Stack
- **Frontend:** React 19, Tailwind CSS, Framer Motion
- **Backend:** FastAPI, MongoDB
- **Real-time:** WebSocket
- **Authentication:** JWT with bcrypt

## What's Been Implemented

### January 2026 - MVP Launch

#### Backend
- Full REST API with /api prefix
- JWT Authentication (register/login)
- Events CRUD with filters (city, genre, vibe, date)
- City Feed posts with likes
- WebSocket chat per city
- Venues management
- Notifications system
- Seed data endpoint

#### Frontend
- Landing page with city cards
- Events page with filters
- Event detail page with attend functionality
- City Feed with post creation
- Real-time Chat rooms
- User Profile with preferences
- Auth pages (login/register)
- Bottom navigation
- Dark mode design with neon accents

## Prioritized Backlog

### P0 - Critical (Next Sprint)
- [ ] Image upload for posts/events
- [ ] Push notifications (browser)
- [ ] Event search functionality

### P1 - High Priority
- [ ] Venue profiles with verified badges
- [ ] Promoter dashboard
- [ ] Event bookmarking/saving
- [ ] Social sharing with deep links

### P2 - Medium Priority
- [ ] User following system
- [ ] Event comments/reviews
- [ ] Location-based recommendations
- [ ] Calendar integration

### P3 - Nice to Have
- [ ] Ticketing integration
- [ ] Venue check-ins
- [ ] Loyalty rewards
- [ ] Multi-language support

## Architecture

```
/app
├── backend/
│   ├── server.py          # FastAPI main app
│   ├── requirements.txt   # Python dependencies
│   └── .env              # Environment variables
├── frontend/
│   ├── src/
│   │   ├── App.js        # Main app with context
│   │   ├── pages/        # Route pages
│   │   │   ├── Landing.jsx
│   │   │   ├── Events.jsx
│   │   │   ├── EventDetail.jsx
│   │   │   ├── CityFeed.jsx
│   │   │   ├── Chat.jsx
│   │   │   ├── Profile.jsx
│   │   │   └── Auth.jsx
│   │   └── components/
│   │       └── Navigation.jsx
│   └── package.json
└── memory/
    └── PRD.md
```

## API Endpoints

### Auth
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- PUT /api/auth/me

### Events
- GET /api/events
- GET /api/events/:id
- POST /api/events
- POST /api/events/:id/attend

### Feed
- GET /api/feed/:city
- POST /api/feed
- POST /api/feed/:id/like

### Chat
- GET /api/chat/:city/messages
- POST /api/chat/:city/message
- WS /ws/chat/:city

### Venues
- GET /api/venues
- GET /api/venues/:id
- POST /api/venues

### Utilities
- GET /api/cities
- GET /api/genres
- GET /api/vibes
- POST /api/seed

## Next Action Items
1. Add image upload functionality
2. Implement browser push notifications
3. Build promoter verification system
4. Add event search
5. Consider Stripe integration for ticket sales
