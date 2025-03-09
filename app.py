from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import logging
import tensorflow as tf
import numpy as np
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
import joblib
import os

app = Flask(__name__)
CORS(app)

# Setup logging
logging.basicConfig(level=logging.INFO)

# ------------------- [ Load Skin Disease Prediction Model (VGG16) ] -------------------
MODEL_PATH = "./vgg16_skin_model_final.h5"  # Update with VGG16 model filename
if os.path.exists(MODEL_PATH):
    model = load_model(MODEL_PATH)
    logging.info("✅ VGG16 Skin disease prediction model loaded successfully.")
else:
    logging.error(f"❌ Model file not found: {MODEL_PATH}")
    raise FileNotFoundError(f"Model file {MODEL_PATH} is missing!")

# Ensure class names match your dataset folder names
class_names = [
    "Eczema",
    "Melanoma",
    "Atopic Dermatitis",
    "Basal Cell Carcinoma (BCC)",
    "Melanocytic Nevi (NV)",
    "Benign Keratosis-like Lesions (BKL)",
    "Psoriasis pictures Lichen Planus and related diseases",
    "Seborrheic Keratoses and other Benign Tumors",
    "Tinea Ringworm Candidiasis and other Fungal Infections",
    "Warts Molluscum and other Viral Infections"
]

IMG_SIZE = (224, 224)

@app.before_request
def log_request_info():
    """Log request data for debugging."""
    logging.info(f"[INFO] Request received: {request.method} {request.path}")
    if request.method == 'POST':
        logging.info(f"[INFO] Request Headers: {request.headers}")

# ------------------- [ Updated Skin Disease Prediction API for VGG16 ] -------------------
@app.route('/predict_skin_disease', methods=['POST'])
def predict_skin_disease():
    """
    Predict skin disease from an uploaded image using VGG16.
    ONLY returns the disease name without confidence score.
    """
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided. Please upload an image.'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file. Please upload a valid image.'}), 400

    try:
        # Save uploaded image temporarily
        file_path = os.path.join("uploads", file.filename)
        os.makedirs("uploads", exist_ok=True)  # Ensure the directory exists
        file.save(file_path)

        # Load and preprocess the image using VGG16 preprocessing
        img = image.load_img(file_path, target_size=IMG_SIZE)
        img_array = image.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)  # Add batch dimension
        img_array = tf.keras.applications.vgg16.preprocess_input(img_array)  # VGG16 preprocessing

        # Predict using the model
        predictions = model.predict(img_array)
        predicted_index = np.argmax(predictions[0])
        predicted_label = class_names[predicted_index]

        logging.info(f"✅ Predicted Disease: {predicted_label}")

        # Remove the temporary file
        os.remove(file_path)

        return jsonify({
            "predicted_disease": predicted_label  # Only returns the disease name
        })

    except Exception as e:
        logging.error(f"❌ Error processing image: {str(e)}")
        return jsonify({'error': 'Image processing failed.', 'details': str(e)}), 500

# ------------------- [ Load ML Models & LabelEncoders for Product Recommendation ] -------------------
MODEL_PRODUCT_PATH = "./xgb_product_model.pkl"
MODEL_URL_PATH = "./xgb_url_model.pkl"

LABEL_SKIN_TYPE = "./le_skin_type.pkl"
LABEL_SKIN_TONE = "./le_skin_tone.pkl"
LABEL_BRAND = "./le_brand.pkl"
LABEL_CATEGORY = "./le_category.pkl"
LABEL_PRODUCT = "./le_product.pkl"
LABEL_PRODUCT_URL = "./le_product_url.pkl"

# Load models
model_product = joblib.load(MODEL_PRODUCT_PATH)
model_url = joblib.load(MODEL_URL_PATH)

# Load LabelEncoders
le_skin_type = joblib.load(LABEL_SKIN_TYPE)
le_skin_tone = joblib.load(LABEL_SKIN_TONE)
le_brand = joblib.load(LABEL_BRAND)
le_category = joblib.load(LABEL_CATEGORY)
le_product = joblib.load(LABEL_PRODUCT)
le_product_url = joblib.load(LABEL_PRODUCT_URL)

logging.info("✅ ML Models & LabelEncoders Loaded Successfully!")

# ------------------- [ Define Recommendation Function (Fixes Case Sensitivity) ] -------------------
def recommend_product_details(skin_tone, skin_type, brand, category):
    try:
        # Convert user input to lowercase (fixes case sensitivity issues)
        skin_tone = skin_tone.lower().strip()
        skin_type = skin_type.lower().strip()
        brand = brand.lower().strip()
        category = category.lower().strip()

        # Convert to numeric using LabelEncoders
        skin_tone_encoded = le_skin_tone.transform([skin_tone])[0]
        skin_type_encoded = le_skin_type.transform([skin_type])[0]
        brand_encoded = le_brand.transform([brand])[0]
        category_encoded = le_category.transform([category])[0]

        # Prepare Input Data (Ensuring Feature Order Matches Training)
        input_data = pd.DataFrame([[skin_type_encoded, skin_tone_encoded, brand_encoded, category_encoded]],
                                  columns=['skin_type', 'skin_tone', 'brand', 'category'])

        # Predict Product & URL
        predicted_product_id = model_product.predict(input_data)[0]
        predicted_url_id = model_url.predict(input_data)[0]

        # Decode Predictions
        predicted_product = le_product.inverse_transform([predicted_product_id])[0]
        predicted_url = le_product_url.inverse_transform([predicted_url_id])[0]

        return {"Product": predicted_product, "Product_URL": predicted_url}

    except Exception as e:
        logging.error(f"❌ Error in recommendation: {str(e)}")
        return {"error": str(e)}

# ------------------- [ API Route: Product Recommendation ] -------------------
@app.route('/recommend_product', methods=['POST'])
def recommend():
    """
    API to recommend skincare products based on:
    - skin_tone
    - skin_type
    - brand
    - category

    Returns:
    - Recommended Product
    - Product URL
    """
    data = request.get_json()
    print(data)
    if not data or not all(key in data for key in ['skin_tone', 'skin_type', 'brand', 'category']):
        return jsonify({'error': 'Missing required input fields: skin_tone, skin_type, brand, category'}), 400

    try:
        skin_tone = data.get('skin_tone')
        skin_type = data.get('skin_type')
        brand = data.get('brand')
        category = data.get('category')

        # Get Recommendation
        recommendation = recommend_product_details(skin_tone, skin_type, brand, category)

        return jsonify(recommendation)

    except Exception as e:
        logging.error(f"❌ An error occurred: {str(e)}")
        return jsonify({'error': 'An unexpected error occurred.', 'details': str(e)}), 500

# ------------------- [ Start Flask Server ] -------------------
if __name__ == '__main__':
    app.run(port=5000, debug=True)