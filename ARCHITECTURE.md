# Architecture
## Request path
Browser → React → `/api/v1` → JWT middleware → route → service/repository logic → SQLAlchemy → PostgreSQL.

## Personalization
Interactions are persisted for view/skip/like/save/share/comment. The recommendation service derives topic and creator affinity from those events, combines them with token similarity, social graph, freshness and engagement, then applies topic/creator diversity. Recommendation rows persist score, reason and model version.

## AI
Ollama receives only controlled application context assembled by backend services. It is instructed not to invent metrics. Recommendation explanations are generated from explicit stored signals.

## Messaging
Conversation → members → messages. Every message is persisted and creates a notification for other members. Authorization checks membership before reading/sending.

## ML
Sentiment: CardiffNLP Twitter-RoBERTa. Emotion: Hartmann DistilRoBERTa emotion classifier. Both are lazy-loaded and expose confidence/model version. A future worker can process post inference asynchronously without changing the API contract.
