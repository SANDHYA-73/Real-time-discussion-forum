from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.models import Base, engine
from app.controllers import user, topic, comment, notification
from app.services.notification_service import init_notification_worker
from app.services.search_service import search_service
from app.models import get_db
from app.models.topic import Topic
from app.graphql.schema import graphql_router

# Create tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(title="Real-Time Discussion Forum")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(user.router, prefix="/api/users", tags=["users"])
app.include_router(topic.router, prefix="/api/topics", tags=["topics"])
app.include_router(comment.router, prefix="/api/comments", tags=["comments"])
app.include_router(notification.router, prefix="/api/notifications", tags=["notifications"])

# Add GraphQL endpoint
app.include_router(graphql_router, prefix="/graphql")

# Initialize notification worker
@app.on_event("startup")
def startup_notification_worker():
    init_notification_worker()

# Initialize search service
@app.on_event("startup")
def startup_search_service():
    def init_search():
        db = next(get_db())
        topics = db.query(Topic).all()
        search_service.initialize(topics)
    
    # Initialize in a separate thread to avoid blocking startup
    import threading
    thread = threading.Thread(target=init_search)
    thread.daemon = True
    thread.start()

@app.get("/")
def read_root():
    return {"message": "Welcome to the Real-Time Discussion Forum API"}