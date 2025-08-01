// frontend/src/App.js (UPDATED)
import React, { useState, useEffect } from 'react';
// Remove BrowserRouter import here:
import { Routes, Route, Link, useNavigate } from 'react-router-dom'; // No need for BrowserRouter import anymore
import './App.css';

// Import actual components
import Login from './components/Auth/Login';

// Placeholder components for now
const Home = () => <h2>Welcome to Expense Tracker!</h2>;
const Dashboard = () => <h2>Dashboard View</h2>;
const Transactions = () => <h2>Transactions View</h2>;
const Budgets = () => <h2>Budgets View</h2>;


function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate(); // This hook is now correctly within Router's context

  // Check for user_id in localStorage on app load
  useEffect(() => {
    const userId = localStorage.getItem('user_id');
    if (userId) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLoginSuccess = (userId) => {
    localStorage.setItem('user_id', userId); // Store user ID
    setIsAuthenticated(true);
    navigate('/dashboard'); // Redirect to dashboard after login
  };

  const handleLogout = () => {
    localStorage.removeItem('user_id'); // Clear stored user ID
    setIsAuthenticated(false);
    navigate('/login'); // Redirect to login page
  };

  return (
    // REMOVE THE <Router> WRAPPER HERE!
    <div className="app-container">
      {/* Sidebar - Conditional rendering based on authentication */}
      {isAuthenticated && (
        <aside className="sidebar">
          <div className="sidebar-header">Expense Tracker</div>
          <nav>
            <ul>
              <li><Link to="/dashboard">Dashboard</Link></li>
              <li><Link to="/transactions">Transactions</Link></li>
              <li><Link to="/budgets">Budgets</Link></li>
              {/* More links */}
              <li><button onClick={handleLogout} className="logout-btn">Logout</button></li>
            </ul>
          </nav>
        </aside>
      )}

      {/* --- Main Content Area --- */}
      <main className="main-content">
        {/* Header - Conditional rendering */}
        {isAuthenticated && (
          <header className="app-header">
            <h1>App Header - Placeholder</h1>
            {/* Search, Add Expense, Profile, Notifications */}
          </header>
        )}

        <div className="content-area">
          <Routes>
            {/* Login Route (always accessible) */}
            <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
            <Route path="/" element={<Home />} /> {/* You can redirect this to login if not auth */}

            {/* Protected Routes - Render only if authenticated */}
            {isAuthenticated ? (
              <>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/budgets" element={<Budgets />} />
                {/* Add more routes as you create components */}
              </>
            ) : (
              // Redirect to login if trying to access protected routes when not authenticated
              <Route path="*" element={<Login onLoginSuccess={handleLoginSuccess} />} />
            )}
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default App;