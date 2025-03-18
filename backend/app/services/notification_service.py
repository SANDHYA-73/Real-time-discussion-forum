import json
import redis
import pika
from typing import Dict, Any
import threading
from app.config import settings

# Redis connection
redis_client = redis.Redis(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    decode_responses=True
)

# RabbitMQ connection
class RabbitMQClient:
    def __init__(self):
        self.connection = None
        self.channel = None
        self.connect()
        
    def connect(self):
        credentials = pika.PlainCredentials(settings.RABBITMQ_USER, settings.RABBITMQ_PASS)
        parameters = pika.ConnectionParameters(
            host=settings.RABBITMQ_HOST,
            port=settings.RABBITMQ_PORT,
            credentials=credentials
        )
        
        self.connection = pika.BlockingConnection(parameters)
        self.channel = self.connection.channel()
        
        # Declare exchanges
        self.channel.exchange_declare(
            exchange='notifications',
            exchange_type='topic',
            durable=True
        )
        
    def publish_notification(self, routing_key: str, message: Dict[str, Any]):
        try:
            if not self.connection or self.connection.is_closed:
                self.connect()
                
            self.channel.basic_publish(
                exchange='notifications',
                routing_key=routing_key,
                body=json.dumps(message),
                properties=pika.BasicProperties(
                    delivery_mode=2,  # make message persistent
                    content_type='application/json'
                )
            )
            return True
        except Exception as e:
            print(f"Error publishing to RabbitMQ: {e}")
            return False

# Singleton RabbitMQ client
rabbitmq_client = RabbitMQClient()

# Redis Pub/Sub for real-time notifications
def publish_notification(user_id: int, message: Dict[str, Any]):
    channel = f"user:{user_id}:notifications"
    redis_client.publish(channel, json.dumps(message))
    
    # Also send via RabbitMQ for reliable delivery
    routing_key = f"user.{user_id}.notification"
    rabbitmq_client.publish_notification(routing_key, message)

# Background worker to process notifications from RabbitMQ
def start_notification_worker():
    # This could be moved to a separate process or worker
    def callback(ch, method, properties, body):
        notification = json.loads(body)
        user_id = notification.get('user_id')
        
        # Store in Redis cache for quick retrieval
        notification_id = notification.get('id')
        if notification_id and user_id:
            key = f"user:{user_id}:notification:{notification_id}"
            redis_client.setex(key, 86400, json.dumps(notification))  # 24 hour TTL
            
            # Add to user's notification list
            list_key = f"user:{user_id}:notifications"
            redis_client.lpush(list_key, notification_id)
            redis_client.ltrim(list_key, 0, 99)  # Keep last 100 notifications
        
        ch.basic_ack(delivery_tag=method.delivery_tag)
    
    try:
        connection = pika.BlockingConnection(
            pika.ConnectionParameters(
                host=settings.RABBITMQ_HOST,
                port=settings.RABBITMQ_PORT,
                credentials=pika.PlainCredentials(
                    settings.RABBITMQ_USER, 
                    settings.RABBITMQ_PASS
                )
            )
        )
        channel = connection.channel()
        
        # Declare queue
        queue_name = 'notification_processor'
        channel.queue_declare(queue=queue_name, durable=True)
        
        # Bind to exchange
        channel.queue_bind(
            exchange='notifications',
            queue=queue_name,
            routing_key='user.*.notification'
        )
        
        # Set prefetch
        channel.basic_qos(prefetch_count=1)
        
        # Consume
        channel.basic_consume(
            queue=queue_name,
            on_message_callback=callback
        )
        
        print("Starting notification worker...")
        channel.start_consuming()
        
    except Exception as e:
        print(f"Error in notification worker: {e}")

# Start notification worker in a background thread
def init_notification_worker():
    worker_thread = threading.Thread(target=start_notification_worker)
    worker_thread.daemon = True
    worker_thread.start()