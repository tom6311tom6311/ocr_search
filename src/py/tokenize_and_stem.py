# tokenize_and_stem.py tokenize and stem a given string using NLTK and return a list of stemmed words
# Usage: > python3 tokenize_and_stem.py "<input string>"
# Note: run download_nltk_data.py to download data needed by NLTK package before running this script for the first time

import sys
import nltk
import string
import jieba
import json
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from nltk.tokenize import word_tokenize

# isPureAscii(s) detemines if an input string `s` contains only ascii characters
def isPureAscii(s):
  try:
    s.encode(encoding='utf-8').decode('ascii')
  except UnicodeDecodeError:
    return False
  else:
    return True

# get input text from system argument
text = sys.argv[1]

# remove punctuations
for p in string.punctuation:
  text = text.replace(p, ' ')

# print(text)

# tokenize text
words = word_tokenize(text)

# split into 2 languages, english and chinese
eng_words = []
chi_text = ''
for w in words:
  if not isPureAscii(w):
    chi_text += w
  else:
    if len(w) > 1 and any(c.isalpha() for c in w) and w not in stopwords.words():
      eng_words.append(w)

# lemmatize english words
lemmatizer = WordNetLemmatizer()
eng_terms = [lemmatizer.lemmatize(lemmatizer.lemmatize(w, pos="v")) for w in eng_words]

# segment chinese text
# jieba.set_dictionary('model/dict.txt.big')
chi_text = ''.join([c for c in chi_text if u'\u4e00' <= c <= u'\u9fff'])
chi_terms = [w for w in jieba.cut_for_search(chi_text)]

# merge term lists
terms = eng_terms + chi_terms

# count term frequencies
term_freq_dict = {}
for t in terms:
  if (t in term_freq_dict):
    term_freq_dict[t] += 1
  else:
    term_freq_dict[t] = 1

# output
print(json.dumps(term_freq_dict))
