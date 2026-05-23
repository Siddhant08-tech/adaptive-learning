from flask import Blueprint, request, jsonify
import whisper
import os

transcribe_bp = Blueprint("transcribe", __name__)

print("Loading Whisper model... please wait ⏳")
model = whisper.load_model("base")
print("Whisper model loaded ✅")

# This gets the absolute path to the uploads folder
# no matter where Flask is run from
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")


@transcribe_bp.route("/transcribe", methods=["POST"])
def transcribe():
    data = request.get_json()
    filename = data.get("filename")

    if not filename:
        return jsonify({"error": "No filename provided"}), 400

    file_path = os.path.join(UPLOAD_FOLDER, filename)

    # Debug line — you'll see the exact path in your terminal
    print(f"Looking for file at: {file_path}")
    print(f"File exists: {os.path.exists(file_path)}")

    if not os.path.exists(file_path):
        return jsonify({"error": f"File not found at path: {file_path}"}), 404

    try:
        print(f"Transcribing: {filename}")
        result = model.transcribe(file_path)
        transcript = result["text"].strip()

        transcript_filename = filename.rsplit(".", 1)[0] + "_transcript.txt"
        transcript_path = os.path.join(UPLOAD_FOLDER, transcript_filename)

        with open(transcript_path, "w", encoding="utf-8") as f:
            f.write(transcript)

        print(f"Transcription done ✅ — {len(transcript)} characters")

        return jsonify({
            "message": "Transcription successful ✅",
            "transcript": transcript,
            "transcript_file": transcript_filename,
            "word_count": len(transcript.split()),
            "char_count": len(transcript)
        }), 200

    except Exception as e:
        print(f"Transcription error: {str(e)}")
        return jsonify({"error": str(e)}), 500


@transcribe_bp.route("/transcript/<filename>", methods=["GET"])
def get_transcript(filename):
    path = os.path.join(UPLOAD_FOLDER, filename)
    if not os.path.exists(path):
        return jsonify({"error": "Transcript not found"}), 404

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    return jsonify({"transcript": content}), 200