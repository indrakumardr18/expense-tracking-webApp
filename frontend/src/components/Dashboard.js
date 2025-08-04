// frontend/src/components/Dashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { toast } from 'react-toastify'; // <--- ADD THIS

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const Dashboard = () => {
    const [summary, setSummary] = useState(null);
    const [budgets, setBudgets] = useState([]);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [error, setError] = useState(''); // Keep local error state for main dashboard message
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Get current month in YYYY-MM format
    const currentMonth = new Date().toISOString().slice(0, 7);

    useEffect(() => {
        const fetchDashboardData = async () => {
            const userId = localStorage.getItem('user_id');

            if (!userId) {
                setError("You must be logged in to view the dashboard.");
                toast.error("You must be logged in to view the dashboard."); // <--- Toast
                setLoading(false);
                navigate('/login');
                return;
            }

            try {
                setLoading(true); // Set loading true before any fetch operations start
                setError(''); // Clear any previous errors when starting new fetch

                // 1. Fetch Summary Data (for monthly_category_breakdown)
                const summaryResponse = await fetch(`http://localhost:5001/summary/${userId}?month=${currentMonth}`);
                if (summaryResponse.ok) {
                    const summaryData = await summaryResponse.json();
                    setSummary(summaryData);
                } else {
                    const errorData = await summaryResponse.json();
                    setError(errorData.error || 'Failed to fetch dashboard summary.'); // Local error for primary display
                    toast.error(`Failed to load summary: ${errorData.error || 'Unknown error'}`); // <--- Toast for specific fetch
                }

                // 2. Fetch Budgets for the current month
                const budgetsResponse = await fetch(`http://localhost:5001/budgets/${userId}/${currentMonth}`);
                if (budgetsResponse.ok) {
                    const budgetsData = await budgetsResponse.json();
                    setBudgets(budgetsData);
                } else {
                    const errorData = await budgetsResponse.json();
                    console.error('Failed to fetch budgets for dashboard:', errorData.error);
                    toast.error(`Failed to load budgets: ${errorData.error || 'Unknown error'}`); // <--- Toast for specific fetch
                    setBudgets([]);
                }

                // 3. Fetch Recent Transactions (e.g., last 5)
                const recentTransactionsResponse = await fetch(`http://localhost:5001/expenses/${userId}?limit=5&sort_by=date&order=desc`);
                if (recentTransactionsResponse.ok) {
                    const recentData = await recentTransactionsResponse.json();
                    setRecentTransactions(recentData);
                } else {
                    const errorData = await recentTransactionsResponse.json();
                    console.error('Failed to fetch recent transactions:', errorData.error);
                    toast.error(`Failed to load recent transactions: ${errorData.error || 'Unknown error'}`); // <--- Toast for specific fetch
                    setRecentTransactions([]);
                }

            } catch (err) {
                setError('Network error. Could not connect to backend. Please try again.'); // Local error
                toast.error('Network error. Could not connect to backend. Please try again.'); // <--- Toast for general network error
                console.error('Fetch dashboard data error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [navigate, currentMonth]);


    // --- Prepare data for Pie Chart (Category Breakdown) ---
    const pieChartData = {
        labels: summary?.monthly_category_breakdown ? Object.keys(summary.monthly_category_breakdown) : [],
        datasets: [
            {
                data: summary?.monthly_category_breakdown ? Object.values(summary.monthly_category_breakdown) : [],
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#E7E9ED',
                    '#6B7A8F', '#F7CAC9', '#92A8D1', '#034078', '#DA2C38' // More colors
                ],
                hoverBackgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#E7E9ED',
                    '#6B7A8F', '#F7CAC9', '#92A8D1', '#034078', '#DA2C38'
                ],
            },
        ],
    };
    const pieChartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'right',
            },
            title: {
                display: true,
                text: `Monthly Spending Breakdown (${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })})`,
                font: { size: 18 }
            }
        }
    };


    // --- Prepare data for Bar Chart (Budget vs. Spent) ---
    const budgetCategories = [...new Set([
        ...(budgets || []).map(b => b.category),
        ...(summary?.monthly_category_breakdown ? Object.keys(summary.monthly_category_breakdown) : [])
    ])];

    const barChartData = {
        labels: budgetCategories,
        datasets: [
            {
                label: 'Budgeted',
                data: budgetCategories.map(cat => {
                    const budget = budgets.find(b => b.category === cat);
                    return budget ? budget.amount : 0;
                }),
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
            },
            {
                label: 'Spent',
                data: budgetCategories.map(cat => summary?.monthly_category_breakdown[cat] || 0),
                backgroundColor: 'rgba(255, 99, 132, 0.6)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1,
            },
        ],
    };

    const barChartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: `Monthly Budget vs. Spent (${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })})`,
                font: { size: 18 }
            }
        },
        scales: {
            x: {
                stacked: false,
            },
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Amount ($)'
                }
            },
        },
    };


    // --- Calculate overall monthly budget summary ---
    const totalBudgeted = budgets.reduce((acc, budget) => acc + (budget.amount || 0), 0);
    const totalSpent = summary?.total_monthly_expenses || 0;
    const totalRemaining = totalBudgeted - totalSpent;


    if (loading) {
        return <div className="dashboard-container">Loading dashboard...</div>;
    }

    if (error) {
        return <div className="dashboard-container error-message">{error}</div>;
    }

    return (
        <div className="dashboard-container">
            <h2>Your Financial Overview</h2>

            <div className="summary-cards">
                <div className="card">
                    <h3>Total Monthly Expenses ({new Date().toLocaleString('default', { month: 'long' })})</h3>
                    <p className="amount">${totalSpent.toFixed(2)}</p>
                </div>
                <div className="card">
                    <h3>Total Yearly Expenses ({new Date().getFullYear()})</h3>
                    <p className="amount">${summary?.total_yearly_expenses ? summary.total_yearly_expenses.toFixed(2) : '0.00'}</p>
                </div>
                 <div className="card">
                    <h3>Total Monthly Budget ({new Date().toLocaleString('default', { month: 'long' })})</h3>
                    <p className="amount">${totalBudgeted.toFixed(2)}</p>
                </div>
                <div className="card">
                    <h3>Remaining Monthly Budget</h3>
                    <p className={`amount ${totalRemaining < 0 ? 'over-budget' : ''}`}>
                        ${totalRemaining.toFixed(2)}
                    </p>
                </div>
            </div>

            <div className="chart-section">
                <div className="chart-card">
                    {summary?.monthly_category_breakdown && Object.keys(summary.monthly_category_breakdown).length > 0 ? (
                        <Pie data={pieChartData} options={pieChartOptions} />
                    ) : (
                        <p>No monthly expenses recorded to display category breakdown chart.</p>
                    )}
                </div>
                <div className="chart-card">
                    {budgetCategories.length > 0 ? (
                        <Bar data={barChartData} options={barChartOptions} />
                    ) : (
                        <p>No budgets or expenses recorded for current month to display budget vs. spent chart.</p>
                    )}
                </div>
            </div>

            {/* --- NEW: Recent Transactions Section --- */}
            <div className="recent-transactions-section">
                <h3>Recent Transactions</h3>
                {recentTransactions.length === 0 ? (
                    <p>No recent transactions to display.</p>
                ) : (
                    <div className="recent-transactions-list">
                        {recentTransactions.map(transaction => (
                            <div key={transaction._id} className="recent-transaction-item">
                                <span className="recent-transaction-date">{transaction.date}</span>
                                <span className="recent-transaction-category">{transaction.category}</span>
                                <span className="recent-transaction-amount">${transaction.amount.toFixed(2)}</span>
                                {transaction.description && <span className="recent-transaction-description">{transaction.description}</span>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {/* --- END NEW Section --- */}

            {/* You can remove the old category breakdown list if you prefer the chart */}
            {/*
            <div className="category-breakdown">
                <h3>Monthly Spending by Category (List)</h3>
                {summary?.monthly_category_breakdown && Object.keys(summary.monthly_category_breakdown).length === 0 ? (
                    <p>No monthly expenses recorded yet for category breakdown.</p>
                ) : (
                    <ul>
                        {summary?.monthly_category_breakdown && Object.entries(summary.monthly_category_breakdown).map(([category, amount]) => (
                            <li key={category}>
                                {category}: ${amount.toFixed(2)}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            */}
        </div>
    );
};

export default Dashboard;