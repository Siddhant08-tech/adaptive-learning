from flask import Flask
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from config import Config
from routes.auth import auth_bp
from routes.upload import upload_bp
from routes.transcribe import transcribe_bp
from routes.notes import notes_bp
from routes.quiz import quiz_bp
from routes.emotion import emotion_bp
from routes.recommend import recommend_bp              # ← NEW
import os

app = Flask(__name__)
app.config.from_object(Config)

CORS(app)
bcrypt = Bcrypt(app)

app.register_blueprint(auth_bp, url_prefix="/auth")
app.register_blueprint(upload_bp, url_prefix="/lecture")
app.register_blueprint(transcribe_bp, url_prefix="/ai")
app.register_blueprint(notes_bp, url_prefix="/ai")
app.register_blueprint(quiz_bp, url_prefix="/ai")
app.register_blueprint(emotion_bp, url_prefix="/ai")
app.register_blueprint(recommend_bp, url_prefix="/ai")        # ← NEW

os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

@app.route("/")
def home():
    return {"message": "Adaptive Learning API is running ✅"}

if __name__ == "__main__":
    app.run(debug=True, port=5000)