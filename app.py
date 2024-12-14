from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import joblib
import logging
from pymongo import MongoClient

app = Flask(__name__)
CORS(app)

# Setup logging
logging.basicConfig(level=logging.INFO)

# MongoDB setup
MONGO_URI = "mongodb://127.0.0.1:27017/skin_care"
client = MongoClient(MONGO_URI)
db = client['skin_care']
collection = db['products']

# Load the pre-trained skincare recommendation model, encoders, and accuracy
recommendation_model = joblib.load('xgb_skincare_model.pkl')
le_conditions = joblib.load('le_conditions.pkl')
le_feel = joblib.load('le_feel.pkl')
le_ingredient = joblib.load('le_ingredient.pkl')
le_product = joblib.load('le_product.pkl')
model_accuracy = joblib.load('model_accuracy.pkl')  # Load the accuracy value

# Load the dataset for direct lookup
product_file_path = 'data/solution_finder_dataset.xlsx'
recommendation_df = pd.read_excel(product_file_path, engine='openpyxl')

@app.before_request
def log_request_info():
    """Log request data for debugging purposes."""
    app.logger.info(f"Request Data: {request.get_json()}")

@app.route('/recommendation', methods=['POST'])
def recommend():
    """Handle skincare product recommendation requests."""
    data = request.get_json()

    # Validate input
    if not data or not all(key in data for key in ['skin_conditions', 'skin_feel', 'ingredient_preferences']):
        return jsonify({'error': 'Missing required input fields: skin_conditions, skin_feel, ingredient_preferences'}), 400

    try:
        # Extract input data
        skin_condition = data.get('skin_conditions').strip()
        skin_feel = data.get('skin_feel').strip()
        ingredient_preference = data.get('ingredient_preferences').strip()

        # Step 1: Check for exact matches in the dataset
        exact_match_df = recommendation_df[
            (recommendation_df['skin_conditions'] == skin_condition) &
            (recommendation_df['skin_feel'] == skin_feel) &
            (recommendation_df['ingredient_preferences'] == ingredient_preference)
        ]
        exact_matches = exact_match_df['product_name'].tolist()

        # Step 2: Check for exact matches in the database
        db_query = {
            "skin_conditions": skin_condition,
            "skin_feel": skin_feel,
            "ingredient_preferences": ingredient_preference
        }
        db_matches = list(collection.find(db_query, {"_id": 0, "product_name": 1}))
        db_product_names = [match['product_name'] for match in db_matches]

        # Combine exact matches from both sources
        exact_matches.extend(db_product_names)

        # If exact matches are found, return them
        if exact_matches:
            return jsonify({
                "recommended_products": exact_matches,
                "source": "Exact Match"
            })

        # Step 3: No exact matches found, fall back to model prediction
        # Encode input data using LabelEncoders
        if skin_condition not in le_conditions.classes_:
            raise KeyError(f"Skin condition '{skin_condition}' not recognized.")
        if skin_feel not in le_feel.classes_:
            raise KeyError(f"Skin feel '{skin_feel}' not recognized.")
        if ingredient_preference not in le_ingredient.classes_:
            raise KeyError(f"Ingredient preference '{ingredient_preference}' not recognized.")

        condition_encoded = le_conditions.transform([skin_condition])[0]
        feel_encoded = le_feel.transform([skin_feel])[0]
        ingredient_encoded = le_ingredient.transform([ingredient_preference])[0]

        # Prepare input data for model prediction
        input_data = [[condition_encoded, feel_encoded, ingredient_encoded]]

        # Predict the product using the model
        prediction = recommendation_model.predict(input_data)
        predicted_label = prediction[0]
        predicted_product_name = le_product.inverse_transform([predicted_label])[0]

        # Calculate confidence score (if supported by model)
        if hasattr(recommendation_model, "predict_proba"):
            probabilities = recommendation_model.predict_proba(input_data)
            confidence = max(probabilities[0]) * 100  # Convert to percentage
        else:
            confidence = None

        # Fallback recommendations based on model
        fallback_recommendations = [{"product_name": predicted_product_name, "confidence": round(confidence, 2) if confidence else None}]

        # Return fallback recommendations
        return jsonify({
            "recommended_products": fallback_recommendations,
            "source": "Model Prediction",
            "accuracy": model_accuracy * 100
        })

    except KeyError as e:
        app.logger.error(f"Invalid input: {str(e)}")
        return jsonify({'error': f"Invalid input: {str(e)}"}), 400

    except Exception as e:
        app.logger.error(f"An error occurred: {str(e)}")
        return jsonify({'error': 'An unexpected error occurred.', 'details': str(e)}), 500


if __name__ == '__main__':
    app.run(port=5000, debug=True)
