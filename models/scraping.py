import googleapiclient.discovery
import pandas as pd
import re
import os
from dotenv import load_dotenv

load_dotenv()

DEVELOPER_KEY = os.getenv("DEVELOPER_KEY")

if not DEVELOPER_KEY:
    raise ValueError("Missing API KEY in .env file")

api_service_name = "youtube"
api_version = "v3"

def extract_video_id(link):
    match = re.search(r"(?:v=|youtu\.be/)([A-Za-z0-9_-]{11})", link)
    return match.group(1) if match else link

def fetch_top_comments(video_link, max_scrape=10, final_count=5):
    video_id = extract_video_id(video_link)
    youtube = googleapiclient.discovery.build(api_service_name, api_version, developerKey=DEVELOPER_KEY)

    comments = []
    next_page_token = None

    while len(comments) < max_scrape:
        request = youtube.commentThreads().list(
            part="snippet",
            videoId=video_id,
            maxResults=100,
            pageToken=next_page_token
        )
        response = request.execute()

        for item in response['items']:
            comment = item['snippet']['topLevelComment']['snippet']
            comments.append({
                'author': comment['authorDisplayName'],
                'like_count': comment['likeCount'],
                'text': comment['textDisplay']
            })
            if len(comments) >= max_scrape:
                break

        next_page_token = response.get('nextPageToken')
        if not next_page_token:
            break

    df = pd.DataFrame(comments)
    df_sorted = df.sort_values(by='like_count', ascending=False).head(final_count)
    df_sorted.reset_index(drop=True, inplace=True)
    df_sorted.index += 1
    df_sorted.rename(columns={'text': 'Comment'}, inplace=True)
    df_sorted['ID'] = df_sorted.index
    df_sorted.rename(columns={'like_count': 'Likes'}, inplace=True)
    return df_sorted[['ID', 'Comment', 'Likes']], video_id

