from flask import Blueprint, request, jsonify

recommend_bp = Blueprint("recommend", __name__)

print("Recommendation module loaded ✅")

# ── Thresholds ──────────────────────────────────────────────
HIGH_SCORE   = 70   # % and above = good
LOW_SCORE    = 40   # % and below = struggling

# How each emotion affects the recommendation
EMOTION_WEIGHT = {
    "happy":    "positive",
    "neutral":  "positive",
    "surprise": "positive",
    "sad":      "negative",
    "angry":    "negative",
    "fear":     "negative",
    "disgust":  "negative",
}


def get_recommendation(score, emotion, keywords):
    """
    Core recommendation logic.
    Combines quiz score + emotion state → returns a full recommendation plan.
    """
    sentiment = EMOTION_WEIGHT.get(emotion, "positive")
    weak      = keywords[:3] if keywords else ["the recent topic"]

    # ── Case 1: Low score + negative emotion ─────────────────
    if score < LOW_SCORE and sentiment == "negative":
        return {
            "case":  "needs_support",
            "title": "Let's slow down and rebuild 💙",
            "summary": (
                f"You scored {score}% and seem to be feeling {emotion}. "
                "That's completely okay — learning takes time. "
                "Let's go back to the basics and make things clearer."
            ),
            "actions": [
                {"icon": "📖", "label": "Revise easy notes",        "desc": "Re-read the summarized notes from this lecture."},
                {"icon": "🎯", "label": "Take a simpler quiz",      "desc": "Try 3 basic MCQs on: " + ", ".join(weak)},
                {"icon": "⏸️", "label": "Take a 5-minute break",    "desc": "Step away, breathe, then come back fresh."},
                {"icon": "🔁", "label": "Re-watch the lecture",     "desc": "Play the lecture again and focus on weak spots."},
            ],
            "weak_topics": weak,
            "priority":    "high",
            "color":       "#9c27b0",
            "emoji":       "💙",
        }

    # ── Case 2: Low score + positive emotion ─────────────────
    if score < LOW_SCORE and sentiment == "positive":
        return {
            "case":  "needs_practice",
            "title": "Good spirit! Let's strengthen your knowledge 💪",
            "summary": (
                f"You scored {score}% but you seem {emotion} — "
                "great attitude! You just need more practice on specific topics."
            ),
            "actions": [
                {"icon": "📝", "label": "Review key points",         "desc": "Focus on the key points section in your notes."},
                {"icon": "❓", "label": "Redo the quiz",             "desc": "Try the quiz again focusing on: " + ", ".join(weak)},
                {"icon": "🔍", "label": "Deep-dive weak topics",     "desc": f"Study these specifically: {', '.join(weak)}"},
                {"icon": "✍️", "label": "Write a short summary",     "desc": "Write 5 lines about what you learned today."},
            ],
            "weak_topics": weak,
            "priority":    "medium",
            "color":       "#ff9800",
            "emoji":       "💪",
        }

    # ── Case 3: Medium score + negative emotion ───────────────
    if LOW_SCORE <= score < HIGH_SCORE and sentiment == "negative":
        return {
            "case":  "needs_encouragement",
            "title": "You're halfway there — don't give up! 🌟",
            "summary": (
                f"You scored {score}% which is decent, but you seem {emotion}. "
                "Let's boost your mood and push to the next level."
            ),
            "actions": [
                {"icon": "🏆", "label": "Celebrate progress",        "desc": "You already know more than 50% — that matters!"},
                {"icon": "📊", "label": "Review your notes",         "desc": "Skim through notes to reinforce what you know."},
                {"icon": "🎯", "label": "Target weak spots",         "desc": "Focus extra time on: " + ", ".join(weak)},
                {"icon": "😴", "label": "Rest if needed",            "desc": "If you're tired, a short rest improves retention."},
            ],
            "weak_topics": weak,
            "priority":    "medium",
            "color":       "#2196f3",
            "emoji":       "🌟",
        }

    # ── Case 4: Medium score + positive emotion ───────────────
    if LOW_SCORE <= score < HIGH_SCORE and sentiment == "positive":
        return {
            "case":  "almost_there",
            "title": "Almost there — one more push! 🚀",
            "summary": (
                f"You scored {score}% and you're feeling {emotion}. "
                "You're so close to mastering this. A little more effort and you'll nail it."
            ),
            "actions": [
                {"icon": "📚", "label": "Read advanced notes",       "desc": "Go beyond the summary — explore details."},
                {"icon": "❓", "label": "Try harder questions",      "desc": "Attempt the long-answer questions now."},
                {"icon": "🔗", "label": "Connect concepts",          "desc": f"Link {weak[0]} with other topics you know."},
                {"icon": "📝", "label": "Make your own notes",       "desc": "Writing in your own words boosts memory."},
            ],
            "weak_topics": weak,
            "priority":    "low",
            "color":       "#4caf50",
            "emoji":       "🚀",
        }

    # ── Case 5: High score + negative emotion ────────────────
    if score >= HIGH_SCORE and sentiment == "negative":
        return {
            "case":  "high_score_tired",
            "title": "Excellent score! But take care of yourself 🌿",
            "summary": (
                f"You scored {score}% — that's impressive! "
                f"But you seem {emotion}. Make sure to rest — "
                "your brain needs recovery to retain what you learned."
            ),
            "actions": [
                {"icon": "🌿", "label": "Take a proper break",       "desc": "Rest for 15-20 minutes before continuing."},
                {"icon": "🏆", "label": "You've earned it",          "desc": "Celebrate this score — great work today!"},
                {"icon": "🔁", "label": "Light revision tomorrow",   "desc": "Do a quick 5-min review tomorrow morning."},
                {"icon": "💤", "label": "Sleep consolidates memory", "desc": "A good night's sleep locks in what you learned."},
            ],
            "weak_topics": weak,
            "priority":    "low",
            "color":       "#4caf50",
            "emoji":       "🌿",
        }

    # ── Case 6: High score + positive emotion ────────────────
    return {
        "case":  "excelling",
        "title": "You're excelling! Time for advanced challenges 🎓",
        "summary": (
            f"You scored {score}% and you're feeling {emotion}. "
            "You've mastered this lecture. Time to go deeper and challenge yourself!"
        ),
        "actions": [
            {"icon": "🎓", "label": "Explore advanced concepts",  "desc": f"Go deeper into: {', '.join(weak)}"},
            {"icon": "❓", "label": "Try difficult questions",    "desc": "Attempt long-answer and application questions."},
            {"icon": "🧠", "label": "Teach someone else",         "desc": "Explaining to others is the best way to master."},
            {"icon": "📈", "label": "Move to next lecture",       "desc": "You're ready for the next topic!"},
        ],
        "weak_topics": weak,
        "priority":    "none",
        "color":       "#6c63ff",
        "emoji":       "🎓",
    }


@recommend_bp.route("/recommend", methods=["POST"])
def recommend():
    data        = request.get_json()
    score       = int(data.get("score", 0))
    emotion     = data.get("emotion", "neutral").lower()
    keywords    = data.get("keywords", [])

    recommendation = get_recommendation(score, emotion, keywords)

    return jsonify(recommendation), 200