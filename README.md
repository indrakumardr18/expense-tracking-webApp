# Expense Tracker Web Application

![Expense Tracker Dashboard Screenshot](https://via.placeholder.com/800x400?text=Dashboard+Screenshot+Here)
*(Replace with an actual screenshot of your Dashboard)*

A full-stack web application designed to help users efficiently track their expenses, manage budgets, and gain insights into their spending habits. Built with React for the frontend and Flask for the backend, utilizing MongoDB as the database.

## 🌟 Features

* **User Authentication:**
    * Secure User Registration and Login.
    * **Forgot Password:** Initiate a password reset flow (via console link in development).
    * **Reset Password:** Set a new password using a unique, time-limited token.
* **Expense Management:**
    * Add new expenses with details like amount, category, date, and description.
    * View all transactions with filtering options by category, date range.
    * Edit existing expense details.
    * Delete individual expenses.
* **Budgeting:**
    * Set monthly budgets for different categories.
    * Track spending against set budgets.
* **Dashboard Summary:**
    * Overview of monthly and yearly spending.
    * Category-wise spending breakdown for the current month.
* **User Profile:**
    * View and update user profile information (username, email).
    * Change account password.
    * Option to delete user account and all associated data.

## 🚀 Technologies Used

**Frontend:**
* React.js
* React Router DOM (for navigation)
* `react-toastify` (for notifications)
* CSS (for styling)

**Backend:**
* Python 3
* Flask (web framework)
* PyMongo (MongoDB driver)
* Werkzeug Security (for password hashing)
* python-dotenv (for environment variables)
* Flask-CORS (for handling cross-origin requests)
* `secrets` module (for generating secure tokens)
* `datetime` module (for token expiry)

**Database:**
* MongoDB (NoSQL database)

## 🛠️ Setup and Installation

Follow these steps to get the Expense Tracker up and running on your local machine.

### Prerequisites

* Node.js (LTS version recommended) & npm (or yarn)
* Python 3.8+ & pip
* MongoDB (Local installation or a cloud service like MongoDB Atlas)

### 1. Clone the Repository

```bash
git clone [https://github.com/your-github-username/expense-tracker-webApp.git](https://github.com/your-github-username/expense-tracker-webApp.git)
cd expense-tracker-webApp
(Replace your-github-username with your actual GitHub username)

2. Backend Setup
Navigate into the backend directory:

Bash

cd backend
a. Create a Virtual Environment (Recommended)

Bash

python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
b. Install Dependencies

Bash

pip install -r requirements.txt
(If requirements.txt doesn't exist, create it by running pip freeze > requirements.txt after installing dependencies manually with pip install Flask pymongo python-dotenv Flask-Cors Werkzeug)

c. Configure Environment Variables
Create a file named .env in the backend directory with the following content:

Code snippet

MONGO_URI="mongodb://localhost:27017/expense_tracker"
FRONTEND_BASE_URL="http://localhost:3000"
# Add other sensitive variables here if needed, e.g., email service API keys
MONGO_URI: Replace with your MongoDB connection string. If you're using a local MongoDB instance, mongodb://localhost:27017/expense_tracker should work. For MongoDB Atlas, use your provided connection string.

FRONTEND_BASE_URL: This is crucial for constructing the password reset link. Ensure it matches the URL where your React frontend will be running.

d. Run the Flask Backend

Bash

flask run --port 5001 # Or python app.py if you prefer
The backend will run on http://localhost:5001.

3. Frontend Setup
Open a new terminal and navigate back to the project root, then into the frontend directory:

Bash

cd .. # Go back to the project root: expense-tracker-webApp
cd frontend
a. Install Dependencies

Bash

npm install # Or yarn install
b. Run the React Frontend

Bash

npm start
The frontend will run on http://localhost:3000 (or another available port).

💡 Usage
Open your browser and navigate to http://localhost:3000.

Register a New Account: Click on "Sign up" and create a new user. Remember the username and password.

Login: Use your newly created credentials to log in.

Explore the Dashboard: Get an overview of your spending.

Add Expenses: Go to "Add Expense" to record your expenditures.

View Transactions: Check the "Transactions" page to see, filter, edit, or delete your expenses.

Set Budgets: Use the "Budgets" section to control your spending categories.

Profile Settings: Update your details or change your password.

Forgot Password: If you forget your password, go back to the login page, click "Forgot Password?", enter your username/email, and check your backend terminal for the reset link. Copy the link and paste it into your browser to reset your password.

🤝 Contributing
Contributions are welcome! If you have suggestions for improvements or new features, please:

Fork the repository.

Create a new branch (git checkout -b feature/your-feature-name).

Make your changes.

Commit your changes (git commit -m 'feat: Add new feature X').

Push to the branch (git push origin feature/your-feature-name).

Open a Pull Request.

📄 License
This project is open-source and available under the MIT License.
(You might want to create a LICENSE file in your root directory if you want to formally apply the MIT license or another open-source license.)


