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
pip install -r requirements.txt
python -c "import nltk; nltk.download('stopwords')"

echo "==> Build Completed Successfully!"
