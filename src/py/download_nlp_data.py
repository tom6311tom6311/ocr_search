# download_nltk_data.py downloads data needed by NLTK
# Usage: > python3 download_nltk_data.py

import os
import ssl
import nltk
import urllib.request

MODEL_DIR_PATH = 'model'

# download needed NLTK data
try:
  _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
  pass
else:
  ssl._create_default_https_context = _create_unverified_https_context

nltk.download('punkt')
nltk.download('wordnet')
nltk.download('stopwords')
# download needed NLTK data

# download dictionary for jieba chinese segmentation tool
if not os.path.exists(MODEL_DIR_PATH):
  os.makedirs(MODEL_DIR_PATH)
urllib.request.urlretrieve("https://github.com/fxsjy/jieba/raw/master/extra_dict/dict.txt.big", f"{MODEL_DIR_PATH}/dict.txt.big")
