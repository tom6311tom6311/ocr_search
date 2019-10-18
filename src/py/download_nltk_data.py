# download_nltk_data.py downloads data needed by NLTK
# Usage: > python3 download_nltk_data.py

import ssl
import nltk

try:
  _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
  pass
else:
  ssl._create_default_https_context = _create_unverified_https_context

nltk.download('punkt')
nltk.download('wordnet')
nltk.download('stopwords')
