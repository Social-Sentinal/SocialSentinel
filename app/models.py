from datetime import datetime, timezone
import json
from app.extensions import db
import bcrypt

def utcnow(): return datetime.now(timezone.utc)

class User(db.Model):
    __tablename__="users"
    id=db.Column(db.Integer,primary_key=True)
    username=db.Column(db.String(40),unique=True,nullable=False,index=True)
    email=db.Column(db.String(255),unique=True,nullable=False,index=True)
    password_hash=db.Column(db.String(255),nullable=False)
    display_name=db.Column(db.String(120),nullable=False)
    bio=db.Column(db.Text,default="")
    avatar_url=db.Column(db.String(1000))
    created_at=db.Column(db.DateTime,default=utcnow,nullable=False,index=True)
    updated_at=db.Column(db.DateTime,default=utcnow,onupdate=utcnow)
    preferences=db.relationship("UserPreference",backref="user",uselist=False,cascade="all,delete-orphan")
    def set_password(self,p): self.password_hash=bcrypt.hashpw(p.encode(),bcrypt.gensalt()).decode()
    def check_password(self,p): return bcrypt.checkpw(p.encode(),self.password_hash.encode())
    def to_dict(self,private=False):
        d={"id":self.id,"username":self.username,"email":self.email if private else None,"display_name":self.display_name,"bio":self.bio or "","avatar_url":self.avatar_url,"created_at":self.created_at.isoformat()}
        d["followers_count"]=Follow.query.filter_by(following_id=self.id).count()
        d["following_count"]=Follow.query.filter_by(follower_id=self.id).count()
        d["posts_count"]=Post.query.filter_by(author_id=self.id).count()
        return d

class UserPreference(db.Model):
    __tablename__="user_preferences"
    id=db.Column(db.Integer,primary_key=True)
    user_id=db.Column(db.Integer,db.ForeignKey("users.id",ondelete="CASCADE"),unique=True,nullable=False)
    preferred_topics=db.Column(db.Text,default="Technology,AI,Programming")
    exploration_rate=db.Column(db.Float,default=.15)
    theme=db.Column(db.String(20),default="system")
    def topics(self): return [x.strip() for x in (self.preferred_topics or "").split(",") if x.strip()]
    def to_dict(self): return {"preferred_topics":self.topics(),"exploration_rate":self.exploration_rate,"theme":self.theme}

class Post(db.Model):
    __tablename__="posts"
    id=db.Column(db.Integer,primary_key=True)
    author_id=db.Column(db.Integer,db.ForeignKey("users.id",ondelete="CASCADE"),nullable=False,index=True)
    caption=db.Column(db.Text,nullable=False)
    hashtags=db.Column(db.String(1000),default="")
    media_url=db.Column(db.String(1000))
    topic_category=db.Column(db.String(80),default="General",index=True)
    sentiment=db.Column(db.String(32),default="Neutral",index=True)
    sentiment_confidence=db.Column(db.Float,default=0)
    emotion=db.Column(db.String(32),default="neutral",index=True)
    emotion_confidence=db.Column(db.Float,default=0)
    embedding=db.Column(db.Text)
    created_at=db.Column(db.DateTime,default=utcnow,index=True)
    updated_at=db.Column(db.DateTime,default=utcnow,onupdate=utcnow)
    author=db.relationship("User",backref=db.backref("posts",lazy=True))
    def counts(self):
        return {"likes":Like.query.filter_by(post_id=self.id).count(),"comments":Comment.query.filter_by(post_id=self.id).count(),"saves":Save.query.filter_by(post_id=self.id).count(),"shares":Share.query.filter_by(post_id=self.id).count(),"views":Interaction.query.filter_by(post_id=self.id,event_type="view").count()}
    def to_dict(self,viewer=None):
        c=self.counts()
        return {"id":self.id,"author":self.author.to_dict(),"caption":self.caption,"hashtags":self.hashtags or "","media_url":self.media_url,"topic":self.topic_category,"sentiment":self.sentiment,"sentiment_confidence":self.sentiment_confidence,"emotion":self.emotion,"emotion_confidence":self.emotion_confidence,"created_at":self.created_at.isoformat(),"counts":c,"liked":bool(viewer and Like.query.filter_by(post_id=self.id,user_id=viewer).first()),"saved":bool(viewer and Save.query.filter_by(post_id=self.id,user_id=viewer).first())}

class Like(db.Model):
    __tablename__="likes"; id=db.Column(db.Integer,primary_key=True); user_id=db.Column(db.Integer,db.ForeignKey("users.id",ondelete="CASCADE"),nullable=False); post_id=db.Column(db.Integer,db.ForeignKey("posts.id",ondelete="CASCADE"),nullable=False); created_at=db.Column(db.DateTime,default=utcnow); __table_args__=(db.UniqueConstraint("user_id","post_id",name="uq_like"),)
class Save(db.Model):
    __tablename__="saves"; id=db.Column(db.Integer,primary_key=True); user_id=db.Column(db.Integer,db.ForeignKey("users.id",ondelete="CASCADE"),nullable=False); post_id=db.Column(db.Integer,db.ForeignKey("posts.id",ondelete="CASCADE"),nullable=False); created_at=db.Column(db.DateTime,default=utcnow); __table_args__=(db.UniqueConstraint("user_id","post_id",name="uq_save"),)
class Share(db.Model):
    __tablename__="shares"; id=db.Column(db.Integer,primary_key=True); user_id=db.Column(db.Integer,db.ForeignKey("users.id",ondelete="CASCADE"),nullable=False); post_id=db.Column(db.Integer,db.ForeignKey("posts.id",ondelete="CASCADE"),nullable=False); created_at=db.Column(db.DateTime,default=utcnow)
class Follow(db.Model):
    __tablename__="follows"; id=db.Column(db.Integer,primary_key=True); follower_id=db.Column(db.Integer,db.ForeignKey("users.id",ondelete="CASCADE"),nullable=False,index=True); following_id=db.Column(db.Integer,db.ForeignKey("users.id",ondelete="CASCADE"),nullable=False,index=True); created_at=db.Column(db.DateTime,default=utcnow); __table_args__=(db.UniqueConstraint("follower_id","following_id",name="uq_follow"),db.CheckConstraint("follower_id <> following_id",name="ck_no_self_follow"))
class Comment(db.Model):
    __tablename__="comments"; id=db.Column(db.Integer,primary_key=True); post_id=db.Column(db.Integer,db.ForeignKey("posts.id",ondelete="CASCADE"),nullable=False,index=True); user_id=db.Column(db.Integer,db.ForeignKey("users.id",ondelete="CASCADE"),nullable=False); text=db.Column(db.Text,nullable=False); created_at=db.Column(db.DateTime,default=utcnow)
    def to_dict(self): return {"id":self.id,"post_id":self.post_id,"user":User.query.get(self.user_id).to_dict(),"text":self.text,"created_at":self.created_at.isoformat()}

class Interaction(db.Model):
    __tablename__="interactions"; id=db.Column(db.Integer,primary_key=True); user_id=db.Column(db.Integer,db.ForeignKey("users.id",ondelete="CASCADE"),nullable=False,index=True); post_id=db.Column(db.Integer,db.ForeignKey("posts.id",ondelete="CASCADE"),nullable=False,index=True); event_type=db.Column(db.String(32),nullable=False,index=True); duration_seconds=db.Column(db.Float,default=0); session_id=db.Column(db.String(128)); created_at=db.Column(db.DateTime,default=utcnow,index=True)

class Recommendation(db.Model):
    __tablename__="recommendations"; id=db.Column(db.Integer,primary_key=True); user_id=db.Column(db.Integer,db.ForeignKey("users.id",ondelete="CASCADE"),nullable=False,index=True); post_id=db.Column(db.Integer,db.ForeignKey("posts.id",ondelete="CASCADE"),nullable=False); score=db.Column(db.Float,nullable=False); reason=db.Column(db.String(500)); model_version=db.Column(db.String(64)); created_at=db.Column(db.DateTime,default=utcnow,index=True)

class Notification(db.Model):
    __tablename__="notifications"; id=db.Column(db.Integer,primary_key=True); user_id=db.Column(db.Integer,db.ForeignKey("users.id",ondelete="CASCADE"),nullable=False,index=True); actor_id=db.Column(db.Integer,db.ForeignKey("users.id",ondelete="CASCADE")); type=db.Column(db.String(40),nullable=False); post_id=db.Column(db.Integer,db.ForeignKey("posts.id",ondelete="CASCADE")); read=db.Column(db.Boolean,default=False,index=True); created_at=db.Column(db.DateTime,default=utcnow,index=True)

class Conversation(db.Model):
    __tablename__="conversations"; id=db.Column(db.Integer,primary_key=True); created_at=db.Column(db.DateTime,default=utcnow)
class ConversationMember(db.Model):
    __tablename__="conversation_members"; id=db.Column(db.Integer,primary_key=True); conversation_id=db.Column(db.Integer,db.ForeignKey("conversations.id",ondelete="CASCADE"),nullable=False); user_id=db.Column(db.Integer,db.ForeignKey("users.id",ondelete="CASCADE"),nullable=False); joined_at=db.Column(db.DateTime,default=utcnow); __table_args__=(db.UniqueConstraint("conversation_id","user_id",name="uq_member"),)
class Message(db.Model):
    __tablename__="messages"
    id=db.Column(db.Integer,primary_key=True)
    conversation_id=db.Column(db.Integer,db.ForeignKey("conversations.id",ondelete="CASCADE"),nullable=False,index=True)
    sender_id=db.Column(db.Integer,db.ForeignKey("users.id",ondelete="CASCADE"),nullable=False)
    body=db.Column(db.Text,nullable=False)
    shared_post_id=db.Column(db.Integer,db.ForeignKey("posts.id",ondelete="SET NULL"),nullable=True)
    created_at=db.Column(db.DateTime,default=utcnow,index=True)
    edited_at=db.Column(db.DateTime)
    def to_dict(self):
        post=Post.query.get(self.shared_post_id) if self.shared_post_id else None
        return {
            "id":self.id,
            "conversation_id":self.conversation_id,
            "sender":User.query.get(self.sender_id).to_dict() if self.sender_id else None,
            "body":self.body,
            "shared_post_id":self.shared_post_id,
            "shared_post":post.to_dict() if post else None,
            "created_at":self.created_at.isoformat()
        }

class Community(db.Model):
    __tablename__="communities"
    id=db.Column(db.Integer,primary_key=True)
    name=db.Column(db.String(80),unique=True,nullable=False)
    slug=db.Column(db.String(80),unique=True,nullable=False)
    description=db.Column(db.Text,default="")
    icon=db.Column(db.String(40),default="🪐")
    banner_gradient=db.Column(db.String(120),default="linear-gradient(135deg, #6366f1, #a855f7)")
    created_at=db.Column(db.DateTime,default=utcnow)
    def to_dict(self,viewer=None):
        m_count=CommunityMember.query.filter_by(community_id=self.id).count()
        p_count=Post.query.filter_by(topic_category=self.name).count()
        is_member=bool(viewer and CommunityMember.query.filter_by(community_id=self.id,user_id=viewer).first())
        return {
            "id":self.id,"name":self.name,"slug":self.slug,"description":self.description,
            "icon":self.icon,"banner_gradient":self.banner_gradient,"members_count":m_count,
            "posts_count":p_count,"is_member":is_member
        }

class CommunityMember(db.Model):
    __tablename__="community_members"
    id=db.Column(db.Integer,primary_key=True)
    community_id=db.Column(db.Integer,db.ForeignKey("communities.id",ondelete="CASCADE"),nullable=False)
    user_id=db.Column(db.Integer,db.ForeignKey("users.id",ondelete="CASCADE"),nullable=False)
    joined_at=db.Column(db.DateTime,default=utcnow)
    __table_args__=(db.UniqueConstraint("community_id","user_id",name="uq_comm_member"),)

class AIInsight(db.Model):
    __tablename__="ai_insights"; id=db.Column(db.Integer,primary_key=True); user_id=db.Column(db.Integer,db.ForeignKey("users.id",ondelete="CASCADE"),nullable=False); prompt=db.Column(db.Text,nullable=False); response=db.Column(db.Text,nullable=False); source=db.Column(db.String(40)); created_at=db.Column(db.DateTime,default=utcnow)
class ModelVersion(db.Model):
    __tablename__="model_versions"; id=db.Column(db.Integer,primary_key=True); name=db.Column(db.String(100),nullable=False); version=db.Column(db.String(50),nullable=False); algorithm=db.Column(db.String(120),nullable=False); status=db.Column(db.String(32),default="active"); metrics_json=db.Column(db.Text,default="{}"); created_at=db.Column(db.DateTime,default=utcnow)
class Report(db.Model):
    __tablename__="reports"; id=db.Column(db.Integer,primary_key=True); reporter_id=db.Column(db.Integer,db.ForeignKey("users.id",ondelete="CASCADE"),nullable=False); post_id=db.Column(db.Integer,db.ForeignKey("posts.id",ondelete="CASCADE")); reason=db.Column(db.String(100),nullable=False); details=db.Column(db.Text); status=db.Column(db.String(30),default="open"); created_at=db.Column(db.DateTime,default=utcnow)
class SearchHistory(db.Model):
    __tablename__="search_history"; id=db.Column(db.Integer,primary_key=True); user_id=db.Column(db.Integer,db.ForeignKey("users.id",ondelete="CASCADE"),nullable=False); query=db.Column(db.String(300),nullable=False); created_at=db.Column(db.DateTime,default=utcnow)

