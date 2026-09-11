import pytest
from app import create_app
from app.extensions import db
from app.models import User

@pytest.fixture()
def app():
    app=create_app(); app.config.update(TESTING=True,SQLALCHEMY_DATABASE_URI="sqlite:///:memory:")
    with app.app_context(): db.drop_all(); db.create_all()
    yield app
    with app.app_context(): db.drop_all()

def test_health(app):
    assert app.test_client().get('/api/v1/health').status_code==200

def test_register_login_and_protected_me(app):
    c=app.test_client()
    r=c.post('/api/v1/auth/register',json={"username":"alice","email":"alice@example.com","password":"Password1","display_name":"Alice"})
    assert r.status_code==201
    token=r.get_json()["access_token"]
    assert c.get('/api/v1/users/me',headers={"Authorization":f"Bearer {token}"}).status_code==200

def test_post_like_comment(app):
    c=app.test_client()
    r=c.post('/api/v1/auth/register',json={"username":"bob","email":"bob@example.com","password":"Password1"})
    h={"Authorization":f"Bearer {r.get_json()['access_token']}"}
    p=c.post('/api/v1/posts',headers=h,json={"caption":"Hello AI community","hashtags":"#ai"}); assert p.status_code==201
    pid=p.get_json()["post"]["id"]
    assert c.post(f'/api/v1/posts/{pid}/like',headers=h).status_code==200
    assert c.post(f'/api/v1/posts/{pid}/comments',headers=h,json={"text":"Nice"}).status_code==201
