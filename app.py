from __future__ import annotations
import os
from typing import List, Dict, Any
from flask import Flask, request, jsonify, render_template
import google.generativeai as genai

# Configure Google Generative AI
genai.configure(api_key="AIzaSyDndz9XGHWWDXxoguxv9VUxTdel_hVcckA")

app = Flask(__name__)     

SYSTEM_PROMPT = (
    "You are a helpful, concise assistant for a web chat. "
    "Use clear, friendly language. If a question is ambiguous, make a reasonable assumption and answer."
)

def generate_ai_response(user_message: str, history: List[Dict[str, str]] | None = None) -> str:
    try:
        history = history or []
        chat = genai.GenerativeModel("gemini-1.5-flash").start_chat(
            history=[{"role": turn.get("role"), "parts": [turn.get("content")]} for turn in history]
        )
        response = chat.send_message(user_message)
        return response.text.strip()
    except Exception as e:
        print("[AI ERROR]", e)
        return "Sorry, I couldn't process that. Please try again."

@app.get("/")
def index() -> str:
    return render_template("index.html")

@app.post("/chat")
def chat() -> Any:
    payload: Dict[str, Any] = request.get_json(force=True, silent=True) or {}
    user_message: str = (payload.get("message") or "").strip()
    history: List[Dict[str, str]] = payload.get("history") or []

    if not user_message:
        return jsonify({"ok": False, "error": "Empty message."}), 400

    reply = generate_ai_response(user_message, history)
    return jsonify({"ok": True, "reply": reply})

if __name__ == "__main__":
    app.run(debug=True)
