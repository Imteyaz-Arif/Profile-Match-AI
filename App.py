import os
import json
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.staticfiles import StaticFiles
from pypdf import PdfReader
import docx
from google import genai
from typing import Optional
from dotenv import load_dotenv
import asyncio

load_dotenv()

App = FastAPI()

import pathlib
frontend_dir = pathlib.Path(__file__).parent / "Frontend"
frontend_dir.mkdir(exist_ok=True)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai_client = genai.Client(api_key=GEMINI_API_KEY)

def extract_text_from_file(file_obj, filename: str) -> str:
    try:
        text = ""
        if filename.lower().endswith('.pdf'):
            reader = PdfReader(file_obj)
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        elif filename.lower().endswith('.docx'):
            doc = docx.Document(file_obj)
            for para in doc.paragraphs:
                text += para.text + "\n"
        return text
    except Exception as e:
        print(f"Error reading file {filename}: {e}")
        return ""

@App.post("/api/analyze")
async def analyze_profiles(
    resume: UploadFile = File(...), 
    jd: Optional[UploadFile] = File(None),
    jd_text: Optional[str] = Form(None)
):
    valid_exts = ('.pdf', '.docx')
    if not resume.filename.lower().endswith(valid_exts):
        raise HTTPException(status_code=400, detail="Resume must be a PDF or DOCX")
    
    resume_text = extract_text_from_file(resume.file, resume.filename)
    
    final_jd_text = ""
    if jd and jd.filename:
        if not jd.filename.lower().endswith(valid_exts):
            raise HTTPException(status_code=400, detail="JD file must be a PDF or DOCX")
        final_jd_text = extract_text_from_file(jd.file, jd.filename)
    elif jd_text:
        final_jd_text = jd_text.strip()
        
    if not resume_text or not final_jd_text:
        raise HTTPException(status_code=400, detail="Could not extract text from required inputs")
    
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="API Key not configured in .env file.")
        
    try:
        prompt = f"""
        You are an expert ATS (Applicant Tracking System) and technical recruiter.
        Analyze the following Resume against the Job Description.
        
        Provide the response STRICTLY as a valid JSON object with the following keys exactly:
        - "matchPercentage" (integer 0-100)
        - "likelyToShortlist" (integer 0-100)
        - "matchingKeywords" (list of strings)
        - "missingKeywords" (list of strings)
        - "suggestions" (list of strings, actionable advice to improve the resume for this JD)
        
        Do not include markdown blocks like ```json ... ```, just output the raw JSON string.
        
        Job Description:
        {final_jd_text[:3000]}
        
        Resume:
        {resume_text[:3000]}
        """
        response = genai_client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
        text_response = response.text.strip()
        
        if text_response.startswith("```json"):
            text_response = text_response[7:]
        if text_response.endswith("```"):
            text_response = text_response[:-3]
            
        return json.loads(text_response)
    except Exception as e:
        error_msg = str(e)
        print(f"Gemini API Error: {error_msg}")
        if "404" in error_msg or "not found" in error_msg.lower():
            raise HTTPException(status_code=404, detail="404 Model Not Found. Your API key might be invalid, or your AI Studio project is inactive.")
        raise HTTPException(status_code=500, detail=str(e))

App.mount("/Assets", StaticFiles(directory="Assets"), name="assets")
App.mount("/", StaticFiles(directory="Frontend", html=True), name="frontend")