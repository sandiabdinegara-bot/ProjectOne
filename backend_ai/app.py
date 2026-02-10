import os
import easyocr
import cv2
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
import re
import base64

app = Flask(__name__)
CORS(app)

# Initialize EasyOCR Reader (Detects English digits)
# This will download models on first run (~100MB) if not already present
print("Initializing OCR Engine (EasyOCR)...")
reader = easyocr.Reader(['en'], gpu=False)

def apply_red_mask(img):
    """Detects and masks red (liters/decimals) with white background."""
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    
    # Red Range 1: 0-10
    lower_red1 = np.array([0, 70, 50])
    upper_red1 = np.array([10, 255, 255])
    
    # Red Range 2: 170-180
    lower_red2 = np.array([170, 70, 50])
    upper_red2 = np.array([180, 255, 255])
    
    mask1 = cv2.inRange(hsv, lower_red1, upper_red1)
    mask2 = cv2.inRange(hsv, lower_red2, upper_red2)
    red_mask = cv2.bitwise_or(mask1, mask2)
    
    kernel = np.ones((3,3), np.uint8)
    red_mask = cv2.dilate(red_mask, kernel, iterations=1)
    
    masked_img = img.copy()
    masked_img[red_mask > 0] = [255, 255, 255]
    
    return masked_img

def enhance_image(img):
    """Applies Scaling, Padding, CLAHE, and Sharpening for OCR accuracy."""
    # Resize 2.5x
    height, width = img.shape[:2]
    img = cv2.resize(img, (int(width*2.5), int(height*2.5)), interpolation=cv2.INTER_CUBIC)
    
    # Add Padding
    pad = 40
    img = cv2.copyMakeBorder(img, pad, pad, pad, pad, cv2.BORDER_CONSTANT, value=[255, 255, 255])
    
    # Grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # CLAHE
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
    enhanced = clahe.apply(gray)
    
    # Soft Sharpening
    kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
    sharpened = cv2.filter2D(enhanced, -1, kernel)
    
    return sharpened

def extract_digits(text_list):
    """Filters results to keep only digits, sorted Left-to-Right."""
    # Sort results by the X-coordinate of the bounding box
    sorted_list = sorted(text_list, key=lambda res: res[0][0][0])
    
    combined = "".join([res[1] for res in sorted_list])
    digits = re.sub(r'\D', '', combined)
    return digits

def find_best_match(detected, target):
    """Logic V7: Dynamic Scoring based on matched digit presence."""
    if not target: return "", 0.0
    
    temp_detected = list(detected)
    match_count = 0
    
    for digit in target:
        if digit in temp_detected:
            match_count += 1
            temp_detected.remove(digit)
            
    if len(target) > 0:
        final_ratio = (match_count / len(target)) * 100
    else:
        final_ratio = 0.0
    
    # Threshold for partial matches
    if final_ratio >= 50:
        return target, round(final_ratio, 2)
        
    return "", round(final_ratio, 2)

@app.route('/status', methods=['GET'])
def status():
    return jsonify({"status": "ready", "service": "PDAM OCR Microservice", "version": "1.0.0-v7"})

@app.route('/validate', methods=['POST'])
def validate_meter():
    image_url = request.form.get('image_url') # For fetching from server
    user_input = request.form.get('user_input', '')
    
    # Handle direct upload (preferred for real-time)
    if 'image' in request.files:
        image_file = request.files['image']
        nparr = np.frombuffer(image_file.read(), np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    else:
        return jsonify({"error": "No image provided"}), 400

    if img is None:
        return jsonify({"error": "Invalid image format"}), 400

    # Process
    masked_img = apply_red_mask(img)
    preprocessed_img = enhance_image(masked_img)
    results = reader.readtext(preprocessed_img)
    detected_digits = extract_digits(results)
    
    best_match_text, similarity = find_best_match(detected_digits, user_input)
    
    # Visual status
    status_label = "RED"
    if similarity >= 85: status_label = "GREEN"
    elif similarity >= 50: status_label = "YELLOW"

    # Debug image (optional but good for visual proof)
    _, buffer = cv2.imencode('.jpg', preprocessed_img)
    processed_base64 = base64.b64encode(buffer).decode('utf-8')
    
    return jsonify({
        "detected": detected_digits,
        "best_match": best_match_text,
        "user_input": user_input,
        "similarity_percent": similarity,
        "status": status_label,
        "debug_image": f"data:image/jpeg;base64,{processed_base64}"
    })

if __name__ == '__main__':
    print("PDAM OCR Microservice starting on Port 5000...")
    app.run(host='0.0.0.0', port=5000)
