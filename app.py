# app.py
from flask import Flask, render_template, request, jsonify
from emotion_detector import EmotionDetector
from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import random
import os

app = Flask(__name__)
CORS(app)

# Initialize the emotion detector with the basic model
model_path = "basic_model.pkl"  
detector = EmotionDetector(model_path)

# Load the emotional quotes
emotional_quotes = {}
try:
    with open('emotional_quotes.json', 'r') as f:
        emotional_quotes = json.load(f)
    print("Successfully loaded quotes from emotional_quotes.json")
except FileNotFoundError:
    print("Warning: emotional_quotes.json not found. Quote functionality will use fallback data.")
    # Fallback quotes in case file is not found
    emotional_quotes = {
        'joy': [
            {"text": "Happiness is when what you think, what you say, and what you do are in harmony.", "author": "Mahatma Gandhi"},
            {"text": "The most wasted of all days is one without laughter.", "author": "E. E. Cummings"}
        ],
        'sadness': [
            {"text": "Even the darkest night will end and the sun will rise.", "author": "Victor Hugo"},
            {"text": "In the middle of every difficulty lies opportunity.", "author": "Albert Einstein"}
        ],
        'anger': [
            {"text": "For every minute you remain angry, you give up sixty seconds of peace of mind.", "author": "Ralph Waldo Emerson"},
            {"text": "Holding onto anger is like drinking poison and expecting the other person to die.", "author": "Buddha"}
        ],
        'fear': [
            {"text": "Courage is resistance to fear, mastery of fear, not absence of fear.", "author": "Mark Twain"},
            {"text": "Everything you want is on the other side of fear.", "author": "Jack Canfield"}
        ],
        'love': [
            {"text": "The best thing to hold onto in life is each other.", "author": "Audrey Hepburn"},
            {"text": "Where there is love there is life.", "author": "Mahatma Gandhi"}
        ],
        'surprise': [
            {"text": "Life is full of surprises and serendipity.", "author": "Todd Kashdan"},
            {"text": "The best things in life are unexpected - because there were no expectations.", "author": "Eli Khamarov"}
        ]
    }

@app.route('/')
def index():
    """Render the main page"""
    return render_template('index.html')

@app.route('/about')
def about():
    """Render the about page"""
    return render_template('about.html')

@app.route('/detect', methods=['POST'])
def detect():
    """API endpoint to detect emotion in text"""
    data = request.json
    text = data.get('text', '')
    
    if not text:
        return jsonify({
            'error': 'No text provided'
        }), 400
    
    # Detect emotion
    emotion, confidence = detector.detect_emotion(text)
    
    # Get emoji and color
    emoji = detector.get_emoji_for_emotion(emotion)
    color = detector.get_color_for_emotion(emotion)
    
    # Return the result
    return jsonify({
        'text': text,
        'emotion': emotion,
        'emoji': emoji,
        'color': color,
        'confidence': confidence
    })

@app.route('/quote/<emotion>', methods=['GET'])
def get_quote(emotion):
    """API endpoint to get a motivational quote based on emotion"""
    if emotion not in emotional_quotes or not emotional_quotes[emotion]:
        # Default to joy quotes if no matching quotes found
        emotion = 'joy'
    
    # Select a random quote for the given emotion
    quote = random.choice(emotional_quotes[emotion])
    
    return jsonify({
        'emotion': emotion,
        'quote': quote['text'],
        'author': quote['author']
    })

if __name__ == '__main__':
    app.run(debug=True)