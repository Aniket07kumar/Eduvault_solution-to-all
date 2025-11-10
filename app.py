import os
from flask import Flask, jsonify, request
from flask_pymongo import PyMongo
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS, cross_origin
from bson.objectid import ObjectId
# NEW IMPORT for Google API
from googleapiclient.discovery import build 

# --- App Setup ---
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://127.0.0.1:5500"}})

# --- Database Configuration ---
# PASTE YOUR MONGODB ATLAS CONNECTION STRING HERE
MONGO_URI = "mongodb+srv://aniketkumar070505_db_user:ds29fdUpC9LyuTZ7@cluster0.z5acstc.mongodb.net/FinalEduvault?appName=Cluster0"
app.config["MONGO_URI"] = MONGO_URI

# --- Security & API Key Configuration ---
app.config["JWT_SECRET_KEY"] = "your-super-secret-key-change-this" 
app.config["SECRET_KEY"] = "another-super-secret-key-change-this"

# ## START: ADD YOUR API KEYS HERE ##
# Paste the keys you just got from Google
YOUTUBE_API_KEY = "AIzaSyA4eiN0O6uA1v49AteLU38r1N8gjeVAJOM"
GOOGLE_SEARCH_KEY = "AIzaSyA4eiN0O6uA1v49AteLU38r1N8gjeVAJOM"     # Use the same key
GOOGLE_SEARCH_CX = "https://cse.google.com/cse.js?cx=36eaa01e60bc24c4b" # The CX key from Step 4
# ## END: ADD YOUR API KEYS HERE ##

# --- Initialize Extensions ---
mongo = PyMongo(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

# --- Database Seeder Function ---
def seed_database():
    if mongo.db.resources.count_documents({}) == 0:
        print("Database is empty. Seeding sample resources...")
        sample_resources = [
            # ... (sample data - you can keep this as is) ...
            {
                "title": "Introduction to Astrophysics",
                "description": "A comprehensive video lecture series by MIT...",
                "url": "https://www.youtube.com/watch?v=k9D30uCA01A", 
                "type": "video", "source": "MIT OpenCourseWare",
                "visits": 1200, "ratingSum": 47, "ratingCount": 10
            },
            {
                "title": "Quantum Mechanics Study Guide",
                "description": "Detailed PDF notes summarizing key concepts...",
                "url": "#", "type": "notes", "source": "Physics.org",
                "visits": 890, "ratingSum": 49, "ratingCount": 10
            },
             {
                "title": "StarTalk Radio Show with Neil deGrasse Tyson",
                "description": "Explore everything cosmic with astrophysicist Neil deGrasse Tyson...",
                "url": "#", "type": "podcast", "source": "StarTalk",
                "visits": 500, "ratingSum": 46, "ratingCount": 10
            },
        ]
        mongo.db.resources.insert_many(sample_resources)
        print("Sample resources have been added.")
    else:
        print("Database already contains resources. Skipping seed.")


# --- API Helper Functions (NEW) ---

def search_our_db(query):
    """Searches our internal MongoDB for resources."""
    resources = []
    # Use $regex for a simple, case-insensitive text search on title and description
    search_filter = {"$or": [
        {"title": {"$regex": query, "$options": "i"}},
        {"description": {"$regex": query, "$options": "i"}}
    ]}
    for resource in mongo.db.resources.find(search_filter):
        resource['_id'] = str(resource['_id'])
        resource['suitability_score'] = 10.0 # Give our DB results the highest score
        resources.append(resource)
    return resources

def search_youtube(query):
    """Searches YouTube API for videos."""
    try:
        youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)
        request = youtube.search().list(
            part='snippet',
            q=query,
            type='video',
            videoDefinition='high',
            videoEmbeddable='true',
            order='relevance',
            maxResults=10
        )
        response = request.execute()
        
        results = []
        for item in response.get('items', []):
            results.append({
                "_id": item['id']['videoId'], # Use video ID as a unique ID
                "title": item['snippet']['title'],
                "description": item['snippet']['description'],
                "url": f"https://www.youtube.com/watch?v={item['id']['videoId']}",
                "type": "video",
                "source": item['snippet']['channelTitle'],
                "suitability_score": 1.0 # Base score for external results
            })
        return results
    except Exception as e:
        print(f"Error searching YouTube: {e}")
        return []

def search_google(query):
    """Searches Google Custom Search API for web pages."""
    try:
        service = build("customsearch", "v1", developerKey=GOOGLE_SEARCH_KEY)
        res = service.cse().list(
            q=query,
            cx=GOOGLE_SEARCH_CX,
            num=10
        ).execute()
        
        results = []
        for item in res.get('items', []):
            results.append({
                "_id": item['cacheId'] if 'cacheId' in item else item['link'], # Use cacheId or link as ID
                "title": item['title'],
                "description": item['snippet'],
                "url": item['link'],
                "type": "notes", # Treat web pages as 'notes'
                "source": item['displayLink'],
                "suitability_score": 1.0 # Base score
            })
        return results
    except Exception as e:
        print(f"Error searching Google: {e}")
        return []


# --- Test Route ---
@app.route('/')
def index():
    try:
        mongo.db.command('ping')
        return jsonify({"message": "Welcome to the EduVault API! Database connected."})
    except Exception as e:
        return jsonify({"message": f"Database connection failed: {e}"})

# --- API Routes ---

# ... (Signup and Login routes remain exactly the same) ...
@app.route('/api/signup', methods=['POST'])
@cross_origin()
def signup():
    # ... (no changes) ...
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    if not name or not email or not password:
        return jsonify({"message": "Missing name, email, or password"}), 400
    email = email.lower() 
    existing_user = mongo.db.users.find_one({"email": email})
    if existing_user:
        return jsonify({"message": "Email already exists"}), 409
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    mongo.db.users.insert_one({
        "name": name, "email": email, "password": hashed_password,
        "savedResources": [], "likedResources": []
    })
    return jsonify({"message": "User created successfully"}), 201

@app.route('/api/login', methods=['POST'])
@cross_origin()
def login():
    # ... (no changes) ...
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    if not email or not password:
        return jsonify({"message": "Missing email or password"}), 400
    email = email.lower()
    user = mongo.db.users.find_one({"email": email})
    if user and bcrypt.check_password_hash(user['password'], password):
        access_token = create_access_token(identity=str(user['_id']))
        return jsonify({"message": "Login successful", "access_token": access_token}), 200
    else:
        return jsonify({"message": "Invalid email or password"}), 401

@app.route('/api/profile', methods=['GET'])
@cross_origin()
@jwt_required()
def get_profile():
    # ... (no changes) ...
    current_user_id = get_jwt_identity()
    user = mongo.db.users.find_one({"_id": ObjectId(current_user_id)})
    if not user:
        return jsonify({"message": "User not found"}), 404
    return jsonify({"name": user.get('name'), "email": user.get('email')}), 200

# --- UPDATED: Search/Get All Resources Route ---
@app.route('/api/search', methods=['GET'])
@cross_origin()
def hybrid_search_resources():
    query = request.args.get('q') # Get the query from ?q=...
    if not query:
        return jsonify({"message": "A search query 'q' is required."}), 400

    try:
        # 1. Search our own trusted database
        db_results = search_our_db(query)
        
        # 2. Search YouTube
        youtube_results = search_youtube(query)
        
        # 3. Search Google
        google_results = search_google(query)

        # 4. Combine all results
        all_results = db_results + youtube_results + google_results
        
        # 5. Sort by our custom score, highest first
        all_results.sort(key=lambda x: x.get('suitability_score', 0), reverse=True)
        
        # 6. Return only the Top 10-15 (you decide)
        top_results = all_results[:15]
        
        return jsonify(top_results), 200
        
    except Exception as e:
        print(f"Search Error: {e}")
        return jsonify({"message": f"An error occurred during search: {e}"}), 500


# ... (Keep the /api/resources/<id>, /api/save/<id>, /api/saved-resources routes) ...
@app.route('/api/resources/<resource_id>', methods=['GET'])
@cross_origin()
def get_resource(resource_id):
    # ... (no changes) ...
    try:
        resource = mongo.db.resources.find_one({"_id": ObjectId(resource_id)})
        if not resource:
            return jsonify({"message": "Resource not found"}), 404
        resource['_id'] = str(resource['_id'])
        return jsonify(resource), 200
    except Exception as e:
        return jsonify({"message": "Invalid ID format"}), 400

@app.route('/api/save/<resource_id>', methods=['POST'])
@cross_origin()
@jwt_required()
def save_resource(resource_id):
    # ... (no changes) ...
    current_user_id = get_jwt_identity()
    user_object_id = ObjectId(current_user_id)
    
    # Check if resource_id is a valid ObjectId (from our DB)
    try:
        resource_object_id = ObjectId(resource_id)
        # It's from our DB, save the reference
        mongo.db.users.update_one(
            {"_id": user_object_id},
            {"$addToSet": {"savedResources": resource_object_id}}
        )
        return jsonify({"message": "Resource saved"}), 200
    except Exception:
        # It's not a valid ObjectId, so it must be an external link (like from YouTube)
        # In a real app, you might save the full object or URL
        # For now, we'll just log that we can't save it by ID
        return jsonify({"message": "Cannot save external resource by ID yet"}), 400

@app.route('/api/saved-resources', methods=['GET'])
@cross_origin()
@jwt_required()
def get_saved_resources():
    # ... (no changes) ...
    current_user_id = get_jwt_identity()
    user = mongo.db.users.find_one({"_id": ObjectId(current_user_id)})
    if not user:
        return jsonify({"message": "User not found"}), 404
    saved_resource_ids = user.get('savedResources', [])
    saved_resources = []
    if saved_resource_ids: 
        for resource in mongo.db.resources.find({"_id": {"$in": saved_resource_ids}}):
            resource['_id'] = str(resource['_id'])
            saved_resources.append(resource)
    return jsonify(saved_resources), 200

# --- (This route is no longer needed, as seed_database handles it) ---
# @app.route('/api/resources', methods=['POST']) ...

# --- Main entry point ---
if __name__ == '__main__':
    with app.app_context():
        seed_database() 
    app.run(debug=True)