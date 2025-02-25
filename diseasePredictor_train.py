import os
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, models
from tensorflow.keras.applications import ResNet50V2
from tensorflow.keras.preprocessing import image_dataset_from_directory
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint, LearningRateScheduler
from sklearn.utils.class_weight import compute_class_weight
import matplotlib.pyplot as plt

# ------------------ [ Load Dataset & Apply Augmentation ] ------------------
def load_dataset(data_dir, img_size=(224, 224), batch_size=64, val_split=0.2, seed=123):
    """Load images and create labels from subfolder names."""
    
    train_ds = image_dataset_from_directory(
        data_dir, validation_split=val_split, subset="training", seed=seed,
        image_size=img_size, batch_size=batch_size, label_mode="int"
    )
    val_ds = image_dataset_from_directory(
        data_dir, validation_split=val_split, subset="validation", seed=seed,
        image_size=img_size, batch_size=batch_size, label_mode="int"
    )

    class_names = train_ds.class_names
    print(f"[INFO] Classes found: {class_names}")

    # Apply Data Augmentation for better accuracy
    data_augmentation = keras.Sequential([
        layers.RandomFlip("horizontal_and_vertical"),
        layers.RandomRotation(0.4),  # Increased rotation
        layers.RandomZoom(0.3),      # Increased zoom
        layers.RandomContrast(0.3),  # Increased contrast
        layers.RandomBrightness(0.2),# Adjust brightness
    ])

    train_ds = train_ds.map(lambda x, y: (data_augmentation(x, training=True), y))
    
    # Optimize dataset performance
    AUTOTUNE = tf.data.AUTOTUNE
    train_ds = train_ds.prefetch(buffer_size=AUTOTUNE)
    val_ds = val_ds.prefetch(buffer_size=AUTOTUNE)

    return train_ds, val_ds, class_names

# ------------------ [ Compute Class Weights for Imbalanced Data ] ------------------
def compute_weights(train_ds, class_names):
    """Calculate class weights dynamically based on dataset distribution."""
    labels = np.concatenate([y for x, y in train_ds], axis=0)
    class_weights = compute_class_weight(class_weight="balanced", classes=np.unique(labels), y=labels)
    class_weights = {i: weight for i, weight in enumerate(class_weights)}
    print("[INFO] Computed class weights:", class_weights)
    return class_weights

# ------------------ [ Build ResNet50V2 Model ] ------------------
def build_resnet50_model(num_classes, img_size=(224, 224)):
    """Fine-tune ResNet50V2 for skin disease classification."""
    
    base_model = ResNet50V2(weights="imagenet", include_top=False, input_shape=(img_size[0], img_size[1], 3))
    base_model.trainable = False  # Freeze initially

    model = models.Sequential([
        base_model,
        layers.GlobalAveragePooling2D(),
        layers.Dense(1024, activation="relu", kernel_regularizer=tf.keras.regularizers.l2(0.002)),
        layers.Dropout(0.5),
        layers.Dense(512, activation="relu", kernel_regularizer=tf.keras.regularizers.l2(0.002)),
        layers.Dropout(0.4),
        layers.Dense(num_classes, activation="softmax")
    ])

    model.compile(optimizer=keras.optimizers.Adam(learning_rate=1e-4),
                  loss="sparse_categorical_crossentropy",
                  metrics=["accuracy"])

    return model

# ------------------ [ Learning Rate Scheduler ] ------------------
def lr_scheduler(epoch, lr):
    """Adjust learning rate dynamically during training."""
    if epoch < 10:
        return lr
    else:
        return lr * tf.math.exp(-0.1)  # Exponential decay

# ------------------ [ Train & Fine-Tune Model ] ------------------
def train_model(train_ds, val_ds, class_names, initial_epochs=30, fine_tune_epochs=50):
    """Train and fine-tune the model for best accuracy."""
    
    model = build_resnet50_model(num_classes=len(class_names))

    class_weights = compute_weights(train_ds, class_names)

    # Callbacks
    early_stopping = EarlyStopping(monitor="val_loss", patience=7, restore_best_weights=True)
    reduce_lr = ReduceLROnPlateau(monitor="val_loss", factor=0.3, patience=3, verbose=1)
    lr_schedule = LearningRateScheduler(lr_scheduler)
    checkpoint = ModelCheckpoint("best_model.h5", monitor="val_accuracy", save_best_only=True, mode="max", verbose=1)

    print("[INFO] Training initial model...")
    history = model.fit(train_ds, validation_data=val_ds, epochs=initial_epochs,
                        class_weight=class_weights, callbacks=[early_stopping, reduce_lr, lr_schedule, checkpoint])

    print("[INFO] Fine-tuning the model...")
    base_model = model.layers[0]
    base_model.trainable = True  # Unfreeze ResNet

    for layer in base_model.layers[:-50]:  # Unfreeze last 50 layers
        layer.trainable = True

    model.compile(optimizer=keras.optimizers.Adam(learning_rate=1e-5),
                  loss="sparse_categorical_crossentropy",
                  metrics=["accuracy"])

    history_fine = model.fit(train_ds, validation_data=val_ds, epochs=fine_tune_epochs,
                             class_weight=class_weights, callbacks=[early_stopping, reduce_lr, lr_schedule, checkpoint])

    return model, history, history_fine

# ------------------ [ Save Model ] ------------------
def save_model(model, model_path="skin_disease_resnet50.h5"):
    """Save the trained model in the correct format."""
    model.save(model_path)
    print(f"[INFO] Model saved to {model_path}")

# ------------------ [ Predict Disease Name ] ------------------
def predict_disease(model, img_path, class_names, img_size=(224, 224)):
    """Predict the disease name from an image."""
    
    img = keras.preprocessing.image.load_img(img_path, target_size=img_size)
    img_array = keras.preprocessing.image.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)  # Create a batch
    img_array = tf.keras.applications.resnet_v2.preprocess_input(img_array)

    predictions = model.predict(img_array)
    confidence_scores = predictions[0]
    predicted_index = np.argmax(confidence_scores)
    predicted_class_name = class_names[predicted_index]
    confidence = confidence_scores[predicted_index] * 100

    # If confidence is low, assume "Healthy Skin"
    if confidence < 50:
        return "Healthy Skin", 99.9

    return predicted_class_name, round(confidence, 2)

# ------------------ [ Run Training Process ] ------------------
if __name__ == "__main__":
    data_dir = r"./data/IMG_CLASSES"  # Replace with your dataset path

    # Delete old model file before training
    if os.path.exists("best_model.h5"):
        os.remove("best_model.h5")
        print("[INFO] Old model deleted successfully.")

    # Load dataset
    train_ds, val_ds, class_names = load_dataset(data_dir, img_size=(224, 224), batch_size=64)

    # Train & fine-tune model
    model, history, history_fine = train_model(train_ds, val_ds, class_names, initial_epochs=30, fine_tune_epochs=70)

    # Save model
    save_model(model, "skin_disease_resnet50.h5")

    # Example: Predict disease from a new image
    test_image_path = r"./data/test_image.jpg"  # Replace with your test image path
    predicted_disease, confidence = predict_disease(model, test_image_path, class_names)
    print(f"[INFO] Predicted Disease: {predicted_disease} (Confidence: {confidence}%)")
