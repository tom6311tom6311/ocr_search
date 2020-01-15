import numpy as np
import json
import lightgbm as lgb
from tqdm import tqdm

'''
with open('docIdTermsDict.json', 'r') as jsonfile:
    data = json.load(jsonfile)
allTermSet = set()


for key,value in data.items():
    for v in value:
        allTermSet.add(v)


#print(len(allTermSet))

allTermList = list(allTermSet)
leng = len(allTermList)


train_data = []
train_label = []
cou = 0
for docId, terms in tqdm(data.items()):
    #ss = np.zeros(len(data.keys()))
    #ss[cou] = 1
    #train_label.append(ss)
    train_label.append(cou)
    li = np.zeros(leng)
    for term in terms:
        li[allTermList.index(term)] = 1
    train_data.append(li)
    cou+=1
        
#print(np.sum(train_data[0]))
train_data = np.array(train_data)
train_label = np.array(train_label)
np.save('train_data', train_data)
np.save('train_label', train_label)

'''
x = np.load('train_data.npy')
y = np.load('train_label.npy')


trainX = x #[:int(len(x)*0.8)]
trainY = y #[:int(len(y)*0.8)]

validX = x[int(len(x)*0.8):]
validY = y[int(len(y)*0.8):]

print(len(x[1]))
params = {
    "objective" : "multiclass",
    "num_class" : len(x),
    "boosting_type": 'gbdt',
    "num_leaves": 100,
    "learning_rate": 0.1,
    "feature_fraction": 0.5,
    "bagging_fraction": 0.8,
    "bagging_freq": 5,
    "verbose": -1
    }

print(x.shape)

lgtrain, lgval = lgb.Dataset(trainX, trainY), lgb.Dataset(validX, validY)
lgbmodel = lgb.train(params, lgtrain, 1000, valid_sets=[lgtrain,lgval])



