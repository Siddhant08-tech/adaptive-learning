from flask import Blueprint, request, jsonify
import base64
import numpy as np
import cv2
from deepface import DeepFace

emotion_bp = Blueprint("emotion", __name__)

print("Emotion module loaded ✅")

EMOTION_MAP = {
    "happy":    {"state": "Engaged",    "emoji": "😊", "color": "#4caf50", "tip": "Great! You're in the zone. Keep going!"},
    "neutral":  {"state": "Focused",    "emoji": "😐", "color": "#2196f3", "tip": "You seem focused. Good concentration!"},
    "surprise": {"state": "Curious",    "emoji": "😮", "color": "#ff9800", "tip": "You look curious! Explore this topic more."},
    "sad":      {"state": "Struggling", "emoji": "😢", "color": "#9c27b0", "tip": "You look low. Take a short break."},
    "angry":    {"state": "Frustrated", "emoji": "😠", "color": "#f44336", "tip": "You seem frustrated. Try easier content first."},
    "fear":     {"state": "Confused",   "emoji": "😨", "color": "#ff5722", "tip": "You look confused. Revisit the basics."},
    "disgust":  {"state": "Disengaged", "emoji": "😒", "color": "#607d8b", "tip": "You seem disengaged. Try a short quiz!"},
}


def to_python_type(obj):
    """Convert numpy types to native Python types for JSON serialization"""
    if isinstance(obj, np.floating):
        return float(obj)
    if isinstance(obj, np.integer):
        return int(obj)
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    return obj


@emotion_bp.route("/detect-emotion", methods=["POST"])
def detect_emotion():
    data = request.get_json()
    image_data = data.get("image", "")

    if not image_data:
        return jsonify({"error": "No image provided"}), 400

    try:
        if "," in image_data:
            image_data = image_data.split(",")[1]

        img_bytes = base64.b64decode(image_data)
        np_arr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if frame is None:
            return jsonify({"error": "Could not decode image"}), 400

        result = DeepFace.analyze(
            frame,
            actions=["emotion"],
            enforce_detection=False,
            silent=True
        )

        if isinstance(result, list):
            result = result[0]

        dominant_emotion = result["dominant_emotion"]
        emotion_scores = result["emotion"]

        # Convert all scores to plain Python floats
        clean_scores = {k: round(float(v), 1) for k, v in emotion_scores.items()}

        top_emotions = sorted(clean_scores.items(), key=lambda x: x[1], reverse=True)[:3]
        top_emotions = [{"emotion": e, "score": s} for e, s in top_emotions]

        mapped = EMOTION_MAP.get(dominant_emotion, {
            "state": "Unknown", "emoji": "🤔", "color": "#888",
            "tip": "Keep your face visible to the camera."
        })

        return jsonify({
            "dominant_emotion": dominant_emotion,
            "learning_state": mapped["state"],
            "emoji": mapped["emoji"],
            "color": mapped["color"],
            "tip": mapped["tip"],
            "top_emotions": top_emotions,
            "all_scores": clean_scores
        }), 200

    except Exception as e:
        print(f"Emotion error: {str(e)}")
        return jsonify({"error": str(e)}), 500