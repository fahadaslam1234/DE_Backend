from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import joblib
import logging

app = Flask(__name__)
CORS(app)

# Setup logging
logging.basicConfig(level=logging.INFO)

# Load the pre-trained skincare recommendation model, encoders, and accuracy
recommendation_model = joblib.load('xgb_skincare_model.pkl')  # Updated to load XGBoost model
le_conditions = joblib.load('le_conditions.pkl')
le_feel = joblib.load('le_feel.pkl')
le_ingredient = joblib.load('le_ingredient.pkl')
le_product = joblib.load('le_product.pkl')
model_accuracy = joblib.load('model_accuracy.pkl')  # Load the accuracy value

# Load the dataset for direct lookup
product_file_path = 'data/solution_finder_dataset.xlsx'
recommendation_df = pd.read_excel(product_file_path, engine='openpyxl')

# Normalize the DataFrame columns
recommendation_df['skin_conditions'] = recommendation_df['skin_conditions'].str.strip().str.lower()
recommendation_df['skin_feel'] = recommendation_df['skin_feel'].str.strip().str.lower()
recommendation_df['ingredient_preferences'] = recommendation_df['ingredient_preferences'].str.strip().str.lower()

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
        # Extract and normalize input data
        skin_condition = data.get('skin_conditions').strip().lower()
        skin_feel = data.get('skin_feel').strip().lower()
        ingredient_preference = data.get('ingredient_preferences').strip().lower()

        # Direct lookup in the DataFrame
        match = recommendation_df[
            (recommendation_df['skin_conditions'] == skin_condition) &
            (recommendation_df['skin_feel'] == skin_feel) &
            (recommendation_df['ingredient_preferences'] == ingredient_preference)
        ]

        # If a match is found, return the product name directly
        if not match.empty:
            product_name = match.iloc[0]['product_name']
            return jsonify({"product_name": product_name, "accuracy": model_accuracy})

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

        # Return the product name, confidence score, and accuracy
        response = {
            "product_name": predicted_product_name,
            "confidence": round(confidence, 2) if confidence else None,
            "accuracy": model_accuracy * 100
        }
        return jsonify(response)

    except KeyError as e:
        app.logger.error(f"Invalid input: {str(e)}")
        return jsonify({'error': f"Invalid input: {str(e)}"}), 400

    except Exception as e:
        app.logger.error(f"An error occurred: {str(e)}")
        return jsonify({'error': 'An unexpected error occurred.', 'details': str(e)}), 500


if __name__ == '__main__':
    app.run(port=5000, debug=True)
