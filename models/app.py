from flask import Flask, request, jsonify, send_file
from scraping import fetch_top_comments
from predictor import predict_categories, generate_wordclouds
import pandas as pd
from io import BytesIO
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Global in-memory file store
in_memory_csv = BytesIO()

@app.route("/")
def index():
    return jsonify({"status": "SocialSense API is running"})

@app.route("/predict", methods=["POST"])
def predict():
    global in_memory_csv
    data = request.get_json()
    video_link = data.get("video_link")

    if not video_link:
        return jsonify({"error": "Missing 'video_link' in request"}), 400

    try:
        comments_df, video_id = fetch_top_comments(video_link)
        result_df, summary = predict_categories(comments_df)

        in_memory_csv = BytesIO()
        result_df.to_csv(in_memory_csv, index=False)
        in_memory_csv.seek(0)

        wordclouds = generate_wordclouds(result_df)

        response = {
            "video_id": video_id,
            "total_comments": summary["total"],
            "breakdown": summary["breakdown"],
            "download_link": "/download",
            "wordclouds": wordclouds  
        }

        return jsonify(response)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/download", methods=["GET"])
def download_csv():
    global in_memory_csv
    in_memory_csv.seek(0)
    temp = BytesIO(in_memory_csv.read())  # Clone data
    in_memory_csv = BytesIO()             # Clear
    return send_file(temp, as_attachment=True, download_name="batch_predictions.csv", mimetype="text/csv")

if __name__ == "__main__":
    app.run(debug=True)
