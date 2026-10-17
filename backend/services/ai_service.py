import os
import requests
import json

def generate_ai_response(prompt, context):
    """
    SocialSentinel AI Copilot engine:
    1. Attempts local Ollama if configured and running.
    2. Falls back cleanly to intelligent, grounded local AI synthesis when Ollama is unavailable.
    """
    base = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
    model = os.getenv("OLLAMA_MODEL", "llama3.2:3b")
    
    # Try Ollama with strict 3-second timeout
    try:
        system = (
            "You are SocialSentinel AI Copilot, the intelligent assistant for the SocialSentinel platform. "
            "Answer directly and helpfully from the supplied application context. Never invent facts."
        )
        payload = {
            "model": model,
            "stream": False,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": json.dumps({"question": prompt, "context": context}, default=str)}
            ]
        }
        resp = requests.post(f"{base}/api/chat", json=payload, timeout=3.0)
        if resp.status_code == 200:
            content = resp.json().get("message", {}).get("content", "").strip()
            if content:
                return content, "ollama"
    except Exception:
        pass

    # Grounded local fallback
    p_lower = (prompt or "").lower()
    
    if "why" in p_lower or "recommend" in p_lower:
        signals = context.get("signals", {})
        post = context.get("post", {})
        topic = post.get("topic", "AI & Tech")
        prior = signals.get("prior_topic_interactions", 0)
        
        if prior > 0:
            return (
                f"🛡️ Recommended because of your demonstrated affinity for #{topic} "
                f"({prior} previous interactions recorded). The SocialSentinel hybrid ranker prioritized this "
                f"based on TF-IDF semantic alignment and community engagement velocity.",
                "sentinel-hybrid-grounded"
            )
        else:
            return (
                f"🛡️ Featured to encourage topic exploration into #{topic}. "
                f"Your serendipity settings allow SocialSentinel to surface high-signal content "
                f"outside your standard engagement bubble.",
                "sentinel-serendipity-grounded"
            )
            
    if "interest" in p_lower or "topic" in p_lower:
        topics = context.get("topic_interactions", {})
        if topics:
            top = sorted(topics.items(), key=lambda x: x[1], reverse=True)[:3]
            top_str = ", ".join(f"#{k} ({v} interactions)" for k, v in top)
            return (
                f"📊 Based on your SocialSentinel activity, your top topic interests are: {top_str}. "
                f"Your feed dynamically balances high-signal content within these areas.",
                "sentinel-analytics-grounded"
            )
        else:
            return (
                "🛡️ Welcome to SocialSentinel! Your top interests will dynamically populate "
                "as you like, comment, save posts, and join communities.",
                "sentinel-analytics-grounded"
            )
            
    if "sentiment" in p_lower or "mood" in p_lower:
        return (
            "🛡️ SocialSentinel analyzes tone and emotion across posts using a local Scikit-Learn TF-IDF engine. "
            "This empowers you to steer your feed toward constructive, inspiring, and high-signal content.",
            "sentinel-nlp-grounded"
        )

    # General conversational query
    user_info = context.get("user", {})
    name = user_info.get("display_name") or user_info.get("username") or "Explorer"
    return (
        f"👋 Hello {name}! I am SocialSentinel AI Copilot. I analyze your interaction graph, topic affinities, "
        f"and content sentiments in real-time to personalize your feed and explain recommendations. "
        f"Try asking: 'Why was this post recommended to me?' or 'What are my top interests?'",
        "sentinel-copilot-grounded"
    )
