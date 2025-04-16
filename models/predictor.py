import joblib
import pandas as pd
import re
from nltk.stem import PorterStemmer
from collections import Counter
from scraping import extract_video_id
from wordcloud import WordCloud
import matplotlib.pyplot as plt
import os

ps = PorterStemmer()
tfidf = joblib.load("tfidf_transformer.pkl")
model = joblib.load("Trained_Model.pkl")
label_encoder = joblib.load("label_encoder.pkl")

def clean_and_stem_text(text):
    text = text.lower()
    text = re.sub(r'[^a-z\s]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return ' '.join(ps.stem(word) for word in text.split())

def predict_categories(df):
    df['Cleaned'] = df['Comment'].apply(clean_and_stem_text)
    X = tfidf.transform(df['Cleaned'])
    y_pred = model.predict(X)
    labels = label_encoder.inverse_transform(y_pred)

    df['Label'] = labels

    total = len(labels)
    breakdown = dict(Counter(labels))
    percentages = {k: round((v / total) * 100, 2) for k, v in breakdown.items()}

    return df[['ID', 'Comment', 'Likes', 'Label']], {
        "video_id": extract_video_id(df['Comment'].iloc[0]),
        "total": total,
        "breakdown": percentages
    }

import shutil
from flask import current_app
import uuid
def generate_wordclouds(result_df):
    wordcloud_paths = {}

    static_folder = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static", "wordclouds_temp")

    os.makedirs(static_folder, exist_ok=True)

    for label in result_df['Label'].unique():
        text = " ".join(result_df[result_df['Label'] == label]['Comment'])
        wordcloud = WordCloud(width=800, height=400, background_color='white').generate(text)
        filename = f"{label.lower().replace(' ', '_')}.png"
        file_path = os.path.join(static_folder, filename)
        wordcloud.to_file(file_path)
        wordcloud_paths[label] = f"/static/wordclouds_temp/{filename}"

    return wordcloud_paths
