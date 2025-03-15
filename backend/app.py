from flask import Flask, request, jsonify
from flask_cors import CORS
from groq import Groq
import os
import json
from dotenv import load_dotenv
import re
from loanbuddy_routes import loanbuddy
from emi_calculator import emi_calculator

load_dotenv()

app = Flask(__name__)
CORS(app)
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

# Register the loanbuddy blueprint with a URL prefix
app.register_blueprint(loanbuddy, url_prefix='/chat')

# Register the EMI calculator blueprint
app.register_blueprint(emi_calculator, url_prefix='/api/emi')

INTENTS = {
    "loan_check": r"(loan|credit|borrow|finance).*?(eligibility|qualify|check|status)",
    "apply_loan": r"(apply|get|request|want).*?(loan|credit|mortgage)",
    "profile_view": r"(show|view|see|open|go).*?(profile|account|my details)",
    "settings": r"(change|update|modify|settings|preferences)",
    "dashboard": r"(show|view|go|open).*?(dashboard|home|main)",
    "chat": r"(talk|speak|chat|discuss|help)",
    "language": r"(change|switch|select).*?(language|भाषा|ভাষা|மொழி|భాష|ಭಾಷೆ|ഭാഷ|ਭਾਸ਼ਾ)"
}

LOAN_INTENTS = {
    "loan_eligibility": r"(check|know|tell|see).*?(eligible|qualify|eligibility|qualification)",
    "loan_apply": r"(apply|get|want|need|take).*?(loan|credit|finance)",
    "loan_status": r"(status|track|check).*?(application|loan)",
    "loan_types": r"(types|kinds|different|various).*?(loan|credit)",
    "loan_requirements": r"(requirements|documents|need|required).*?(loan|apply)",
    "loan_interest": r"(interest|rate|charges|cost).*?(loan|credit)",
}

LANGUAGES = {
    "en-IN": "English",
    "hi-IN": "Hindi",
    "bn-IN": "Bengali",
    "ta-IN": "Tamil",
    "te-IN": "Telugu",
    "mr-IN": "Marathi",
    "gu-IN": "Gujarati",
    "kn-IN": "Kannada",
    "ml-IN": "Malayalam",
    "pa-IN": "Punjabi"
}

LANGUAGE_INSTRUCTIONS = {
    "en-IN": "Respond in English.",
    "hi-IN": "Respond in Hindi (हिंदी में उत्तर दें).",
    "bn-IN": "Respond in Bengali (বাংলায় উত্তর দিন).",
    "ta-IN": "Respond in Tamil (தமிழில் பதிலளிக்கவும்).",
    "te-IN": "Respond in Telugu (తెలుగులో సమాధానం ఇవ్వండి).",
    "mr-IN": "Respond in Marathi (मराठीत उत्तर द्या).",
    "gu-IN": "Respond in Gujarati (ગુજરાતીમાં જવાબ આપો).",
    "kn-IN": "Respond in Kannada (ಕನ್ನಡದಲ್ಲಿ ಉತ್ತರಿಸಿ).",
    "ml-IN": "Respond in Malayalam (മലയാളത്തിൽ മറുപടി നൽകുക).",
    "pa-IN": "Respond in Punjabi (ਪੰਜਾਬੀ ਵਿੱਚ ਜਵਾਬ ਦਿਓ)."
}

def detect_intent(message):
    message = message.lower()
    for intent, pattern in INTENTS.items():
        if re.search(pattern, message):
            return intent
    return "chat"

def detect_loan_intent(message):
    message = message.lower()
    for intent, pattern in LOAN_INTENTS.items():
        if re.search(pattern, message):
            return intent
    return None

def generate_loan_guidance(path, language):
    """Generate contextual guidance based on the path user is navigating to"""
    guidance = {
        "/dashboard/eligibility": {
            "en-IN": "I'll help you check your loan eligibility. Please fill in your details and I'll guide you through each step.",
            "hi-IN": "मैं आपकी लोन पात्रता की जांच करने में मदद करूंगा। कृपया अपनी जानकारी भरें और मैं आपको हर चरण में मार्गदर्शन करूंगा।"
        },
        "/dashboard/applications/new": {
            "en-IN": "Let's start your loan application. I'll help you with the required documents and guide you through the process.",
            "hi-IN": "चलिए आपका लोन आवेदन शुरू करते हैं। मैं आपको आवश्यक दस्तावेजों के साथ प्रक्रिया में मदद करूंगा।"
        }
        # Add more paths and translations
    }
    return guidance.get(path, {}).get(language, guidance[path]["en-IN"])

def generate_navigation_response(intent, language, message, current_path=None):
    """Enhanced navigation response with contextual guidance"""
    actions = {
        "loan_check": {
            "action": "navigate",
            "path": "/dashboard/eligibility",
            "response": {
                "en-IN": "Let me check your loan eligibility. Taking you to the eligibility checker.",
                "hi-IN": "मैं आपकी लोन पात्रता की जांच करता हूं। आपको पात्रता चेकर पर ले जा रहा हूं।"
                # Add translations for other languages
            }
        },
        "apply_loan": {
            "action": "navigate",
            "path": "/dashboard/applications",
            "response": {
                "en-IN": "I'll help you apply for a loan. Redirecting to the loan application page.",
                "hi-IN": "मैं आपको लोन के लिए आवेदन करने में मदद करूंगा। लोन आवेदन पेज पर रीडायरेक्ट कर रहा हूं।"
                # Add translations for other languages
            }
        },
        "profile_view": {
            "action": "navigate",
            "path": "/dashboard/profile",
            "response": {
                "en-IN": "Taking you to your profile page.",
                "hi-IN": "आपको आपके प्रोफ़ाइल पेज पर ले जा रहा हूं।"
                # Add translations for other languages
            }
        }
    }

    if intent in actions:
        response_data = actions[intent]
        guidance = generate_loan_guidance(response_data["path"], language)
        
        return {
            "action": "navigate",
            "path": response_data["path"],
            "response": response_data["response"].get(language, response_data["response"]["en-IN"]),
            "guidance": guidance,
            "suggestions": get_contextual_suggestions(response_data["path"], language),
            "detected_language": language
        }
    
    return None

def generate_loan_response(intent, language):
    responses = {
        "loan_eligibility": {
            "action": "navigate",
            "path": "/dashboard/eligibility",
            "response": {
                "en-IN": "I'll help you check your loan eligibility. Let me guide you through the process.",
                "hi-IN": "मैं आपकी लोन पात्रता की जांच में मदद करूंगा। मैं आपको इस प्रक्रिया में मार्गदर्शन करूंगा।"
            },
            "suggestions": [
                "What documents do I need?",
                "Show me loan types",
                "What's the interest rate?"
            ]
        },
        "loan_apply": {
            "action": "navigate",
            "path": "/dashboard/applications/new",
            "response": {
                "en-IN": "I'll help you apply for a loan. First, let's fill out your application.",
                "hi-IN": "मैं आपको लोन के लिए आवेदन करने में मदद करूंगा। पहले, आइए आपका आवेदन भरें।"
            },
            "suggestions": [
                "What are the requirements?",
                "Check eligibility first",
                "Show loan status"
            ]
        }
        # Add more loan-related intents and responses
    }
    
    return responses.get(intent)

def format_response(text, action="stay", path=None, suggestions=None, language="en-IN"):
    """Ensure consistent JSON response format"""
    return {
        "action": action,
        "path": path,
        "response": text,
        "suggestions": suggestions or [],
        "detected_language": language
    }

def get_loanbuddy_system_prompt(language_code):
    """Get the LoanBuddy system prompt."""
    # Map language code to language name
    language_name = LANGUAGES.get(language_code, "English")
    language_instruction = LANGUAGE_INSTRUCTIONS.get(language_code, LANGUAGE_INSTRUCTIONS["en-IN"])
    
    return f"""You are LoanBuddy, a specialized financial assistant focused on loan guidance and support in India.
    Your expertise includes:
    - Analyzing loan documents and financial statements
    - Explaining complex loan terms, interest rates, and repayment options
    - Providing personalized guidance for loan applications
    - Helping users understand eligibility requirements
    - Comparing different loan products available in India
    - Offering financial planning advice related to loans

    IMPORTANT: You must follow these rules strictly:
    1. ALWAYS respond in {language_name} ({language_code})
    2. ALWAYS respond in valid JSON format
    3. Keep responses clear and helpful
    4. Focus on loans and financial advice relevant to India
    5. Provide 2-3 relevant suggestions for next steps or related topics

    Response MUST be in this exact JSON format:
    {{
        "action": "stay",
        "response": "your response in {language_name}",
        "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
        "detected_language": "{language_code}"
    }}
    
    Maintain a helpful, informative, and non-judgmental tone. Your goal is to empower users with clear, 
    accessible information about loans and financial products in India.
    
    {language_instruction}"""

@app.route("/chat", methods=["POST"])
def chat():
    data = request.json
    message = data.get("message", "")
    language = data.get("language", "en-IN")

    # First check for loan-specific intents
    loan_intent = detect_loan_intent(message)
    if loan_intent:
        response = generate_loan_response(loan_intent, language)
        if response:
            return jsonify({
                "success": True,
                "data": json.dumps(format_response(
                    text=response["response"][language],
                    action="navigate",
                    path=response["path"],
                    suggestions=response["suggestions"],
                    language=language
                ))
            })

    # Process with AI
    system_prompt = get_loanbuddy_system_prompt(language)
    
    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ],
            model="llama-3.2-90b-vision-preview",
            temperature=0.7,
            max_tokens=500
        )
        
        response_content = chat_completion.choices[0].message.content.strip()
        
        # Ensure valid JSON
        try:
            parsed_response = json.loads(response_content)
            if not all(k in parsed_response for k in ["action", "response"]):
                raise ValueError("Invalid response format")
        except:
            parsed_response = format_response(
                text=response_content,
                suggestions=[
                    "Tell me more about loans",
                    "Check my eligibility",
                    "How can I apply?"
                ],
                language=language
            )

        return jsonify({
            "success": True,
            "data": json.dumps(parsed_response)
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "data": json.dumps(format_response(
                text="I apologize, but I encountered an error. Please try again.",
                language=language
            ))
        })

if __name__ == "__main__":
    app.run(debug=True)