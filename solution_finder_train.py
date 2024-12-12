import pandas as pd
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from imblearn.over_sampling import SMOTE
import joblib

# Load the dataset from Excel
df = pd.read_excel('data/solution_finder_dataset.xlsx', sheet_name=0)

# Check the dataset structure
print("Dataset Preview:")
print(df.head())

# Data Cleaning
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

# Handle class imbalance using SMOTE
print("\nBalancing classes with SMOTE...")
smote = SMOTE(random_state=42, k_neighbors=1)  # Adjust k_neighbors to handle small classes
X, y = smote.fit_resample(X, y)

print("\nClass distribution after balancing:")
print(pd.Series(y).value_counts())

# Split the dataset into training and testing sets
print("\nSplitting dataset...")
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.22, random_state=42, stratify=y)

# Train XGBoost model
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
