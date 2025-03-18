import redis
from app.utils.trie import Trie
from app.utils.heap_ranking import TopicHeap
from app.config import settings

# Redis client for caching
redis_client = redis.Redis(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    decode_responses=True
)

class SearchService:
    def __init__(self):
        self.trie = Trie()
        self.topic_heap = TopicHeap()
        self.initialized = False
        
    def initialize(self, topics):
        """Initialize search data structures with all topics"""
        for topic in topics:
            self.add_topic(topic)
        self.initialized = True
    
    def add_topic(self, topic):
        """Add a topic to search index"""
        # Add to Trie for search
        words = self._tokenize(topic.title) + self._tokenize(topic.content)
        for word in words:
            self.trie.insert(word, topic.id)
        
        # Add to heap for trending topics
        score = topic.view_count
        self.topic_heap.add_topic(topic.id, score, topic.title)
        
        # Cache in Redis
        redis_client.hset(
            f"topic:{topic.id}",
            mapping={
                "title": topic.title,
                "content": topic.content,
                "views": topic.view_count
            }
        )
        redis_client.expire(f"topic:{topic.id}", 3600)  # 1 hour TTL
    
    def _tokenize(self, text):
        """Convert text to lowercase tokens"""
        if not text:
            return []
        return text.lower().split()
    
    def search(self, query, limit=10):
        """Search topics by keyword"""
        tokens = self._tokenize(query)
        if not tokens:
            return []
        
        # Use cache if available
        cache_key = f"search:{query.lower()}"
        cached = redis_client.get(cache_key)
        if cached:
            return eval(cached)  # Convert string to list
        
        # Search using Trie
        results = set()
        for token in tokens:
            token_results = self.trie.search(token)
            results.update(token_results)
        
        # Limit results
        limited_results = list(results)[:limit]
        
        # Cache results
        redis_client.setex(cache_key, 60, str(limited_results))  # 1 minute TTL
        
        return limited_results
    
    def get_trending_topics(self, limit=10):
        """Get top trending topics"""
        cache_key = "trending_topics"
        cached = redis_client.get(cache_key)
        if cached:
            return eval(cached)  # Convert string to list
        
        trending = self.topic_heap.get_top_topics(limit)
        
        # Cache results
        redis_client.setex(cache_key, 300, str(trending))  # 5 minutes TTL
        
        return trending
        
    def increment_topic_view(self, topic_id):
        """Increment topic view count"""
        # Update in Redis
        redis_client.hincrby(f"topic:{topic_id}", "views", 1)
        
        # Update in heap
        self.topic_heap.increment_score(topic_id)

# Global search service instance
search_service = SearchService()