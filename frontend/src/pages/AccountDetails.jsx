import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAccount, getTransactions, updateTransaction, deleteTransaction, getCategories, getAccounts } from '../api/client';
import { ArrowLeft, Wallet, Building2, CreditCard, ArrowRight, Trash2 } from 'lucide-react';

const AccountDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [account, setAccount] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [allAccounts, setAllAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ income: 0, expense: 0 });

    const [showModal, setShowModal] = useState(false);
    const [editingTxId, setEditingTxId] = useState(null);
    const [newTx, setNewTx] = useState({
        amount: '', type: 'expense', date: new Date().toISOString().split('T')[0],
        description: '', account_id: '', category_id: '', to_account_id: ''
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [accRes, txRes, catRes, allAccRes] = await Promise.all([
                getAccount(id),
                getTransactions(id),
                getCategories(),
                getAccounts()
            ]);
            setAccount(accRes.data);
            setTransactions(txRes.data);
            setCategories(catRes.data);
            setAllAccounts(allAccRes.data);

            // Calculate specific stats for this account from transactions
            let totalIn = 0;
            let totalOut = 0;

            txRes.data.forEach(tx => {
                if (tx.type === 'income' && tx.account_id === id) {
                    totalIn += tx.amount;
                } else if (tx.type === 'expense' && tx.account_id === id) {
                    totalOut += tx.amount;
                } else if (tx.type === 'transfer') {
                    if (tx.account_id === id) { // Money left this account
                        totalOut += tx.amount;
                    } else if (tx.to_account_id === id) { // Money entered this account
                        totalIn += tx.amount;
                    }
                }
            });
            setStats({ income: totalIn, expense: totalOut });

        } catch (error) {
            console.error("Failed to fetch account details", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const getIcon = (type) => {
        switch (type) {
            case 'bank': return <Building2 size={24} style={{ color: 'var(--brand-primary)' }} />;
            case 'cash': return <Wallet size={24} style={{ color: 'var(--status-success)' }} />;
            default: return <CreditCard size={24} style={{ color: 'var(--brand-secondary)' }} />;
        }
    };

    const formatCurrency = (amount) => {
        return `Rs ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...newTx,
                amount: parseFloat(newTx.amount),
                date: new Date(newTx.date).toISOString()
            };

            if (payload.type !== 'transfer') delete payload.to_account_id;
            if (payload.type === 'transfer') delete payload.category_id;
            if (!payload.category_id) delete payload.category_id;

            if (editingTxId) {
                await updateTransaction(editingTxId, payload);
            }

            setShowModal(false);
            setEditingTxId(null);
            fetchData(); // Refresh account details and transactions
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

    const handleDelete = async (txId) => {
        if (window.confirm("Delete this transaction? This will revert the account balances by the transaction amount.")) {
            try {
                await deleteTransaction(txId);
                fetchData();
            } catch (error) {
                console.error("Failed to delete transaction", error);
            }
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!account) return <div>Account not found</div>;

    return (
        <div>
            <div className="page-header" style={{ marginBottom: 'var(--spacing-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                    <button className="btn-icon" onClick={() => navigate('/accounts')} style={{ background: 'var(--glass-bg)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                            {getIcon(account.type)} {account.name}
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{account.type} Account</p>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Current Balance</p>
                    <h2 style={{ fontSize: '2rem', margin: 0 }}>{formatCurrency(account.balance)}</h2>
                </div>
            </div>

            <div className="grid-2" style={{ marginBottom: 'var(--spacing-xl)' }}>
                <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Inflow</p>
                    <h3 style={{ fontSize: '1.5rem', color: 'var(--status-success)', margin: 0 }}>+{formatCurrency(stats.income)}</h3>
                </div>
                <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Outflow</p>
                    <h3 style={{ fontSize: '1.5rem', color: 'var(--status-danger)', margin: 0 }}>-{formatCurrency(stats.expense)}</h3>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: 0 }}>
                <div style={{ padding: 'var(--spacing-md)', borderBottom: '1px solid var(--glass-border)' }}>
                    <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Transaction History</h3>
                </div>

                {transactions.length === 0 ? (
                    <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                        No transactions found for this account.
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Description</th>
                                    <th>Type</th>
                                    <th style={{ textAlign: 'right' }}>Amount</th>
                                    <th style={{ width: '80px', textAlign: 'right' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map(tx => {
                                    // Determine how this transaction affects THIS account
                                    let displayStyle = {};
                                    let amountPrefix = "";
                                    let typeLabel = tx.type;

                                    if (tx.type === 'income') {
                                        displayStyle = { color: 'var(--status-success)' };
                                        amountPrefix = "+";
                                    } else if (tx.type === 'expense') {
                                        displayStyle = { color: 'var(--text-primary)' };
                                        amountPrefix = "-";
                                    } else if (tx.type === 'transfer') {
                                        if (tx.account_id === account._id) {
                                            // Transfer OUT of this account
                                            displayStyle = { color: 'var(--text-primary)' };
                                            amountPrefix = "-";
                                            typeLabel = "transfer out";
                                        } else {
                                            // Transfer INTO this account
                                            displayStyle = { color: 'var(--status-success)' };
                                            amountPrefix = "+";
                                            typeLabel = "transfer in";
                                        }
                                    }

                                    return (
                                        <tr key={tx._id}>
                                            <td>{new Date(tx.date).toLocaleDateString()}</td>
                                            <td>{tx.description}</td>
                                            <td>
                                                <span className={`badge badge-${tx.type === 'income' || typeLabel === 'transfer in' ? 'success' : tx.type === 'expense' || typeLabel === 'transfer out' ? 'danger' : 'warning'}`}>
                                                    {typeLabel}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right', fontWeight: '500', ...displayStyle }}>
                                                {amountPrefix}Rs {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* --- Edit Transaction Modal --- */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="glass-panel modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Edit Transaction</h2>
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
                                    {allAccounts.map(acc => (
                                        <option key={acc._id} value={acc._id}>{acc.name} (Rs {acc.balance})</option>
                                    ))}
                                </select>
                            </div>

                            {newTx.type === 'transfer' && (
                                <div className="form-group">
                                    <label className="form-label">To Account</label>
                                    <select className="form-control" required value={newTx.to_account_id} onChange={e => setNewTx({ ...newTx, to_account_id: e.target.value })}>
                                        <option value="">Select Account...</option>
                                        {allAccounts.map(acc => (
                                            <option key={acc._id} value={acc._id}>{acc.name} (Rs {acc.balance})</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Update Transaction</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccountDetails;
