import pandas as pd
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from imblearn.over_sampling import SMOTE
import joblib
from pymongo import MongoClient 

# MongoDB connection setup
MONGO_URI = "mongodb://127.0.0.1:27017/skin_care"
client = MongoClient(MONGO_URI)
db = client['skin_care']  # Database name
collection = db['products']  # Collection name

# Step 1: Load the dataset from Excel
print("\nLoading dataset from Excel...")
df = pd.read_excel('data/solution_finder_dataset.xlsx', sheet_name=0)

# Check the dataset structure
print("Dataset Preview:")
print(df.head())

# Step 2: Data Cleaning
print("\nCleaning dataset...")
df.drop_duplicates(inplace=True)
df.dropna(inplace=True)

# Check class distribution before filtering
print("\nClass distribution before filtering:")
print(df['product_name'].value_counts())

# Filter out classes with fewer than 2 occurrences
class_counts = df['product_name'].value_counts()
valid_classes = class_counts[class_counts > 1].index
df = df[df['product_name'].isin(valid_classes)]

print("\nClass distribution after filtering:")
print(df['product_name'].value_counts())

# Step 3: Initialize LabelEncoders
le_conditions = LabelEncoder()
le_feel = LabelEncoder()
le_ingredient = LabelEncoder()
le_product = LabelEncoder()

print(le_conditions)
print(le_feel)
print(le_ingredient)
print(le_product)

# Encode input features
df['skin_conditions'] = le_conditions.fit_transform(df['skin_conditions'])
df['skin_feel'] = le_feel.fit_transform(df['skin_feel'])
df['ingredient_preferences'] = le_ingredient.fit_transform(df['ingredient_preferences'])

# Encode the target column
df['product_name'] = le_product.fit_transform(df['product_name'])

# Step 4: Define features (X) and target (y)
X = df[['skin_conditions', 'skin_feel', 'ingredient_preferences']]
y = df['product_name']

# Handle class imbalance using SMOTE
print("\nBalancing classes with SMOTE...")
smote = SMOTE(random_state=42, k_neighbors=1)  # Adjust k_neighbors to handle small classes
X, y = smote.fit_resample(X, y)

print("\nClass distribution after balancing:")
print(pd.Series(y).value_counts())

# Step 5: Split the dataset into training and testing sets
print("\nSplitting dataset...")
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.22, random_state=42, stratify=y)

# Step 6: Train XGBoost model
print("\nTraining XGBoost Classifier...")
model = XGBClassifier(random_state=42, eval_metric='mlogloss')
model.fit(X_train, y_train)

# Calculate accuracy on the test set
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred) * 100
print(f"\nModel Accuracy: {accuracy:.2f}%")

# Check unique classes in the test set
print("\nClasses in training set:", set(y_train))
print("Classes in testing set:", set(y_test))

# Improved Classification Report
print("\nClassification Report:")
print(classification_report(
    y_test,
    y_pred,
    labels=list(range(len(le_product.classes_))),
    target_names=le_product.classes_,
    zero_division=0  # Handle undefined metrics gracefully
))

# Confusion matrix
print("\nConfusion Matrix:")
print(confusion_matrix(y_test, y_pred))

# Save the trained model, LabelEncoders, and accuracy
joblib.dump(model, 'xgb_skincare_model.pkl')
joblib.dump(le_conditions, 'le_conditions.pkl')
joblib.dump(le_feel, 'le_feel.pkl')
joblib.dump(le_ingredient, 'le_ingredient.pkl')
joblib.dump(le_product, 'le_product.pkl')
joblib.dump(accuracy, 'model_accuracy.pkl')

print("\nModel training completed and saved as 'xgb_skincare_model.pkl' and related files.")

# Step 7: Fetch data from MongoDB for recommendations
# Step 7: Fetch data from MongoDB for recommendations
print("\nFetching product data from MongoDB...")
products_cursor = collection.find(
     {
        "skin_conditions": {"$nin": [None, "None"]},  # Exclude None and "None"
        "skin_feel": {"$nin": [None, "None"]},
        "ingredient_preferences": {"$nin": [None, "None"]}
    },
    {
        "product_name": 1,
        "skin_conditions": 1,
        "skin_feel": 1,
        "ingredient_preferences": 1,
        "price": 1,
        "_id": 0
    }
)
df_products = pd.DataFrame(list(products_cursor))

# Ensure all required fields are available and valid
if df_products.empty:
    print("No data found in the MongoDB collection.")
    exit()

print("\nValidating and encoding MongoDB data...")

# Validate and encode labels to match the training data
try:
    df_products['skin_conditions'] = le_conditions.transform(df_products['skin_conditions'])
    df_products['skin_feel'] = le_feel.transform(df_products['skin_feel'])
    df_products['ingredient_preferences'] = le_ingredient.transform(df_products['ingredient_preferences'])
except ValueError as e:
    print("Error during label encoding:", e)
    exit()

# Ensure all encoded fields are numeric
df_products[['skin_conditions', 'skin_feel', 'ingredient_preferences']] = df_products[
    ['skin_conditions', 'skin_feel', 'ingredient_preferences']
].astype(int)

# Prepare features for prediction
X_products = df_products[['skin_conditions', 'skin_feel', 'ingredient_preferences']]

# Predict probabilities for product recommendations
# Predict probabilities for product recommendations
print("\nPredicting product recommendations...")
try:
    probabilities = model.predict_proba(X_products)
except ValueError as e:
    print("Error during prediction:", e)
    exit()

# Define the number of top recommendations (e.g., top 3)
TOP_N = 3

# Get the top-N recommended classes for each product
top_n_indices = probabilities.argsort(axis=1)[:, -TOP_N:][:, ::-1]  # Get top-N indices in descending order

# Convert the 2D array to a list of lists to store in the DataFrame
df_products['top_n_classes'] = top_n_indices.tolist()

# Decode the top-N class indices back to product names
df_products['top_n_products'] = df_products['top_n_classes'].apply(
    lambda classes: [le_product.inverse_transform([cls])[0] for cls in classes]
)

# Display product recommendations with top-N products
print("\nProduct Recommendations (Top-N):")
for index, row in df_products.iterrows():
    print(f"Product Name: {row['product_name']}, Recommended Products: {', '.join(row['top_n_products'])}, Price: {row['price']}") 