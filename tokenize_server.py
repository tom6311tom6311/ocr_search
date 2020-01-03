import socket 
import sys
import nltk
import string
import jieba
import json
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from nltk.tokenize import word_tokenize
TRANS_SIZE = 4096

def isPureAscii(s):
    try:
        s.encode(encoding='utf-8').decode('ascii')
    except UnicodeDecodeError:
        return False
    else:
        return True


def tokenlize(text):
    # get input text from system argument
    # text = sys.argv[1]

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

    term_freq_dict = {}
    for t in terms:
        if (t in term_freq_dict):
            term_freq_dict[t] += 1
        else:
            term_freq_dict[t] = 1                                                
    
    # output
    return (json.dumps(term_freq_dict))


class server():
    def __init__ (self):
        self.ip = "localhost"
        self.port = 4567                                   
        self.server_ready = False
        tokenlize('server 嗨')

    def user_listen(self):   
        self.user_server = socket.socket(socket.AF_INET,socket.SOCK_STREAM)
        self.user_server.bind((self.ip, self.port))
        self.user_server.listen(10)
        self.user_server_ready = True
        
        while True:
            conn,addr = self.user_server.accept()
            #print(conn,addr) 
            try:
                data = conn.recv(TRANS_SIZE).decode()
                text = data[data.find('GET ')+4:data.find(' HTTP')]
                d = tokenlize(text)
                to_send = json.dumps(d)
                conn.send(to_send.encode('utf-8'))                                                                                                                                         
            except:
                conn.send('error')
                print('error')
            conn.close()

s = server()
s.user_listen()
