from flask import Blueprint, request, jsonify
import os
import base64
import tempfile
import gc
from io import BytesIO
from PIL import Image
import PyPDF2
import docx
import fitz
import re
import json
import logging

# Change the import to use CPU version
try:
    from paddleocr import PaddleOCR
except ImportError:
    print("Installing PaddleOCR dependencies...")
    os.system("pip install paddlepaddle")  # Install CPU version
    os.system("pip install paddleocr")
    from paddleocr import PaddleOCR

loanbuddy = Blueprint("loanbuddy", __name__)

# Initialize OCR with CPU settings
ocr = None

# Configure logging
logger = logging.getLogger(__name__)

def get_ocr():
    global ocr
    if ocr is None:
        ocr = PaddleOCR(
            use_angle_cls=False,
            lang="en",
            use_gpu=False,
            show_log=False,
            use_mp=True,
            cpu_threads=4,
        )
    return ocr


def get_temp_dir():
    temp_dir = os.path.join(tempfile.gettempdir(), "loanbuddy_api")
    os.makedirs(temp_dir, exist_ok=True)
    return temp_dir


# Document processing functions
def process_document(file_data, filename, language):
    try:
        temp_dir = get_temp_dir()
        _, ext = os.path.splitext(filename.lower())
        
        # Handle image files
        if ext in ['.jpg', '.jpeg', '.png']:
            return process_image(file_data)
            
        temp_file = os.path.join(temp_dir, f"temp_doc{ext}")

        with open(temp_file, "wb") as f:
            f.write(file_data)

        text = ""
        if ext == ".pdf":
            text = process_pdf(temp_file)
        elif ext == ".docx":
            text = process_docx(temp_file)
        elif ext == ".txt":
            text = process_txt(temp_file)
        else:
            raise ValueError(f"Unsupported file type: {ext}")

        # Clean up
        if os.path.exists(temp_file):
            os.remove(temp_file)

        return {
            "success": True,
            "text": text[:10000] if len(text) > 10000 else text,
            "truncated": len(text) > 10000,
        }

    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        gc.collect()


def process_pdf(file_path):
    try:
        text = ""
        pdf = PyPDF2.PdfReader(file_path)

        for page in pdf.pages:
            text += page.extract_text() + "\n"
            gc.collect()

        if not text.strip():
            # Try OCR if text extraction fails
            text = process_pdf_ocr(file_path)

        return text
    except Exception as e:
        raise Exception(f"PDF processing error: {str(e)}")


def process_pdf_ocr(file_path):
    text = ""
    pdf = fitz.open(file_path)

    # Get OCR instance
    ocr_instance = get_ocr()

    for page_num in range(min(3, len(pdf))):
        page = pdf[page_num]
        pix = page.get_pixmap()
        img_path = os.path.join(get_temp_dir(), f"page_{page_num}.png")
        pix.save(img_path)

        result = ocr_instance.ocr(img_path)
        if result and result[0]:
            text += (
                "\n".join([line[1][0] for line in result[0] if len(line) > 1]) + "\n"
            )

        os.remove(img_path)
        gc.collect()

    return text


def process_docx(file_path):
    try:
        doc = docx.Document(file_path)
        return "\n".join([para.text for para in doc.paragraphs])
    except Exception as e:
        raise Exception(f"DOCX processing error: {str(e)}")


def process_txt(file_path):
    try:
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            return f.read()
    except Exception as e:
        raise Exception(f"TXT processing error: {str(e)}")


def process_image(file_data):
    try:
        # Save and process image
        temp_dir = get_temp_dir()
        temp_img = os.path.join(temp_dir, "temp_image.jpg")
        
        image = Image.open(BytesIO(file_data))
        
        # Resize if needed
        if max(image.size) > 1200:
            image.thumbnail((1200, 1200), Image.LANCZOS)
        
        image.save(temp_img, optimize=True, quality=85)
        
        # Get OCR instance
        ocr_instance = get_ocr()
        
        # Run OCR
        result = ocr_instance.ocr(temp_img)
        text = ""
        if result and result[0]:
            text = "\n".join([line[1][0] for line in result[0] if len(line) > 1])
        
        # Clean up
        os.remove(temp_img)
        gc.collect()
        
        return {
            "success": True,
            "text": text[:10000] if len(text) > 10000 else text,
            "truncated": len(text) > 10000,
            "type": "image"
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


@loanbuddy.route("/document", methods=["POST"])
def handle_document():
    try:
        if "file" not in request.files:
            return jsonify({"success": False, "error": "No file provided"}), 400

        file = request.files["file"]
        if not file.filename:
            return jsonify({"success": False, "error": "Invalid file"}), 400

        target_language = request.form.get("targetLanguage", "Hindi")
        source_language = request.form.get("sourceLanguage", "en-IN")

        # Process document
        result = process_document(file.read(), file.filename, source_language)
        
        if not result["success"]:
            return jsonify({"success": False, "error": result["error"]}), 500

        # Extract and process text
        text = result["text"]
        
        # Process translations in batches
        translations = process_translations([{"text": t} for t in text.split("\n") if t.strip()], target_language)
        
        # Generate guide
        guide = generate_guide(text, translations, target_language)
        
        # Combine results
        response = {
            "success": True,
            "data": {
                "text": text,
                "translations": translations,
                "guide": guide,
                "key_info": extract_key_info(text),
                "truncated": result.get("truncated", False)
            }
        }
        
        return jsonify(response)

    except Exception as e:
        logger.error(f"Document handling error: {e}", exc_info=True)
        return jsonify({"success": False, "error": str(e)}), 500


def extract_key_info(text):
    """Extract key information from document text"""
    key_info = {
        "loan_amount": None,
        "interest_rate": None,
        "tenure": None,
        "type": None,
    }

    # Simple pattern matching for demonstration
    # In production, use more sophisticated NLP
    if re.search(r"loan amount.*?(\d[\d,]*)", text, re.I):
        key_info["loan_amount"] = re.search(
            r"loan amount.*?(\d[\d,]*)", text, re.I
        ).group(1)
    if re.search(r"interest.*?(\d+\.?\d*)%", text, re.I):
        key_info["interest_rate"] = re.search(
            r"interest.*?(\d+\.?\d*)%", text, re.I
        ).group(1)
    if re.search(r"tenure.*?(\d+)\s*(month|year)", text, re.I):
        key_info["tenure"] = re.search(
            r"tenure.*?(\d+)\s*(month|year)", text, re.I
        ).group(1)
    if re.search(r"(personal|home|car|business)\s+loan", text, re.I):
        key_info["type"] = re.search(
            r"(personal|home|car|business)\s+loan", text, re.I
        ).group(1)

    return key_info


def process_pdf_file(file_data):
    """Process PDF data directly from bytes"""
    try:
        # Save to temporary file
        temp_dir = get_temp_dir()
        temp_file = os.path.join(temp_dir, "temp.pdf")

        with open(temp_file, "wb") as f:
            f.write(file_data)

        text = process_pdf(temp_file)

        # Clean up
        os.remove(temp_file)

        return {
            "success": True,
            "text": text[:10000] if len(text) > 10000 else text,
            "truncated": len(text) > 10000,
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


# Similarly update process_docx_file and process_txt_file
# ...rest of existing code...


@loanbuddy.route("/image", methods=["POST"])
def handle_image():
    try:
        if "image" not in request.files:
            return jsonify({"success": False, "error": "No image provided"}), 400

        image = request.files["image"]
        if not image.filename:
            return jsonify({"success": False, "error": "Invalid image"}), 400

        # Get user's prompt and language
        prompt = request.form.get("message", "")
        language = request.form.get("language", "en-IN")

        # Process the image
        image_data = image.read()
        result = process_image(image_data)

        if not result["success"]:
            return jsonify({"success": False, "error": result["error"]}), 500

        # Add prompt to response for context
        return jsonify(
            {
                "success": True,
                "data": {
                    "text": result["text"],
                    "image": result["image_base64"],
                    "prompt": prompt,
                },
            }
        )

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


def get_groq_client():
    """Get initialized Groq client for translations"""
    groq_api_key = os.environ.get("GROQ_API_KEY")
    if not groq_api_key:
        logger.error("GROQ_API_KEY not set in environment")
        raise ValueError("GROQ_API_KEY not set in environment")
    try:
        from groq import Groq
        return Groq(api_key=groq_api_key)
    except ImportError:
        logger.error("Failed to import Groq package")
        raise ImportError("Please install groq package: pip install groq")

def process_translations(text_items, target_language, batch_size=15):
    """Process translations in batches with error handling"""
    try:
        client = get_groq_client()
        results = []
        
        for i in range(0, len(text_items), batch_size):
            batch = text_items[i:i+batch_size]
            try:
                prompt = f"""Create a JSON response with translations for the following text segments.
                Target language: {target_language}

                Return response in this exact JSON format:
                {{
                    "translations": [
                        {{
                            "original": "original text",
                            "purpose": "purpose/meaning",
                            "translated_text": "translation in {target_language}",
                            "instructions": "instructions in {target_language}"
                        }}
                    ]
                }}

                Text segments to translate:
                {json.dumps(batch, ensure_ascii=False, indent=2)}
                """
                
                response = client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": "You are a translation assistant. Generate JSON responses."},
                        {"role": "user", "content": f"Create JSON translation for: {prompt}"}
                    ],
                    model="mixtral-8x7b-32768",
                    temperature=0.3,
                    max_tokens=2000
                )
                
                result = json.loads(response.choices[0].message.content)
                if "translations" in result:
                    results.extend(result["translations"])
                
            except Exception as e:
                logger.error(f"Translation batch error: {e}")
                continue
                
        return results or [{
            "original": "Translation error",
            "translated_text": "Error processing translation",
            "purpose": "Error notification",
            "instructions": "Please try again"
        }]
        
    except Exception as e:
        logger.error(f"Translation process failed: {e}")
        return []

def generate_guide(text, translations, target_language):
    """Generate a user guide for the document with error handling"""
    try:
        client = get_groq_client()
        
        prompt = f"""
        Create a helpful guide for this document in {target_language}.
        Include:
        1. Overview of the document
        2. Important sections
        3. Key points to note
        4. Common mistakes to avoid
        5. Step by step instructions
        
        Base your guide on this content:
        {text[:2000]}
        
        Use the translations provided:
        {json.dumps(translations[:5], ensure_ascii=False)}
        """
        
        try:
            response = client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="mixtral-8x7b-32768",
                temperature=0.7,
                max_tokens=1500
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"Guide generation error: {e}")
            return None
            
    except Exception as e:
        logger.error(f"Guide creation failed: {e}")
        return None

@loanbuddy.route("/document", methods=["POST"])
def process_document_route():
    try:
        if "file" not in request.files:
            return jsonify({"success": False, "error": "No file provided"}), 400

        file = request.files["file"]
        if not file.filename:
            return jsonify({"success": False, "error": "Invalid file"}), 400

        target_language = request.form.get("targetLanguage", "Hindi")
        source_language = request.form.get("sourceLanguage", "en-IN")

        # Read file data
        file_data = file.read()
        file_extension = os.path.splitext(file.filename)[1].lower()

        # Process based on file type
        if file_extension == ".pdf":
            result = process_pdf_file(file_data)
        elif file_extension in [".jpg", ".jpeg", ".png"]:
            result = process_image(file_data)
        else:
            return jsonify({"success": False, "error": "Unsupported file type"}), 400

        if not result["success"]:
            return jsonify({"success": False, "error": result["error"]}), 500

        # Extract form fields
        text = result["text"]
        form_fields = extract_key_info(text)

        # Process translations and create guide
        translation_results = process_translations(
            list(form_fields.values()), [{"text": text}], target_language
        )

        return jsonify(
            {
                "success": True,
                "data": {
                    "fields": form_fields,
                    "translations": translation_results,
                    "text": text,
                },
            }
        )

    except Exception as e:
        print(f"Error processing document: {e}")
        return jsonify({"success": False, "error": str(e)}), 500
