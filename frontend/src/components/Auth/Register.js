// frontend/src/components/Auth/Register.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AuthForm.css';
import { toast } from 'react-toastify';

const Register = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!username || !password) {
            setError("Please enter both username and password.");
            toast.error("Please enter both username and password.");
            return;
        }

        try {
            const response = await fetch('http://localhost:5001/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                // --- IMPORTANT CHANGE HERE: Trim username and password ---
                body: JSON.stringify({
                    username: username.trim(), // Trim username
                    password: password.trim()  // Trim password
                }),
                // --- END IMPORTANT CHANGE ---
            });

            if (response.ok) {
                const data = await response.json();
                toast.success(data.message);
                navigate('/login');
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Registration failed. Please try again.');
                toast.error(errorData.error || 'Registration failed. Please try again.');
            }
        } catch (err) {
            setError('Network error. Please ensure the backend is running and accessible.');
            toast.error('Network error. Could not connect to backend.');
            console.error('Registration fetch error:', err);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Register Account</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
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
                            required
                        />
                    </div>
                    {error && <p className="error-message">{error}</p>}
                    <button type="submit" className="btn-primary">Register</button>
                </form>
                <p>Already have an account? <span onClick={() => navigate('/login')} className="link-text">Login here</span></p>
            </div>
        </div>
    );
};

export default Register;