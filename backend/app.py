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

# Restrict to only the four main dashboard routes
DASHBOARD_ROUTES = {
    'overview': {
        'path': '/dashboard',
        'intents': {
            'en-IN': ['show dashboard', 'go home', 'main page', 'overview'],
            'hi-IN': ['डैशबोर्ड दिखाएं', 'होम पेज', 'मुख्य पृष्ठ', 'अवलोकन']
        }
    },
    'loan_buddy': {
        'path': '/dashboard/loanBuddy',
        'intents': {
            'en-IN': ['loan assistant', 'chat about loan', 'help with loan'],
            'hi-IN': ['लोन सहायक', 'लोन के बारे में बात करें', 'लोन में मदद']
        }
    },
    'loan_guard': {
        'path': '/dashboard/loanguard',
        'intents': {
            'en-IN': ['check documents', 'analyze papers', 'verify loan'],
            'hi-IN': ['दस्तावेज़ जांचें', 'कागजात विश्लेषण', 'लोन सत्यापन']
        }
    },
    'emi_analysis': {
        'path': '/dashboard/emiAnalysis',
        'intents': {
            'en-IN': ['calculate emi', 'payment analysis', 'check installments'],
            'hi-IN': ['ईएमआई गणना', 'भुगतान विश्लेषण', 'किस्त जांच']
        }
    }
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

# Enhanced intents with more patterns and context
INTENTS = {
    'overview': r'(show|view|see|open|go to|take me to|display|get).*?(dashboard|overview|summary|home|main page)',
    'loan_buddy': r'(talk|chat|discuss|help|assist|need help|advice|guidance).*?(loan|buddy|assistant|query|question)',
    'loan_guard': r'(analyze|check|review|verify|scan|validate|read|look at).*?(document|application|paper|form|agreement)',
    'emi_analysis': r'(calculate|compute|check|show|analyze|what|how much|tell me).*?(emi|payment|installment|monthly payment)',
    'eligibility': r'(check|know|tell|see|am i|can i|will i|qualify).*?(eligible|qualify|eligibility|get loan|loan approval)',
    'news': r'(show|tell|get|see|what|latest).*?(news|updates|finance news|market|trends)',
    'profile': r'(show|view|update|change|edit|modify).*?(profile|account|details|information|settings)',
    'loan_comparison': r'(compare|difference|better|which|suggest).*?(loan|offers|options|rates|banks)',
    'payment_status': r'(check|view|show|payment|paid).*?(status|due|date|schedule|upcoming)',
    'help': r'(help|support|guide|how|what|assist).*?(me|work|use|do)'
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
    
    # Check for direct page mentions
    direct_mentions = {
        'dashboard': 'overview',
        'loan buddy': 'loan_buddy',
        'loanguard': 'loan_guard',
        'emi': 'emi_analysis',
        'eligibility': 'eligibility',
        'news': 'news',
        'profile': 'profile'
    }
    
    for keyword, intent in direct_mentions.items():
        if keyword in message:
            return intent

    # Check patterns
    for intent, pattern in INTENTS.items():
        if re.search(pattern, message):
            return intent

    return None


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


def generate_navigation_message(intent, language):
    """Generate appropriate navigation message based on intent and language"""
    messages = {
        'overview': {
            'en-IN': 'Taking you to the dashboard overview',
            'hi-IN': 'डैशबोर्ड अवलोकन पर ले जा रहा हूं',
            'bn-IN': 'ড্যাশবোর্ড ওভারভিউতে নিয়ে যাচ্ছি',
            'ta-IN': 'டாஷ்போர்டு பார்வைக்கு அழைத்துச் செல்கிறேன்',
            'te-IN': 'డాష్‌బోర్డ్ ఓవర్‌వ్యూకి మిమ్మల్ని తీసుకువెళ్తున్నాను',
            'mr-IN': 'डॅशबोर्ड अवलोकनाकडे नेत आहे',
            'gu-IN': 'ડેશબોર્ડ ઓવરવ્યુ પર લઈ જઈ રહ્યો છું',
            'kn-IN': 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಅವಲೋಕನಕ್ಕೆ ಕರೆದೊಯ್ಯುತ್ತಿದ್ದೇನೆ',
            'ml-IN': 'ഡാഷ്ബോർഡ് അവലോകനത്തിലേക്ക് നയിക്കുന്നു',
            'pa-IN': 'ਡੈਸ਼ਬੋਰਡ ਓਵਰਵਿਊ ਤੇ ਲੈ ਜਾ ਰਿਹਾ ਹਾਂ'
        },
        'loan_buddy': {
            'en-IN': 'Opening loan assistant',
            'hi-IN': 'लोन सहायक खोल रहा हूं',
            'bn-IN': 'ঋণ সহায়ক খুলছি',
            'ta-IN': 'கடன் உதவியாளரைத் திறக்கிறது',
            'te-IN': 'రుణ సహాయకుడిని తెరుస్తున్నాను',
            'mr-IN': 'कर्ज सहाय्यक उघडत आहे',
            'gu-IN': 'લોન સહાયક ખોલી રહ્યો છું',
            'kn-IN': 'ಸಾಲ ಸಹಾಯಕವನ್ನು ತೆರೆಯುತ್ತಿದ್ದೇನೆ',
            'ml-IN': 'വായ്പാ സഹായി തുറക്കുന്നു',
            'pa-IN': 'ਲੋਨ ਸਹਾਇਕ ਖੋਲ੍ਹ ਰਿਹਾ ਹਾਂ'
        },
        'loan_guard': {
            'en-IN': 'Opening document analyzer',
            'hi-IN': 'दस्तावेज़ विश्लेषक खोल रहा हूं',
            'bn-IN': 'নথি বিশ্লেষক খুলছি',
            'ta-IN': 'ஆவண பகுப்பாய்வியைத் திறக்கிறது',
            'te-IN': 'డాక్యుమెంట్ విశ్లేషకుడిని తెరుస్తున్నాను',
            'mr-IN': 'दस्तऐवज विश्लेषक उघडत आहे',
            'gu-IN': 'દસ્તાવેજ વિશ્લેષક ખોલી રહ્યો છું',
            'kn-IN': 'ದಾಖಲೆ ವಿಶ್ಲೇಷಕವನ್ನು ತೆರೆಯುತ್ತಿದ್ದೇನೆ',
            'ml-IN': 'രേഖാ വിശകലനം തുറക്കുന്നു',
            'pa-IN': 'ਦਸਤਾਵੇਜ਼ ਵਿਸ਼ਲੇਸ਼ਕ ਖੋਲ੍ਹ ਰਿਹਾ ਹਾਂ'
        },
        'emi_analysis': {
            'en-IN': 'Taking you to EMI calculator',
            'hi-IN': 'ईएमआई कैलकुलेटर पर ले जा रहा हूं',
            'bn-IN': 'ইএমআই ক্যালকুলেটরে নিয়ে যাচ্ছি',
            'ta-IN': 'இஎம்ஐ கால்குலேட்டருக்கு அழைத்துச் செல்கிறேன்',
            'te-IN': 'ఈఎంఐ కాల్కులేటర్‌కి మిమ్మల్ని తీసుకువెళ్తున్నాను',
            'mr-IN': 'ईएमआय कॅल्क्युलेटरकडे नेत आहे',
            'gu-IN': 'ઈએમઆઈ કેલ્ક્યુલેટર પર લઈ જઈ રહ્યો છું',
            'kn-IN': 'ಇಎಂಐ ಕ್ಯಾಲ್ಕುಲೇಟರ್‌ಗೆ ಕರೆದೊಯ್ಯುತ್ತಿದ್ದೇನೆ',
            'ml-IN': 'ഇഎംഐ കാൽക്കുലേറ്ററിലേക്ക് നയിക്കുന്നു',
            'pa-IN': 'ਈਐਮਆਈ ਕੈਲਕੂਲੇਟਰ ਤੇ ਲੈ ਜਾ ਰਿਹਾ ਹਾਂ'
        },
        'eligibility': {
            'en-IN': 'Checking loan eligibility',
            'hi-IN': 'लोन पात्रता जांच रहा हूं',
            'bn-IN': 'ঋণ যোগ্যতা যাচাই করছি',
            'ta-IN': 'கடன் தகுதியை சரிபார்க்கிறது',
            'te-IN': 'రుణ అర్హతను తనిఖీ చేస్తున్నాను',
            'mr-IN': 'कर्ज पात्रता तपासत आहे',
            'gu-IN': 'લોન પાત્રતા ચકાસી રહ્યો છું',
            'kn-IN': 'ಸಾಲ ಅರ್ಹತೆಯನ್ನು ಪರಿಶೀಲಿಸುತ್ತಿದ್ದೇನೆ',
            'ml-IN': 'വായ്പാ യോഗ്യത പരിശോധിക്കുന്നു',
            'pa-IN': 'ਲੋਨ ਯੋਗਤਾ ਚੈੱਕ ਕਰ ਰਿਹਾ ਹਾਂ'
        }
    }

    # Get message for intent and language, fallback to English if not found
    intent_messages = messages.get(intent, {})
    return intent_messages.get(language, intent_messages.get('en-IN', 'Navigating to requested page'))

def generate_navigation_response(intent, language, message):
    """Enhanced navigation response with immediate redirection"""
    if intent not in PROJECT_PATHS:
        return None
        
    path = PROJECT_PATHS[intent]
    description = FEATURE_DESCRIPTIONS[intent]['description']
    nav_message = generate_navigation_message(intent, language)
    
    # Force navigate for EMI and eligibility
    force_navigate = intent in ['emi_analysis', 'eligibility']
    
    return {
        'action': 'navigate',
        'path': path,
        'response': nav_message,
        'suggestions': get_default_suggestions(language),
        'detected_language': language,
        'force_navigate': force_navigate,
        'confidence': 0.9
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
    """Get personalized system prompt for floating assistant"""
    language_name = LANGUAGES.get(language_code, "English")
    
    user_context = ""
    if user_data and user_data.get('profile'):
        profile = user_data['profile']
        user_context = f"""
        User Context:
        - Monthly Income: ₹{profile.get('monthly_income', 'Not provided')}
        - Employment: {profile.get('employment_type', 'Not provided')}
        - Credit Score: {profile.get('credit_score', 'Not provided')}
        - Existing Loans: {len(user_data.get('loans', []))}
        - Monthly Expenses: ₹{profile.get('monthly_expenses', 'Not provided')}
        """

    return f"""You are FinSaathi, a specialized financial assistant focused on Indian loans and banking.
    {user_context}
    
    Key Capabilities:
    1. Navigate users to appropriate sections
    2. Answer loan-related queries
    3. Provide personalized financial advice
    4. Help with document analysis
    5. Guide through EMI calculations
    6. Check loan eligibility
    7. Compare loan offers
    8. Track payments and dues

    Rules:
    1. Respond in {language_name}
    2. Keep responses concise (under 50 words)
    3. Personalize based on user context
    4. Provide clear next actions
    5. Always maintain context
    6. Be proactive with suggestions
    7. Handle multiple intents in one query
    8. Confirm understanding before navigation

    Available Actions:
    - navigate: Direct user to specific pages
    - calculate: Perform financial calculations
    - analyze: Review documents or data
    - inform: Provide information
    - suggest: Offer recommendations
    
    Response format:
    {{
        "action": "stay/navigate",
        "response": "brief response",
        "suggestions": ["2-3 relevant suggestions"],
        "path": "destination path if navigating",
        "detected_language": "{language_code}",
        "confidence": 0.0-1.0
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


def get_default_suggestions(language="en-IN"):
    """Get default suggestions based on language"""
    suggestions = {
        "en-IN": [
            "Check loan eligibility",
            "Calculate EMI",
            "Analyze loan documents",
            "View loan options"
        ],
        "hi-IN": [
            "ऋण पात्रता जांचें",
            "ईएमआई गणना करें",
            "ऋण दस्तावेज़ विश्लेषण",
            "ऋण विकल्प देखें"
        ],
        "bn-IN": [
            "ঋণের যোগ্যতা যাচাই করুন",
            "ইএমআই গণনা করুন",
            "ঋণ নথি বিশ্লেষণ করুন",
            "ঋণের বিকল্পগুলি দেখুন"
        ],
        # Add other languages as needed...
    }
    return suggestions.get(language, suggestions["en-IN"])

def process_with_ai(message, language, system_prompt, user_data=None):
    """Enhanced AI processing with strict route validation"""
    try:
        # First detect intent
        intent = detect_dashboard_intent(message, language)
        
        # Add context to the message
        context_message = f"""User Query: {message}
        Current Language: {language}
        Detected Intent: {intent if intent else 'None'}
        Valid Routes: {', '.join(DASHBOARD_ROUTES.keys())}
        """

        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": context_message},
            ],
            model="llama-3.2-90b-vision-preview",
            temperature=0.7,
            max_tokens=500,
        )

        response_content = chat_completion.choices[0].message.content.strip()

        try:
            parsed_response = json.loads(response_content)
            
            # Validate navigation path
            if parsed_response.get('action') == 'navigate':
                path = parsed_response.get('path')
                if not any(route['path'] == path for route in DASHBOARD_ROUTES.values()):
                    # If invalid path, force stay action
                    parsed_response['action'] = 'stay'
                    parsed_response['response'] = 'I can only help you navigate within the main dashboard sections.'
            
            return parsed_response
            
        except:
            return {
                "action": "stay",
                "response": response_content,
                "suggestions": get_default_suggestions(language),
                "detected_language": language,
                "confidence": 0.5
            }

    except Exception as e:
        logger.error(f"AI processing error: {str(e)}")
        return {
            "action": "stay",
            "response": "I encountered an error. Please try again.",
            "suggestions": get_default_suggestions(language),
            "detected_language": language,
            "confidence": 0.0
        }

def detect_dashboard_intent(message, language):
    """Enhanced intent detection with language support - restricted to main routes"""
    message = message.lower()
    
    # Check each route's intents in the specified language
    for route_id, route_info in DASHBOARD_ROUTES.items():
        route_intents = route_info['intents'].get(language, route_info['intents']['en-IN'])
        
        # Check for exact matches
        if any(intent.lower() in message for intent in route_intents):
            return {
                'intent': route_id,
                'path': route_info['path'],
                'confidence': 0.9
            }
            
    return None

def get_system_prompt(language_code, user_data=None):
    """Get enhanced system prompt for strict response format"""
    language_name = LANGUAGES.get(language_code, "English")
    
    dashboard_paths = "\n".join([
        f"- {route['path']}: {', '.join(route['intents'].get(language_code, route['intents']['en-IN']))}" 
        for route in DASHBOARD_ROUTES.values()
    ])

    return f"""You are FinSaathi, a focused financial assistant for Indian banking and loans.

STRICT RESPONSE FORMAT:
{{
    "action": "navigate" | "stay",
    "response": "your concise response in {language_name}",
    "suggestions": ["2-3 relevant suggestions"],
    "path": "/dashboard/..." if action is navigate,
    "detected_language": "{language_code}",
    "confidence": 0.0 to 1.0
}}

VALIDATION RULES:
1. Response MUST be valid JSON
2. Response MUST be in {language_name}
3. Response length MUST be under 50 words
4. Suggestions MUST be relevant to current context
5. Navigation MUST only use these paths:
{dashboard_paths}

BEHAVIORAL RULES:
1. Stay within dashboard navigation
2. Confirm user intent before navigation
3. Maintain conversation context
4. Be direct and concise
5. Focus on financial guidance
6. Use formal language
7. Handle unclear requests with clarification

Example valid responses:
{{"action": "navigate", "path": "/dashboard/loanBuddy", "response": "Taking you to loan assistant", "suggestions": ["Check EMI", "View Documents"], "detected_language": "{language_code}", "confidence": 0.9}}
{{"action": "stay", "response": "Your EMI would be ₹15,000 per month", "suggestions": ["Calculate EMI", "Check Eligibility"], "detected_language": "{language_code}", "confidence": 1.0}}

Current user context:
{user_data if user_data else "No user data available"}
"""

@app.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.json
        message = data.get("message", "")
        language = data.get("language", "en-IN")
        current_path = data.get("currentPath", "")
        clerk_id = data.get("clerk_id")
        
        # Get user data for context
        user_data = get_user_data(clerk_id) if clerk_id else None
        
        # First try to detect dashboard navigation intent
        intent = detect_dashboard_intent(message, language)
        
        if intent and intent['path'] != current_path:
            response = {
                'action': 'navigate',
                'path': intent['path'],
                'response': generate_navigation_message(intent['intent'], language),
                'confidence': intent['confidence'],
                'suggestions': get_default_suggestions(language),
                'detected_language': language,
                'force_navigate': intent['confidence'] > 0.8
            }
            return jsonify({"success": True, "data": json.dumps(response)})
        
        # If no navigation intent, process with AI using strict system prompt
        system_prompt = get_system_prompt(language, user_data)
        response = process_with_ai(message, language, system_prompt, user_data)
        
        # Ensure response has suggestions
        if 'suggestions' not in response or not response['suggestions']:
            response['suggestions'] = get_default_suggestions(language)
        
        return jsonify({"success": True, "data": json.dumps(response)})
        
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        return jsonify({
            "success": False, 
            "error": str(e),
            "data": json.dumps({
                "action": "stay",
                "response": "I encountered an error. Please try again.",
                "suggestions": get_default_suggestions(language),
                "detected_language": language,
                "confidence": 0.0
            })
        })

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

if __name__ == "__main__":
    app.run(debug=True)
