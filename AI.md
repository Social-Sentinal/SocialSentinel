# GenAI
Frontend prompt → backend assembles user profile + recent interaction/topic context → Ollama `/api/chat` → grounded response. The model never receives unrestricted DB access. Recommendation explanations pass explicit signals. Configure OLLAMA_BASE_URL and OLLAMA_MODEL.
