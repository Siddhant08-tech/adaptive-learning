from flask import Blueprint, request, jsonify
import os
import re
import random
import nltk
from nltk.corpus import stopwords
from rake_nltk import Rake

quiz_bp = Blueprint("quiz", __name__)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")

nltk.download("stopwords", quiet=True)
nltk.download("punkt", quiet=True)
nltk.download("punkt_tab", quiet=True)

print("Quiz module loaded ✅")


def get_sentences(text):
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    return [s.strip() for s in sentences if len(s.split()) > 6]


def extract_keyphrases(text, count=20):
    rake = Rake()
    rake.extract_keywords_from_text(text)
    phrases = rake.get_ranked_phrases()
    # Filter: only phrases between 1 and 4 words
    filtered = [p for p in phrases if 1 <= len(p.split()) <= 4]
    return filtered[:count]


def generate_mcqs(text, num=5):
    sentences = get_sentences(text)
    keyphrases = extract_keyphrases(text, count=30)

    if len(keyphrases) < 4:
        return []

    mcqs = []
    used_sentences = set()

    for sentence in sentences:
        if len(mcqs) >= num:
            break

        # Find a keyphrase that appears in this sentence
        answer = None
        for phrase in keyphrases:
            if phrase.lower() in sentence.lower() and sentence not in used_sentences:
                answer = phrase
                break

        if not answer:
            continue

        # Create the question by blanking the answer
        question = re.sub(re.escape(answer), "______", sentence, flags=re.IGNORECASE)

        # Generate wrong options from other keyphrases
        wrong_options = [p for p in keyphrases if p.lower() != answer.lower()]
        random.shuffle(wrong_options)
        distractors = wrong_options[:3]

        if len(distractors) < 3:
            continue

        options = distractors + [answer]
        random.shuffle(options)
        correct_index = options.index(answer)
        labels = ["A", "B", "C", "D"]

        mcqs.append({
            "question": question,
            "options": {labels[i]: options[i] for i in range(4)},
            "answer": labels[correct_index],
            "answer_text": answer
        })
        used_sentences.add(sentence)

    return mcqs


def generate_short_questions(text, num=5):
    sentences = get_sentences(text)
    keyphrases = extract_keyphrases(text, count=20)
    questions = []

    templates = [
        "What is {}?",
        "Define {} in the context of this topic.",
        "Explain the concept of {}.",
        "What role does {} play?",
        "How is {} related to the main topic?",
        "Why is {} important?",
    ]

    used = set()
    for phrase in keyphrases:
        if len(questions) >= num:
            break
        if phrase in used:
            continue
        template = random.choice(templates)
        questions.append({
            "question": template.format(phrase),
            "type": "short",
            "hint": f"Look for mentions of '{phrase}' in your notes"
        })
        used.add(phrase)

    return questions


def generate_long_questions(text, num=3):
    sentences = get_sentences(text)
    keyphrases = extract_keyphrases(text, count=10)

    templates = [
        "Discuss the significance of {} in detail with examples.",
        "Explain {} and how it connects to the broader topic covered in the lecture.",
        "Compare and contrast different aspects of {} as discussed in the lecture.",
        "Analyze the role of {} and its implications.",
        "Describe {} comprehensively, covering all key aspects.",
    ]

    questions = []
    used = set()

    for phrase in keyphrases:
        if len(questions) >= num:
            break
        if phrase in used:
            continue
        template = random.choice(templates)
        questions.append({
            "question": template.format(phrase),
            "type": "long",
            "hint": f"Your answer should be at least 3-4 sentences covering '{phrase}'"
        })
        used.add(phrase)

    return questions


@quiz_bp.route("/generate-quiz", methods=["POST"])
def generate_quiz():
    data = request.get_json()
    transcript = data.get("transcript", "").strip()
    summary = data.get("summary", "").strip()

    # Use transcript if available, otherwise fall back to summary
    text = transcript if transcript else summary

    if not text or len(text.split()) < 30:
        return jsonify({"error": "Not enough text to generate questions"}), 400

    try:
        print("Generating quiz questions...")

        mcqs = generate_mcqs(text, num=5)
        short_qs = generate_short_questions(text, num=5)
        long_qs = generate_long_questions(text, num=3)

        total = len(mcqs) + len(short_qs) + len(long_qs)
        print(f"Generated {total} questions ✅")

        return jsonify({
            "message": f"Generated {total} questions ✅",
            "mcqs": mcqs,
            "short_questions": short_qs,
            "long_questions": long_qs,
            "total": total
        }), 200

    except Exception as e:
        print(f"Quiz error: {str(e)}")
        return jsonify({"error": str(e)}), 500