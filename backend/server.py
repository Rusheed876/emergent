from fastapi import FastAPI, APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
SECRET_KEY = os.environ.get('JWT_SECRET', 'pulse-of-the-city-secret-key-2024')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

app = FastAPI(title="Pulse of the City API")
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============== MODELS ==============

# Cities
CITIES = ["kingston", "miami", "nyc"]
GENRES = ["dancehall", "hiphop", "rnb", "soca", "afrobeat", "edm", "reggae", "latin"]
VIBES = ["chill", "lit", "upscale", "street", "underground", "rooftop"]

# User Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    username: str
    city: str = "miami"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserProfile(BaseModel):
    id: str
    email: str
    username: str
    city: str
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    favorite_genres: List[str] = []
    favorite_vibes: List[str] = []
    is_verified: bool = False
    is_promoter: bool = False
    created_at: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    city: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    favorite_genres: Optional[List[str]] = None
    favorite_vibes: Optional[List[str]] = None

# Event Models
class EventCreate(BaseModel):
    title: str
    description: str
    city: str
    venue_name: str
    venue_address: str
    date: str
    time: str
    genre: List[str]
    vibe: str
    image_url: Optional[str] = None
    ticket_url: Optional[str] = None
    price: Optional[str] = None

class Event(BaseModel):
    id: str
    title: str
    description: str
    city: str
    venue_name: str
    venue_address: str
    date: str
    time: str
    genre: List[str]
    vibe: str
    image_url: Optional[str] = None
    ticket_url: Optional[str] = None
    price: Optional[str] = None
    promoter_id: Optional[str] = None
    promoter_name: Optional[str] = None
    is_featured: bool = False
    attendee_count: int = 0
    created_at: str

# Feed Post Models
class FeedPostCreate(BaseModel):
    content: str
    city: str
    image_url: Optional[str] = None
    event_id: Optional[str] = None
    post_type: str = "update"  # update, flyer, announcement, vibe_check

class FeedPost(BaseModel):
    id: str
    content: str
    city: str
    image_url: Optional[str] = None
    event_id: Optional[str] = None
    post_type: str
    user_id: str
    username: str
    user_avatar: Optional[str] = None
    is_verified: bool = False
    likes: int = 0
    created_at: str

# Chat Message Models
class ChatMessage(BaseModel):
    id: str
    city: str
    user_id: str
    username: str
    user_avatar: Optional[str] = None
    content: str
    created_at: str

# Venue Models
class VenueCreate(BaseModel):
    name: str
    city: str
    address: str
    description: str
    image_url: Optional[str] = None
    genres: List[str] = []
    vibes: List[str] = []
    instagram: Optional[str] = None
    website: Optional[str] = None

class Venue(BaseModel):
    id: str
    name: str
    city: str
    address: str
    description: str
    image_url: Optional[str] = None
    genres: List[str] = []
    vibes: List[str] = []
    instagram: Optional[str] = None
    website: Optional[str] = None
    is_verified: bool = False
    owner_id: Optional[str] = None
    created_at: str

# Notification Models
class Notification(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    notification_type: str  # event, chat, system
    city: Optional[str] = None
    event_id: Optional[str] = None
    is_read: bool = False
    created_at: str

# ============== AUTH HELPERS ==============

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_optional_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))):
    if credentials is None:
        return None
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id:
            return await db.users.find_one({"id": user_id}, {"_id": 0})
    except:
        pass
    return None

# ============== AUTH ROUTES ==============

@api_router.post("/auth/register")
async def register(user: UserCreate):
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    existing_username = await db.users.find_one({"username": user.username})
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    hashed_password = pwd_context.hash(user.password)
    user_id = str(uuid.uuid4())
    
    user_doc = {
        "id": user_id,
        "email": user.email,
        "username": user.username,
        "password": hashed_password,
        "city": user.city,
        "avatar_url": None,
        "bio": None,
        "favorite_genres": [],
        "favorite_vibes": [],
        "is_verified": False,
        "is_promoter": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    token = create_access_token({"sub": user_id})
    
    return {
        "token": token,
        "user": {
            "id": user_id,
            "email": user.email,
            "username": user.username,
            "city": user.city,
            "is_verified": False,
            "is_promoter": False
        }
    }

@api_router.post("/auth/login")
async def login(user: UserLogin):
    db_user = await db.users.find_one({"email": user.email})
    if not db_user or not pwd_context.verify(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": db_user["id"]})
    
    return {
        "token": token,
        "user": {
            "id": db_user["id"],
            "email": db_user["email"],
            "username": db_user["username"],
            "city": db_user["city"],
            "avatar_url": db_user.get("avatar_url"),
            "is_verified": db_user.get("is_verified", False),
            "is_promoter": db_user.get("is_promoter", False)
        }
    }

@api_router.get("/auth/me", response_model=UserProfile)
async def get_me(user = Depends(get_current_user)):
    return UserProfile(**user)

@api_router.put("/auth/me")
async def update_me(updates: UserUpdate, user = Depends(get_current_user)):
    update_dict = {k: v for k, v in updates.model_dump().items() if v is not None}
    if update_dict:
        await db.users.update_one({"id": user["id"]}, {"$set": update_dict})
    updated_user = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password": 0})
    return updated_user

# ============== EVENTS ROUTES ==============

@api_router.get("/events", response_model=List[Event])
async def get_events(
    city: Optional[str] = None,
    genre: Optional[str] = None,
    vibe: Optional[str] = None,
    date_filter: Optional[str] = None,  # tonight, weekend, all
    featured: Optional[bool] = None,
    limit: int = Query(50, le=100)
):
    query = {}
    if city:
        query["city"] = city.lower()
    if genre:
        query["genre"] = {"$in": [genre.lower()]}
    if vibe:
        query["vibe"] = vibe.lower()
    if featured:
        query["is_featured"] = True
    
    # Date filtering
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    if date_filter == "tonight":
        query["date"] = today
    elif date_filter == "weekend":
        # Get next 3 days
        dates = [(datetime.now(timezone.utc) + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(4)]
        query["date"] = {"$in": dates}
    
    events = await db.events.find(query, {"_id": 0}).sort("date", 1).limit(limit).to_list(limit)
    return events

@api_router.get("/events/{event_id}", response_model=Event)
async def get_event(event_id: str):
    event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

@api_router.post("/events", response_model=Event)
async def create_event(event: EventCreate, user = Depends(get_current_user)):
    event_id = str(uuid.uuid4())
    event_doc = {
        "id": event_id,
        **event.model_dump(),
        "city": event.city.lower(),
        "promoter_id": user["id"],
        "promoter_name": user["username"],
        "is_featured": user.get("is_promoter", False),
        "attendee_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.events.insert_one(event_doc)
    return Event(**event_doc)

@api_router.post("/events/{event_id}/attend")
async def attend_event(event_id: str, user = Depends(get_current_user)):
    event = await db.events.find_one({"id": event_id})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    await db.events.update_one({"id": event_id}, {"$inc": {"attendee_count": 1}})
    return {"message": "You're attending this event!"}

# ============== FEED ROUTES ==============

@api_router.get("/feed/{city}", response_model=List[FeedPost])
async def get_city_feed(city: str, limit: int = Query(50, le=100)):
    posts = await db.feed_posts.find(
        {"city": city.lower()}, 
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    return posts

@api_router.post("/feed", response_model=FeedPost)
async def create_feed_post(post: FeedPostCreate, user = Depends(get_current_user)):
    post_id = str(uuid.uuid4())
    post_doc = {
        "id": post_id,
        **post.model_dump(),
        "city": post.city.lower(),
        "user_id": user["id"],
        "username": user["username"],
        "user_avatar": user.get("avatar_url"),
        "is_verified": user.get("is_verified", False),
        "likes": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.feed_posts.insert_one(post_doc)
    return FeedPost(**post_doc)

@api_router.post("/feed/{post_id}/like")
async def like_post(post_id: str, user = Depends(get_current_user)):
    await db.feed_posts.update_one({"id": post_id}, {"$inc": {"likes": 1}})
    return {"message": "Post liked"}

# ============== CHAT ROUTES ==============

@api_router.get("/chat/{city}/messages", response_model=List[ChatMessage])
async def get_chat_messages(city: str, limit: int = Query(100, le=200)):
    messages = await db.chat_messages.find(
        {"city": city.lower()}, 
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    return list(reversed(messages))

@api_router.post("/chat/{city}/message", response_model=ChatMessage)
async def send_chat_message(city: str, content: str = Query(...), user = Depends(get_current_user)):
    msg_id = str(uuid.uuid4())
    msg_doc = {
        "id": msg_id,
        "city": city.lower(),
        "user_id": user["id"],
        "username": user["username"],
        "user_avatar": user.get("avatar_url"),
        "content": content,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.chat_messages.insert_one(msg_doc)
    return ChatMessage(**msg_doc)

# ============== VENUES ROUTES ==============

@api_router.get("/venues", response_model=List[Venue])
async def get_venues(city: Optional[str] = None, limit: int = Query(50, le=100)):
    query = {}
    if city:
        query["city"] = city.lower()
    venues = await db.venues.find(query, {"_id": 0}).limit(limit).to_list(limit)
    return venues

@api_router.get("/venues/{venue_id}", response_model=Venue)
async def get_venue(venue_id: str):
    venue = await db.venues.find_one({"id": venue_id}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    return venue

@api_router.post("/venues", response_model=Venue)
async def create_venue(venue: VenueCreate, user = Depends(get_current_user)):
    venue_id = str(uuid.uuid4())
    venue_doc = {
        "id": venue_id,
        **venue.model_dump(),
        "city": venue.city.lower(),
        "is_verified": user.get("is_promoter", False),
        "owner_id": user["id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.venues.insert_one(venue_doc)
    return Venue(**venue_doc)

# ============== NOTIFICATIONS ROUTES ==============

@api_router.get("/notifications", response_model=List[Notification])
async def get_notifications(user = Depends(get_current_user), limit: int = Query(50, le=100)):
    notifications = await db.notifications.find(
        {"user_id": user["id"]}, 
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    return notifications

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, user = Depends(get_current_user)):
    await db.notifications.update_one(
        {"id": notification_id, "user_id": user["id"]}, 
        {"$set": {"is_read": True}}
    )
    return {"message": "Marked as read"}

@api_router.get("/notifications/unread-count")
async def get_unread_count(user = Depends(get_current_user)):
    count = await db.notifications.count_documents({"user_id": user["id"], "is_read": False})
    return {"count": count}

# ============== UTILITY ROUTES ==============

@api_router.get("/cities")
async def get_cities():
    return {
        "cities": [
            {"id": "kingston", "name": "Kingston", "country": "Jamaica", "flag": "🇯🇲"},
            {"id": "miami", "name": "Miami", "country": "USA", "flag": "🇺🇸"},
            {"id": "nyc", "name": "New York City", "country": "USA", "flag": "🇺🇸"}
        ]
    }

@api_router.get("/genres")
async def get_genres():
    return {"genres": GENRES}

@api_router.get("/vibes")
async def get_vibes():
    return {"vibes": VIBES}

@api_router.get("/")
async def root():
    return {"message": "Pulse of the City API", "version": "1.0.0"}

# ============== WEBSOCKET FOR REAL-TIME CHAT ==============

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {city: [] for city in CITIES}
    
    async def connect(self, websocket: WebSocket, city: str):
        await websocket.accept()
        if city not in self.active_connections:
            self.active_connections[city] = []
        self.active_connections[city].append(websocket)
    
    def disconnect(self, websocket: WebSocket, city: str):
        if city in self.active_connections:
            self.active_connections[city].remove(websocket)
    
    async def broadcast(self, message: dict, city: str):
        if city in self.active_connections:
            for connection in self.active_connections[city]:
                try:
                    await connection.send_json(message)
                except:
                    pass

manager = ConnectionManager()

@app.websocket("/ws/chat/{city}")
async def websocket_chat(websocket: WebSocket, city: str):
    await manager.connect(websocket, city.lower())
    try:
        while True:
            data = await websocket.receive_json()
            # Save message to DB
            msg_id = str(uuid.uuid4())
            msg_doc = {
                "id": msg_id,
                "city": city.lower(),
                "user_id": data.get("user_id", "anonymous"),
                "username": data.get("username", "Anonymous"),
                "user_avatar": data.get("user_avatar"),
                "content": data.get("content", ""),
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.chat_messages.insert_one(msg_doc)
            # Broadcast to all connected clients
            await manager.broadcast(msg_doc, city.lower())
    except WebSocketDisconnect:
        manager.disconnect(websocket, city.lower())

# ============== SEED DATA ==============

@api_router.post("/seed")
async def seed_data():
    # Check if already seeded
    existing_events = await db.events.count_documents({})
    if existing_events > 0:
        return {"message": "Data already seeded"}
    
    # Seed events
    events = [
        # Kingston Events
        {
            "id": str(uuid.uuid4()),
            "title": "Dancehall Fridays at Fiction",
            "description": "The biggest dancehall party in Kingston. Live DJs, bottle service, and the hottest vibes.",
            "city": "kingston",
            "venue_name": "Fiction Nightclub",
            "venue_address": "67 Knutsford Blvd, Kingston",
            "date": (datetime.now(timezone.utc) + timedelta(days=1)).strftime("%Y-%m-%d"),
            "time": "10:00 PM",
            "genre": ["dancehall", "reggae"],
            "vibe": "lit",
            "image_url": "https://images.unsplash.com/photo-1574155331040-87b9dae81218?w=800",
            "price": "$20 USD",
            "is_featured": True,
            "attendee_count": 234,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Rooftop Sessions",
            "description": "Sunset vibes with R&B and Neo-Soul. Dress code: Smart Casual",
            "city": "kingston",
            "venue_name": "Sky Lounge",
            "venue_address": "The Jamaica Pegasus Hotel",
            "date": (datetime.now(timezone.utc) + timedelta(days=2)).strftime("%Y-%m-%d"),
            "time": "6:00 PM",
            "genre": ["rnb"],
            "vibe": "upscale",
            "image_url": "https://images.unsplash.com/photo-1622962284117-b8a4f9c43b9f?w=800",
            "price": "$30 USD",
            "is_featured": True,
            "attendee_count": 89,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        # Miami Events
        {
            "id": str(uuid.uuid4()),
            "title": "Soca Brunch Miami",
            "description": "Bottomless brunch with the best soca music. Caribbean food, unlimited drinks.",
            "city": "miami",
            "venue_name": "Clevelander South Beach",
            "venue_address": "1020 Ocean Dr, Miami Beach",
            "date": (datetime.now(timezone.utc) + timedelta(days=1)).strftime("%Y-%m-%d"),
            "time": "12:00 PM",
            "genre": ["soca", "dancehall"],
            "vibe": "lit",
            "image_url": "https://images.unsplash.com/photo-1758200519616-56bac165cb33?w=800",
            "price": "$65 USD",
            "is_featured": True,
            "attendee_count": 156,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Afrobeat Takeover",
            "description": "Miami's premier Afrobeat party. Live Afrohouse, Amapiano, and Afrobeat.",
            "city": "miami",
            "venue_name": "E11even Miami",
            "venue_address": "29 NE 11th St, Miami",
            "date": (datetime.now(timezone.utc) + timedelta(days=3)).strftime("%Y-%m-%d"),
            "time": "11:00 PM",
            "genre": ["afrobeat"],
            "vibe": "upscale",
            "image_url": "https://images.unsplash.com/photo-1763322564752-12ce8fae2bfe?w=800",
            "price": "$40 USD",
            "is_featured": True,
            "attendee_count": 312,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        # NYC Events
        {
            "id": str(uuid.uuid4()),
            "title": "Hip-Hop Wednesdays",
            "description": "Old school meets new school. Classic hip-hop all night long.",
            "city": "nyc",
            "venue_name": "Marquee New York",
            "venue_address": "289 10th Ave, New York",
            "date": (datetime.now(timezone.utc) + timedelta(days=2)).strftime("%Y-%m-%d"),
            "time": "10:00 PM",
            "genre": ["hiphop", "rnb"],
            "vibe": "upscale",
            "image_url": "https://images.unsplash.com/photo-1759336773390-200b9e86b386?w=800",
            "price": "$30 USD",
            "is_featured": True,
            "attendee_count": 445,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Underground Reggae",
            "description": "Roots, dub, and conscious reggae in Brooklyn. Strictly vinyl selections.",
            "city": "nyc",
            "venue_name": "The Basement Brooklyn",
            "venue_address": "446 Meeker Ave, Brooklyn",
            "date": (datetime.now(timezone.utc) + timedelta(days=1)).strftime("%Y-%m-%d"),
            "time": "9:00 PM",
            "genre": ["reggae"],
            "vibe": "underground",
            "image_url": "https://images.unsplash.com/photo-1762294049200-608cf4fe13cf?w=800",
            "price": "$15 USD",
            "is_featured": False,
            "attendee_count": 78,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.events.insert_many(events)
    
    # Seed venues
    venues = [
        {
            "id": str(uuid.uuid4()),
            "name": "Fiction Nightclub",
            "city": "kingston",
            "address": "67 Knutsford Blvd, Kingston",
            "description": "Kingston's premier nightlife destination. Three floors of music.",
            "image_url": "https://images.unsplash.com/photo-1574155331040-87b9dae81218?w=800",
            "genres": ["dancehall", "reggae", "hiphop"],
            "vibes": ["lit", "upscale"],
            "is_verified": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "E11even Miami",
            "city": "miami",
            "address": "29 NE 11th St, Miami",
            "description": "24/7 ultraclub in the heart of downtown Miami.",
            "image_url": "https://images.unsplash.com/photo-1763322564752-12ce8fae2bfe?w=800",
            "genres": ["edm", "hiphop", "afrobeat"],
            "vibes": ["upscale", "lit"],
            "is_verified": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Marquee New York",
            "city": "nyc",
            "address": "289 10th Ave, New York",
            "description": "Iconic NYC nightclub in Chelsea with world-class DJs.",
            "image_url": "https://images.unsplash.com/photo-1759336773390-200b9e86b386?w=800",
            "genres": ["edm", "hiphop", "rnb"],
            "vibes": ["upscale"],
            "is_verified": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.venues.insert_many(venues)
    
    # Seed feed posts
    posts = [
        {
            "id": str(uuid.uuid4()),
            "content": "Kingston heating up tonight! Fiction is PACKED 🔥",
            "city": "kingston",
            "post_type": "vibe_check",
            "user_id": "system",
            "username": "PulseKingston",
            "is_verified": True,
            "likes": 45,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "content": "Who's coming to Soca Brunch tomorrow? The lineup is crazy!",
            "city": "miami",
            "post_type": "announcement",
            "user_id": "system",
            "username": "PulseMiami",
            "is_verified": True,
            "likes": 89,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "content": "NYC late night crowd moving to Marquee. Hip-Hop Wednesdays never disappoints.",
            "city": "nyc",
            "post_type": "update",
            "user_id": "system",
            "username": "PulseNYC",
            "is_verified": True,
            "likes": 123,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.feed_posts.insert_many(posts)
    
    return {"message": "Data seeded successfully", "events": len(events), "venues": len(venues), "posts": len(posts)}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
