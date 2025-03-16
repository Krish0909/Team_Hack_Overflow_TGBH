from flask import Flask, request, jsonify
from flask_cors import CORS
from groq import Groq
import os
import json
from dotenv import load_dotenv
import re
from loanbuddy_routes import loanbuddy
from emi_calculator import emi_calculator
import logging
import sys
from supabase import create_client, Client
from loanbuddy_routes import (
    process_document,
    extract_key_info,
    process_image,
    get_ocr
)

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format="[%(asctime)s] [%(levelname)8s] %(name)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)

load_dotenv()

app = Flask(__name__)
CORS(app)
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

# Initialize Supabase
supabase: Client = create_client(
    os.environ.get("SUPABASE_URL"),
    os.environ.get("SUPABASE_KEY")
)

# Register the loanbuddy blueprint with a URL prefix
app.register_blueprint(loanbuddy, url_prefix="/chat")

# Register the EMI calculator blueprint
app.register_blueprint(emi_calculator, url_prefix="/api/emi")

# Update PROJECT_PATHS with all dashboard features
PROJECT_PATHS = {
    'overview': '/dashboard',
    'loan_buddy': '/dashboard/loanBuddy',
    'loan_guard': '/dashboard/loangaurd',
    'eligibility': '/dashboard/eligibility', 
    'emi_analysis': '/dashboard/emiAnalysis',
    'news': '/dashboard/news',
    'settings': '/dashboard/settings'
}

FEATURE_DESCRIPTIONS = {
    'overview': {
        'path': '/dashboard',
        'description': 'View your loan dashboard and summary'
    },
    'loan_buddy': {
        'path': '/dashboard/loanBuddy',
        'description': 'Get personalized loan guidance and support'
    },
    'loan_guard': {
        'path': '/dashboard/loangaurd',
        'description': 'Analyze and verify loan documents'
    },
    'eligibility': {
        'path': '/dashboard/eligibility',
        'description': 'Check your loan eligibility'
    },
    'emi_analysis': {
        'path': '/dashboard/emiAnalysis',
        'description': 'Calculate and analyze loan EMIs'
    },
    'news': {
        'path': '/dashboard/news',
        'description': 'Stay updated with latest financial news'
    },
    'settings': {
        'path': '/dashboard/settings',
        'description': 'Manage your account settings'
    }
}

# Update INTENTS with more specific patterns
INTENTS = {
    'overview': r'(show|view|see|open).*?(dashboard|overview|summary)',
    'loan_buddy': r'(talk|chat|discuss|help).*?(loan|assistant|buddy)',
    'loan_guard': r'(analyze|check|review|verify).*?(document|application|paper)',
    'eligibility': r'(check|know|tell|see).*?(eligible|qualify|eligibility)',
    'emi_analysis': r'(calculate|compute|check|show|tell|know|what|want).*?(emi|payment|installment|monthly)',
    'news': r'(show|tell|get|want).*?(news|updates|latest)',
    'settings': r'(change|update|modify|manage).*?(settings|profile|account)',
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
    "pa-IN": "Punjabi",
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
    "pa-IN": "Respond in Punjabi (ਪੰਜਾਬੀ ਵਿੱਚ ਜਵਾਬ ਦਿਓ).",
}

def detect_intent(message):
    message = message.lower()
    # Check EMI keywords first
    emi_keywords = ['emi', 'calculate', 'payment', 'installment', 'monthly payment']
    if any(keyword in message.lower() for keyword in emi_keywords):
        return 'emi_analysis'
    
    # Then check other intents
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
            "hi-IN": "मैं आपकी लोन पात्रता की जांच करने में मदद करूंगा। कृपया अपनी जानकारी भरें और मैं आपको हर चरण में मार्गदर्शन करूंगा।",
        },
        "/dashboard/applications": {
            "en-IN": "Let's start your loan application. I'll help you with the required documents and guide you through the process.",
            "hi-IN": "चलिए आपका लोन आवेदन शुरू करते हैं। मैं आपको आवश्यक दस्तावेजों के साथ प्रक्रिया में मदद करूंगा।",
        },
        "/dashboard/emiAnalysis": {
            "en-IN": "I'll help you calculate and analyze your EMI. Enter your loan details and I'll show you the breakdown.",
            "hi-IN": "मैं आपकी EMI की गणना और विश्लेषण करने में मदद करूंगा। अपने लोन का विवरण दर्ज करें और मैं आपको विश्लेषण दिखाऊंगा।",
        },
        "/dashboard/loangaurd": {
            "en-IN": "Upload your loan documents and I'll help you analyze them.",
            "hi-IN": "अपने लोन दस्तावेज अपलोड करें और मैं उनका विश्लेषण करने में आपकी मदद करूंगा।",
        },
    }
    # Return empty guidance if path not found to avoid KeyError
    return guidance.get(path, {}).get(language) or guidance.get(path, {}).get(
        "en-IN", ""
    )


def generate_navigation_response(intent, language, message):
    """Enhanced navigation response with immediate redirection"""
    if intent not in PROJECT_PATHS:
        return None
        
    path = PROJECT_PATHS[intent]
    description = FEATURE_DESCRIPTIONS[intent]['description']
    
    responses = {
        'en-IN': f"Taking you to {description.lower()}",
        'hi-IN': f"आपको {description} पर ले जा रहा हूं"
    }
    
    # Force navigate for EMI and eligibility
    force_navigate = intent in ['emi_analysis', 'eligibility']
    
    return {
        'action': 'navigate',
        'path': path,
        'response': responses.get(language, responses['en-IN']),
        'suggestions': get_default_suggestions(),
        'detected_language': language,
        'force_navigate': force_navigate
    }


def generate_loan_response(intent, language):
    responses = {
        "loan_eligibility": {
            "action": "navigate",
            "path": "/dashboard/eligibility",
            "response": {
                "en-IN": "I'll help you check your loan eligibility. Let me guide you through the process.",
                "hi-IN": "मैं आपकी लोन पात्रता की जांच में मदद करूंगा। मैं आपको इस प्रक्रिया में मार्गदर्शन करूंगा।",
            },
            "suggestions": [
                "What documents do I need?",
                "Show me loan types",
                "What's the interest rate?",
            ],
        },
        "loan_apply": {
            "action": "navigate",
            "path": "/dashboard/applications/new",
            "response": {
                "en-IN": "I'll help you apply for a loan. First, let's fill out your application.",
                "hi-IN": "मैं आपको लोन के लिए आवेदन करने में मदद करूंगा। पहले, आइए आपका आवेदन भरें।",
            },
            "suggestions": [
                "What are the requirements?",
                "Check eligibility first",
                "Show loan status",
            ],
        },
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
        "detected_language": language,
    }


def get_user_data(clerk_id):
    """Fetch user data from Supabase"""
    try:
        # Fetch user profile
        profile = supabase.table('user_profiles').select('*').eq('clerk_id', clerk_id).single().execute()
        
        # Fetch loans
        loans = supabase.table('loans').select('*').eq('clerk_id', clerk_id).execute()
        
        # Fetch loan applications
        applications = supabase.table('loan_applications').select('*').eq('clerk_id', clerk_id).execute()
        
        return {
            'profile': profile.data,
            'loans': loans.data,
            'applications': applications.data
        }
    except Exception as e:
        logger.error(f"Error fetching user data: {e}")
        return None

def get_floating_assistant_prompt(language_code, user_data=None):
    """Get concise, personalized system prompt for floating assistant"""
    language_name = LANGUAGES.get(language_code, "English")
    
    user_context = ""
    if user_data and user_data.get('profile'):
        profile = user_data['profile']
        user_context = f"""
        User Context:
        - Monthly Income: {profile.get('monthly_income', 'Not provided')}
        - Employment: {profile.get('employment_type', 'Not provided')}
        - Credit Score: {profile.get('credit_score', 'Not provided')}
        - Existing Loans: {len(user_data.get('loans', []))}
        """

    return f"""You are a concise financial assistant. Keep responses under 50 words.
    {user_context}
    
    Rules:
    1. Respond in {language_name}
    2. Be direct and brief
    3. Personalize based on user context
    4. Focus on immediate actions
    5. Use conversational tone
    
    Response format:
    {{
        "action": "stay/navigate",
        "response": "brief response",
        "suggestions": ["1-2 relevant suggestions"],
        "detected_language": "{language_code}"
    }}
    """

def get_loanbuddy_system_prompt(language_code):
    """Get detailed system prompt for document analysis"""
    language_name = LANGUAGES.get(language_code, "English")
    
    return f"""You are an expert loan document analyzer. Provide detailed analysis.
    
    Focus on:
    1. Document verification
    2. Term analysis
    3. Risk assessment
    4. Compliance check
    5. User-friendly explanations
    
    Response format:
    {{
        "response": "detailed analysis",
        "key_points": ["extracted key information"],
        "concerns": ["potential issues"],
        "suggestions": ["next steps"],
        "language": "{language_code}"
    }}
    """

def get_loanbuddy_system_prompt(language_code):
    """Get the LoanBuddy system prompt."""
    # Map language code to language name
    language_name = LANGUAGES.get(language_code, "English")
    language_instruction = LANGUAGE_INSTRUCTIONS.get(
        language_code, LANGUAGE_INSTRUCTIONS["en-IN"]
    )

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


def get_default_suggestions():
    """Get default suggestions when no specific ones are available"""
    return [
        "Check loan eligibility",
        "Calculate EMI",
        "Analyze loan documents",
        "View loan options"
    ]

def process_with_ai(message, language, system_prompt):
    """Process message with AI when no specific intent is matched"""
    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message},
            ],
            model="llama-3.2-90b-vision-preview",
            temperature=0.7,
            max_tokens=500,
        )

        response_content = chat_completion.choices[0].message.content.strip()

        try:
            parsed_response = json.loads(response_content)
            if not all(k in parsed_response for k in ["action", "response"]):
                raise ValueError("Invalid response format")
            return parsed_response
        except:
            return {
                "action": "stay",
                "response": response_content,
                "suggestions": get_default_suggestions(),
                "detected_language": language
            }

    except Exception as e:
        logger.error(f"AI processing error: {str(e)}")
        return {
            "action": "stay",
            "response": "I apologize, but I encountered an error. Please try again.",
            "suggestions": get_default_suggestions(),
            "detected_language": language
        }

@app.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.json
        message = data.get("message", "")
        language = data.get("language", "en-IN")
        clerk_id = data.get("clerk_id")
        
        # Get user data for personalization
        user_data = get_user_data(clerk_id) if clerk_id else None
        
        # First check for intent
        intent = detect_intent(message)
        
        # Handle navigation intents
        if intent in PROJECT_PATHS:
            nav_response = generate_navigation_response(intent, language, message)
            if nav_response:
                return jsonify({"success": True, "data": json.dumps(nav_response)})
        
        # Check for loan-specific intents
        loan_intent = detect_loan_intent(message)
        if loan_intent:
            response = generate_loan_response(loan_intent, language)
            if response:
                return jsonify({
                    "success": True,
                    "data": json.dumps(
                        format_response(
                            text=response["response"][language],
                            action="navigate",
                            path=response["path"],
                            suggestions=response["suggestions"],
                            language=language,
                        )
                    ),
                })
        
        # For non-navigation intents, process with AI using personalized prompt
        system_prompt = get_floating_assistant_prompt(language, user_data)
        ai_response = process_with_ai(message, language, system_prompt)
        
        return jsonify({"success": True, "data": json.dumps(ai_response)})
        
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        error_response = format_response(
            text="I apologize, but I encountered an error. Please try again.",
            language=language
        )
        return jsonify({
            "success": False, 
            "error": str(e), 
            "data": json.dumps(error_response)
        })

# Add error handler
@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal Server Error: {str(error)}", exc_info=True)
    return (
        jsonify(
            {"success": False, "error": "Internal Server Error", "details": str(error)}
        ),
        500,
    )

@app.route("/loanbuddy/chat", methods=["POST"])
def loanbuddy_chat():
    """Handle LoanBuddy chat requests"""
    try:
        data = request.json
        message = data.get("message", "")
        language = data.get("language", "en-IN")
        
        # Get response from LLM
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": f"You are LoanBuddy, a friendly loan assistant. Respond in {LANGUAGES[language]}. Keep responses clear and helpful."
                },
                {"role": "user", "content": message}
            ],
            model="llama-3.2-90b-vision-preview",
            temperature=0.7,
            max_tokens=500
        )
        
        # Get suggestions based on context
        suggestions = get_default_suggestions()
        if "loan" in message.lower():
            suggestions = [
                "What documents do I need?",
                "Check my eligibility",
                "Calculate EMI"
            ]
        elif "emi" in message.lower():
            suggestions = [
                "Calculate another EMI",
                "Compare loan options",
                "View repayment schedule"
            ]
        
        return jsonify({
            "success": True,
            "data": {
                "response": chat_completion.choices[0].message.content,
                "suggestions": suggestions
            }
        })
        
    except Exception as e:
        logger.error(f"LoanBuddy chat error: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        })

@app.route("/loanbuddy/document", methods=["POST"])
def loanbuddy_document():
    """Handle document analysis for LoanBuddy"""
    try:
        if 'file' not in request.files:
            return jsonify({"success": False, "error": "No file provided"}), 400
        
        file = request.files['file']
        language = request.form.get('language', 'en-IN')
        file_data = file.read()
        
        # Process document
        result = process_document(file_data, file.filename, language)
        
        if not result["success"]:
            return jsonify(result), 500
            
        # Extract key information
        text = result["text"]
        key_info = extract_key_info(text)
        
        # Clean up and format response
        response_data = {
            "success": True,
            "data": {
                "text": text,
                "key_info": key_info,
                "truncated": result.get("truncated", False),
                "summary": {
                    "document_type": key_info.get("type", "Unknown"),
                    "total_amount": key_info.get("loan_amount", "Not specified"),
                    "interest_rate": key_info.get("interest_rate", "Not specified"),
                    "tenure": key_info.get("tenure", "Not specified")
                }
            }
        }
        
        return jsonify(response_data)
            
    except Exception as e:
        logger.error(f"Document analysis error: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
