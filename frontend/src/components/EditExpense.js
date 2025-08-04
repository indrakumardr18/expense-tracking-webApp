// frontend/src/components/EditExpense.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import './AddExpense.css'; // Reuse existing form styling
import { toast } from 'react-toastify'; // <--- ADD THIS

const EditExpense = () => {
    const { id } = useParams(); // Get expense ID from URL
    const navigate = useNavigate();
    const location = useLocation(); // To access state passed during navigation

    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [error, setError] = useState(''); // Local error for form feedback
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if expense data was passed via state (e.g., from Transactions page)
        if (location.state && location.state.expense) {
            const { expense } = location.state;
            setAmount(expense.amount);
            setCategory(expense.category);
            setDescription(expense.description || ''); // Description might be null/undefined
            setDate(expense.date);
            setLoading(false);
        } else {
            // If not passed via state, fetch the expense data using its ID
            const fetchExpense = async () => {
                const userId = localStorage.getItem('user_id'); // We'll need user_id for security later or for checking ownership

                if (!userId) {
                    setError("You must be logged in."); // Local error
                    toast.error("You must be logged in to edit an expense."); // <--- Toast
                    setLoading(false);
                    navigate('/login');
                    return;
                }

                try {
                    // Assuming you have a backend endpoint like /expenses/<expense_id>
                    // The previous setup had /expenses/689064ab5c8a9ba5f779417d which fetches all for a user.
                    // For single expense fetch, typically it's /expenses/<expense_id> directly.
                    // Let's assume the endpoint `http://localhost:5001/expenses/${id}` returns a single expense if `id` is an expense ID.
                    // If your backend needs `user_id` as part of getting a single expense, you might need to adjust this.
                    const response = await fetch(`http://localhost:5001/expenses/${id}`);
                    if (response.ok) {
                        const data = await response.json();
                        // Backend might return an array if the /expenses/:user_id endpoint is misused here.
                        // Assuming it returns a single object if accessed by _id.
                        const expenseData = Array.isArray(data) ? data[0] : data; // Adjust if needed
                        
                        if (expenseData) {
                            setAmount(expenseData.amount);
                            setCategory(expenseData.category);
                            setDescription(expenseData.description || '');
                            setDate(expenseData.date);
                        } else {
                            setError('Expense not found.');
                            toast.error('Expense not found.');
                        }
                    } else {
                        const errorData = await response.json();
                        setError(errorData.error || 'Failed to fetch expense details.'); // Local error
                        toast.error(errorData.error || 'Failed to fetch expense details.'); // <--- Toast
                    }
                } catch (err) {
                    setError('Network error. Could not connect to backend.'); // Local error
                    toast.error('Network error. Could not connect to backend.'); // <--- Toast
                    console.error('Fetch single expense error:', err);
                } finally {
                    setLoading(false);
                }
            };
            fetchExpense();
        }
    }, [id, location.state, navigate]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); // Clear previous errors displayed below the form

        if (!amount || !category || !date) {
            setError("Amount, Category, and Date are required."); // Local error
            toast.error("Amount, Category, and Date are required."); // <--- Toast for immediate feedback
            return;
        }

        // Basic validation for amount
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            setError("Please enter a valid positive amount.");
            toast.error("Please enter a valid positive amount.");
            return;
        }

        const userId = localStorage.getItem('user_id'); // Ensure user_id is sent for verification on backend

        if (!userId) {
            setError("You must be logged in to update an expense.");
            toast.error("You must be logged in to update an expense.");
            navigate('/login');
            return;
        }

        try {
            const response = await fetch(`http://localhost:5001/expenses/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: userId, // Send user_id for backend validation/ownership check
                    amount: parsedAmount, // Use parsed amount
                    category,
                    description,
                    date
                }),
            });

            if (response.ok) {
                const data = await response.json();
                // alert(data.message); // <--- REMOVE THIS
                toast.success(data.message); // <--- ADD THIS
                navigate('/transactions'); // Redirect to transactions list after update
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to update expense.'); // Local error
                toast.error(errorData.error || 'Failed to update expense.'); // <--- Toast
            }
        } catch (err) {
            setError('Network error. Could not connect to backend.'); // Local error
            toast.error('Network error. Could not connect to backend.'); // <--- Toast
            console.error('Update expense error:', err);
        }
    };

    if (loading) {
        return <div className="add-expense-container">Loading expense details...</div>;
    }

    return (
        <div className="add-expense-container">
            <h2>Edit Expense</h2>
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
                <button type="submit" className="btn-primary">Update Expense</button>
                <button type="button" onClick={() => navigate('/transactions')} className="btn-secondary" style={{marginLeft: '10px'}}>Cancel</button>
            </form>
        </div>
    );
};

export default EditExpense;