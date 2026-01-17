from flask import Flask, request, jsonify
import os
from dotenv import load_dotenv
from recommendation_engine import RecommendationEngine

load_dotenv()

app = Flask(__name__)

# Initialize recommendation engine
rec_engine = RecommendationEngine(
    host=os.getenv('POSTGRES_HOST', 'localhost'),
    port=os.getenv('POSTGRES_PORT', '5432'),
    database=os.getenv('POSTGRES_DB', 'job_portal'),
    user=os.getenv('POSTGRES_USER', 'postgres'),
    password=os.getenv('POSTGRES_PASSWORD', '')
)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'OK', 'service': 'ML Recommendation Engine'}), 200

@app.route('/api/recommend/content-based', methods=['POST'])
def content_based_recommendations():
    """
    Get content-based job recommendations for a user
    """
    try:
        data = request.json
        user_id = data.get('user_id')
        limit = data.get('limit', 10)
        
        if not user_id:
            return jsonify({'error': 'user_id is required'}), 400
        
        recommendations = rec_engine.get_content_based_recommendations(user_id, limit)
        
        return jsonify({
            'user_id': user_id,
            'recommendations': recommendations,
            'method': 'content_based'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/recommend/collaborative', methods=['POST'])
def collaborative_recommendations():
    """
    Get collaborative filtering job recommendations for a user
    """
    try:
        data = request.json
        user_id = data.get('user_id')
        limit = data.get('limit', 10)
        
        if not user_id:
            return jsonify({'error': 'user_id is required'}), 400
        
        recommendations = rec_engine.get_collaborative_recommendations(user_id, limit)
        
        return jsonify({
            'user_id': user_id,
            'recommendations': recommendations,
            'method': 'collaborative'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/recommend/hybrid', methods=['POST'])
def hybrid_recommendations():
    """
    Get hybrid job recommendations (content-based + collaborative)
    """
    try:
        data = request.json
        user_id = data.get('user_id')
        limit = data.get('limit', 10)
        
        if not user_id:
            return jsonify({'error': 'user_id is required'}), 400
        
        recommendations = rec_engine.get_hybrid_recommendations(user_id, limit)
        
        return jsonify({
            'user_id': user_id,
            'recommendations': recommendations,
            'method': 'hybrid'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/recommend/train', methods=['POST'])
def train_model():
    """
    Train/retrain the recommendation models
    """
    try:
        rec_engine.train_models()
        
        return jsonify({
            'message': 'Models trained successfully',
            'status': 'success'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=os.getenv('FLASK_ENV') == 'development')
