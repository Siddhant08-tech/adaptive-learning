from flask import Blueprint, request, jsonify
from flask_bcrypt import Bcrypt
import jwt
import datetime

auth_bp = Blueprint("auth", __name__)
bcrypt = Bcrypt()

# Temporary in-memory user store (we'll connect Firebase later)
users_db = {}

@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    name = data.get("name")

    if not email or not password or not name:
        return jsonify({"error": "All fields required"}), 400

    if email in users_db:
        return jsonify({"error": "User already exists"}), 409

    hashed_pw = bcrypt.generate_password_hash(password).decode("utf-8")
    users_db[email] = {"name": name, "email": email, "password": hashed_pw}

    return jsonify({"message": "Signup successful"}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    user = users_db.get(email)
    if not user:
        return jsonify({"error": "User not found"}), 404

    if not bcrypt.check_password_hash(user["password"], password):
        return jsonify({"error": "Wrong password"}), 401

    token = jwt.encode(
        {
            "email": email,
            "name": user["name"],
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24),
        },
        "your_super_secret_key_change_this_later",
        algorithm="HS256",
    )

    return jsonify({"token": token, "name": user["name"], "email": email}), 200