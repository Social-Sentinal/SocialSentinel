# ML pipeline
Post text → Hugging Face transformer → sentiment/emotion + confidence → API result. Recommendation: interaction history → affinity features + text-token similarity + social/freshness/engagement → diversity-aware ranking → persisted recommendation and reason. Production evaluation should use held-out labeled sentiment/emotion sets and Precision@K/Recall@K/NDCG/CTR for ranking.
