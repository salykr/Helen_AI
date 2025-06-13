from huggingface_hub import hf_hub_download

path = hf_hub_download(
    repo_id="BioMistral/BioMistral-7B-GGUF",
    filename="ggml-model-Q4_K_M.gguf",
    local_dir="../models"
)

print(f" Downloaded model to: {path}")
