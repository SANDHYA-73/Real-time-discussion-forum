from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.schema_validation.user import User

class CommentBase(BaseModel):
    content: str

class CommentCreate(CommentBase):
    topic_id: int

class CommentUpdate(BaseModel):
    content: Optional[str] = None

class Comment(CommentBase):
    id: int
    user_id: int
    topic_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    user: User
    
    class Config:
        orm_mode = True