import React, { useState, useEffect } from 'react';
import { getBudgets, createBudget, deleteBudget, getCategories } from '../api/client';
import { Plus, Trash2, Target, AlertTriangle } from 'lucide-react';

const Budgets = () => {
    const [budgets, setBudgets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    const [newBudget, setNewBudget] = useState({
        name: '',
        amount: '',
        period: 'monthly',
        category_id: ''
    });

    const fetchData = async () => {
        try {
            const [budgetsRes, categoriesRes] = await Promise.all([
                getBudgets(),
                getCategories()
            ]);
            setBudgets(budgetsRes.data);
            // Only need expense categories for budget, but let's grab all or filter
            setCategories(categoriesRes.data.filter(c => c.type === 'expense'));
        } catch (error) {
            console.error("Failed to fetch budgets data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateBudget = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...newBudget,
                amount: parseFloat(newBudget.amount),
                category_id: newBudget.category_id || null // send null if overall
            };
            await createBudget(payload);
            setShowAddModal(false);
            setNewBudget({ name: '', amount: '', period: 'monthly', category_id: '' });
            fetchData();
        } catch (error) {
            console.error("Failed to create budget", error);
        }
    };

    const handleDeleteBudget = async (id) => {
        if (window.confirm("Are you sure you want to delete this budget?")) {
            try {
                await deleteBudget(id);
                fetchData();
            } catch (error) {
                console.error("Failed to delete budget", error);
            }
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Budgets</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Manage and track your spending limits.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                    <Plus size={18} /> Create Budget
                </button>
            </div>

            <div className="grid-3" style={{ alignItems: 'start' }}>
                {budgets.length === 0 ? (
                    <div className="glass-panel" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 'var(--spacing-xl)' }}>
                        <Target size={48} style={{ color: 'var(--brand-primary)', marginBottom: 'var(--spacing-md)' }} />
                        <h3>No Budgets Set</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>Create a budget to start tracking your spending.</p>
                    </div>
                ) : (
                    budgets.map(budget => {
                        const spent = budget.spent || 0;
                        const limit = budget.amount;
                        const percentage = (spent / limit) * 100;

                        let progressColor = 'var(--status-success)';
                        if (percentage >= 100) {
                            progressColor = 'var(--status-danger)';
                        } else if (percentage >= 80) {
                            progressColor = 'var(--status-warning)';
                        }

                        const categoryName = budget.category_id
                            ? categories.find(c => c._id === budget.category_id)?.name || 'Unknown Category'
                            : 'All Expenses';

                        return (
                            <div key={budget._id} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>{budget.name}</h3>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>{budget.period}</span>
                                            <span style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>{categoryName}</span>
                                        </div>
                                    </div>
                                    <button className="btn-icon" onClick={() => handleDeleteBudget(budget._id)} style={{ color: 'var(--text-tertiary)' }}>
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                                <div style={{ background: 'rgba(0,0,0,0.2)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-xs)', alignItems: 'flex-end' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Spent</span>
                                            <span style={{ fontSize: '1.125rem', fontWeight: 'bold', color: progressColor }}>Rs {spent.toLocaleString()}</span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                            <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Budget Limit</span>
                                            <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>Rs {limit.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <div style={{ width: '100%', height: '8px', background: 'var(--glass-border)', borderRadius: '4px', overflow: 'hidden', marginTop: 'var(--spacing-sm)' }}>
                                        <div style={{
                                            height: '100%',
                                            background: progressColor,
                                            width: `${Math.min(100, Math.max(0, percentage))}%`,
                                            transition: 'width 0.4s ease, background-color 0.4s ease'
                                        }}></div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--spacing-xs)' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{percentage.toFixed(1)}% used</span>
                                        {percentage >= 100 ? (
                                            <span style={{ fontSize: '0.75rem', color: 'var(--status-danger)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <AlertTriangle size={12} /> Over budget
                                            </span>
                                        ) : (
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                Rs {(limit - spent).toLocaleString()} remaining
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Add Budget Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="glass-panel modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Create Budget</h2>
                            <button className="btn-icon" onClick={() => setShowAddModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleCreateBudget}>
                            <div className="form-group">
                                <label className="form-label">Budget Name</label>
                                <input type="text" className="form-control" required placeholder="e.g. Monthly Groceries"
                                    value={newBudget.name} onChange={e => setNewBudget({ ...newBudget, name: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Budget Amount (Rs)</label>
                                <input type="number" step="0.01" className="form-control" required
                                    value={newBudget.amount} onChange={e => setNewBudget({ ...newBudget, amount: e.target.value })} />
                            </div>
                            <div className="grid-2">
                                <div className="form-group">
                                    <label className="form-label">Period</label>
                                    <select className="form-control" value={newBudget.period} onChange={e => setNewBudget({ ...newBudget, period: e.target.value })}>
                                        <option value="monthly">Monthly</option>
                                        <option value="weekly">Weekly</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Target Category</label>
                                    <select className="form-control" value={newBudget.category_id} onChange={e => setNewBudget({ ...newBudget, category_id: e.target.value })}>
                                        <option value="">All Expenses (Overall)</option>
                                        {categories.map(cat => (
                                            <option key={cat._id} value={cat._id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Create Budget</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Budgets;
