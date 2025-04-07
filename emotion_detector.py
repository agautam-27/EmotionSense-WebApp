# emotion_detector.py - Replace your current file with this
import joblib

class EmotionDetector:
    def __init__(self, model_path):
        """Initialize the emotion detector with a pre-trained model"""
        self.pipeline = joblib.load(model_path)
        
    def detect_emotion(self, text):
        """
        Detect emotion in text with confidence scores
        
        Args:
            text (str): Input text to analyze
            
        Returns:
            tuple: (emotion, confidence_dict)
        """
        # Predict the emotion
        prediction = self.pipeline.predict([text])[0]
        
        # Get prediction probabilities
        probs = self.pipeline.predict_proba([text])[0]
        
        # Create confidence dictionary
        emotions = self.pipeline.classes_
        confidence = dict(zip(emotions, probs * 100))
        
        # Sort by confidence (descending)
        sorted_confidence = {k: v for k, v in sorted(confidence.items(), key=lambda item: item[1], reverse=True)}
        
        return prediction, sorted_confidence
    
    def get_emoji_for_emotion(self, emotion):
        """Return emoji character for the given emotion"""
        emoji_map = {
            'joy': '😀',
            'sadness': '😢',
            'anger': '😡',
            'fear': '😨',
            'love': '❤️',
            'surprise': '😲'
        }
        return emoji_map.get(emotion, '🤔')
    
    def get_color_for_emotion(self, emotion):
        """Return color hex code for the given emotion"""
        color_map = {
            'joy': '#FFD700',      # Gold
            'sadness': '#1E90FF',  # Blue
            'anger': '#FF4500',    # Red/Orange
            'fear': '#800080',     # Purple
            'love': '#FF69B4',     # Pink
            'surprise': '#00FFFF'  # Cyan
        }
        return color_map.get(emotion, '#CCCCCC')  # Default gray