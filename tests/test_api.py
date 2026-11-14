import pytest
from backend import create_app
from backend.extensions import db
from backend.models import User, UserTopicPreference

@pytest.fixture()
def app():
    app = create_app()
    app.config.update(TESTING=True, SQLALCHEMY_DATABASE_URI="sqlite:///:memory:")
    with app.app_context():
        db.drop_all()
        db.create_all()
    yield app
    with app.app_context():
        db.drop_all()

def test_health(app):
    assert app.test_client().get('/api/v1/health').status_code == 200

def test_register_login_and_protected_me(app):
    c = app.test_client()
    r = c.post('/api/v1/auth/register', json={"username": "alice", "email": "alice@example.com", "password": "Password1", "display_name": "Alice"})
    assert r.status_code == 201
    token = r.get_json()["access_token"]
    assert c.get('/api/v1/users/me', headers={"Authorization": f"Bearer {token}"}).status_code == 200

def test_post_like_comment_and_sentiment_profile(app):
    c = app.test_client()
    r = c.post('/api/v1/auth/register', json={"username": "bob", "email": "bob@example.com", "password": "Password1"})
    h = {"Authorization": f"Bearer {r.get_json()['access_token']}"}
    p = c.post('/api/v1/posts', headers=h, json={"caption": "Breakthrough in local AI transformers and deep learning!", "hashtags": "#ai", "topic": "AI & Tech"})
    assert p.status_code == 201
    pid = p.get_json()["post"]["id"]
    assert c.post(f'/api/v1/posts/{pid}/like', headers=h).status_code == 200

    # Comment with positive sentiment
    comm_resp = c.post(f'/api/v1/posts/{pid}/comments', headers=h, json={"text": "This is amazing, brilliant and wonderfully explained!"})
    assert comm_resp.status_code == 201
    comm_data = comm_resp.get_json()["comment"]
    assert comm_data["sentiment"] == "Positive"

    # Verify topic preference updated
    pref_res = c.get('/api/v1/users/topic-preferences', headers=h)
    assert pref_res.status_code == 200
    prefs = pref_res.get_json()["data"]
    assert len(prefs) >= 1
    ai_pref = [x for x in prefs if x["topic"] == "AI & Tech"][0]
    assert ai_pref["positive_count"] >= 1
    assert ai_pref["sentiment_score"] > 0.5

def test_recommendation_and_explanation(app):
    c = app.test_client()
    r = c.post('/api/v1/auth/register', json={"username": "charlie", "email": "charlie@example.com", "password": "Password1"})
    h = {"Authorization": f"Bearer {r.get_json()['access_token']}"}

    # Create post
    p = c.post('/api/v1/posts', headers=h, json={"caption": "Web engineering performance optimization guide", "topic": "Web Engineering"})
    pid = p.get_json()["post"]["id"]

    # Feed recommendation
    feed_res = c.get('/api/v1/recommendations/feed', headers=h)
    assert feed_res.status_code == 200
    items = feed_res.get_json()["data"]
    assert len(items) >= 1

    # Explanation endpoint
    explain_res = c.get(f'/api/v1/recommendations/explain/{pid}', headers=h)
    assert explain_res.status_code == 200
    expl = explain_res.get_json()
    assert "final_score" in expl
    assert "breakdown" in expl
    assert "rationale" in expl

def test_direct_messaging(app):
    c = app.test_client()
    r1 = c.post('/api/v1/auth/register', json={"username": "user1", "email": "user1@example.com", "password": "Password1"})
    h1 = {"Authorization": f"Bearer {r1.get_json()['access_token']}"}
    u1_id = r1.get_json()["user"]["id"]

    r2 = c.post('/api/v1/auth/register', json={"username": "user2", "email": "user2@example.com", "password": "Password1"})
    h2 = {"Authorization": f"Bearer {r2.get_json()['access_token']}"}
    u2_id = r2.get_json()["user"]["id"]

    # Create conversation
    conv_res = c.post('/api/v1/conversations', headers=h1, json={"user_ids": [u2_id]})
    assert conv_res.status_code in (200, 201)
    cid = conv_res.get_json()["conversation_id"]

    # Send message
    msg_res = c.post(f'/api/v1/conversations/{cid}/messages', headers=h1, json={"body": "Hello user2!"})
    assert msg_res.status_code == 201

    # User 2 reads messages
    list_res = c.get(f'/api/v1/conversations/{cid}/messages', headers=h2)
    assert list_res.status_code == 200
    assert len(list_res.get_json()["data"]) == 1
