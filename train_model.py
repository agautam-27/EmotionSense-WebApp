# basic_train.py - Save in your project folder
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
import joblib

# Load training data
train_path = r"C:\COMP4949_WorkSpace\Assignment2\train.txt"
val_path = r"C:\COMP4949_WorkSpace\Assignment2\val.txt"

def load_data(file_path):
    data = pd.read_csv(file_path, sep=';', names=['text', 'emotion'])
    return data

print("Loading data...")
train_df = load_data(train_path)
val_df = load_data(val_path)

print("✅ Data loaded!")
print(f"Train: {train_df.shape}")
print(f"Val: {val_df.shape}")

# Create a simple pipeline with no custom components
pipeline = Pipeline([
    ('tfidf', TfidfVectorizer(
        max_features=10000,
        ngram_range=(1, 2),
        min_df=2
    )),
    ('classifier', LogisticRegression(
        C=1.0,
        max_iter=1000, 
        class_weight='balanced',
        solver='liblinear'
    ))
])

# Train the model
print("\n✅ Training model...")
pipeline.fit(train_df['text'], train_df['emotion'])

# Evaluate
print("\n✅ Evaluating model...")
val_preds = pipeline.predict(val_df['text'])
accuracy = (val_preds == val_df['emotion']).mean()
print(f"Validation accuracy: {accuracy:.4f}")

# Save the pipeline (just the pipeline, nothing custom)
print("\n✅ Saving model...")
joblib.dump(pipeline, "basic_model23.pkl")
print("Model saved as basic_model23.pkl")

print("\n✅ Done!")
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
from sklearn.metrics import confusion_matrix

# 1. Data Distribution Chart
plt.figure(figsize=(10, 6))
train_df['emotion'].value_counts().plot(kind='bar', color='skyblue')
plt.title('Distribution of Emotions in Training Data')
plt.ylabel('Count')
plt.tight_layout()
plt.savefig('emotion_distribution.png')

# 2. Confusion Matrix Heatmap
y_true = val_df['emotion']
y_pred = val_preds
cm = confusion_matrix(y_true, y_pred, labels=np.unique(y_true))
plt.figure(figsize=(10, 8))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
            xticklabels=np.unique(y_true),
            yticklabels=np.unique(y_true))
plt.xlabel('Predicted')
plt.ylabel('True')
plt.title('Confusion Matrix')
plt.tight_layout()
plt.savefig('confusion_matrix.png')

# 3. Feature Importance for each emotion
feature_names = pipeline[0].get_feature_names_out()
coefficients = pipeline[1].coef_

plt.figure(figsize=(15, 10))
for i, emotion in enumerate(pipeline[1].classes_):
    # Top 10 features for this emotion
    top_features = np.argsort(coefficients[i])[-10:]
    top_feature_names = [feature_names[j] for j in top_features]
    top_feature_values = [coefficients[i][j] for j in top_features]
    
    plt.subplot(2, 3, i+1)
    plt.barh(top_feature_names, top_feature_values, color='lightgreen')
    plt.title(f'Top words for: {emotion}')
    plt.tight_layout()

plt.savefig('feature_importance.png')