import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from pymongo import MongoClient
from bson.objectid import ObjectId # To work with MongoDB's _id
from flask_cors import CORS

# Load environment variables from .env file


load_dotenv()

app = Flask(__name__)
CORS(app) 
# MongoDB connection
mongo_uri = os.getenv("MONGO_URI")
if not mongo_uri:
    print("Error: MONGO_URI not found in .env file.")
    exit(1)
try:
    client = MongoClient(mongo_uri)
    db = client.expense_tracker

    print(f"Connected to mongodb database: {db.name}")
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")
    exit(1)

#--------Basic API Endpoints---------

@app.route('/')
def home():
    return "Welcome to Expense  Tracker backend is running!"

@app.route('/register', methods = ['POST'])
def register_user():
    data = request.get_json()
    username = data.get('username')
    passowrd = data.get('password')

    if not username or not passowrd:
        return jsonify({"error": "Username and password are requeried"}), 400
    
    if db.users.find_one({"username": username }):
        return jsonify({"error": "Username already exists"}), 409
    
    db.users.insert_one({"username": username, "password": password})
    return jsonify({"message": "User registered successfully"}), 201

@app.route('/login', methods = ['POST'])
# @cross_origin(origins="http://localhost:3000", methods=['GET', 'POST', 'OPTIONS'], supports_credentials=True) # <--- ADD THIS DECORATOR

def login_user():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = db.users.find_one({"username": username , "password": password})
    if user:
        return jsonify({"message": "Login successful", "user_id": str(user['_id'])}),200
    return jsonify({"error": "Invalid credentials"}), 401

@app.route("/expenses", methods = ['POST'])
def add_expense():
    data = request.get_json()

    required_fields = ["user_id", "amount", "category", "data"]
    if not all(field in data for field in required_fields):
        return jsonify({"error": f"Missing one or more requeried fields: {', '.join(required_fields)}"}), 400
    
    try:
        data['amount'] = float(data['amount'])
    except ValueError:
        return jsonify({"error": "Amount must be a number"}), 400
    
    expense_id = db.expenses.insert_one(data).inserted_id
    return jsonify({"message": "Expense added successfully", "id": str(expense_id)}),201

@app.route("/expenses/<user_id>", methods= ['GET'])
def get_expenses(user_id):
    expenses = []

    for  expense in db.expenses.find({"user_id" : user_id}).sort("data", -1):
        expense['_id'] = str(expense['_id'])
        expenses.append(expense)
    return jsonify(expenses), 200

@app.route('/budgets', methods = ['POST'])
def set_budget():
    data = request.get_json()
    required_fields = ["user_id", "category", "amount", "month"] # month in 'YYYY-MM' format
    if not all(field in data for field in required_fields):
        return jsonify({"error": f"Missing one or more required fields: {', '.join(required_fields)}"}), 400
    
    try:
        data['amount'] = float(data['amount'])
    except ValueError:
        return jsonify({"error": "Amount must be a number"}), 400

    db.budgets.update_one(
            {"user_id": data['user_id'], "category": data['category'], "month": data['month']},
            {"$set": data},
            upsert=True
    )
    return jsonify({"message": "Budget set/updated successfully"}), 201

@app.route('/budgets/<user_id>/<month>', methods=['GET'])
def get_budgets(user_id, month):
    budgets = []
    # Fetch budgets for a specific user and month
    for budget in db.budgets.find({"user_id": user_id, "month": month}):
        budget['_id'] = str(budget['_id'])
        budgets.append(budget)
    return jsonify(budgets), 200

if __name__ == '__main__':
    app.run(debug=True, port = 5001) # Run Flask in debug mode on port 5001

