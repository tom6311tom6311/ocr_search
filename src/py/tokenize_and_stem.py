# tokenize_and_stem.py tokenize and stem a given string using NLTK and return a list of stemmed words
# Usage: > python3 tokenize_and_stem.py "<input string>"
# Note: run download_nltk_data.py to download data needed by NLTK package before running this script for the first time

import sys
import nltk
import string
import jieba
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

# get input sentence from system argument
sentence = sys.argv[1]

# remove punctuations
for p in string.punctuation:
  sentence = sentence.replace(p, ' ')

# print(sentence)

# tokenize sentence
words = word_tokenize(sentence)

# split into 2 languages, english and chinese
eng_words = []
chinese_sentence = ''
for w in words:
  if not isPureAscii(w):
    chinese_sentence += w
  else:
    if len(w) > 1 and any(c.isalpha() for c in w) and w not in stopwords.words():
      eng_words.append(w)

# lemmatize english words
lemmatizer = WordNetLemmatizer()
eng_words = [lemmatizer.lemmatize(lemmatizer.lemmatize(w, pos="v")) for w in eng_words]

# output english words
print(eng_words)

# segment chinese sentence
jieba.set_dictionary('model/dict.txt.big')
chinese_sentence = ''.join([c for c in chinese_sentence if u'\u4e00' <= c <= u'\u9fff'])
chinese_words = list(set([w for w in jieba.cut_for_search(chinese_sentence)]))

# output chinese words
print(chinese_words)
