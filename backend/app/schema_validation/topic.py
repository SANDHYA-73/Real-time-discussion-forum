from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.schema_validation.user import User

class TopicBase(BaseModel):
    title: str
    content: str

class TopicCreate(TopicBase):
    pass

class TopicUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None

class Topic(TopicBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    view_count: int
    user: User
    
    class Config:
        orm_mode = True

class TopicDetail(Topic):
    comments_count: int
    
    class Config:
        orm_mode = True