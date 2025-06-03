from fastapi import WebSocket, WebSocketDisconnect, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Dict
import json
import redis
import asyncio
from app.models import get_db
from app.models.notification import Notification
from app.schema_validation.notification import Notification as NotificationSchema
from app.services.auth_service import get_current_user
from app.models.user import User
from app.config import settings
from jose import JWTError, jwt
from fastapi import APIRouter

router = APIRouter()

# Redis connection for WebSocket subscription
redis_client = redis.Redis(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    decode_responses=True
)

# Store active WebSocket connections
active_connections: Dict[int, List[WebSocket]] = {}

@router.get("/", response_model=List[NotificationSchema])
def get_notifications(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(
        Notification.created_at.desc()
    ).offset(skip).limit(limit).all()
    
    return notifications

@router.put("/{notification_id}/read", response_model=NotificationSchema)
def mark_notification_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get notification
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    # Mark as read
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    
    return notification

@router.put("/read-all", status_code=status.HTTP_204_NO_CONTENT)
def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Update all unread notifications
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update(
        {"is_read": True}
    )
    
    db.commit()
    
    return

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(
    websocket: WebSocket, 
    user_id: int, 
    token: str = Query(None)
):
    # Authenticate the WebSocket connection
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
        
    try:
        # Verify the token
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        token_user_id = int(payload.get("sub"))
        
        # Check if the token user ID matches the requested user ID
        if token_user_id != user_id:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
            
        # Accept the connection
        await websocket.accept()
        
        # Add to active connections
        if user_id not in active_connections:
            active_connections[user_id] = []
        active_connections[user_id].append(websocket)
        
        try:
            # Create Redis pubsub
            pubsub = redis_client.pubsub()
            channel = f"user:{user_id}:notifications"
            pubsub.subscribe(channel)
            
            # Listen for messages in the background
            async def redis_listener():
                for message in pubsub.listen():
                    if message["type"] == "message":
                        payload = message["data"]
                        await websocket.send_text(payload)
            
            # Start Redis listener task
            redis_task = asyncio.create_task(redis_listener())
            
            # Handle WebSocket messages
            while True:
                data = await websocket.receive_text()
                # Process client messages if needed
        
        except WebSocketDisconnect:
            # Remove from active connections
            if user_id in active_connections:
                active_connections[user_id].remove(websocket)
                if not active_connections[user_id]:
                    del active_connections[user_id]
    except JWTError:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    except Exception as e:
        print(f"WebSocket error: {e}")
        await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
        return