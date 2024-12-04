import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import joblib

# Load the dataset from Excel
df = pd.read_excel('data/solution_finder_dataset.xlsx', sheet_name=0)  # Adjust the path and sheet_name if necessary

# Check the dataset structure
print(df.head())  # Optional: Remove this line after verifying the dataset's structure

# Initialize LabelEncoders
le_conditions = LabelEncoder()
le_feel = LabelEncoder()
le_ingredient = LabelEncoder()
le_product = LabelEncoder()

# Encode input features
df['skin_conditions'] = le_conditions.fit_transform(df['skin_conditions'])
df['skin_feel'] = le_feel.fit_transform(df['skin_feel'])
df['ingredient_preferences'] = le_ingredient.fit_transform(df['ingredient_preferences'])

# Encode the target column
df['product_name'] = le_product.fit_transform(df['product_name'])

# Define features (X) and target (y)
X = df[['skin_conditions', 'skin_feel', 'ingredient_preferences']]
y = df['product_name']

# Split the dataset into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train the RandomForest model
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Save the trained model and LabelEncoders
joblib.dump(model, 'skincare_model.pkl')
joblib.dump(le_conditions, 'le_conditions.pkl')
joblib.dump(le_feel, 'le_feel.pkl')
joblib.dump(le_ingredient, 'le_ingredient.pkl')
joblib.dump(le_product, 'le_product.pkl')

print("Model training completed and saved as 'skincare_model.pkl'")

# Function to make a prediction
def recommend_product(skin_condition, skin_feel, ingredient_preference):
    # Load the model and encoders
    model = joblib.load('skincare_model.pkl')
    le_conditions = joblib.load('le_conditions.pkl')
    le_feel = joblib.load('le_feel.pkl')
    le_ingredient = joblib.load('le_ingredient.pkl')
    le_product = joblib.load('le_product.pkl')

    # Encode the input values
    condition_encoded = le_conditions.transform([skin_condition])[0]
    feel_encoded = le_feel.transform([skin_feel])[0]
    ingredient_encoded = le_ingredient.transform([ingredient_preference])[0]

    # Prepare input data for prediction
    input_data = [[condition_encoded, feel_encoded, ingredient_encoded]]

    # Make a prediction
    prediction = model.predict(input_data)
    recommended_product = le_product.inverse_transform(prediction)[0]

    return recommended_product

# Example usage
#print(recommend_product('Skin Texture/Dullness', 'Dry', 'Vegan'))