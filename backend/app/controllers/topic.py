from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from app.models import get_db
from app.models.topic import Topic
from app.models.comment import Comment
from app.schema_validation.topic import TopicCreate, Topic as TopicSchema, TopicDetail, TopicUpdate
from app.services.auth_service import get_current_user
from app.models.user import User
from app.services.search_service import search_service
from sqlalchemy import func

router = APIRouter()

@router.post("/", response_model=TopicSchema)
def create_topic(
    topic: TopicCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Create new topic
    db_topic = Topic(
        title=topic.title,
        content=topic.content,
        user_id=current_user.id
    )
    db.add(db_topic)
    db.commit()
    db.refresh(db_topic)
    
    # Add to search index
    search_service.add_topic(db_topic)
    
    return db_topic

@router.get("/", response_model=List[TopicDetail])
def get_topics(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    # Get topics with comment count
    topics = db.query(
        Topic,
        func.count(Comment.id).label('comments_count')
    ).outerjoin(
        Comment, 
        Topic.id == Comment.topic_id
    ).group_by(
        Topic.id
    ).order_by(
        Topic.created_at.desc()
    ).offset(skip).limit(limit).all()
    
    # Convert to schema format
    results = []
    for topic, comments_count in topics:
        # Convert to schema format
        topic_dict = {
            "id": topic.id,
            "title": topic.title,
            "content": topic.content,
            "user_id": topic.user_id,
            "created_at": topic.created_at,
            "updated_at": topic.updated_at,
            "view_count": topic.view_count,
            "user": topic.user,
            "comments_count": comments_count
        }
        results.append(topic_dict)
    
    return results

@router.get("/trending", response_model=List[dict])
def get_trending_topics():
    return search_service.get_trending_topics(limit=10)

@router.get("/search", response_model=List[TopicSchema])
def search_topics(
    query: str = Query(..., min_length=1),
    db: Session = Depends(get_db)
):
    # Search topics
    topic_ids = search_service.search(query)
    if not topic_ids:
        return []
    
    # Get topics from database
    topics = db.query(Topic).filter(Topic.id.in_(topic_ids)).all()
    return topics

@router.get("/{topic_id}", response_model=TopicDetail)
def get_topic(
    topic_id: int,
    db: Session = Depends(get_db)
):
    # Get topic with comment count
    result = db.query(
        Topic,
        func.count(Comment.id).label('comments_count')
    ).outerjoin(
        Comment, 
        Topic.id == Comment.topic_id
    ).filter(
        Topic.id == topic_id
    ).group_by(
        Topic.id
    ).first()
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Topic not found"
        )
    
    topic, comments_count = result
    
    # Increment view count
    topic.view_count += 1
    db.commit()
    
    # Update in search service
    search_service.increment_topic_view(topic_id)
    
    # Convert to schema format
    topic_dict = {
        "id": topic.id,
        "title": topic.title,
        "content": topic.content,
        "user_id": topic.user_id,
        "created_at": topic.created_at,
        "updated_at": topic.updated_at,
        "view_count": topic.view_count,
        "user": topic.user,
        "comments_count": comments_count
    }
    
    return topic_dict

@router.put("/{topic_id}", response_model=TopicSchema)
def update_topic(
    topic_id: int,
    topic_update: TopicUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get topic
    db_topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not db_topic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Topic not found"
        )
    
    # Check if user is the author
    if db_topic.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this topic"
        )
    
    # Update topic
    if topic_update.title:
        db_topic.title = topic_update.title
    if topic_update.content:
        db_topic.content = topic_update.content
    
    db.commit()
    db.refresh(db_topic)
    
    # Update in search index
    search_service.add_topic(db_topic)
    
    return db_topic

@router.delete("/{topic_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_topic(
    topic_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get topic
    db_topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not db_topic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Topic not found"
        )
    
    # Check if user is the author
    if db_topic.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this topic"
        )
    
    # Delete topic
    db.delete(db_topic)
    db.commit()
    
    return