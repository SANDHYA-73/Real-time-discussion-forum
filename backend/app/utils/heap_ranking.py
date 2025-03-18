import heapq
from typing import List, Dict, Tuple

class TopicHeap:
    def __init__(self):
        self.topics = {}  # topic_id -> (score, title)
        self.heap = []    # max-heap of (-score, topic_id)
    
    def add_topic(self, topic_id: int, score: int, title: str):
        """Add a topic to the heap with its score"""
        self.topics[topic_id] = (score, title)
        heapq.heappush(self.heap, (-score, topic_id))
    
    def increment_score(self, topic_id: int):
        """Increment the score of a topic"""
        if topic_id in self.topics:
            score, title = self.topics[topic_id]
            new_score = score + 1
            self.topics[topic_id] = (new_score, title)
            
            # Add a new entry with updated score
            # (We don't remove old entries, will be filtered during get_top_topics)
            heapq.heappush(self.heap, (-new_score, topic_id))
    
    def get_top_topics(self, limit: int) -> List[Dict]:
        """Get the top N topics by score"""
        seen = set()
        result = []
        
        # Create a copy of the heap to not modify the original
        temp_heap = self.heap.copy()
        
        while temp_heap and len(result) < limit:
            neg_score, topic_id = heapq.heappop(temp_heap)
            
            # Skip if we've seen this topic already
            if topic_id in seen:
                continue
            
            seen.add(topic_id)
            
            # Get current score (could be updated since it was added to heap)
            current_score, title = self.topics[topic_id]
            
            result.append({
                "id": topic_id,
                "title": title,
                "score": current_score
            })
        
        return result