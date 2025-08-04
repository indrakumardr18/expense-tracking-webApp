// frontend/src/components/Auth/ResetPassword.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import './AuthForm.css'; // Reusing your existing AuthForm styles

function ResetPassword() {
    const { token } = useParams(); // Get token from URL (e.g., /reset-password/YOUR_TOKEN)
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Optional: Add a state to check if the token is valid on load
    // const [isTokenValid, setIsTokenValid] = useState(false); // Can do an initial fetch to backend

    useEffect(() => {
        // You might want to make an initial call to the backend here
        // to validate the token's existence and expiry before the user types
        // This is good for UX to tell the user immediately if the link is bad.
        // For simplicity, we'll validate it on form submission.
        if (!token) {
            setMessage("No reset token found in the URL.");
            toast.error("No reset token found.");
        }
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setLoading(true);

        if (!token) {
            setMessage("Missing reset token.");
            toast.error("Missing reset token.");
            setLoading(false);
            return;
        }

        if (!newPassword || !confirmPassword) {
            setMessage("Please enter and confirm your new password.");
            toast.error("Please enter and confirm your new password.");
            setLoading(false);
            return;
        }

        if (newPassword !== confirmPassword) {
            setMessage("Passwords do not match.");
            toast.error("Passwords do not match.");
            setLoading(false);
            return;
        }

        if (newPassword.length < 6) {
            setMessage("New password must be at least 6 characters long.");
            toast.error("New password must be at least 6 characters long.");
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:5001/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: token,
                    new_password: newPassword.trim(),
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message);
                toast.success(data.message);
                // Redirect to login after successful password reset
                setTimeout(() => {
                    navigate('/login');
                }, 3000); // Redirect after 3 seconds
            } else {
                setMessage(data.error || 'Failed to reset password.');
                toast.error(data.error || 'Failed to reset password.');
            }
        } catch (networkError) {
            setMessage('Network error. Could not connect to the server.');
            toast.error('Network error. Could not connect to the server.');
            console.error('Reset password fetch error:', networkError);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Reset Password</h2>
                <p>Enter your new password.</p>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="newPassword">New Password</label>
                        <input
                            type="password"
                            id="newPassword"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm New Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            required
                        />
                    </div>
                    {message && (
                        <p className={message.includes('successfully') ? "success-message" : "error-message"}>
                            {message}
                        </p>
                    )}
                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>
                <p className="signup-link">
                    <Link to="/login">Back to Login</Link>
                </p>
            </div>
        </div>
    );
}

export default ResetPassword;