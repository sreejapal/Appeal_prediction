import re
import os
import joblib
import numpy as np
from io import BytesIO
import PyPDF2
import docx

# Disable fbgemm (Windows compatibility)
os.environ.setdefault('TORCH_USE_FBGEMM', '0')
os.environ.setdefault('USE_FBGEMM', '0')

# Base folder
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Lazy global models
_tokenizer = None
_bert_model = None
_device = None
_scaler = None
_base_models = None
_meta_model = None

# Label mapping
_label_map = {0: "appeal rejected", 1: "appeal approved"}


# ===================================================================
# 1. Load LegalBERT, Scaler, Base Models, Meta Model
# ===================================================================
def _load_models():
    """Lazy-load all models only when needed."""
    global _tokenizer, _bert_model, _device
    global _scaler, _base_models, _meta_model

    if _tokenizer is not None:
        return

    try:
        import torch
        from transformers import AutoTokenizer, AutoModel

        # ---- Load LegalBERT model ----
        _tokenizer = AutoTokenizer.from_pretrained("law-ai/InLegalBERT")
        _bert_model = AutoModel.from_pretrained("law-ai/InLegalBERT")

        _device = torch.device("cpu")
        _bert_model.to(_device)
        _bert_model.eval()

        # ---- Load scaler ----
        _scaler = joblib.load(os.path.join(BASE_DIR, "models", "scaler.joblib"))

        # ---- Load base models (list of tuples: (name, model)) ----
        _base_models = joblib.load(
            os.path.join(BASE_DIR, "models", "stack_base_models.joblib")
        )

        # ---- Load meta-classifier ----
        _meta_model = joblib.load(
            os.path.join(BASE_DIR, "models", "stack_meta_clf.joblib")
        )

    except Exception as e:
        if "fbgemm" in str(e) or "WinError 126" in str(e):
            raise RuntimeError(
                "PyTorch failed to load due to missing Visual C++ Redistributables.\n"
                "Install from: https://aka.ms/vs/17/release/vc_redist.x64.exe"
            )
        raise e


# ===================================================================
# 2. File Extraction
# ===================================================================
def extract_text_from_pdf(file_bytes: bytes) -> str:
    try:
        reader = PyPDF2.PdfReader(BytesIO(file_bytes))
    except Exception:
        return ""

    text = ""
    for p in reader.pages:
        t = p.extract_text()
        if t:
            text += t + "\n"
    return text


def extract_text_from_docx(file_bytes: bytes) -> str:
    try:
        docx_file = docx.Document(BytesIO(file_bytes))
        return "\n".join(p.text for p in docx_file.paragraphs)
    except:
        return ""


def extract_text_from_file(file_bytes, filename):
    ext = filename.split(".")[-1].lower()
    if ext == "pdf":
        return extract_text_from_pdf(file_bytes)
    elif ext in ["doc", "docx"]:
        return extract_text_from_docx(file_bytes)
    elif ext == "txt":
        return file_bytes.decode("utf-8", errors="ignore")
    return ""


# ===================================================================
# 3. Preprocessing
# ===================================================================
def text_cleaning(text: str) -> str:
    text = re.sub(r"[^a-zA-Z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.lower().strip()


# ===================================================================
# 4. Embeddings (chunked)
# ===================================================================
def generate_embeddings(text: str) -> np.ndarray:
    _load_models()

    import torch

    tokens = _tokenizer(text, return_tensors="pt", truncation=False)["input_ids"]
    max_len = 512

    chunks = [tokens[:, i:i+max_len] for i in range(0, tokens.size(1), max_len)]
    cls_vectors = []

    for chunk in chunks:
        chunk = chunk.to(_device)
        with torch.no_grad():
            output = _bert_model(chunk)
        cls_vec = output.last_hidden_state[:, 0, :].cpu().numpy().squeeze()
        cls_vectors.append(cls_vec)

    return np.mean(cls_vectors, axis=0)   # Final 768-dim vector


# ===================================================================
# 5. Helper for probability extraction
# ===================================================================
def _get_proba(model, X, n_classes=2):
    """Make sure all models return probability vectors."""
    if hasattr(model, "predict_proba"):
        return model.predict_proba(X)

    if hasattr(model, "decision_function"):
        df = model.decision_function(X)
        if df.ndim == 1:
            df = np.vstack([-df, df]).T
        exp = np.exp(df - df.max(axis=1, keepdims=True))
        return exp / exp.sum(axis=1, keepdims=True)

    # Fallback: convert predicted labels into one-hot
    preds = model.predict(X)
    oh = np.zeros((len(preds), n_classes))
    oh[np.arange(len(preds)), preds] = 1
    return oh


# ===================================================================
# 6. MAIN PREDICTION (STACKING)
# ===================================================================
def predict_text(text: str):
    """
    Stacking pipeline:
    1. Embedding → Scaling
    2. Base models → Probability features
    3. Meta model → Final decision
    """
    _load_models()

    # ---- 1. Embedding ----
    cleaned = text_cleaning(text)
    vec = generate_embeddings(cleaned)
    vec_scaled = _scaler.transform([vec])      # shape: (1, 768)

    # ---- 2. Base model probability predictions ----
    base_probas = []
    for name, model in _base_models:           # FIX: unpack tuple
        proba = _get_proba(model, vec_scaled)
        base_probas.append(proba)

    # Flatten into horizontal vector
    meta_features = np.hstack(base_probas)     # shape: (1, models*2)

    # ---- 3. Meta model prediction ----
    final_pred = _meta_model.predict(meta_features)[0]
    final_proba = _meta_model.predict_proba(meta_features)[0]

    label = _label_map[int(final_pred)]
    confidence = final_proba[final_pred]

    return {
        "prediction": label,
        "confidence": round(float(confidence) * 100, 2),
        "base_model_outputs": {
            name: base_probas[i][0].tolist()
            for i, (name, _) in enumerate(_base_models)
        }
    }
