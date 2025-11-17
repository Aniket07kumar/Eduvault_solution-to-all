import os
from flask import Flask, jsonify, request
from flask_pymongo import PyMongo
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS, cross_origin
from bson.objectid import ObjectId
from googleapiclient.discovery import build
from datetime import datetime
import re

# --- App Setup ---
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://127.0.0.1:5500"}})

# --- Database Configuration ---
# Make sure this is your correct, working URI
MONGO_URI = "mongodb+srv://aniketkumar070505_db_user:ds29fdUpC9LyuTZ7@cluster0.z5acstc.mongodb.net/FinalEduvault?appName=Cluster0"
app.config["MONGO_URI"] = MONGO_URI

# --- Security & API Key Configuration ---
# !!! REPLACE THESE WITH YOUR REAL KEYS !!!
app.config["JWT_SECRET_KEY"] = "your-super-secret-key-change-this-123" 
app.config["SECRET_KEY"] = "another-super-secret-key-change-this-456"

# !!! REPLACE THESE WITH YOUR REAL KEYS !!!
YOUTUBE_API_KEY = "AIzaSyA4eiN0O6uA1v49AteLU38r1N8gjeVAJOM"
GOOGLE_SEARCH_KEY = "AIzaSyA4eiN0O6uA1v49AteLU38r1N8gjeVAJOM"
GOOGLE_SEARCH_CX = "36eaa01e60bc24c4b"

# --- Initialize Extensions ---
mongo = PyMongo(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

# --- Educational Topics Configuration ---
EDUCATIONAL_TOPICS = {
    "Mathematics": ["calculus", "algebra", "geometry", "trigonometry", "statistics", "linear algebra"],
    "Science": ["physics", "chemistry", "biology", "astronomy", "environmental science"],
    "Programming": ["python programming", "javascript", "web development", "data structures", "machine learning"],
    "Languages": ["english grammar", "spanish learning", "french basics"],
    "Business": ["economics", "accounting", "marketing", "finance"],
    "History": ["world history", "ancient civilizations", "modern history"],
    "Engineering": ["electrical engineering", "mechanical engineering", "civil engineering"]
}

# --- Helper Functions ---
def extract_tags(text):
    words = re.sub(r'[^\w\s]', '', text.lower()).split()
    stop_words = {'the', 'and', 'for', 'with', 'this', 'that', 'from', 'tutorial', 'learn', 'how', 'what'}
    tags = [word for word in words if len(word) > 3 and word not in stop_words]
    return list(set(tags))[:10]

def detect_category(subject):
    subject_lower = subject.lower()
    for category, subjects in EDUCATIONAL_TOPICS.items():
        if any(sub.lower() in subject_lower for sub in subjects):
            return category
    return "General"

def calculate_relevance_score(resource, query_terms):
    score = 0
    title_lower = resource.get('title', '').lower()
    description_lower = resource.get('description', '').lower()
    tags = resource.get('tags', [])
    
    for term in query_terms:
        term_lower = term.lower()
        if term_lower == title_lower: score += 20
        elif term_lower in title_lower: score += 10
        if title_lower.startswith(term_lower): score += 5
        if any(term_lower in tag.lower() for tag in tags): score += 8
        if term_lower in description_lower: score += 3
        if term_lower in resource.get('subject', '').lower(): score += 7
        if term_lower in resource.get('category', '').lower(): score += 5
    
    trusted_sources = ['khan academy', 'mit', 'stanford', 'coursera', 'edx']
    source_lower = resource.get('source', '').lower()
    if any(trusted in source_lower for trusted in trusted_sources):
        score += 5
    if resource.get('type') == 'video': score += 2
    return score

# --- Database Population Functions ---
def populate_from_youtube(subject, category, max_results=25):
    try:
        youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)
        request_obj = youtube.search().list(
            part='snippet', q=f"{subject} tutorial educational", type='video',
            videoCategoryId='27', videoDefinition='high', order='relevance', maxResults=max_results
        )
        response = request_obj.execute()
        
        added_count = 0
        for item in response.get('items', []):
            video_id = item['id']['videoId']
            title = item['snippet']['title']
            description = item['snippet']['description']
            
            existing = mongo.db.resources.find_one({"url": f"https://www.youtube.com/watch?v={video_id}"})
            if existing: continue
            
            resource = {
                "title": title, "description": description[:500],
                "url": f"https://www.youtube.com/watch?v={video_id}",
                "type": "video", "source": item['snippet']['channelTitle'],
                "category": category, "subject": subject,
                "tags": extract_tags(title + " " + description),
                "visits": 0, "ratingSum": 0, "ratingCount": 0,
                "dateAdded": datetime.now()
            }
            mongo.db.resources.insert_one(resource)
            added_count += 1
        return added_count
    except Exception as e:
        print(f"Error fetching from YouTube for {subject}: {e}")
        return 0

def auto_populate_database():
    print("Checking database population...")
    total_added = 0
    if mongo.db.resources.count_documents({}) < 50: # Only run if DB is small
        for category, subjects in EDUCATIONAL_TOPICS.items():
            print(f"\n=== Processing {category} ===")
            for subject in subjects:
                print(f"  Fetching resources for: {subject}")
                count = populate_from_youtube(subject, category, max_results=10) # Reduced results
                total_added += count
                print(f"  Added {count} resources for {subject}")
        print(f"\n✅ Database population complete! Added {total_added} total resources.")
    else:
        print("Database already populated. Skipping seed.")
    return total_added

# --- Search Functions ---
def search_internal_db(query):
    query_terms = query.lower().split()
    search_filter = {
        "$or": [
            {"title": {"$regex": query, "$options": "i"}},
            {"description": {"$regex": query, "$options": "i"}},
            {"tags": {"$regex": query, "$options": "i"}},
            {"subject": {"$regex": query, "$options": "i"}}
        ]
    }
    resources = []
    for resource in mongo.db.resources.find(search_filter):
        resource['_id'] = str(resource['_id'])
        resource['relevance_score'] = calculate_relevance_score(resource, query_terms)
        resource['relevance_score'] += 10 # Internal DB boost
        resources.append(resource)
    return resources

def search_youtube_api(query, max_results=10):
    try:
        youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)
        request_obj = youtube.search().list(
            part='snippet', q=f"{query} educational tutorial", type='video',
            videoCategoryId='27', order='relevance', maxResults=max_results
        )
        response = request_obj.execute()
        results = []
        for item in response.get('items', []):
            video_id = item['id']['videoId']
            resource = {
                "_id": video_id, "title": item['snippet']['title'],
                "description": item['snippet']['description'][:300],
                "url": f"https://www.youtube.com/watch?v={video_id}",
                "type": "video", "source": item['snippet']['channelTitle'],
                "category": "External", "tags": extract_tags(item['snippet']['title']),
                "relevance_score": calculate_relevance_score({
                    'title': item['snippet']['title'], 'description': item['snippet']['description'],
                    'tags': extract_tags(item['snippet']['title']), 'type': 'video'
                }, query.split())
            }
            results.append(resource)
        return results
    except Exception as e:
        print(f"Error searching YouTube: {e}")
        return []

def search_google_api(query, max_results=10):
    try:
        service = build("customsearch", "v1", developerKey=GOOGLE_SEARCH_KEY)
        res = service.cse().list(q=f"{query} educational resource", cx=GOOGLE_SEARCH_CX, num=max_results).execute()
        results = []
        for item in res.get('items', []):
            resource = {
                "_id": item.get('cacheId', item['link']), "title": item['title'],
                "description": item['snippet'][:300], "url": item['link'],
                "type": "article", "source": item['displayLink'],
                "category": "External", "tags": extract_tags(item['title']),
                "relevance_score": calculate_relevance_score({
                    'title': item['title'], 'description': item['snippet'],
                    'tags': extract_tags(item['title']), 'type': 'article'
                }, query.split())
            }
            results.append(resource)
        return results
    except Exception as e:
        print(f"Error searching Google: {e}")
        return []

# --- API Routes ---

@app.route('/')
def index():
    try:
        mongo.db.command('ping')
        resource_count = mongo.db.resources.count_documents({})
        return jsonify({
            "message": "Welcome to EduVault API!", "status": "Database connected",
            "total_resources": resource_count
        })
    except Exception as e:
        return jsonify({"message": f"Database connection failed: {e}"})

@app.route('/api/signup', methods=['POST'])
@cross_origin()
def signup():
    data = request.get_json()
    name, email, password = data.get('name'), data.get('email'), data.get('password')
    if not name or not email or not password:
        return jsonify({"message": "Missing name, email, or password"}), 400
    email = email.lower()
    if mongo.db.users.find_one({"email": email}):
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
    data = request.get_json()
    email, password = data.get('email'), data.get('password')
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
    current_user_id = get_jwt_identity()
    user = mongo.db.users.find_one({"_id": ObjectId(current_user_id)})
    if not user: return jsonify({"message": "User not found"}), 404
    return jsonify({"name": user.get('name'), "email": user.get('email')}), 200

@app.route('/api/search', methods=['GET'])
@cross_origin()
def hybrid_search():
    query, source, category = request.args.get('q'), request.args.get('source', 'all'), request.args.get('category')
    limit = int(request.args.get('limit', 20))
    if not query: return jsonify({"message": "Search query 'q' is required"}), 400
    
    try:
        all_results = []
        if source in ['all', 'internal']: all_results.extend(search_internal_db(query))
        if source in ['all', 'youtube']: all_results.extend(search_youtube_api(query, max_results=10))
        if source in ['all', 'google']: all_results.extend(search_google_api(query, max_results=10))
        if category: all_results = [r for r in all_results if r.get('category', '').lower() == category.lower()]
        
        all_results.sort(key=lambda x: x.get('relevance_score', 0), reverse=True)
        top_results = all_results[:limit]
        
        return jsonify({
            "query": query, "total_found": len(all_results),
            "returned": len(top_results), "results": top_results
        }), 200
    except Exception as e:
        print(f"Search error: {e}")
        return jsonify({"message": f"Search error: {str(e)}"}), 500

@app.route('/api/categories', methods=['GET'])
@cross_origin()
def get_categories():
    return jsonify({"categories": list(EDUCATIONAL_TOPICS.keys())}), 200

@app.route('/api/subjects', methods=['GET'])
@cross_origin()
def get_subjects():
    category = request.args.get('category')
    if category:
        subjects = EDUCATIONAL_TOPICS.get(category, [])
        return jsonify({"category": category, "subjects": subjects}), 200
    else:
        return jsonify({"all_subjects": EDUCATIONAL_TOPICS}), 200

@app.route('/api/resources/<resource_id>', methods=['GET'])
@cross_origin()
def get_resource(resource_id):
    try:
        resource = mongo.db.resources.find_one({"_id": ObjectId(resource_id)})
        if not resource: return jsonify({"message": "Resource not found"}), 404
        resource['_id'] = str(resource['_id'])
        mongo.db.resources.update_one({"_id": ObjectId(resource_id)}, {"$inc": {"visits": 1}})
        return jsonify(resource), 200
    except Exception:
        return jsonify({"message": "Invalid ID format"}), 400

# ## START: REFINED SAVE LOGIC ##
@app.route('/api/save', methods=['POST']) # Changed route, expects data in body
@cross_origin()
@jwt_required()
def save_resource():
    current_user_id = get_jwt_identity()
    user_object_id = ObjectId(current_user_id)
    data = request.get_json()
    resource_id = data.get('id')
    
    final_resource_id = None
    
    # Check if it's an internal resource (MongoDB ID)
    if len(resource_id) == 24 and re.match(r'^[0-9a-fA-F]{24}$', resource_id):
        try:
            resource_object_id = ObjectId(resource_id)
            # Verify it exists
            if mongo.db.resources.count_documents({"_id": resource_object_id}) > 0:
                final_resource_id = resource_object_id
            else:
                return jsonify({"message": "Internal resource ID not found"}), 404
        except Exception:
            pass # Not a valid ObjectId, treat as external
    
    # If not an internal resource, it's external (from YouTube/Google)
    if final_resource_id is None:
        # Check if this external resource (by URL) is already in our DB
        existing_resource = mongo.db.resources.find_one({"url": data.get('url')})
        if existing_resource:
            # It's already in our DB, just get its ID
            final_resource_id = existing_resource['_id']
        else:
            # It's new. Add it to our `resources` collection
            new_resource = {
                "title": data.get('title'),
                "description": data.get('description'),
                "url": data.get('url'),
                "type": data.get('type'),
                "source": data.get('source'),
                "category": data.get('category', 'External'),
                "subject": data.get('subject', 'General'),
                "tags": data.get('tags', []),
                "visits": 1, "ratingSum": 0, "ratingCount": 0,
                "dateAdded": datetime.now()
            }
            result = mongo.db.resources.insert_one(new_resource)
            final_resource_id = result.inserted_id

    # Now that we have a valid MongoDB ID (final_resource_id), save it to the user
    if final_resource_id:
        mongo.db.users.update_one(
            {"_id": user_object_id},
            {"$addToSet": {"savedResources": final_resource_id}}
        )
        return jsonify({"message": "Resource saved successfully", "new_id": str(final_resource_id)}), 200
    else:
        return jsonify({"message": "Failed to save resource"}), 500

# ## END: REFINED SAVE LOGIC ##

@app.route('/api/saved-resources', methods=['GET'])
@cross_origin()
@jwt_required()
def get_saved_resources():
    current_user_id = get_jwt_identity()
    user = mongo.db.users.find_one({"_id": ObjectId(current_user_id)})
    if not user: return jsonify({"message": "User not found"}), 404
    saved_resource_ids = user.get('savedResources', [])
    saved_resources = []
    if saved_resource_ids:
        for resource in mongo.db.resources.find({"_id": {"$in": saved_resource_ids}}):
            resource['_id'] = str(resource['_id'])
            saved_resources.append(resource)
    return jsonify(saved_resources), 200

@app.route('/api/populate-database', methods=['POST'])
@cross_origin()
def populate_database_route():
    try:
        count = auto_populate_database()
        return jsonify({"message": "Database populated successfully", "resources_added": count}), 200
    except Exception as e:
        return jsonify({"message": f"Population error: {str(e)}"}), 500

@app.route('/api/stats', methods=['GET'])
@cross_origin()
def get_stats():
    try:
        total_resources = mongo.db.resources.count_documents({})
        total_users = mongo.db.users.count_documents({})
        categories = {}
        for category in EDUCATIONAL_TOPICS.keys():
            count = mongo.db.resources.count_documents({"category": category})
            categories[category] = count
        return jsonify({
            "total_resources": total_resources, "total_users": total_users,
            "resources_by_category": categories
        }), 200
    except Exception as e:
        return jsonify({"message": f"Stats error: {str(e)}"}), 500

# --- Main Entry Point ---
if __name__ == '__main__':
    with app.app_context():
        # Auto-populate on first run
        if mongo.db.resources.count_documents({}) < 50:
            print("Database has few resources. Running auto_populate_database()...")
            auto_populate_database()
    app.run(debug=True)
