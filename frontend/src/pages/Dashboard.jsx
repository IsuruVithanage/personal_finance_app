import React, { useState, useEffect } from 'react';
import { getDashboardSummary, getMonthlyReport, getBudgets } from '../api/client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Wallet, TrendingUp, TrendingDown, DollarSign, Target } from 'lucide-react';
import AIInsights from '../components/AIInsights';
import { Link } from 'react-router-dom';

const Dashboard = () => {
    const [summary, setSummary] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [sumRes, reportRes, budgetsRes] = await Promise.all([
                    getDashboardSummary(),
                    getMonthlyReport(6),
                    getBudgets()
                ]);
                setSummary(sumRes.data);
                setBudgets(budgetsRes.data.slice(0, 3)); // show top 3

                // Reformat chart data to ensure clear numbers for Recharts
                const formattedChartData = reportRes.data.map(d => ({
                    ...d,
                    income: Number(d.income),
                    expense: Number(d.expense)
                }));
                // Recharts draws left to right, we want oldest to newest
                setChartData(formattedChartData.reverse());
            } catch (error) {
                console.error("Error fetching dashboard data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>Loading...</div>;
    if (!summary) return <div>Failed to load dashboard</div>;

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Dashboard Overview</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Welcome back to your financial hub.</p>
            </div>

            {/* --- Stat Cards --- */}
            <div className="grid-4" style={{ marginBottom: 'var(--spacing-xl)' }}>
                <div className="glass-panel interactive stat-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h3 className="stat-card-title">Total Balance</h3>
                        <div className="btn-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--brand-primary)' }}><Wallet size={20} /></div>
                    </div>
                    <div className="stat-card-value">Rs {summary.total_balance?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>

                <div className="glass-panel interactive stat-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h3 className="stat-card-title">Monthly Income</h3>
                        <div className="btn-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--status-success)' }}><TrendingUp size={20} /></div>
                    </div>
                    <div className="stat-card-value positive">+Rs {summary.monthly_summary?.income?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>

                <div className="glass-panel interactive stat-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h3 className="stat-card-title">Monthly Expenses</h3>
                        <div className="btn-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--status-danger)' }}><TrendingDown size={20} /></div>
                    </div>
                    <div className="stat-card-value negative">-Rs {summary.monthly_summary?.expense?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>

                <div className="glass-panel interactive stat-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h3 className="stat-card-title">Money Owed To You</h3>
                        <div className="btn-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--status-info)' }}><DollarSign size={20} /></div>
                    </div>
                    <div className="stat-card-value warning">Rs {summary.total_outstanding_debts?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
            </div>

            <div className="grid-2">
                {/* --- Chart --- */}
                <div className="glass-panel chart-container" style={{ display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ marginBottom: 'var(--spacing-md)', fontSize: '1.125rem' }}>Cash Flow (Last 6 Months)</h3>
                    <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--status-success)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--status-success)" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--status-danger)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--status-danger)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="month" stroke="var(--text-tertiary)" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--text-tertiary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `Rs ${val}`} />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--glass-border)" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--bg-color-accent)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}
                                    itemStyle={{ color: 'var(--text-primary)' }}
                                    formatter={(value) => `Rs ${value.toLocaleString()}`}
                                />
                                <Area type="monotone" dataKey="income" stroke="var(--status-success)" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" name="Income" />
                                <Area type="monotone" dataKey="expense" stroke="var(--status-danger)" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" name="Expense" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* --- Recent Transactions --- */}
                <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ marginBottom: 'var(--spacing-md)', fontSize: '1.125rem' }}>Recent Transactions</h3>
                    <div className="table-container" style={{ flex: 1 }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Description</th>
                                    <th style={{ textAlign: 'right' }}>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {summary.recent_transactions?.map((tx) => (
                                    <tr key={tx.id}>
                                        <td>{new Date(tx.date).toLocaleDateString()}</td>
                                        <td>{tx.description}</td>
                                        <td style={{
                                            textAlign: 'right',
                                            fontWeight: '600',
                                            color: tx.type === 'income' ? 'var(--status-success)' :
                                                tx.type === 'expense' ? 'var(--status-danger)' : 'var(--text-primary)'
                                        }}>
                                            {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                                            Rs {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))}
                                {(!summary.recent_transactions || summary.recent_transactions.length === 0) && (
                                    <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>No recent transactions</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* --- Active Budgets --- */}
            {budgets.length > 0 && (
                <div style={{ marginTop: 'var(--spacing-xl)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                        <h3 style={{ fontSize: '1.125rem', margin: 0 }}>Active Budgets</h3>
                        <Link to="/budgets" style={{ color: 'var(--brand-primary)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: '500' }}>View All &rarr;</Link>
                    </div>
                    <div className="grid-3">
                        {budgets.map(budget => {
                            const spent = budget.spent || 0;
                            const limit = budget.amount;
                            const percentage = (spent / limit) * 100;

                            let progressColor = 'var(--status-success)';
                            if (percentage >= 100) {
                                progressColor = 'var(--status-danger)';
                            } else if (percentage >= 80) {
                                progressColor = 'var(--status-warning)';
                            }

                            return (
                                <div key={budget._id} className="glass-panel" style={{ padding: 'var(--spacing-md)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '500' }}>{budget.name}</h4>
                                        <Target size={16} style={{ color: 'var(--text-tertiary)' }} />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: progressColor }}>Rs {spent.toLocaleString()}</span>
                                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>/ Rs {limit.toLocaleString()}</span>
                                    </div>
                                    <div style={{ width: '100%', height: '6px', background: 'var(--glass-border)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%',
                                            background: progressColor,
                                            width: `${Math.min(100, Math.max(0, percentage))}%`,
                                            transition: 'width 0.4s ease'
                                        }}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* --- AI Insights --- */}
            <div style={{ marginTop: 'var(--spacing-xl)' }}>
                <AIInsights />
            </div>
        </div>
    );
};

export default Dashboard;
