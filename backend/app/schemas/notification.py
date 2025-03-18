from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class NotificationBase(BaseModel):
    message: str
    user_id: int

class NotificationCreate(NotificationBase):
    topic_id: Optional[int] = None
    comment_id: Optional[int] = None

class Notification(NotificationBase):
    id: int
    topic_id: Optional[int] = None
    comment_id: Optional[int] = None
    created_at: datetime
    is_read: bool
    
    class Config:
        orm_mode = True