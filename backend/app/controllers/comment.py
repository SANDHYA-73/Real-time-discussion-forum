from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.models import get_db
from app.models.comment import Comment
from app.models.topic import Topic
from app.models.notification import Notification
from app.schema_validation.comment import CommentCreate, Comment as CommentSchema, CommentUpdate
from app.services.auth_service import get_current_user
from app.models.user import User
from app.services.notification_service import publish_notification

router = APIRouter()

@router.post("/", response_model=CommentSchema)
def create_comment(
    comment: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if topic exists
    topic = db.query(Topic).filter(Topic.id == comment.topic_id).first()
    if not topic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Topic not found"
        )
    
    # Create new comment
    db_comment = Comment(
        content=comment.content,
        topic_id=comment.topic_id,
        user_id=current_user.id
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    
    # Create notification for topic author
    if topic.user_id != current_user.id:
        notification = Notification(
            user_id=topic.user_id,
            message=f"{current_user.username} commented on your topic: {topic.title}",
            topic_id=topic.id,
            comment_id=db_comment.id
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)
        
        # Publish real-time notification
        publish_notification(topic.user_id, {
            "id": notification.id,
            "message": notification.message,
            "topic_id": notification.topic_id,
            "comment_id": notification.comment_id,
            "created_at": notification.created_at.isoformat(),
            "is_read": notification.is_read
        })
    
    return db_comment

@router.get("/topic/{topic_id}", response_model=List[CommentSchema])
def get_topic_comments(
    topic_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    # Check if topic exists
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Topic not found"
        )
    
    # Get comments
    comments = db.query(Comment).filter(
        Comment.topic_id == topic_id
    ).order_by(
        Comment.created_at.asc()
    ).offset(skip).limit(limit).all()
    
    return comments

@router.put("/{comment_id}", response_model=CommentSchema)
def update_comment(
    comment_id: int,
    comment_update: CommentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get comment
    db_comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not db_comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    # Check if user is the author
    if db_comment.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this comment"
        )
    
    # Update comment
    if comment_update.content:
        db_comment.content = comment_update.content
    
    db.commit()
    db.refresh(db_comment)
    
    return db_comment

@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get comment
    db_comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not db_comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    # Check if user is the author
    if db_comment.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this comment"
        )
    
    # Delete comment
    db.delete(db_comment)
    db.commit()
    
    return