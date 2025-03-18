class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_end_of_word = False
        self.topic_ids = set()  # Store topic IDs that contain this word

class Trie:
    def __init__(self):
        self.root = TrieNode()
    
    def insert(self, word, topic_id):
        """Insert a word into the trie with its associated topic ID"""
        node = self.root
        for char in word:
            if char not in node.children:
                node.children[char] = TrieNode()
            node = node.children[char]
        node.is_end_of_word = True
        node.topic_ids.add(topic_id)
    
    def search(self, prefix):
        """Return all topic IDs that contain the prefix"""
        node = self.root
        for char in prefix:
            if char not in node.children:
                return set()  # Prefix not found
            node = node.children[char]
        
        # Collect all topic IDs from this node and its children
        topic_ids = set()
        self._collect_topic_ids(node, topic_ids)
        return topic_ids
    
    def _collect_topic_ids(self, node, topic_ids):
        """Collect all topic IDs in the subtree rooted at node"""
        if node.is_end_of_word:
            topic_ids.update(node.topic_ids)
        
        for child in node.children.values():
            self._collect_topic_ids(child, topic_ids)