import strawberry
from typing import List, Optional
from datetime import datetime
from strawberry.fastapi import GraphQLRouter
from sqlalchemy.orm import Session
from fastapi import Depends  # Add this line
from app.models import get_db
from app.models.user import User as UserModel
from app.models.topic import Topic as TopicModel
from app.models.comment import Comment as CommentModel
from app.models.notification import Notification as NotificationModel

# GraphQL Types
@strawberry.type
class User:
    id: int
    username: str
    email: str
    bio: Optional[str] = None
    created_at: datetime
    
    @strawberry.field
    def topics(self, info) -> List["Topic"]:
        db = info.context["db"]
        user_topics = db.query(TopicModel).filter(TopicModel.user_id == self.id).all()
        return [Topic.from_orm(topic) for topic in user_topics]

@strawberry.type
class Topic:
    id: int
    title: str
    content: str
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    view_count: int
    
    @classmethod
    def from_orm(cls, topic: TopicModel):
        return cls(
            id=topic.id,
            title=topic.title,
            content=topic.content,
            user_id=topic.user_id,
            created_at=topic.created_at,
            updated_at=topic.updated_at,
            view_count=topic.view_count
        )
    
    @strawberry.field
    def user(self, info) -> User:
        db = info.context["db"]
        user = db.query(UserModel).filter(UserModel.id == self.user_id).first()
        return User(
            id=user.id,
            username=user.username,
            email=user.email,
            bio=user.bio,
            created_at=user.created_at
        )
    
    @strawberry.field
    def comments(self, info) -> List["Comment"]:
        db = info.context["db"]
        topic_comments = db.query(CommentModel).filter(CommentModel.topic_id == self.id).all()
        return [Comment.from_orm(comment) for comment in topic_comments]
    
    @strawberry.field
    def comments_count(self, info) -> int:
        db = info.context["db"]
        return db.query(CommentModel).filter(CommentModel.topic_id == self.id).count()

@strawberry.type
class Comment:
    id: int
    content: str
    user_id: int
    topic_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    @classmethod
    def from_orm(cls, comment: CommentModel):
        return cls(
            id=comment.id,
            content=comment.content,
            user_id=comment.user_id,
            topic_id=comment.topic_id,
            created_at=comment.created_at,
            updated_at=comment.updated_at
        )
    
    @strawberry.field
    def user(self, info) -> User:
        db = info.context["db"]
        user = db.query(UserModel).filter(UserModel.id == self.user_id).first()
        return User(
            id=user.id,
            username=user.username,
            email=user.email,
            bio=user.bio,
            created_at=user.created_at
        )
    
    @strawberry.field
    def topic(self, info) -> Topic:
        db = info.context["db"]
        topic = db.query(TopicModel).filter(TopicModel.id == self.topic_id).first()
        return Topic.from_orm(topic)

@strawberry.type
class Notification:
    id: int
    message: str
    user_id: int
    topic_id: Optional[int] = None
    comment_id: Optional[int] = None
    created_at: datetime
    is_read: bool
    
    @classmethod
    def from_orm(cls, notification: NotificationModel):
        return cls(
            id=notification.id,
            message=notification.message,
            user_id=notification.user_id,
            topic_id=notification.topic_id,
            comment_id=notification.comment_id,
            created_at=notification.created_at,
            is_read=notification.is_read
        )

# Queries
@strawberry.type
class Query:
    @strawberry.field
    def topic(self, info, id: int) -> Optional[Topic]:
        db = info.context["db"]
        topic = db.query(TopicModel).filter(TopicModel.id == id).first()
        if not topic:
            return None
        return Topic.from_orm(topic)
    
    @strawberry.field
    def topics(self, info, limit: int = 10, offset: int = 0) -> List[Topic]:
        db = info.context["db"]
        topics = db.query(TopicModel).order_by(TopicModel.created_at.desc()).offset(offset).limit(limit).all()
        return [Topic.from_orm(topic) for topic in topics]
    
    @strawberry.field
    def user(self, info, id: int) -> Optional[User]:
        db = info.context["db"]
        user = db.query(UserModel).filter(UserModel.id == id).first()
        if not user:
            return None
        return User(
            id=user.id,
            username=user.username,
            email=user.email,
            bio=user.bio,
            created_at=user.created_at
        )
    
    @strawberry.field
    def comments(self, info, topic_id: int) -> List[Comment]:
        db = info.context["db"]
        comments = db.query(CommentModel).filter(CommentModel.topic_id == topic_id).all()
        return [Comment.from_orm(comment) for comment in comments]
    
    @strawberry.field
    def notifications(self, info, user_id: int) -> List[Notification]:
        db = info.context["db"]
        notifications = db.query(NotificationModel).filter(
            NotificationModel.user_id == user_id
        ).order_by(
            NotificationModel.created_at.desc()
        ).all()
        return [Notification.from_orm(notification) for notification in notifications]

# Create Schema
schema = strawberry.Schema(query=Query)

# GraphQL Router
def get_context(db: Session = Depends(get_db)):
    return {"db": db}

graphql_router = GraphQLRouter(schema, context_getter=get_context)