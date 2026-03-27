# Profile Match AI 🎯

An advanced, AI-powered web application that evaluates your resume against any Job Description. It uses Google's Gemini 2.5 Flash model to instantly provide a match percentage, shortlist likelihood, deeply analyzed keyword matching, and targeted recommendations for improvement.

## ✨ Features
- **Intelligent ATS Scanning**: Native support for extracting text from both `.pdf` and `.docx` resume formats.
- **Deep AI Analysis**: Powered by Gemini 2.5 AI to analyze contextual matches, not just strict keyword exact-matches.
- **Premium Glassmorphism UI**: A beautifully polished, Apple-inspired interface with liquid-glass aesthetic, dynamic animations, and responsive layout.
- **Instant Insights Dashboard**: Generates visual Match Scores, missing keywords, and actionable suggestions to improve your resume.

## 🛠️ Technology Stack
- **Backend Application**: Python 3, FastAPI, Uvicorn
- **AI Integration**: Google GenAI SDK (`gemini-2.5-flash`)
- **Document Processing**: `pypdf`, `python-docx`
- **Frontend Architecture**: Vanilla HTML5, CSS3, Javascript

## 🚀 Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/Imteyaz-Arif/Profile-Match-AI.git
cd Profile-Match-AI
```

### 2. Set up a Python Virtual Environment
Keep your dependencies isolated from your main Windows Python installation:
```bash
python -m venv .venv
.\.venv\Scripts\activate
```

### 3. Install Required Dependencies
```bash
pip install fastapi uvicorn python-multipart pypdf python-docx google-genai python-dotenv
```

### 4. Configure API Keys
Create a `.env` file in the main folder and securely add your Google Gemini API key:
```env
GEMINI_API_KEY="your_actual_api_key_here"
```

### 5. Start the Application
Boot up the high-performance Uvicorn web server:
```bash
.\.venv\Scripts\uvicorn App:App --port 8000 --reload
```
The application will launch and instantly become available locally at: `http://127.0.0.1:8000`

---
**Developed by Imteyaz Arif**
