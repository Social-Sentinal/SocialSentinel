#!/usr/bin/env bash
# exit on error
set -o errexit

echo "==> Building React Frontend Assets..."
cd frontend
npm install
npm run build
cd ..

echo "==> Installing Python Dependencies & Downloading NLTK Corpora..."
pip install --upgrade pip
pip install --no-cache-dir --retries 10 --timeout 60 -r requirements.txt
python -c "import nltk; nltk.download('stopwords')"

echo "==> Build Completed Successfully!"
