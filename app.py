from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import joblib

app = Flask(__name__)
CORS(app)

# Load the pre-trained skincare recommendation model and encoders
recommendation_model = joblib.load('skincare_model.pkl')
le_conditions = joblib.load('le_conditions.pkl')
le_feel = joblib.load('le_feel.pkl')
le_ingredient = joblib.load('le_ingredient.pkl')
le_product = joblib.load('le_product.pkl')

# Load the dataset for direct lookup
product_file_path = 'data/testingDataForSolutionFinder.xlsx'
recommendation_df = pd.read_excel(product_file_path, engine='openpyxl')

# Normalize the DataFrame columns
recommendation_df['skin_conditions'] = recommendation_df['skin_conditions'].str.strip().str.lower()
recommendation_df['skin_feel'] = recommendation_df['skin_feel'].str.strip().str.lower()
recommendation_df['ingredient_preferences'] = recommendation_df['ingredient_preferences'].str.strip().str.lower()

@app.route('/recommendation', methods=['POST'])
def recommend():
    """Handle skincare product recommendation requests."""
    data = request.get_json()

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
            return jsonify({"product_name": product_name})

        # Encode input data using LabelEncoders
        condition_encoded = le_conditions.transform([skin_condition])[0]
        feel_encoded = le_feel.transform([skin_feel])[0]
        ingredient_encoded = le_ingredient.transform([ingredient_preference])[0]

        # Prepare input data for model prediction
        input_data = [[condition_encoded, feel_encoded, ingredient_encoded]]

        # Predict the product using the model
        prediction = recommendation_model.predict(input_data)
        predicted_label = prediction[0]
        predicted_product_name = le_product.inverse_transform([predicted_label])[0]

        # Return the product name from the model prediction
        return jsonify({"product_name": predicted_product_name})

    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(port=5000, debug=True)