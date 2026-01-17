import psycopg2
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from scipy.sparse import csr_matrix
from collections import defaultdict
import pickle
import os

class RecommendationEngine:
    def __init__(self, host, port, database, user, password):
        self.db_config = {
            'host': host,
            'port': port,
            'database': database,
            'user': user,
            'password': password
        }
        self.tfidf_vectorizer = None
        self.job_features = None
        self.user_item_matrix = None
        self.models_dir = 'models'
        
        # Create models directory if it doesn't exist
        if not os.path.exists(self.models_dir):
            os.makedirs(self.models_dir)
    
    def get_db_connection(self):
        """Create database connection"""
        return psycopg2.connect(**self.db_config)
    
    def get_user_profile(self, user_id):
        """Get user profile and preferences"""
        conn = self.get_db_connection()
        cursor = conn.cursor()
        
        # Get user's skills and preferences from their profile
        cursor.execute("""
            SELECT skills, expected_salary_min, expected_salary_max, 
                   experience_years, job_preferences
            FROM job_seeker_profiles
            WHERE user_id = %s
        """, (user_id,))
        
        profile = cursor.fetchone()
        cursor.close()
        conn.close()
        
        return profile
    
    def get_user_interactions(self, user_id):
        """Get user's past interactions (views, applications, saves)"""
        conn = self.get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT job_id, activity_type, created_at
            FROM user_activity
            WHERE user_id = %s
            ORDER BY created_at DESC
            LIMIT 50
        """, (user_id,))
        
        interactions = cursor.fetchall()
        cursor.close()
        conn.close()
        
        return interactions
    
    def get_all_active_jobs(self):
        """Get all active jobs"""
        conn = self.get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, title, description, skills, location, 
                   salary_min, salary_max, job_type, experience_level
            FROM jobs
            WHERE status = 'active'
        """)
        
        jobs = cursor.fetchall()
        cursor.close()
        conn.close()
        
        return jobs
    
    def create_job_text_features(self, jobs):
        """Create text features for jobs"""
        job_texts = []
        job_ids = []
        
        for job in jobs:
            job_id, title, description, skills, location, _, _, job_type, exp_level = job
            
            # Combine all text features
            skills_text = ' '.join(skills) if skills else ''
            text = f"{title} {description} {skills_text} {location} {job_type} {exp_level}"
            
            job_texts.append(text)
            job_ids.append(job_id)
        
        return job_ids, job_texts
    
    def get_content_based_recommendations(self, user_id, limit=10):
        """
        Content-based filtering: Recommend jobs based on user profile similarity
        """
        profile = self.get_user_profile(user_id)
        
        if not profile:
            return []
        
        user_skills, salary_min, salary_max, exp_years, preferences = profile
        
        # Get all active jobs
        jobs = self.get_all_active_jobs()
        
        if not jobs:
            return []
        
        # Create job features
        job_ids, job_texts = self.create_job_text_features(jobs)
        
        # Create user profile text
        user_skills_text = ' '.join(user_skills) if user_skills else ''
        user_text = f"{user_skills_text}"
        
        # Use TF-IDF vectorization
        if self.tfidf_vectorizer is None:
            self.tfidf_vectorizer = TfidfVectorizer(max_features=500, stop_words='english')
            self.tfidf_vectorizer.fit(job_texts)
        
        # Transform job texts and user profile
        job_vectors = self.tfidf_vectorizer.transform(job_texts)
        user_vector = self.tfidf_vectorizer.transform([user_text])
        
        # Calculate cosine similarity
        similarities = cosine_similarity(user_vector, job_vectors)[0]
        
        # Get job details with scores
        recommendations = []
        for i, job in enumerate(jobs):
            job_id, title, description, skills, location, sal_min, sal_max, job_type, exp_level = job
            
            score = similarities[i]
            
            # Boost score based on salary match
            if salary_min and sal_max and sal_max >= salary_min:
                score *= 1.2
            
            recommendations.append({
                'job_id': job_id,
                'title': title,
                'location': location,
                'job_type': job_type,
                'score': float(score)
            })
        
        # Sort by score and return top N
        recommendations.sort(key=lambda x: x['score'], reverse=True)
        
        return recommendations[:limit]
    
    def get_collaborative_recommendations(self, user_id, limit=10):
        """
        Collaborative filtering: Recommend jobs based on similar users' behavior
        """
        conn = self.get_db_connection()
        cursor = conn.cursor()
        
        # Get user's interacted jobs
        cursor.execute("""
            SELECT DISTINCT job_id
            FROM user_activity
            WHERE user_id = %s AND activity_type IN ('apply', 'save')
        """, (user_id,))
        
        user_jobs = {row[0] for row in cursor.fetchall()}
        
        if not user_jobs:
            cursor.close()
            conn.close()
            return self.get_content_based_recommendations(user_id, limit)
        
        # Find similar users (users who interacted with same jobs)
        cursor.execute("""
            SELECT user_id, job_id, activity_type
            FROM user_activity
            WHERE job_id = ANY(%s) AND user_id != %s
            AND activity_type IN ('apply', 'save')
        """, (list(user_jobs), user_id))
        
        similar_user_activities = cursor.fetchall()
        
        # Calculate similar users
        similar_users = defaultdict(int)
        for uid, jid, activity in similar_user_activities:
            if jid in user_jobs:
                weight = 2 if activity == 'apply' else 1
                similar_users[uid] += weight
        
        if not similar_users:
            cursor.close()
            conn.close()
            return self.get_content_based_recommendations(user_id, limit)
        
        # Get top similar users
        top_similar_users = sorted(similar_users.items(), key=lambda x: x[1], reverse=True)[:10]
        top_user_ids = [uid for uid, _ in top_similar_users]
        
        # Get jobs that similar users interacted with
        cursor.execute("""
            SELECT ua.job_id, j.title, j.location, j.job_type,
                   COUNT(*) as interaction_count,
                   SUM(CASE WHEN ua.activity_type = 'apply' THEN 2 ELSE 1 END) as weighted_score
            FROM user_activity ua
            JOIN jobs j ON ua.job_id = j.id
            WHERE ua.user_id = ANY(%s)
            AND ua.job_id != ALL(%s)
            AND j.status = 'active'
            AND ua.activity_type IN ('apply', 'save')
            GROUP BY ua.job_id, j.title, j.location, j.job_type
            ORDER BY weighted_score DESC
            LIMIT %s
        """, (top_user_ids, list(user_jobs), limit))
        
        recommendations = []
        for row in cursor.fetchall():
            job_id, title, location, job_type, count, score = row
            recommendations.append({
                'job_id': job_id,
                'title': title,
                'location': location,
                'job_type': job_type,
                'score': float(score)
            })
        
        cursor.close()
        conn.close()
        
        return recommendations
    
    def get_hybrid_recommendations(self, user_id, limit=10):
        """
        Hybrid approach: Combine content-based and collaborative filtering
        """
        # Get recommendations from both approaches
        content_recs = self.get_content_based_recommendations(user_id, limit * 2)
        collab_recs = self.get_collaborative_recommendations(user_id, limit * 2)
        
        # Combine and weight scores
        job_scores = {}
        
        # Weight: 60% content-based, 40% collaborative
        for rec in content_recs:
            job_id = rec['job_id']
            job_scores[job_id] = {
                'job_id': job_id,
                'title': rec['title'],
                'location': rec['location'],
                'job_type': rec['job_type'],
                'score': rec['score'] * 0.6
            }
        
        for rec in collab_recs:
            job_id = rec['job_id']
            if job_id in job_scores:
                job_scores[job_id]['score'] += rec['score'] * 0.4
            else:
                job_scores[job_id] = {
                    'job_id': job_id,
                    'title': rec['title'],
                    'location': rec['location'],
                    'job_type': rec['job_type'],
                    'score': rec['score'] * 0.4
                }
        
        # Sort and return top N
        recommendations = sorted(job_scores.values(), key=lambda x: x['score'], reverse=True)
        
        return recommendations[:limit]
    
    def train_models(self):
        """Train and save models (TF-IDF vectorizer)"""
        jobs = self.get_all_active_jobs()
        
        if not jobs:
            return
        
        job_ids, job_texts = self.create_job_text_features(jobs)
        
        # Train TF-IDF vectorizer
        self.tfidf_vectorizer = TfidfVectorizer(max_features=500, stop_words='english')
        self.job_features = self.tfidf_vectorizer.fit_transform(job_texts)
        
        # Save models
        with open(f'{self.models_dir}/tfidf_vectorizer.pkl', 'wb') as f:
            pickle.dump(self.tfidf_vectorizer, f)
        
        print(f"Models trained and saved. Processed {len(jobs)} jobs.")
