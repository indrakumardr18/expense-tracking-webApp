// frontend/src/components/Transactions.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './Transactions.css';
import { toast } from 'react-toastify';

const Transactions = () => {
    const [expenses, setExpenses] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const [currentUserId, setCurrentUserId] = useState(null);

    const [filterCategory, setFilterCategory] = useState('All'); // This holds the *display* value from dropdown
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState('desc');

    const [allUniqueCategories, setAllUniqueCategories] = useState([]);

    useEffect(() => {
        const id = localStorage.getItem('user_id');
        if (id) {
            setCurrentUserId(id);
        } else {
            toast.error("You need to be logged in to view transactions.");
            navigate('/login');
        }
    }, [navigate]);


    // Function to fetch expenses
    const fetchExpenses = useCallback(async () => {
        if (!currentUserId) {
            setLoading(false);
            return;
        }

        let url = `http://localhost:5001/expenses/${currentUserId}?`;

        // --- IMPORTANT CHANGE HERE: Convert filterCategory to lowercase for backend query ---
        if (filterCategory !== 'All') {
            url += `category=${encodeURIComponent(filterCategory.toLowerCase())}&`; // Convert to lowercase here
        }
        // --- END IMPORTANT CHANGE ---

        if (filterStartDate) {
            url += `start_date=${encodeURIComponent(filterStartDate)}&`;
        }
        if (filterEndDate) {
            url += `end_date=${encodeURIComponent(filterEndDate)}&`;
        }

        url += `sort_by=${encodeURIComponent(sortBy)}&`;
        url += `order=${encodeURIComponent(sortOrder)}`;

        if (url.endsWith('?') || url.endsWith('&')) {
            url = url.slice(0, -1);
        }

        try {
            setLoading(true);
            setError('');

            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                setExpenses(data);

                const categoriesFromExpenses = Array.from(new Set(
                    data.map(expense => expense.category.toLowerCase().trim())
                ));
                const formattedCategories = categoriesFromExpenses.map(cat =>
                    cat.charAt(0).toUpperCase() + cat.slice(1)
                ).sort();
                setAllUniqueCategories(['All', ...formattedCategories]);

            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to fetch expenses.');
                toast.error(`Failed to load expenses: ${errorData.error || 'Unknown error'}`);
                setExpenses([]);
                setAllUniqueCategories(['All']);
            }
        } catch (err) {
            setError('Network error. Could not connect to backend.');
            toast.error('Network error. Could not connect to backend.');
            console.error('Fetch expenses error:', err);
        } finally {
            setLoading(false);
        }
    }, [currentUserId, filterCategory, filterStartDate, filterEndDate, sortBy, sortOrder]);


    useEffect(() => {
        if (currentUserId) {
            fetchExpenses();
        }
    }, [fetchExpenses, currentUserId]);

    const handleDelete = async (expenseId) => {
        if (!window.confirm("Are you sure you want to delete this expense?")) {
            return;
        }
        try {
            const response = await fetch(`http://localhost:5001/expenses/${expenseId}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                toast.success('Expense deleted successfully!');
                fetchExpenses();
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to delete expense.');
                toast.error(errorData.error || 'Failed to delete expense.');
            }
        } catch (err) {
            setError('Network error. Could not connect to backend.');
            toast.error('Network error. Could not connect to backend.');
            console.error('Delete expense error:', err);
        }
    };

    const handleEdit = (expense) => {
        navigate(`/edit-expense/${expense._id}`, { state: { expense } });
    };

    if (loading) {
        return <div className="transactions-container">Loading transactions...</div>;
    }

    if (error) {
        return <div className="transactions-container error-message">{error}</div>;
    }

    if (!currentUserId) {
        return null;
    }

    return (
        <div className="transactions-container">
            <h2>Your Transactions</h2>

            <div className="filter-sort-controls">
                <div className="control-group">
                    <label htmlFor="filterCategory">Category:</label>
                    <select
                        id="filterCategory"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                    >
                        {allUniqueCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                <div className="control-group">
                    <label htmlFor="filterStartDate">From:</label>
                    <input
                        type="date"
                        id="filterStartDate"
                        value={filterStartDate}
                        onChange={(e) => setFilterStartDate(e.target.value)}
                    />
                </div>

                <div className="control-group">
                    <label htmlFor="filterEndDate">To:</label>
                    <input
                        type="date"
                        id="filterEndDate"
                        value={filterEndDate}
                        onChange={(e) => setFilterEndDate(e.target.value)}
                    />
                </div>

                <div className="control-group">
                    <label htmlFor="sortBy">Sort By:</label>
                    <select
                        id="sortBy"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <option value="date">Date</option>
                        <option value="amount">Amount</option>
                        <option value="category">Category</option>
                    </select>
                </div>

                <div className="control-group">
                    <label htmlFor="sortOrder">Order:</label>
                    <select
                        id="sortOrder"
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                    >
                        <option value="desc">Descending</option>
                        <option value="asc">Ascending</option>
                    </select>
                </div>
            </div>

            {expenses.length === 0 ? (
                <p>No expenses recorded yet, or no expenses match your current filters. Go to "Add Expense" to add some!</p>
            ) : (
                <div className="expenses-list">
                    {expenses.map(expense => (
                        <div key={expense._id} className="expense-item">
                            <div className="expense-details">
                                <p className="expense-amount">Amount: ${expense.amount ? expense.amount.toFixed(2) : '0.00'}</p>
                                <p className="expense-category">Category: {expense.category}</p>
                                <p className="expense-date">Date: {expense.date}</p>
                                {expense.description && (
                                    <p className="expense-description">Description: {expense.description}</p>
                                )}
                            </div>
                            <div className="expense-actions">
                                <button onClick={() => handleEdit(expense)} className="btn-edit">Edit</button>
                                <button onClick={() => handleDelete(expense._id)} className="btn-delete">Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Transactions;