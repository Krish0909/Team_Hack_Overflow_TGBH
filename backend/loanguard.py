from flask import Blueprint, request, jsonify
import os
import json
import logging
import re
from groq import Groq
import PyPDF2
from PIL import Image
import io

# Configure logging
logger = logging.getLogger(__name__)

# Initialize Groq client
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

# Create blueprint
loanguard = Blueprint('loanguard', __name__)

# Dictionary of predatory lending red flags by category
PREDATORY_PATTERNS = {
    'interest_rates': [
        r'interest.*?(\d{2,}%|percent)',
        r'annual.?rate.?(\d{2,}%|percent)',
        r'apr.*?(\d{2,}%)',
        r'compound.*?daily|weekly'
    ],
    'hidden_fees': [
        r'processing fee.?(\d+%|₹\s\d+,?\d+)',
        r'prepayment.*?penalty',
        r'foreclosure.*?charges',
        r'late.?fee.?(₹\s*\d+,?\d+|\d+%)',
        r'service.*?charge'
    ],
    'balloon_payments': [
        r'balloon.*?payment',
        r'final.?payment.?larger',
        r'lump.?sum.?end'
    ],
    'repayment_terms': [
        r'mandatory.*?refinance',
        r'automatic.*?renewal',
        r'loan.*?flipping',
        r'early.?repayment.?penalty'
    ]
}

SEVERITY_LEVELS = {
    'critical': [
        r'interest.*?[4-9][0-9]%',
        r'compound.*?daily',
        r'waive.?right.?to.*?sue',
        r'blank.*?sign',
        r'verbal.*?promise'
    ],
    'high': [
        r'interest.*?[3-4][0-9]%',
        r'prepayment.?penalty.?[3-9][0-9]%',
        r'balloon.?payment.?over.*?30%',
        r'mandatory.*?refinance',
        r'immediate.*?repossession'
    ],
    'medium': [
        r'interest.*?[2-3][0-9]%',
        r'hidden.*?fee',
        r'processing.?fee.?above.*?2%',
        r'late.?fee.?above.*?₹1000',
    ],
    'low': [
        r'interest.*?[1-2][0-9]%',
        r'early.?repayment.?fee',
        r'service.?charge.?undisclosed',
        r'automatic.*?renewal'
    ]
}

def extract_text_from_pdf(file_data):
    """Extract text from PDF file"""
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_data))
        text = ""
        for page_num in range(len(pdf_reader.pages)):
            text += pdf_reader.pages[page_num].extract_text()
        return text
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {e}")
        return ""

def extract_text_from_image(file_data):
    """Use Groq to extract text from image"""
    try:
        image_base64 = io.BytesIO(file_data).getvalue().hex()
        
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system", 
                    "content": "Extract all text from this loan document image, focusing on terms, rates, and conditions."
                },
                {
                    "role": "user", 
                    "content": [
                        {"type": "text", "text": "Extract text from this loan document:"},
                        {"type": "image", "image": image_base64}
                    ]
                }
            ],
            model="llama-3.2-90b-vision-preview"
        )
        
        return chat_completion.choices[0].message.content
    except Exception as e:
        logger.error(f"Error extracting text from image: {e}")
        return ""

def detect_predatory_patterns(text):
    """Detect predatory patterns in text"""
    findings = {}
    for category, patterns in PREDATORY_PATTERNS.items():
        matches = []
        for pattern in patterns:
            found = re.finditer(pattern, text, re.IGNORECASE)
            for match in found:
                matches.append({
                    'pattern': pattern,
                    'match': match.group(0),
                    'position': match.span()
                })
        if matches:
            findings[category] = matches
    return findings

def determine_severity(findings, text):
    """Determine overall severity based on findings"""
    severity_counts = {'critical': 0, 'high': 0, 'medium': 0, 'low': 0}
    
    for level, patterns in SEVERITY_LEVELS.items():
        for pattern in patterns:
            if re.search(pattern, text, re.IGNORECASE):
                severity_counts[level] += 1
    
    if severity_counts['critical'] > 0:
        return 'critical'
    elif severity_counts['high'] > 2:
        return 'critical'
    elif severity_counts['high'] > 0:
        return 'high'
    elif severity_counts['medium'] > 2:
        return 'high'
    elif severity_counts['medium'] > 0:
        return 'medium'
    elif severity_counts['low'] > 0:
        return 'low'
    return 'none'

def get_ai_analysis(text, findings, severity):
    """Get AI analysis of the document"""
    try:
        finding_summary = "\n".join([
            f"{category}: {'; '.join(m['match'] for m in matches[:3])}"
            for category, matches in findings.items()
        ])
        
        prompt = f"""Analyze this loan document for predatory lending:

Text extract: {text[:2000]}...

Findings:
{finding_summary}

Severity: {severity}

Provide:
1. Key issues explanation
2. Recommendations
3. Legal context
4. Alternative options"""

        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert in detecting predatory lending practices in Indian loan documents."
                },
                {"role": "user", "content": prompt}
            ],
            model="llama-3.2-90b-vision-preview",
            temperature=0.3,
        )
        
        return chat_completion.choices[0].message.content
    except Exception as e:
        logger.error(f"Error getting AI analysis: {e}")
        return "Could not generate analysis."

@loanguard.route('/analyze', methods=['POST'])
def analyze_document():
    """Analyze document for predatory lending practices"""
    try:
        if 'file' not in request.files:
            return jsonify({"success": False, "error": "No file provided"}), 400
            
        file = request.files['file']
        file_data = file.read()
        
        # Process document
        text = ""
        if file.filename.lower().endswith('.pdf'):
            text = extract_text_from_pdf(file_data)
        elif file.filename.lower().endswith(('.jpg', '.jpeg', '.png')):
            text = extract_text_from_image(file_data)
        else:
            return jsonify({"success": False, "error": "Unsupported file format"}), 400
            
        if not text:
            return jsonify({"success": False, "error": "Could not extract text"}), 500
            
        # Analyze document
        findings = detect_predatory_patterns(text)
        severity = determine_severity(findings, text)
        analysis = get_ai_analysis(text, findings, severity)
        
        report = {
            "severity": severity,
            "findings": findings,
            "analysis": analysis,
            "text_preview": text[:1000]
        }
        
        return jsonify({"success": True, "data": {"report": report}})
            
    except Exception as e:
        logger.error(f"Document analysis error: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@loanguard.route('/chat', methods=['POST'])
def chat():
    """Handle chat about document analysis"""
    try:
        data = request.json
        message = data.get("message", "")
        
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert in loan document analysis. Help users understand predatory lending terms."
                },
                {"role": "user", "content": message}
            ],
            model="llama-3.2-90b-vision-preview",
            temperature=0.7,
        )
        
        response = chat_completion.choices[0].message.content
        
        suggestions = [
            "What makes a loan predatory?",
            "Common red flags to watch for",
            "How to avoid loan scams"
        ]
        
        return jsonify({
            "success": True,
            "data": {
                "response": response,
                "suggestions": suggestions
            }
        })
        
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@loanguard.route('/clear-context', methods=['POST'])
def clear_context():
    """Clear conversation context"""
    try:
        session_id = request.json.get("session_id", "default")
        return jsonify({"success": True, "message": "Context cleared"})
    except Exception as e:
        logger.error(f"Error clearing context: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500
