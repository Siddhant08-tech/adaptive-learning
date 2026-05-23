from flask import Blueprint, request, jsonify
import os
import re
from sumy.parsers.plaintext import PlaintextParser
from sumy.nlp.tokenizers import Tokenizer
from sumy.summarizers.lsa import LsaSummarizer
import nltk

notes_bp = Blueprint("notes", __name__)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")

# Download required nltk data
nltk.download("punkt", quiet=True)
nltk.download("punkt_tab", quiet=True)
nltk.download("stopwords", quiet=True)

print("Notes module loaded ✅")


def extract_keywords(text, top_n=10):
    stopwords = set([
        "the", "a", "an", "and", "or", "but", "in", "on", "at", "to",
        "for", "of", "with", "is", "are", "was", "were", "it", "this",
        "that", "be", "as", "by", "we", "you", "i", "he", "she", "they",
        "have", "has", "had", "do", "does", "did", "will", "would", "can",
        "could", "should", "not", "so", "if", "then", "than", "from",
        "into", "about", "which", "when", "there", "their", "what", "also",
        "its", "just", "like", "very", "been", "our", "your", "more"
    ])
    words = re.findall(r'\b[a-zA-Z]{4,}\b', text.lower())
    freq = {}
    for word in words:
        if word not in stopwords:
            freq[word] = freq.get(word, 0) + 1
    sorted_words = sorted(freq, key=freq.get, reverse=True)
    return sorted_words[:top_n]


def extract_key_points(text):
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    key = [s.strip() for s in sentences if 40 < len(s) < 300]
    return key[:6]


def summarize_text(text, sentence_count=8):
    parser = PlaintextParser.from_string(text, Tokenizer("english"))
    summarizer = LsaSummarizer()
    summary_sentences = summarizer(parser.document, sentence_count)
    return " ".join(str(s) for s in summary_sentences)


@notes_bp.route("/generate-notes", methods=["POST"])
def generate_notes():
    data = request.get_json()
    transcript = data.get("transcript", "").strip()

    if not transcript:
        return jsonify({"error": "No transcript provided"}), 400

    if len(transcript.split()) < 30:
        return jsonify({"error": "Transcript too short to summarize"}), 400

    try:
        print("Generating notes...")

        summary = summarize_text(transcript, sentence_count=8)
        keywords = extract_keywords(transcript)
        key_points = extract_key_points(transcript)

        # Save to file
        notes_filename = f"notes_{len(os.listdir(UPLOAD_FOLDER))}.txt"
        notes_path = os.path.join(UPLOAD_FOLDER, notes_filename)

        with open(notes_path, "w", encoding="utf-8") as f:
            f.write("=== SUMMARY ===\n\n")
            f.write(summary + "\n\n")
            f.write("=== KEY POINTS ===\n\n")
            for i, pt in enumerate(key_points, 1):
                f.write(f"{i}. {pt}\n")
            f.write("\n=== KEYWORDS ===\n\n")
            f.write(", ".join(keywords))

        print("Notes generated ✅")

        return jsonify({
            "message": "Notes generated successfully ✅",
            "summary": summary,
            "key_points": key_points,
            "keywords": keywords,
            "notes_file": notes_filename
        }), 200

    except Exception as e:
        print(f"Notes error: {str(e)}")
        return jsonify({"error": str(e)}), 500