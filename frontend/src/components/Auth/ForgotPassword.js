// frontend/src/components/Auth/ForgotPassword.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './AuthForm.css'; // Reusing your existing AuthForm styles

function ForgotPassword() {
    const [usernameOrEmail, setUsernameOrEmail] = useState('');
    const [message, setMessage] = useState(''); // To show success/error message
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(''); // Clear previous messages
        setLoading(true);

        if (!usernameOrEmail.trim()) {
            setMessage("Please enter your username or email.");
            toast.error("Please enter your username or email.");
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:5001/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username_or_email: usernameOrEmail.trim() }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message);
                toast.success(data.message);
                // Optionally, redirect after a short delay or show a persistent message
                // For now, just show the message and let them go back to login
            } else {
                setMessage(data.error || 'Failed to initiate password reset.');
                toast.error(data.error || 'Failed to initiate password reset.');
            }
        } catch (networkError) {
            setMessage('Network error. Could not connect to the server.');
            toast.error('Network error. Could not connect to the server.');
            console.error('Forgot password fetch error:', networkError);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Forgot Password</h2>
                <p>Enter your username or email to receive a password reset link.</p>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="usernameOrEmail">Username or Email</label>
                        <input
                            type="text"
                            id="usernameOrEmail"
                            value={usernameOrEmail}
                            onChange={(e) => setUsernameOrEmail(e.target.value)}
                            placeholder="Enter your username or email"
                            required
                        />
                    </div>
                    {message && (
                        <p className={message.includes('successfully') ? "success-message" : "error-message"}>
                            {message}
                        </p>
                    )}
                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>
                <p className="signup-link">
                    Remembered your password? <Link to="/login">Login</Link>
                </p>
            </div>
        </div>
    );
}

export default ForgotPassword;