// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import './App.css';

import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ForgotPassword from './components/Auth/ForgotPassword';
import ResetPassword from './components/Auth/ResetPassword';
import AddExpense from './components/AddExpense';
import Transactions from './components/Transactions';
import Dashboard from './components/Dashboard';
import EditExpense from './components/EditExpense';
import Budgets from './components/Budgets';
import Profile from './components/Profile';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userId = localStorage.getItem('user_id');
    if (userId) {
      setIsAuthenticated(true);
      // If authenticated on load, ensure they are on a protected route, e.g., dashboard
      if (['/', '/login', '/register', '/forgot-password', '/reset-password'].includes(window.location.pathname.split('/')[0] + (window.location.pathname.split('/').length > 2 ? '/:token' : ''))) {
          navigate('/dashboard', { replace: true });
      }
    } else {
        // If not authenticated, and they are on a protected route, redirect to login
        // EXCEPT for forgot-password and reset-password
        if (!['/login', '/register', '/forgot-password', '/reset-password'].some(path => window.location.pathname.startsWith(path))) {
            navigate('/login', { replace: true });
        }
    }
  }, [navigate]);


  const handleLoginSuccess = (userId) => {
    localStorage.setItem('user_id', userId);
    setIsAuthenticated(true);
    navigate('/dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('user_id');
    setIsAuthenticated(false);
    navigate('/login');
  };

  return (
    <div className="app-container">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />

      {isAuthenticated && (
        <aside className="sidebar">
          <div className="sidebar-header">Expense Tracker</div>
          <nav>
            <ul>
              <li><Link to="/dashboard">Dashboard</Link></li>
              <li><Link to="/transactions">Transactions</Link></li>
              <li><Link to="/budgets">Budgets</Link></li>
              <li><Link to="/add-expense">Add Expense</Link></li>
              <li><Link to="/profile">Profile Settings</Link></li>
              <li><button onClick={handleLogout} className="logout-btn">Logout</button></li>
            </ul>
          </nav>
        </aside>
      )}

      <main className="main-content">
        {isAuthenticated && (
          <header className="app-header">
            <h1>App Header - Placeholder</h1>
          </header>
        )}

        <div className="content-area">
          <Routes>
            {isAuthenticated ? (
              <>
                {/* Redirect any attempts to go to auth pages when authenticated */}
                <Route path="/login" element={<Dashboard />} />
                <Route path="/register" element={<Dashboard />} />
                <Route path="/forgot-password" element={<Dashboard />} />
                <Route path="/reset-password/:token" element={<Dashboard />} />

                <Route path="/" element={<Dashboard />} />

                {/* Protected Routes */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/budgets" element={<Budgets />} />
                <Route path="/add-expense" element={<AddExpense />} />
                <Route path="/edit-expense/:id" element={<EditExpense />} />
                <Route path="/profile" element={<Profile />} />

                <Route path="*" element={<Dashboard />} />
              </>
            ) : (
              // If NOT authenticated, only show login/register/forgot-password/reset-password
              <>
                <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
                <Route path="/register" element={<Register />} />
                {/* --- ADD THESE ROUTES FOR FORGOT/RESET PASSWORD --- */}
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                {/* --- END ADDITIONS --- */}

                <Route path="/" element={<Login onLoginSuccess={handleLoginSuccess} />} />

                {/* Catch-all for any other paths when not authenticated (redirect to login) */}
                {/* Ensure /forgot-password and /reset-password are not caught here if they are valid paths */}
                <Route path="*" element={<Login onLoginSuccess={handleLoginSuccess} />} />
              </>
            )}
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default App;