// frontend/src/components/Auth/Login.js
import React, { useState } from 'react';
import './Login.css'; // We'll create this CSS file next

function Login({ onLoginSuccess }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent default form submission behavior

        setError(''); // Clear previous errors

        try {
            const response = await fetch('http://localhost:5001/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                console.log('Login successful:', data.message);
                // In a real app, you'd store a JWT token here
                if (onLoginSuccess) {
                    onLoginSuccess(data.user_id); // Pass user_id back to App.js
                }
            } else {
                setError(data.error || 'Login failed. Please try again.');
                console.error('Login error:', data.error);
            }
        } catch (networkError) {
            setError('Network error. Could not connect to the server.');
            console.error('Network error during login:', networkError);
        }
    };

    return (
        <div className="auth-container">
            <div className="login-card">
                <h2 className="login-title">Welcome Back!</h2>
                <p className="login-subtitle">Please log in to your account.</p>
                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter your username"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                        />
                        <a href="#" className="forgot-password">Forgot Password?</a>
                    </div>
                    {error && <p className="error-message">{error}</p>}
                    <button type="submit" className="login-button">Login</button>
                </form>
                <p className="signup-link">
                    Don't have an account? <a href="#">Sign up</a>
                </p>
            </div>
        </div>
    );
}

export default Login;