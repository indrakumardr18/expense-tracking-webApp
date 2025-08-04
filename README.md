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
