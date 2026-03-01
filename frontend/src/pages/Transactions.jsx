import React, { useState, useEffect } from 'react';
import { getTransactions, createTransaction, updateTransaction, deleteTransaction, getAccounts, getCategories, createCategory, deleteCategory, splitBill } from '../api/client';
import { Plus, Trash2, ArrowRight, SplitSquareHorizontal, UserMinus } from 'lucide-react';

const Transactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [categories, setCategories] = useState([]);

    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showSplitModal, setShowSplitModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editingTxId, setEditingTxId] = useState(null);
    const [newCategory, setNewCategory] = useState({ name: '', type: 'expense' });

    const [newTx, setNewTx] = useState({
        amount: '', type: 'expense', date: new Date().toISOString().split('T')[0],
        description: '', account_id: '', category_id: '', to_account_id: ''
    });

    const [splitData, setSplitData] = useState({
        total_amount: '',
        description: '',
        account_id: '',
        category_id: '',
        date: new Date().toISOString().split('T')[0],
        friends: ['']
    });

    const fetchData = async () => {
        try {
            const [txRes, accRes, catRes] = await Promise.all([
                getTransactions(), getAccounts(), getCategories()
            ]);
            setTransactions(txRes.data);
            setAccounts(accRes.data);
            setCategories(catRes.data);

            // Set defaults for new transaction form
            if (accRes.data.length > 0) {
                setNewTx(prev => ({ ...prev, account_id: accRes.data[0]._id }));
                setSplitData(prev => ({ ...prev, account_id: accRes.data[0]._id }));
            }
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...newTx,
                amount: parseFloat(newTx.amount),
                date: new Date(newTx.date).toISOString()
            };

            // Clean up payload based on type
            if (payload.type !== 'transfer') delete payload.to_account_id;
            if (payload.type === 'transfer') delete payload.category_id;
            if (!payload.category_id) delete payload.category_id;

            if (editingTxId) {
                await updateTransaction(editingTxId, payload);
            } else {
                await createTransaction(payload);
            }

            setShowModal(false);
            setEditingTxId(null);
            setNewTx({ amount: '', type: 'expense', date: new Date().toISOString().split('T')[0], description: '', account_id: accounts[0]?._id || '', category_id: '', to_account_id: '' });
            fetchData();
        } catch (error) {
            console.error("Failed to save transaction", error);
            alert(error.response?.data?.detail || "Failed to save transaction");
        }
    };

    const openEditModal = (tx) => {
        setEditingTxId(tx._id);
        const dateStr = new Date(tx.date).toISOString().split('T')[0];
        setNewTx({
            amount: tx.amount,
            type: tx.type,
            date: dateStr,
            description: tx.description,
            account_id: tx.account_id,
            category_id: tx.category_id || '',
            to_account_id: tx.to_account_id || ''
        });
        setShowModal(true);
    };

    const openAddModal = () => {
        setEditingTxId(null);
        setNewTx({ amount: '', type: 'expense', date: new Date().toISOString().split('T')[0], description: '', account_id: accounts[0]?._id || '', category_id: '', to_account_id: '' });
        setShowModal(true);
    };

    // --- Split Bill Handlers ---
    const handleAddFriend = () => {
        setSplitData(prev => ({ ...prev, friends: [...prev.friends, ''] }));
    };

    const handleRemoveFriend = (index) => {
        setSplitData(prev => {
            const newFriends = [...prev.friends];
            newFriends.splice(index, 1);
            return { ...prev, friends: newFriends };
        });
    };

    const handleFriendChange = (index, value) => {
        setSplitData(prev => {
            const newFriends = [...prev.friends];
            newFriends[index] = value;
            return { ...prev, friends: newFriends };
        });
    }

    const handleSplitSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...splitData,
                total_amount: parseFloat(splitData.total_amount),
                date: new Date(splitData.date).toISOString()
            };
            if (!payload.category_id) delete payload.category_id;

            await splitBill(payload);
            setShowSplitModal(false);
            setSplitData({
                total_amount: '', description: '', account_id: accounts[0]?._id || '', category_id: '',
                date: new Date().toISOString().split('T')[0], friends: ['']
            });
            fetchData();
            alert("Bill split successfully! Check your Debts page.");
        } catch (error) {
            console.error("Failed to split bill", error);
            alert(error.response?.data?.detail || "Failed to split bill");
        }
    }

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        try {
            await createCategory(newCategory);
            setNewCategory({ name: '', type: 'expense' });
            fetchData();
        } catch (error) {
            console.error("Failed to create category", error);
            alert(error.response?.data?.detail || "Failed to create category");
        }
    };

    const handleDeleteCategory = async (id) => {
        if (window.confirm("Delete this category? Transactions using this category won't show the category name anymore.")) {
            try {
                await deleteCategory(id);
                fetchData();
            } catch (error) {
                console.error("Failed to delete category", error);
            }
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Delete this transaction? This will revert the account balances by the transaction amount.")) {
            try {
                await deleteTransaction(id);
                fetchData();
            } catch (error) {
                console.error("Failed to delete transaction", error);
            }
        }
    };

    const getAccountName = (id) => accounts.find(a => a._id === id)?.name || 'Unknown';
    const getCategoryName = (id) => categories.find(c => c._id === id)?.name || '-';

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Transactions</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Log and track your financial flow.</p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
                    <button className="btn btn-secondary" onClick={() => setShowCategoryModal(true)}>
                        Manage Categories
                    </button>
                    <button className="btn btn-secondary" onClick={() => setShowSplitModal(true)}>
                        <SplitSquareHorizontal size={18} /> Split Expense
                    </button>
                    <button className="btn btn-primary" onClick={openAddModal}>
                        <Plus size={18} /> Add Transaction
                    </button>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '0' }}>
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Description</th>
                                <th>Category</th>
                                <th>Account</th>
                                <th style={{ textAlign: 'right' }}>Amount</th>
                                <th style={{ width: '80px', textAlign: 'right' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map(tx => (
                                <tr key={tx._id}>
                                    <td>{new Date(tx.date).toLocaleDateString()}</td>
                                    <td style={{ fontWeight: '500' }}>
                                        {tx.description}
                                        {tx.type === 'transfer' && <span className="badge badge-info" style={{ marginLeft: 'var(--spacing-sm)', fontSize: '0.65rem' }}>Transfer</span>}
                                    </td>
                                    <td>{tx.type === 'transfer' ? '-' : getCategoryName(tx.category_id)}</td>
                                    <td>
                                        {tx.type === 'transfer' ? (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                {getAccountName(tx.account_id)} <ArrowRight size={14} /> {getAccountName(tx.to_account_id)}
                                            </span>
                                        ) : getAccountName(tx.account_id)}
                                    </td>
                                    <td style={{
                                        textAlign: 'right', fontWeight: '600',
                                        color: tx.type === 'income' ? 'var(--status-success)' :
                                            tx.type === 'expense' ? 'var(--status-danger)' : 'var(--text-primary)'
                                    }}>
                                        {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                                        Rs {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button className="btn-icon" onClick={() => openEditModal(tx)} title="Edit" style={{ color: 'var(--text-tertiary)', marginRight: '8px' }}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-edit"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                        </button>
                                        <button className="btn-icon" onClick={() => handleDelete(tx._id)} title="Delete" style={{ color: 'var(--text-tertiary)' }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {transactions.length === 0 && (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--text-tertiary)' }}>No transactions found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- Add Transaction Modal --- */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="glass-panel modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">{editingTxId ? 'Edit Transaction' : 'New Transaction'}</h2>
                            <button className="btn-icon" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
                                <button type="button" className={`btn ${newTx.type === 'expense' ? 'btn-danger' : 'btn-secondary'}`} style={{ flex: 1 }} onClick={() => setNewTx({ ...newTx, type: 'expense' })}>Expense</button>
                                <button type="button" className={`btn ${newTx.type === 'income' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1, background: newTx.type === 'income' ? 'var(--status-success)' : '' }} onClick={() => setNewTx({ ...newTx, type: 'income' })}>Income</button>
                                <button type="button" className={`btn ${newTx.type === 'transfer' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1, background: newTx.type === 'transfer' ? 'var(--status-info)' : '' }} onClick={() => setNewTx({ ...newTx, type: 'transfer' })}>Transfer</button>
                            </div>

                            <div className="grid-2">
                                <div className="form-group">
                                    <label className="form-label">Amount (Rs)</label>
                                    <input type="number" step="0.01" className="form-control" required
                                        value={newTx.amount} onChange={e => setNewTx({ ...newTx, amount: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Date</label>
                                    <input type="date" className="form-control" required
                                        value={newTx.date} onChange={e => setNewTx({ ...newTx, date: e.target.value })} />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <input type="text" className="form-control" required placeholder="What was this for?"
                                    value={newTx.description} onChange={e => setNewTx({ ...newTx, description: e.target.value })} />
                            </div>

                            {newTx.type !== 'transfer' && (
                                <div className="form-group">
                                    <label className="form-label">Category</label>
                                    <select className="form-control" value={newTx.category_id} onChange={e => setNewTx({ ...newTx, category_id: e.target.value })}>
                                        <option value="">Select Category...</option>
                                        {categories.filter(c => c.type === newTx.type).map(cat => (
                                            <option key={cat._id} value={cat._id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label">{newTx.type === 'transfer' ? 'From Account' : 'Account'}</label>
                                <select className="form-control" required value={newTx.account_id} onChange={e => setNewTx({ ...newTx, account_id: e.target.value })}>
                                    <option value="">Select Account...</option>
                                    {accounts.map(acc => (
                                        <option key={acc._id} value={acc._id}>{acc.name} (Rs {acc.balance})</option>
                                    ))}
                                </select>
                            </div>

                            {newTx.type === 'transfer' && (
                                <div className="form-group">
                                    <label className="form-label">To Account</label>
                                    <select className="form-control" required value={newTx.to_account_id} onChange={e => setNewTx({ ...newTx, to_account_id: e.target.value })}>
                                        <option value="">Select Account...</option>
                                        {accounts.map(acc => (
                                            <option key={acc._id} value={acc._id}>{acc.name} (Rs {acc.balance})</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{editingTxId ? 'Update Transaction' : 'Save Transaction'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- Split Bill Modal --- */}
            {showSplitModal && (
                <div className="modal-overlay" onClick={() => setShowSplitModal(false)}>
                    <div className="glass-panel modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Split an Expense</h2>
                            <button className="btn-icon" onClick={() => setShowSplitModal(false)}>&times;</button>
                        </div>

                        <div style={{ padding: 'var(--spacing-md)', background: 'var(--glass-bg)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--spacing-md)' }}>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>How it works:</p>
                            <p style={{ fontSize: '0.875rem' }}>We'll create an expense for the <strong>Total Cost</strong>, then generate IOUs for your friends based on an even split (including your share).</p>
                        </div>

                        <form onSubmit={handleSplitSubmit}>
                            <div className="grid-2">
                                <div className="form-group">
                                    <label className="form-label">Total Cost (Rs)</label>
                                    <input type="number" step="0.01" className="form-control" required
                                        value={splitData.total_amount} onChange={e => setSplitData({ ...splitData, total_amount: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Date</label>
                                    <input type="date" className="form-control" required
                                        value={splitData.date} onChange={e => setSplitData({ ...splitData, date: e.target.value })} />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Description (What was this for?)</label>
                                <input type="text" className="form-control" required placeholder="e.g. Dinner at Olive Garden"
                                    value={splitData.description} onChange={e => setSplitData({ ...splitData, description: e.target.value })} />
                            </div>

                            <div className="grid-2">
                                <div className="form-group">
                                    <label className="form-label">Category</label>
                                    <select className="form-control" value={splitData.category_id} onChange={e => setSplitData({ ...splitData, category_id: e.target.value })}>
                                        <option value="">Select Category...</option>
                                        {categories.filter(c => c.type === 'expense').map(cat => (
                                            <option key={cat._id} value={cat._id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Paid From Account</label>
                                    <select className="form-control" required value={splitData.account_id} onChange={e => setSplitData({ ...splitData, account_id: e.target.value })}>
                                        <option value="">Select Account...</option>
                                        {accounts.map(acc => (
                                            <option key={acc._id} value={acc._id}>{acc.name} (Rs {acc.balance})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div style={{ marginTop: 'var(--spacing-lg)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-sm)' }}>
                                    <label className="form-label" style={{ margin: 0 }}>Split with Friends</label>
                                    <button type="button" className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={handleAddFriend}>
                                        + Add Friend
                                    </button>
                                </div>

                                {splitData.friends.map((friend, index) => (
                                    <div key={index} style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-xs)' }}>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder={`Friend ${index + 1} Name`}
                                            required
                                            value={friend}
                                            onChange={(e) => handleFriendChange(index, e.target.value)}
                                        />
                                        {splitData.friends.length > 1 && (
                                            <button type="button" className="btn-icon" style={{ color: 'var(--status-danger)', background: 'rgba(239, 68, 68, 0.1)' }} onClick={() => handleRemoveFriend(index)}>
                                                <UserMinus size={18} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {splitData.total_amount && splitData.friends[0] !== '' && (
                                <div style={{ marginTop: 'var(--spacing-md)', padding: 'var(--spacing-sm)', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--status-success)', borderRadius: 'var(--radius-md)', textAlign: 'center', fontWeight: '500' }}>
                                    You plus {splitData.friends.filter(f => f.trim() !== '').length} friend(s) will pay ~Rs
                                    {(parseFloat(splitData.total_amount) / (splitData.friends.filter(f => f.trim() !== '').length + 1)).toFixed(2)} each.
                                </div>
                            )}

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowSplitModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ background: 'var(--brand-gradient)' }}>Split Bill & Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- Manage Categories Modal --- */}
            {showCategoryModal && (
                <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
                    <div className="glass-panel modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Manage Categories</h2>
                            <button className="btn-icon" onClick={() => setShowCategoryModal(false)}>&times;</button>
                        </div>

                        <form onSubmit={handleCreateCategory} style={{ marginBottom: 'var(--spacing-lg)' }}>
                            <div className="grid-2" style={{ alignItems: 'end' }}>
                                <div className="form-group">
                                    <label className="form-label">Category Name</label>
                                    <input type="text" className="form-control" required placeholder="e.g. Groceries"
                                        value={newCategory.name} onChange={e => setNewCategory({ ...newCategory, name: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Type</label>
                                    <select className="form-control" value={newCategory.type} onChange={e => setNewCategory({ ...newCategory, type: e.target.value })}>
                                        <option value="expense">Expense</option>
                                        <option value="income">Income</option>
                                    </select>
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Add Category</button>
                        </form>

                        <div>
                            <h3 style={{ fontSize: '1rem', marginBottom: 'var(--spacing-sm)' }}>Existing Categories</h3>
                            <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                                {categories.length === 0 ? (
                                    <div style={{ padding: 'var(--spacing-sm)', textAlign: 'center', color: 'var(--text-tertiary)' }}>No categories found</div>
                                ) : (
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                        {categories.map(cat => (
                                            <li key={cat._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--border-color)' }}>
                                                <div>
                                                    <span style={{ fontWeight: '500' }}>{cat.name}</span>
                                                    <span className={`badge badge-${cat.type === 'income' ? 'success' : 'danger'}`} style={{ marginLeft: 'var(--spacing-sm)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem' }}>
                                                        {cat.type}
                                                    </span>
                                                </div>
                                                <button className="btn-icon" onClick={() => handleDeleteCategory(cat._id)} title="Delete Category" style={{ color: 'var(--status-danger)' }}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                        <div className="modal-actions" style={{ marginTop: 'var(--spacing-md)' }}>
                            <button type="button" className="btn btn-secondary" onClick={() => setShowCategoryModal(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Transactions;
