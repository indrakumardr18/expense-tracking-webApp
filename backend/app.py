import os
import secrets  # For generating secure tokens
from datetime import datetime, timedelta
from dotenv import load_dotenv
from flask import Flask, request, jsonify, url_for # url_for is useful for building reset links
from pymongo import MongoClient
from bson.objectid import ObjectId
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash


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

# Base URL for the frontend (needed to construct reset links)
# IMPORTANT: Change this to your actual frontend deployment URL in production!
FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:3000")


#--------API Endpoints---------

@app.route('/')
def home():
    return "Welcome to Expense Tracker backend is running!"

@app.route('/register', methods = ['POST'])
def register_user():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    email = data.get('email')

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    username = username.strip().lower()
    password = password.strip()

    if db.users.find_one({"username": username }):
        return jsonify({"error": "Username already exists"}), 409

    hashed_password = generate_password_hash(password)
    print(f"DEBUG (Register): Hashed password: {hashed_password}")

    new_user = {
        "username": username,
        "password": hashed_password,
        "email": email.strip().lower() if email else None
    }

    try:
        user_id = db.users.insert_one(new_user).inserted_id
        return jsonify({"message": "User registered successfully", "user_id": str(user_id)}), 201
    except Exception as e:
        return jsonify({"error": "Registration failed: " + str(e)}), 500


@app.route('/login', methods = ['POST'])
def login_user():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    username = username.strip().lower()
    password = password.strip()

    user = db.users.find_one({"username": username})

    if user:
        print(f"DEBUG (Login): Stored hash from DB: '{user.get('password')}' (Type: {type(user.get('password'))})")
        print(f"DEBUG (Login): Input password from client: '{password}' (Type: {type(password)})")

        if user.get('password') and check_password_hash(user['password'], password):
            return jsonify({"message": "Login successful", "user_id": str(user['_id'])}), 200
        else:
            return jsonify({"error": "Invalid credentials"}), 401
    return jsonify({"error": "Invalid credentials"}), 401


@app.route("/expenses", methods = ['POST'])
def add_expense():
    data = request.get_json()

    required_fields = ["user_id", "amount", "category", "date"]
    if not all(field in data for field in required_fields):
        return jsonify({"error": f"Missing one or more required fields: {', '.join(required_fields)}"}), 400

    try:
        data['amount'] = float(data['amount'])
    except ValueError:
        return jsonify({"error": "Amount must be a number"}), 400

    if 'category' in data and isinstance(data['category'], str):
        data['category'] = data['category'].strip().lower()

    expense_id = db.expenses.insert_one(data).inserted_id
    return jsonify({"message": "Expense added successfully", "id": str(expense_id)}),201

@app.route("/expenses/<user_id>", methods= ['GET'])
def get_expenses(user_id):
    query = {"user_id": user_id}

    category = request.args.get('category')
    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')
    sort_by = request.args.get('sort_by', 'date')
    order = request.args.get('order', 'desc')
    limit = request.args.get('limit', type=int)

    if category and category != 'All':
        query['category'] = category.strip().lower()

    if start_date_str or end_date_str:
        date_query = {}
        if start_date_str:
            date_query['$gte'] = start_date_str
        if end_date_str:
            date_query['$lte'] = end_date_str
        if date_query:
            query['date'] = date_query

    sort_direction = -1 if order == 'desc' else 1

    cursor = db.expenses.find(query).sort(sort_by, sort_direction)

    if limit is not None and limit > 0:
        cursor = cursor.limit(limit)

    expenses = []
    for expense in cursor:
        expense['_id'] = str(expense['_id'])
        expenses.append(expense)

    return jsonify(expenses), 200

@app.route('/budgets', methods = ['POST'])
def set_budget():
    data = request.get_json()
    required_fields = ["user_id", "category", "amount", "month"]
    if not all(field in data for field in required_fields):
        return jsonify({"error": f"Missing one or more required fields: {', '.join(required_fields)}"}), 400

    try:
        data['amount'] = float(data['amount'])
    except ValueError:
        return jsonify({"error": "Amount must be a number"}), 400

    if 'category' in data and isinstance(data['category'], str):
        data['category'] = data['category'].strip().lower()

    db.budgets.update_one(
            {"user_id": data['user_id'], "category": data['category'], "month": data['month']},
            {"$set": data},
            upsert=True
    )
    return jsonify({"message": "Budget set/updated successfully"}), 201

@app.route('/budgets/<user_id>/<month>', methods=['GET'])
def get_budgets(user_id, month):
    budgets = []
    for budget in db.budgets.find({"user_id": user_id, "month": month}):
        budget['_id'] = str(budget['_id'])
        budgets.append(budget)
    return jsonify(budgets), 200

@app.route('/summary/<user_id>', methods=['GET'])
def get_summary(user_id):
    selected_month_str = request.args.get('month')

    today = datetime.utcnow()
    if selected_month_str:
        try:
            selected_month_dt = datetime.strptime(selected_month_str, "%Y-%m")
            current_month_start = selected_month_dt.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            next_month_start = (selected_month_dt.replace(day=1) + timedelta(days=32)).replace(day=1)
            current_month_end = next_month_start - timedelta(microseconds=1)
        except ValueError:
            return jsonify({"error": "Invalid month format. Use YYYY-MM."}), 400
    else:
        current_month_start = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        next_month_start = (current_month_start.replace(day=1) + timedelta(days=32)).replace(day=1)
        current_month_end = next_month_start - timedelta(microseconds=1)

    current_year_start = today.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)

    monthly_expenses_cursor = db.expenses.find({
        "user_id": user_id,
        "date": {
            "$gte": current_month_start.strftime("%Y-%m-%d"),
            "$lte": current_month_end.strftime("%Y-%m-%d")
        }
    })
    total_monthly_expenses = 0
    monthly_category_breakdown = {}

    for expense in monthly_expenses_cursor:
        amount = expense.get('amount', 0)
        category = expense.get('category', 'Uncategorized')
        category = category.strip().lower() if isinstance(category, str) else category

        total_monthly_expenses += amount
        monthly_category_breakdown[category] = monthly_category_breakdown.get(category, 0) + amount

    yearly_expenses_cursor = db.expenses.find({
        "user_id": user_id,
        "date": {"$gte": current_year_start.strftime("%Y-%m-%d")}
    })
    total_yearly_expenses = 0
    for expense in yearly_expenses_cursor:
        total_yearly_expenses += expense.get('amount', 0)

    summary_data = {
        "total_monthly_expenses": round(total_monthly_expenses, 2),
        "monthly_category_breakdown": {
            k: round(v, 2) for k, v in monthly_category_breakdown.items()
        },
        "total_yearly_expenses": round(total_yearly_expenses, 2)
    }

    return jsonify(summary_data), 200

@app.route('/expenses/<expense_id>', methods=['DELETE'])
def delete_expense(expense_id):
    try:
        object_id = ObjectId(expense_id)
    except:
        return jsonify({"error": "Invalid Expense ID format"}), 400

    result = db.expenses.delete_one({"_id": object_id})

    if result.deleted_count == 1:
        return jsonify({"message": "Expense deleted successfully"}), 200
    else:
        return jsonify({"error": "Expense not found"}), 404

@app.route('/expenses/<expense_id>', methods=['PUT'])
def update_expense(expense_id):
    try:
        object_id = ObjectId(expense_id)
    except:
        return jsonify({"error": "Invalid Expense ID format"}), 400

    data = request.get_json()

    if not data:
        return jsonify({"error": "No data provided for update"}), 400

    if 'amount' in data:
        try:
            data['amount'] = float(data['amount'])
        except ValueError:
            return jsonify({"error": "Amount must be a number"}), 400

    if 'category' in data and isinstance(data['category'], str):
        data['category'] = data['category'].strip().lower()

    result = db.expenses.update_one({"_id": object_id}, {"$set": data})

    if result.matched_count == 0:
        return jsonify({"error": "Expense not found"}), 404
    elif result.modified_count == 0:
        return jsonify({"message": "No changes made to expense"}), 200
    else:
        return jsonify({"message": "Expense updated successfully"}), 200

@app.route('/expenses/single/<expense_id>', methods=['GET'])
def get_single_expense(expense_id):
    try:
        object_id = ObjectId(expense_id)
    except:
        return jsonify({"error": "Invalid Expense ID format"}), 400

    expense = db.expenses.find_one({"_id": object_id})

    if expense:
        expense['_id'] = str(expense['_id'])
        return jsonify(expense), 200
    else:
        return jsonify({"error": "Expense not found"}), 404

# --- User Profile Endpoints ---

@app.route('/users/<user_id>', methods=['GET'])
def get_user_profile(user_id):
    try:
        user = db.users.find_one({"_id": ObjectId(user_id)})
        if user:
            return jsonify({
                "username": user.get("username"),
                "email": user.get("email")
            }), 200
        return jsonify({"error": "User not found"}), 404
    except Exception as e:
        return jsonify({"error": "An error occurred fetching user profile: " + str(e)}), 500

@app.route('/users/<user_id>', methods=['PUT'])
def update_user_profile(user_id):
    data = request.get_json()

    update_fields = {}
    if 'username' in data:
        update_fields['username'] = data['username'].strip().lower()
    if 'email' in data:
        update_fields['email'] = data['email'].strip().lower()

    if not update_fields:
        return jsonify({"error": "No fields provided for update"}), 400

    try:
        result = db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_fields}
        )
        if result.matched_count == 0:
            return jsonify({"error": "User not found or no changes made"}), 404
        return jsonify({"message": "Profile updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": "An error occurred updating profile: " + str(e)}), 500


@app.route('/users/change-password', methods=['PUT'])
def change_password():
    data = request.get_json()
    user_id = data.get('user_id')
    current_password = data.get('current_password')
    new_password = data.get('new_password')

    if not all([user_id, current_password, new_password]):
        return jsonify({"error": "Missing required fields (user_id, current_password, new_password)"}), 400

    current_password = current_password.strip()
    new_password = new_password.strip()

    if len(new_password) < 6:
        return jsonify({"error": "New password must be at least 6 characters"}), 400

    try:
        user = db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            return jsonify({"error": "User not found"}), 404

        print(f"DEBUG (Change Password): Stored hash from DB: '{user.get('password')}' (Type: {type(user.get('password'))})")
        print(f"DEBUG (Change Password): Received current_password: '{current_password}' (Type: {type(current_password)})")

        if user.get('password') and not check_password_hash(user['password'], current_password):
            return jsonify({"error": "Incorrect current password"}), 401

        hashed_new_password = generate_password_hash(new_password)

        db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"password": hashed_new_password}}
        )
        return jsonify({"message": "Password changed successfully"}), 200
    except Exception as e:
        return jsonify({"error": "An error occurred changing password: " + str(e)}), 500

# --- Forgot Password / Reset Password Endpoints ---
@app.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    username_or_email = data.get('username_or_email')

    if not username_or_email:
        return jsonify({"error": "Username or email is required"}), 400

    # Find the user by username or email
    user = db.users.find_one({
        "$or": [
            {"username": username_or_email.strip().lower()},
            {"email": username_or_email.strip().lower()}
        ]
    })

    if not user:
        # For security reasons, always return a generic success message
        # to avoid leaking information about existing usernames/emails.
        return jsonify({"message": "If an account with that username or email exists, a password reset link has been sent."}), 200

    # Generate a secure, time-limited token
    token = secrets.token_urlsafe(32) # Generate a random URL-safe string
    expires_at = datetime.utcnow() + timedelta(hours=1) # Token valid for 1 hour

    # Store the token in the database, associated with the user
    db.password_reset_tokens.update_one(
        {"user_id": str(user['_id'])},
        {"$set": {
            "token": token,
            "expires_at": expires_at,
            "created_at": datetime.utcnow(),
            "used": False # To ensure token can only be used once
        }},
        upsert=True # Create a new document if one doesn't exist for this user_id
    )

    # --- IMPORTANT: Placeholder for Email Sending ---
    # In a real application, you would send an email here.
    # For development, we'll just print the link to the console.
    reset_link = f"{FRONTEND_BASE_URL}/reset-password/{token}"
    print(f"\n--- PASSWORD RESET LINK FOR {user['username']} ---")
    print(f"Please send this link to the user's email ({user.get('email', 'N/A')}):")
    print(reset_link)
    print(f"Token expires at: {expires_at.strftime('%Y-%m-%d %H:%M:%S UTC')}")
    print("-------------------------------------------\n")

    return jsonify({"message": "If an account with that username or email exists, a password reset link has been sent."}), 200

@app.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    token = data.get('token')
    new_password = data.get('new_password')

    if not token or not new_password:
        return jsonify({"error": "Token and new password are required"}), 400

    # Find the token in the database
    reset_record = db.password_reset_tokens.find_one({"token": token})

    if not reset_record:
        return jsonify({"error": "Invalid or expired token."}), 400

    # Check if token is expired
    if reset_record['expires_at'] < datetime.utcnow():
        # Mark as used even if expired for security
        db.password_reset_tokens.update_one({"_id": reset_record['_id']}, {"$set": {"used": True}})
        return jsonify({"error": "Invalid or expired token."}), 400

    # Check if token has already been used
    if reset_record.get('used'):
        return jsonify({"error": "Token has already been used."}), 400

    # Find the associated user
    user = db.users.find_one({"_id": ObjectId(reset_record['user_id'])})
    if not user:
        return jsonify({"error": "User not found for this token."}), 400

    # Hash the new password
    hashed_new_password = generate_password_hash(new_password.strip())

    # Update user's password
    db.users.update_one(
        {"_id": ObjectId(reset_record['user_id'])},
        {"$set": {"password": hashed_new_password}}
    )

    # Invalidate the token after use
    db.password_reset_tokens.update_one(
        {"_id": reset_record['_id']},
        {"$set": {"used": True}}
    )

    return jsonify({"message": "Password has been reset successfully."}), 200

@app.route('/users/<user_id>', methods=['DELETE'])
def delete_user_account(user_id):
    try:
        user = db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            return jsonify({"error": "User not found"}), 404

        # Delete associated data
        db.expenses.delete_many({"user_id": user_id})
        db.budgets.delete_many({"user_id": user_id})
        db.password_reset_tokens.delete_many({"user_id": user_id}) # Clear any pending tokens

        # Delete the user itself
        db.users.delete_one({"_id": ObjectId(user_id)})

        return jsonify({"message": "Account and all associated data deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": "An error occurred deleting account: " + str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port = 5001)