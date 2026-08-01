import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from gensim.models import Word2Vec

from app.config import MODELS_DIR
from app.utils.data_loader import load_dataset
from app.utils.text_utils import clean_text

_df = None
_word2vec_model = None


def get_dataset_and_model():
    global _df, _word2vec_model

    if _df is None:
        _df = load_dataset("content_with_logic.csv")
        if _df.empty:
            # Fallback mock dataset if content_with_logic.csv fails to load
            _df = pd.DataFrame({
                "Caption": ["Exploring nature and hiking", "Morning coffee time", "City lights and nightlife"],
                "Hashtags": ["#nature #hiking", "#coffee #morning", "#city #night"]
            })

        _df["Caption"] = _df["Caption"].fillna("")
        _df["Hashtags"] = _df["Hashtags"].fillna("")
        _df["content"] = _df["Caption"] + " " + _df["Hashtags"]
        _df["clean_content"] = _df["content"].apply(clean_text)
        _df["tokenized_content"] = _df["clean_content"].apply(lambda x: x.split())

    if _word2vec_model is None:
        model_path = MODELS_DIR / "word2vec_model.model"
        if model_path.exists():
            try:
                _word2vec_model = Word2Vec.load(str(model_path))
            except Exception as e:
                print(f"[Warning] Failed to load saved Word2Vec model: {e}")
                _word2vec_model = None

        if _word2vec_model is None:
            # Train Word2Vec on the fly if model file isn't present
            sentences = _df["tokenized_content"].tolist()
            _word2vec_model = Word2Vec(
                sentences=sentences, vector_size=100, window=5, min_count=1, workers=2
            )

    return _df, _word2vec_model


def get_avg_word2vec(tokens: list[str], model: Word2Vec) -> np.ndarray:
    vectors = [model.wv[word] for word in tokens if word in model.wv]
    return np.mean(vectors, axis=0) if vectors else np.zeros(100)


def recommend_posts(user_input: str, num_recommendations: int = 6) -> list[dict]:
    df, model = get_dataset_and_model()

    cleaned_input = clean_text(user_input)
    input_tokens = cleaned_input.split()

    user_embedding = get_avg_word2vec(input_tokens, model)

    if "content_embeddings" not in df.columns:
        df["content_embeddings"] = df["tokenized_content"].apply(
            lambda tokens: get_avg_word2vec(tokens, model)
        )

    embeddings_matrix = np.array(df["content_embeddings"].tolist())
    similarities = cosine_similarity(user_embedding.reshape(1, -1), embeddings_matrix)[0]

    top_indices = np.argsort(similarities)[-num_recommendations:][::-1]
    recommended_df = df.iloc[top_indices]

    results = []
    for _, row in recommended_df.iterrows():
        results.append({
            "Caption": row.get("Caption", ""),
            "Hashtags": row.get("Hashtags", "")
        })

    return results
