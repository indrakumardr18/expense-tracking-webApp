// frontend/src/components/Profile.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './Profile.css'; // We'll create this CSS file

const Profile = () => {
    const navigate = useNavigate();
    const userId = localStorage.getItem('user_id');

    // State for profile details
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState(''); // Assuming you store email

    // State for change password form
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            toast.error("You must be logged in to view your profile.");
            navigate('/login');
            return;
        }

        const fetchUserProfile = async () => {
            try {
                const response = await fetch(`http://localhost:5001/users/${userId}`);
                if (response.ok) {
                    const data = await response.json();
                    setUsername(data.username);
                    setEmail(data.email || ''); // Email might be optional/not always present
                } else {
                    const errorData = await response.json();
                    toast.error(errorData.error || 'Failed to fetch user profile.');
                }
            } catch (err) {
                toast.error('Network error. Could not connect to backend.');
                console.error('Fetch user profile error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, [userId, navigate]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch(`http://localhost:5001/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email }), // Send only fields that can be updated
            });

            if (response.ok) {
                toast.success('Profile updated successfully!');
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || 'Failed to update profile.');
            }
        } catch (err) {
            toast.error('Network error. Could not connect to backend.');
            console.error('Update profile error:', err);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmNewPassword) {
            toast.error("New password and confirmation do not match.");
            return;
        }
        if (newPassword.length < 6) { // Basic client-side validation
            toast.error("New password must be at least 6 characters long.");
            return;
        }

        try {
            const response = await fetch('http://localhost:5001/users/change-password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: userId,
                    current_password: currentPassword,
                    new_password: newPassword,
                }),
            });

            if (response.ok) {
                toast.success('Password changed successfully!');
                // Clear password fields after success
                setCurrentPassword('');
                setNewPassword('');
                setConfirmNewPassword('');
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || 'Failed to change password.');
            }
        } catch (err) {
            toast.error('Network error. Could not connect to backend.');
            console.error('Change password error:', err);
        }
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm("Are you absolutely sure you want to delete your account? This action cannot be undone and all your data (expenses, budgets) will be lost.")) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:5001/users/${userId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                toast.success('Account deleted successfully! Redirecting to login...');
                localStorage.removeItem('user_id'); // Clear user_id from localStorage
                // You might need a global state or prop to setIsAuthenticated(false) in App.js
                // For now, a direct navigate will handle it if App.js checks localStorage.
                navigate('/login');
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || 'Failed to delete account.');
            }
        } catch (err) {
            toast.error('Network error. Could not connect to backend.');
            console.error('Delete account error:', err);
        }
    };

    if (loading) {
        return <div className="profile-container">Loading profile...</div>;
    }

    return (
        <div className="profile-container">
            <h2>User Profile</h2>

            {/* Update Profile Section */}
            <section className="profile-section">
                <h3>Update Profile Information</h3>
                <form onSubmit={handleUpdateProfile}>
                    <div className="form-group">
                        <label htmlFor="username">Username:</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="email">Email:</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn-primary">Update Profile</button>
                </form>
            </section>

            {/* Change Password Section */}
            <section className="profile-section">
                <h3>Change Password</h3>
                <form onSubmit={handleChangePassword}>
                    <div className="form-group">
                        <label htmlFor="current-password">Current Password:</label>
                        <input
                            type="password"
                            id="current-password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="new-password">New Password:</label>
                        <input
                            type="password"
                            id="new-password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="confirm-new-password">Confirm New Password:</label>
                        <input
                            type="password"
                            id="confirm-new-password"
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn-primary">Change Password</button>
                </form>
            </section>

            {/* Delete Account Section */}
            <section className="profile-section delete-account-section">
                <h3>Danger Zone</h3>
                <p>Permanently delete your account and all associated data.</p>
                <button
                    onClick={handleDeleteAccount}
                    className="btn-danger"
                >
                    Delete Account
                </button>
            </section>
        </div>
    );
};

export default Profile;