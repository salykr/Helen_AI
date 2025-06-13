import requests

API_URL = "http://127.0.0.1:5000/ask"  # or your Flask host IP
QUESTIONS_FILE = "questions.txt"
OUTPUT_FILE = "results.txt"

def load_questions(path):
    with open(path, encoding="utf-8") as f:
        return [line.strip() for line in f if line.strip()]

def call_api(question):
    payload = {"question": question, "session_id": None}
    r = requests.post(API_URL, json=payload)
    r.raise_for_status()
    return r.json()

def main():
    questions = load_questions(QUESTIONS_FILE)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as out:
        for q in questions:
            res = call_api(q)
            label = res.get("label", "non-medical")
            answer = res.get("response", "").replace("\n", " ").strip()

            out.write(f"Question: {q}\n")
            out.write(f"Label: {label}\n")
            out.write(f"Answer: {answer}\n\n")

    print(f"Done — see {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
