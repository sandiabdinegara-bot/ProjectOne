import os
import easyocr
import cv2
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
import difflib
import re
import base64

app = Flask(__name__)
CORS(app)

# Initialize EasyOCR Reader (Detects English digits)
# This might download models on the first run (~100MB)
reader = easyocr.Reader(['en'], gpu=False)

def apply_red_mask(img):
    """Detects and masks red (liters) with white background. (Standard Range)"""
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    
    # Standard Red Range (More conservative to avoid eating black digits)
    # Range 1: 0-10
    lower_red1 = np.array([0, 70, 50])
    upper_red1 = np.array([10, 255, 255])
    
    # Range 2: 170-180
    lower_red2 = np.array([170, 70, 50])
    upper_red2 = np.array([180, 255, 255])
    
    mask1 = cv2.inRange(hsv, lower_red1, upper_red1)
    mask2 = cv2.inRange(hsv, lower_red2, upper_red2)
    red_mask = cv2.bitwise_or(mask1, mask2)
    
    # Use standard dilation (clean edges)
    kernel = np.ones((3,3), np.uint8)
    red_mask = cv2.dilate(red_mask, kernel, iterations=1)
    
    # Replace red areas with white
    masked_img = img.copy()
    masked_img[red_mask > 0] = [255, 255, 255]
    
    return masked_img

def enhance_image(img):
    """Applies Resizing, Padding, CLAHE, and Soft Sharpening."""
    # 0. Resize 2.5x for better feature detection
    height, width = img.shape[:2]
    img = cv2.resize(img, (int(width*2.5), int(height*2.5)), interpolation=cv2.INTER_CUBIC)
    
    # 0.1 Add Padding (Crucial to detect digits near the edge like '1')
    pad = 40
    img = cv2.copyMakeBorder(img, pad, pad, pad, pad, cv2.BORDER_CONSTANT, value=[255, 255, 255])
    
    # 1. Grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # 2. CLAHE (Better contrast)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
    enhanced = clahe.apply(gray)
    
    # 3. Soft Sharpening
    kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
    sharpened = cv2.filter2D(enhanced, -1, kernel)
    
    return sharpened

def extract_digits(text_list):
    """Filters results to keep only digits from the list of detections, sorted Left-to-Right."""
    # Sort results by the X-coordinate of the bounding box (res[0][0][0])
    # res[0] is [[x1, y1], [x2, y1], [x2, y2], [x1, y2]]
    sorted_list = sorted(text_list, key=lambda res: res[0][0][0])
    
    # Combine results and strip non-digits
    combined = "".join([res[1] for res in sorted_list])
    digits = re.sub(r'\D', '', combined)
    return digits

def find_best_match(detected, target):
    """Finds if the target digits exist in the detected string, regardless of order (Dynamic Scoring)."""
    if not target: return "", 0.0
    
    # Logic: Count how many digits from target are present in detected
    # We use a temporary copy of detected string to avoid double counting same digit
    temp_detected = list(detected)
    match_count = 0
    
    for digit in target:
        if digit in temp_detected:
            match_count += 1
            temp_detected.remove(digit) # Consume the digit so it's not counted twice
            
    # Calculate ratio: (Found Digits / Total Target Digits) * 100
    if len(target) > 0:
        final_ratio = (match_count / len(target)) * 100
    else:
        final_ratio = 0.0
    
    # DYNAMIC LOGIC (V7):
    # - Return the actual percentage of matched digits.
    # - Example for 5 digits: 4/5 match = 80%.
    # - Example for 4 digits: 3/4 match = 75%.
    # - Threshold: If match is less than 50% (e.g. only 1 out of 4), return empty/failure.
    
    if final_ratio >= 50:
        # If perfect match (100%), return target
        if final_ratio == 100:
            return target, 100.0
        # If partial match (>= 50%), return target but with lower score
        return target, round(final_ratio, 2)
        
    return "", final_ratio

@app.route('/validate', methods=['POST'])
def validate_meter():
    if 'image' not in request.files:
        return jsonify({"error": "No image uploaded"}), 400
    
    user_input = request.form.get('user_input', '')
    image_file = request.files['image']
    
    nparr = np.frombuffer(image_file.read(), np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        return jsonify({"error": "Invalid image format"}), 400

    # Apply Red Masking (Focus on Black)
    masked_img = apply_red_mask(img)
    
    # Enhance Contrast and Sharpen
    preprocessed_img = enhance_image(masked_img)

    # Perform OCR
    results = reader.readtext(preprocessed_img)
    detected_digits = extract_digits(results)
    
    # Noise Reduction logic: Find the best match segment
    best_match_text, similarity = find_best_match(detected_digits, user_input)
    
    # Threshold 85% - Memberikan toleransi jika ada 1 angka yang terlewat (misal angka 0 di depan)
    is_match = similarity >= 85
    
    # Convert preprocessed image to base64 for debugging
    _, buffer = cv2.imencode('.jpg', preprocessed_img)
    processed_base64 = base64.b64encode(buffer).decode('utf-8')
    
    return jsonify({
        "detected": detected_digits,
        "best_match": best_match_text,
        "user_input": user_input,
        "similarity_percent": round(similarity, 2),
        "is_match": is_match,
        "raw_results": [res[1] for res in results],
        "debug_image": f"data:image/jpeg;base64,{processed_base64}"
    })

if __name__ == '__main__':
    print("Starting OCR Prototype Server on http://localhost:5000")
    app.run(port=5000, debug=True)
