# Real-Time Discussion Forum
A scalable, event-driven forum application where users can create topics, post comments, and receive real-time updates. This project integrates modern technologies like FastAPI, Redis Pub/Sub, and RabbitMQ to enable a responsive user experience and robust backend communication.

Objective
To build a real-time forum that allows users to:
- Create and browse discussion topics
- Comment and receive live notifications
- Search topics efficiently and view trending discussions

Technologies Used
- FastAPI– Backend API development  
- Redis Pub/Sub – Real-time updates and caching  
- RabbitMQ – Asynchronous event-driven messaging  
- GraphQL – Flexible client-side querying  
- Docker – Containerized deployment  
- Git – Version control   

Features
- User authentication: register, login, profile management  
- Topic creation and threaded comments  
- Real-time notifications for new replies using Redis Pub/Sub  
- Event-driven messaging using RabbitMQ  
- Optimized topic search with Trie data structure  
- Trending topics based on user engagement (Heap-based ranking)
