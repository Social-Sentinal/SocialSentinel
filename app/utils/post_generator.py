import random
from datetime import datetime, timedelta

CAPTIONS = [
    "Exploring the mountains! #adventure #nature",
    "Delicious food! #foodie #yum",
    "Sunset by the beach! #beachlife #sunset",
    "Morning coffee vibes! #coffee #morning",
    "Hiking through the forest! #hiking #wilderness",
    "Enjoying the city lights! #cityscape #nightlife",
    "Camping under the stars! #camping #stars",
    "Waking up to a beautiful view! #view #morning",
    "Exploring new cultures! #culture #travel",
    "Breathtaking waterfall! #waterfall #explore",
    "Road trip through the countryside! #roadtrip #freedom",
    "Peaceful lakeside moments! #lakeview #serenity",
    "Chasing the horizon! #wanderlust #journey"
]

HASHTAGS = [
    "#travel", "#adventure", "#foodie", "#nature", "#beachlife", "#sunset",
    "#cityscape", "#nightlife", "#coffee", "#morning", "#hiking", "#wilderness",
    "#happy", "#explore", "#wanderlust", "#freedom", "#culture", "#serenity", "#stars"
]

IMAGES = [
    "https://picsum.photos/200/300?random=1",
    "https://picsum.photos/200/300?random=2",
    "https://picsum.photos/200/300?random=3",
    "https://picsum.photos/200/300?random=4",
    "https://picsum.photos/200/300?random=5",
    "https://picsum.photos/200/300?random=6",
    "https://picsum.photos/200/300?random=7",
    "https://picsum.photos/200/300?random=8",
    "https://picsum.photos/200/300?random=9",
    "https://picsum.photos/200/300?random=11",
    "https://picsum.photos/200/300?random=12",
    "https://picsum.photos/200/300?random=13",
    "https://picsum.photos/200/300?random=14",
    "https://picsum.photos/200/300?random=15"
]


def generate_random_timestamp() -> str:
    now = datetime.now()
    random_time = now - timedelta(days=random.randint(0, 10), hours=random.randint(0, 23))
    return random_time.strftime("%Y-%m-%d %H:%M:%S")


def generate_posts(num_posts: int = 30) -> list[dict]:
    posts = []
    for i in range(1, num_posts + 1):
        post = {
            "id": i,
            "image_url": random.choice(IMAGES),
            "caption": random.choice(CAPTIONS),
            "hashtags": random.choice(HASHTAGS),
            "timestamp": generate_random_timestamp()
        }
        posts.append(post)
    return posts
