from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import joblib
import logging
import tensorflow as tf
import numpy as np
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
from pymongo import MongoClient
import os

app = Flask(__name__)
CORS(app)

# Setup logging
logging.basicConfig(level=logging.INFO)

# ------------------- [ MongoDB Setup ] -------------------
MONGO_URI = "mongodb://127.0.0.1:27017/skin_care"
try:
    client = MongoClient(MONGO_URI)
    db = client['skin_care']
    collection = db['products']
    logging.info("✅ Connected to MongoDB successfully.")
except Exception as e:
    logging.error(f"❌ Failed to connect to MongoDB: {e}")

# ------------------- [ Load Product Recommendation Model ] -------------------
try:
    recommendation_model = joblib.load('xgb_skincare_model.pkl')
    le_conditions = joblib.load('le_conditions.pkl')
    le_feel = joblib.load('le_feel.pkl')
    le_ingredient = joblib.load('le_ingredient.pkl')
    le_product = joblib.load('le_product.pkl')
    model_accuracy = joblib.load('model_accuracy.pkl')
    logging.info("✅ Product recommendation model loaded successfully.")
except Exception as e:
    logging.error(f"❌ Failed to load recommendation model: {e}")

# Load dataset for direct lookup
product_file_path = 'data/solution_finder_dataset.xlsx'
try:
    recommendation_df = pd.read_excel(product_file_path, engine='openpyxl')
    logging.info("✅ Product dataset loaded successfully.")
except Exception as e:
    logging.error(f"❌ Failed to load product dataset: {e}")

# ------------------- [ Load Skin Disease Prediction Model ] -------------------
MODEL_PATH = "skin_disease_resnet50.h5"
if os.path.exists(MODEL_PATH):
    model = load_model(MODEL_PATH)
    logging.info("✅ Skin disease prediction model loaded successfully.")
else:
    logging.error(f"❌ Model file not found: {MODEL_PATH}")
    raise FileNotFoundError(f"Model file {MODEL_PATH} is missing!")

# Ensure class names match dataset folder names
class_names = [
    "Eczema", "Melanoma", "Atopic Dermatitis", "Basal Cell Carcinoma (BCC)",
    "Melanocytic Nevi (NV)", "Benign Keratosis-like Lesions (BKL)",
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

# ------------------- [ Skin Disease Prediction API ] -------------------
@app.route('/predict_skin_disease', methods=['POST'])
def predict_skin_disease():
    """Predict skin disease from an uploaded image using ResNet50V2."""

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

        # Load and preprocess the image
        img = image.load_img(file_path, target_size=IMG_SIZE)
        img_array = image.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)  # Add batch dimension
        img_array = img_array / 255.0  # Normalize

        # Predict using the model
        predictions = model.predict(img_array)
        confidence_scores = predictions[0]
        predicted_index = np.argmax(confidence_scores)
        predicted_label = class_names[predicted_index]
        confidence = float(confidence_scores[predicted_index] * 100)

        # Handle Normal Skin Case
        if confidence < 50:  
            predicted_label = "Healthy Skin"
            confidence = 99.9  # High confidence since it's not classified as a disease

        logging.info(f"✅ Prediction: {predicted_label} (Confidence: {confidence:.2f}%)")

        os.remove(file_path)  # Remove temp file

        return jsonify({
            "predicted_disease": predicted_label,
            "confidence": round(confidence, 2)
        })

    except Exception as e:
        logging.error(f"❌ Error processing image: {str(e)}")
        return jsonify({'error': 'Image processing failed.', 'details': str(e)}), 500

# ------------------- [ Skincare Product Recommendation API ] -------------------
@app.route('/recommendation', methods=['POST'])
def recommend():
    """Recommend skincare products based on user input."""
    data = request.get_json()

    if not data or not all(key in data for key in ['skin_conditions', 'skin_feel', 'ingredient_preferences']):
        return jsonify({'error': 'Missing required input fields: skin_conditions, skin_feel, ingredient_preferences'}), 400

    try:
        # Extract and sanitize inputs
        skin_condition = data.get('skin_conditions').strip()
        skin_feel = data.get('skin_feel').strip()
        ingredient_preference = data.get('ingredient_preferences').strip()

        # Step 1: Check for exact matches in dataset
        exact_match_df = recommendation_df[
            (recommendation_df['skin_conditions'] == skin_condition) &
            (recommendation_df['skin_feel'] == skin_feel) &
            (recommendation_df['ingredient_preferences'] == ingredient_preference)
        ]
        exact_matches = exact_match_df['product_name'].tolist()

        # Step 2: Check for exact matches in the database
        db_query = {"skin_conditions": skin_condition, "skin_feel": skin_feel, "ingredient_preferences": ingredient_preference}
        db_matches = list(collection.find(db_query, {"_id": 0, "product_name": 1}))
        db_product_names = [match['product_name'] for match in db_matches]

        exact_matches.extend(db_product_names)

        if exact_matches:
            return jsonify({"recommended_products": exact_matches, "source": "Exact Match"})

        # Step 3: Model Prediction
        if skin_condition not in le_conditions.classes_ or skin_feel not in le_feel.classes_ or ingredient_preference not in le_ingredient.classes_:
            raise KeyError("Invalid input detected.")

        condition_encoded = le_conditions.transform([skin_condition])[0]
        feel_encoded = le_feel.transform([skin_feel])[0]
        ingredient_encoded = le_ingredient.transform([ingredient_preference])[0]

        input_data = [[condition_encoded, feel_encoded, ingredient_encoded]]

        prediction = recommendation_model.predict(input_data)
        predicted_label = le_product.inverse_transform([prediction[0]])[0]

        confidence = None
        if hasattr(recommendation_model, "predict_proba"):
            confidence = max(recommendation_model.predict_proba(input_data)[0]) * 100

        return jsonify({
            "recommended_products": [{"product_name": predicted_label, "confidence": round(confidence, 2) if confidence else None}],
            "source": "Model Prediction",
            "accuracy": model_accuracy * 100
        })

    except KeyError as e:
        logging.error(f"❌ Invalid input: {str(e)}")
        return jsonify({'error': f"Invalid input: {str(e)}"}), 400

    except Exception as e:
        logging.error(f"❌ An error occurred: {str(e)}")
        return jsonify({'error': 'An unexpected error occurred.', 'details': str(e)}), 500

# ------------------- [ Start Flask Server ] -------------------
if __name__ == '__main__':
    app.run(port=5000, debug=True)
