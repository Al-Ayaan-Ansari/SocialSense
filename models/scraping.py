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

def fetch_top_comments(video_link, max_scrape=500, final_count=200):
    video_id = extract_video_id(video_link)
    youtube = googleapiclient.discovery.build(api_service_name, api_version, developerKey=DEVELOPER_KEY)

    comments = []
    next_page_token = None

    while True:
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

        next_page_token = response.get('nextPageToken')
        
        # Exit conditions
        if not next_page_token or len(comments) >= max_scrape:
            break

    # Adjust if scraped less than requested
    df = pd.DataFrame(comments)
    df_sorted = df.sort_values(by='like_count', ascending=False).head(min(final_count, len(df)))
    df_sorted.reset_index(drop=True, inplace=True)
    df_sorted.index += 1
    df_sorted.rename(columns={'text': 'Comment'}, inplace=True)
    df_sorted['ID'] = df_sorted.index
    return df_sorted[['ID', 'Comment']], video_id
