from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from .predict import extract_text_from_pdf, extract_text_from_docx, predict_text

app = FastAPI()

# Enable proper CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://192.168.4.109:8080",   # Your frontend IP
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "*"  # (optional fallback)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# /predict Route
# =========================================================
@app.post("/predict")
async def predict_case(file: UploadFile = File(...)):
    try:
        file_bytes = await file.read()
        filename = file.filename.lower()

        if not file_bytes:
            return {"error": "Uploaded file is empty"}

        if not (filename.endswith(".pdf") or filename.endswith(".docx")):
            return {"error": "Only PDF or DOCX files are supported"}

        if filename.endswith(".pdf"):
            extracted = extract_text_from_pdf(file_bytes)
        else:
            extracted = extract_text_from_docx(file_bytes)

        if not extracted or len(extracted.strip()) < 20:
            return {"error": "File contains too little readable text"}

        result = predict_text(extracted)

        safe_preview = "".join(c for c in extracted[:500] if c.isprintable())

        return {
            "filename": filename,
            "text_preview": safe_preview.replace("\n", " "),
            "result": result
        }

    except Exception as e:
        return {"error": f"Prediction failed: {str(e)}"}


# =========================================================
# Root Route
# =========================================================
@app.get("/")
def home():
    return {"status": "LegalBERT backend running!"}
