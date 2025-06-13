import json
import uuid
import re
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from llama_cpp import Llama

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

def classify_with_llm(question: str) -> str:
    """
    Ask the LLM to label the question as 'medical' or 'non-medical'.
    """
    prompt = (
        "Classify the following user query as “medical” or “non-medical”:\n\n"
        f"“{question}”\n\n"
        "Answer in exactly this JSON format:\n"
        '{ "label": "<medical|non-medical>" }'
    )
    # temperature=0 for consistency
    resp = llm(prompt, max_tokens=12, temperature=0, stop=["}"])
    text = resp["choices"][0]["text"].strip() + "}"
    try:
        data = json.loads(text)
        return data.get("label", "non-medical")
    except json.JSONDecodeError:
        # fallback if LLM didn’t stick to format
        return "non-medical"

@app.route("/")
def home():
    """Render the index.html page."""
    return render_template("index.html")

@app.route('/ask', methods=['POST'])
def ask():
    data = request.json
    question = data.get("question", "").strip()
    session_id = data.get("session_id")

    # Initialize new session if needed
    if not session_id or session_id == "null":
        session_id = str(uuid.uuid4())
        session_histories[session_id] = [{"role": "system", "content": system_prompt}]
        session_context_flags[session_id] = False

    history = session_histories.setdefault(session_id, [{"role": "system", "content": system_prompt}])
    is_medical_context = session_context_flags.get(session_id, False)

    # 1) Classify via LLM
    label = classify_with_llm(question)
    print(f"[LLM Classifier] Question labeled: {label}")

    # 2) Enforce medical-only until context is set
    if label != "medical" and not is_medical_context:
        return jsonify({
            "response": "Sorry, I can only respond to medical-related questions.",
            "session_id": session_id
        })

    # # 3) Reject very short or off-topic inputs
    # if len(question.split()) < 8:
    #     return jsonify({
    #         "response": "Let’s keep things medical – I can’t answer non-medical questions like that.",
    #         "session_id": session_id
    #     })

    # 4) Mark session as medical context
    session_context_flags[session_id] = True

    # 5) Append user message to history
    history.append({"role": "user", "content": question})

    # 6) Build the prompt for the LLM
    prompt = ""
    for turn in history:
        if turn["role"] == "system":
            prompt += turn["content"] + "\n"
        elif turn["role"] == "user":
            prompt += f"[INST] {turn['content']} [/INST] "
        elif turn["role"] == "assistant":
            prompt += turn["content"] + " "

    # 7) Call the model for the actual answer
    response = llm(prompt, max_tokens=300, stop=["</s>"])
    answer = response["choices"][0]["text"].strip()

    # 8) Append assistant response to history
    history.append({"role": "assistant", "content": answer})
    session_histories[session_id] = history

    # 9) Return JSON
    # 9) Return JSON (include the classification label)
    return jsonify({
        "label": label, #remove when done testing
        "response": answer,
        "session_id": session_id
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
