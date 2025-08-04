// frontend/src/components/Budgets.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Budgets.css';
import { toast } from 'react-toastify'; // <--- ADD THIS

const Budgets = () => {
    const [category, setCategory] = useState('');
    const [amount, setAmount] = useState('');
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [budgets, setBudgets] = useState([]);
    const [spentByCategory, setSpentByCategory] = useState({});
    const [error, setError] = useState(''); // Local error for form feedback
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchBudgetsAndSpent = async () => {
        const userId = localStorage.getItem('user_id');

        if (!userId) {
            setError("You must be logged in to view budgets."); // Local error
            toast.error("You must be logged in to view budgets."); // <--- Toast for immediate feedback
            setLoading(false);
            navigate('/login');
            return;
        }

        try {
            setLoading(true);
            // 1. Fetch Budgets
            const budgetsResponse = await fetch(`http://localhost:5001/budgets/${userId}/${month}`);
            if (budgetsResponse.ok) {
                const budgetsData = await budgetsResponse.json();
                setBudgets(budgetsData);
            } else {
                const errorData = await budgetsResponse.json();
                setError(errorData.error || 'Failed to fetch budgets.'); // Local error
                toast.error(errorData.error || 'Failed to fetch budgets.'); // <--- Toast for error
                setBudgets([]);
            }

            // 2. Fetch Spending Summary for the selected month
            const summaryResponse = await fetch(`http://localhost:5001/summary/${userId}?month=${month}`);
            if (summaryResponse.ok) {
                const summaryData = await summaryResponse.json();
                setSpentByCategory(summaryData.monthly_category_breakdown || {});
            } else {
                const errorData = await summaryResponse.json();
                console.error("Failed to fetch monthly spending summary:", errorData.error);
                // For summary fetch errors, we might not set a global error, but a toast is good.
                toast.error(`Failed to load spending summary: ${errorData.error || 'Unknown error'}`); // <--- Toast for summary error
                setSpentByCategory({});
            }

        } catch (err) {
            setError('Network error. Could not connect to backend.'); // Local error
            toast.error('Network error. Could not connect to backend.'); // <--- Toast for network error
            console.error('Fetch budgets/summary error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBudgetsAndSpent();
    }, [month, navigate]); // Re-fetch when month changes

    const handleSetBudget = async (e) => {
        e.preventDefault();
        setError(''); // Clear previous errors displayed below the form

        const userId = localStorage.getItem('user_id');

        if (!userId) {
            setError("You must be logged in to set a budget."); // Local error
            toast.error("You must be logged in to set a budget."); // <--- Toast for immediate feedback
            navigate('/login');
            return;
        }

        if (!category || !amount || !month) {
            setError("All fields (Category, Amount, Month) are required."); // Local error
            toast.error("All fields (Category, Amount, Month) are required."); // <--- Toast for immediate feedback
            return;
        }

        // Basic validation for amount
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            setError("Please enter a valid positive amount for the budget.");
            toast.error("Please enter a valid positive amount for the budget.");
            return;
        }

        try {
            const response = await fetch('http://localhost:5001/budgets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: userId,
                    category,
                    amount: parsedAmount, // Use parsed amount
                    month
                }),
            });

            if (response.ok) {
                const data = await response.json();
                // alert(data.message); // <--- REMOVE THIS
                toast.success(data.message); // <--- ADD THIS
                setCategory('');
                setAmount('');
                fetchBudgetsAndSpent(); // Re-fetch both budgets and spent data to update view
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to set budget.'); // Local error
                toast.error(errorData.error || 'Failed to set budget.'); // <--- Toast for error
            }
        } catch (err) {
            setError('Network error. Could not connect to backend.'); // Local error
            toast.error('Network error. Could not connect to backend.'); // <--- Toast for network error
            console.error('Set budget error:', err);
        }
    };

    if (loading) {
        return <div className="budgets-container">Loading budgets...</div>;
    }

    return (
        <div className="budgets-container">
            <h2>Manage Budgets</h2>

            <div className="budget-form-section">
                <h3>Set a New Budget</h3>
                <form onSubmit={handleSetBudget}>
                    <div className="form-group">
                        <label htmlFor="budget-category">Category:</label>
                        <input
                            type="text"
                            id="budget-category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="budget-amount">Amount:</label>
                        <input
                            type="number"
                            id="budget-amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="budget-month">Month:</label>
                        <input
                            type="month"
                            id="budget-month"
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                            required
                        />
                    </div>
                    {error && <p className="error-message">{error}</p>}
                    <button type="submit" className="btn-primary">Set Budget</button>
                </form>
            </div>

            <div className="budget-list-section">
                <h3>Budgets for {month}</h3>
                <div className="form-group">
                    <label htmlFor="view-month">View Month:</label>
                    <input
                        type="month"
                        id="view-month"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                    />
                </div>

                {budgets.length === 0 ? (
                    <p>No budgets set for {month}.</p>
                ) : (
                    <div className="budgets-list">
                        {budgets.map(budget => {
                            const spent = spentByCategory[budget.category] || 0;
                            const remaining = budget.amount - spent;
                            const isOverBudget = remaining < 0;

                            return (
                                <div key={budget._id} className="budget-item">
                                    <p className="budget-category">{budget.category}</p>
                                    <div className="budget-amounts">
                                        <p className="budget-amount">Budget: ${budget.amount ? budget.amount.toFixed(2) : '0.00'}</p>
                                        <p className="spent-amount">Spent: ${spent.toFixed(2)}</p>
                                        <p className={`remaining-amount ${isOverBudget ? 'over-budget' : ''}`}>
                                            Remaining: ${remaining.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Budgets;