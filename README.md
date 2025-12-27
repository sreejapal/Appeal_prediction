# Legal Appeal Prediction System

## Overview
The Legal Appeal Prediction System is a machine learning application that predicts whether a legal appeal is likely to be **approved or rejected** based on the textual content of legal case documents. The system uses **InLegal-BERT embeddings** and an **ensemble learning approach** to provide accurate, data-driven predictions for Indian legal cases.

---

## Features
- Upload legal case documents (PDF, DOCX, TXT)
- Automatic text extraction and preprocessing
- Legal-domain embeddings using InLegal-BERT
- Ensemble of multiple ML classifiers
- Meta-model stacking for final prediction
- Trained models hosted on Hugging Face

---

## Machine Learning Approach
1. **Text Extraction & Preprocessing**
   - Cleans and normalizes legal case text

2. **Embedding Generation**
   - InLegal-BERT embeddings
   - Feature scaling using StandardScaler

3. **Base Models**
   - Logistic Regression  
   - Support Vector Machine  
   - Random Forest  
   - XGBoost  

4. **Meta-Model**
   - Logistic Regression trained on base model outputs (stacking)

---

## Dataset
- Compiled Indian legal case corpus sourced from **NyayaNuman** and **InLegalLLaMA**
- Covers Supreme Court, High Courts, Tribunal Courts, District Courts, and Daily Orders

| Split | Records |
|-------|---------|
| Training | 70,570 |
| Validation | 10,055 |
| Testing | 20,033 |

---

## Tech Stack
- **Backend:** Python, FastAPI/Flask, Scikit-learn, XGBoost
- **NLP:** Hugging Face Transformers (Legal-BERT)
- **Frontend:** HTML, CSS, JavaScript
- **Model Hosting:** Hugging Face Model Hub

---

## Setup
```bash
git clone https://github.com/sreejapal/appeal-prediction-model.git
cd appeal-prediction-model
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

---

## Output
The system provides the following outputs:
- **Appeal outcome:** Approved / Rejected
- **Confidence score:** Percentage confidence in the prediction
- **JSON-based inference response:** Structured response with prediction details

---

## Disclaimer
This project is intended for research and educational purposes only and should not be considered legal advice.
