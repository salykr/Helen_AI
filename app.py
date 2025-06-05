from flask import Flask, request, jsonify, render_template
from llama_cpp import Llama
from flask_cors import CORS
import uuid
from random import random
import re

# Initialize Flask app and allow CORS
app = Flask(__name__, template_folder="templates")
CORS(app)

# Load BioMistral-7B model with Metal (GPU) support
llm = Llama(
    model_path="../models/mistral-7b-instruct-v0.1.Q4_K_M.gguf",
    n_ctx=2048,
    n_threads=8,
    n_gpu_layers=100,
    verbose=True
)

# Conversation memory
session_histories = {}
session_context_flags = {}  # stores whether the session is in medical context

system_prompt = (
    "You are a calm, articulate, and highly knowledgeable virtual medical assistant, "
    "trained to communicate like a real doctor. Your role is to help users understand "
    "their medical conditions, symptoms, treatments, and terminology with professionalism "
    "and empathy. Speak clearly and naturally—like a physician talking to a patient. Use "
    "accurate medical vocabulary, but explain complex terms briefly and clearly when needed."
)

MEDICAL_KEYWORDS = [
    "pain", "fever", "rash", "headache", "vomiting", "cough", "diarrhea", "nausea",
    "dizzy", "sick", "cramp", "swelling", "infection", "injury", "bleeding", "wound",
    "burn", "symptom", "allergy", "asthma", "fracture", "blood pressure", "pulse",
    "heart", "chest", "hip", "knee", "arm", "leg", "back", "lung", "eye", "ear",
    "throat", "stomach", "urine", "vomit", "fracture", "cut", "lump", "itchy", "itch",
    "numb", "migraine", "disease", "diabetes", "hypertension", "cancer", "tumor",
    "eczema", "skin", "breathe", "breathing", "coughing", "fatigue", "tired", "anemia",
    "discomfort", "paralysis", "broken", "sprain", "bruise", "HIV", "AIDS", "STD"
]

CONTEXT_VERBS = [
    "have", "feel", "got", "getting", "suffering", "hurting", "experience", "experiencing",
    "deal", "diagnosed", "injured", "broke", "fractured", "swollen", "burned", "infected",
    "saw", "noticed", "observed", "lost", "vomited", "bleeding", "detected", "was", "been"
]

def classify_question(question):
    """Classify whether the question is medical or non-medical."""
    score = random()
    label = "medical" if score > 0.6 else "non-medical"

    question_lower = question.lower()
    found_keyword = None

    for keyword in MEDICAL_KEYWORDS:
        if re.search(rf"\b{re.escape(keyword)}\b", question_lower):
            found_keyword = keyword
            break

    if found_keyword:
        for verb in CONTEXT_VERBS:
            if re.search(rf"\b{re.escape(verb)}\b", question_lower):
                print(f"[Context Match] Found medical keyword '{found_keyword}' + verb '{verb}' → override")
                return "medical", 0.95

    print(f"[Classifier] No context-based override. Classifier says {label} ({score:.2f})")
    return label, score

@app.route("/")
def home():
    """Render the index.html page."""
    return render_template("index.html")

@app.route('/ask', methods=['POST'])
def ask():
    data = request.json
    question = data.get("question", "")
    session_id = data.get("session_id")

    if not session_id or session_id == "null":
        session_id = str(uuid.uuid4())
        session_histories[session_id] = [{"role": "system", "content": system_prompt}]
        session_context_flags[session_id] = False  # New session, assume not in medical context

    history = session_histories.get(session_id, [{"role": "system", "content": system_prompt}])
    is_medical_context = session_context_flags.get(session_id, False)

    label, score = classify_question(question)
    print(f"Classification result: {label} (score={score:.2f})")

    if label != "medical":
        # Only allow non-medical messages if already in context
        if not session_context_flags.get(session_id, False):
            return jsonify({
                "response": "Sorry, I can only respond to medical-related questions.",
                "session_id": session_id
            })

    # If the user message is too short or off-topic
    if len(question.split()) < 8 and not any(kw in question.lower() for kw in MEDICAL_KEYWORDS):
        return jsonify({
            "response": "Let’s keep things medical – I can’t answer non-medical questions like that.",
            "session_id": session_id
        })

    # Mark session as medical context
    session_context_flags[session_id] = True

    # Append user message to history
    history.append({"role": "user", "content": question})

    # Build the prompt for the LLM
    prompt = ""
    for turn in history:
        if turn["role"] == "system":
            prompt += turn["content"] + "\n"
        elif turn["role"] == "user":
            prompt += f"[INST] {turn['content']} [/INST]"
        elif turn["role"] == "assistant":
            prompt += turn["content"] + " "

    # Call the model
    response = llm(prompt, max_tokens=300, stop=["</s>"])
    answer = response["choices"][0]["text"].strip()

    # Append assistant response to history
    history.append({"role": "assistant", "content": answer})
    session_histories[session_id] = history

    return jsonify({
        "response": answer,
        "session_id": session_id
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
