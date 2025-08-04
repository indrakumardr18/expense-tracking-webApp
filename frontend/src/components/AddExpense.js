// frontend/src/components/AddExpense.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AddExpense.css';
import { toast } from 'react-toastify'; // <--- ADD THIS

const AddExpense = () => {
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    // Initialize date to today's date for better UX
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10)); // YYYY-MM-DD
    const [error, setError] = useState(''); // Local error for form feedback
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); // Clear previous errors displayed below the form

        const userId = localStorage.getItem('user_id');

        if (!userId) {
            setError("You must be logged in to add an expense."); // Local error
            toast.error("You must be logged in to add an expense."); // <--- Toast for immediate feedback
            navigate('/login');
            return;
        }

        if (!amount || !category || !date) {
            setError("Amount, Category, and Date are required."); // Local error
            toast.error("Amount, Category, and Date are required."); // <--- Toast for immediate feedback
            return;
        }

        // Convert amount to a number
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            setError("Please enter a valid positive amount.");
            toast.error("Please enter a valid positive amount.");
            return;
        }


        try {
            const response = await fetch('http://localhost:5001/expenses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: userId,
                    amount: parsedAmount, // Use the parsed amount
                    category,
                    description,
                    date
                }),
            });

            if (response.ok) {
                const data = await response.json();
                // alert(data.message); // <--- REMOVE THIS
                toast.success(data.message); // <--- ADD THIS

                // Clear form fields
                setAmount('');
                setCategory('');
                setDescription('');
                setDate(new Date().toISOString().slice(0, 10)); // Reset date to today
                // Optionally navigate after adding, but usually for single-add forms, clearing is better
                // navigate('/transactions');
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to add expense.'); // Local error
                toast.error(errorData.error || 'Failed to add expense.'); // <--- Toast for error
            }
        } catch (err) {
            setError('Network error. Could not connect to backend.'); // Local error
            toast.error('Network error. Could not connect to backend.'); // <--- Toast for network error
            console.error('Add expense error:', err);
        }
    };

    return (
        <div className="add-expense-container">
            <h2>Add New Expense</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="amount">Amount:</label>
                    <input
                        type="number"
                        id="amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="category">Category:</label>
                    <input
                        type="text"
                        id="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="description">Description:</label>
                    <input
                        type="text"
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        // description is optional, so 'required' is not set here
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="date">Date:</label>
                    <input
                        type="date"
                        id="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                    />
                </div>
                {error && <p className="error-message">{error}</p>}
                <button type="submit" className="btn-primary">Add Expense</button>
            </form>
        </div>
    );
};

export default AddExpense;