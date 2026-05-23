import os

class Config:
    SECRET_KEY = "your_super_secret_key_change_this_later"
    UPLOAD_FOLDER = "uploads"
    MAX_CONTENT_LENGTH = 500 * 1024 * 1024
    ALLOWED_EXTENSIONS = {"mp3", "mp4", "wav", "m4a"}