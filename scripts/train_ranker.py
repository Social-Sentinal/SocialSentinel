"""Train a small XGBoost/GradientBoosting-compatible ranking baseline from live DB events.
Run with: python scripts/train_ranker.py
"""
import os, json, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from app import create_app
from app.extensions import db
from app.models import Interaction, Post

app=create_app()
with app.app_context():
    rows=[]
    for i in Interaction.query.all():
        p=Post.query.get(i.post_id)
        if not p: continue
        engagement=1 if i.event_type in {'like','save','share','comment','long_view'} else 0
        rows.append([p.likes_count or 0,p.comments_count or 0,p.views_count or 0,p.saves_count or 0,p.shares_count or 0,i.duration_seconds or 0,engagement])
    if len(rows)<10:
        print('Need at least 10 interaction rows; keeping hybrid ranker active.')
        raise SystemExit(0)
    X=[r[:-1] for r in rows]; y=[r[-1] for r in rows]
    try:
        from xgboost import XGBClassifier
        model=XGBClassifier(n_estimators=120,max_depth=4,learning_rate=.08,subsample=.9,colsample_bytree=.9,eval_metric='logloss')
        model.fit(X,y); os.makedirs('models/ranker',exist_ok=True); model.save_model('models/ranker/ranker.json'); meta={'algorithm':'XGBoost engagement ranker','features':['likes','comments','views','saves','shares','duration'],'samples':len(rows)}
        open('models/ranker/metadata.json','w').write(json.dumps(meta,indent=2)); print('Saved models/ranker/ranker.json')
    except ImportError:
        from sklearn.ensemble import GradientBoostingClassifier
        import joblib
        model=GradientBoostingClassifier(random_state=42); model.fit(X,y); os.makedirs('models/ranker',exist_ok=True); joblib.dump(model,'models/ranker/ranker.joblib'); print('Saved GradientBoosting fallback ranker.')
