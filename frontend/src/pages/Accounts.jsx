import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAccounts, createAccount, deleteAccount } from '../api/client';
import { Plus, Wallet, Building2, CreditCard, Trash2, ChevronRight } from 'lucide-react';

const Accounts = () => {
    const navigate = useNavigate();
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newAccount, setNewAccount] = useState({ name: '', type: 'bank', balance: 0 });

    const fetchAccounts = async () => {
        try {
            const res = await getAccounts();
            setAccounts(res.data);
        } catch (error) {
            console.error("Failed to fetch accounts", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await createAccount(newAccount);
            setShowModal(false);
            setNewAccount({ name: '', type: 'bank', balance: 0 });
            fetchAccounts();
        } catch (error) {
            console.error("Failed to create account", error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this account? Transactions linked to it may be affected.")) {
            try {
                await deleteAccount(id);
                fetchAccounts();
            } catch (error) {
                console.error("Failed to delete account", error);
            }
        }
    };

    const getIconForType = (type) => {
        switch (type) {
            case 'bank': return <Building2 size={24} style={{ color: 'var(--brand-primary)' }} />;
            case 'cash': return <CreditCard size={24} style={{ color: 'var(--status-success)' }} />;
            case 'wallet': return <Wallet size={24} style={{ color: 'var(--status-warning)' }} />;
            case 'custom': return <Wallet size={24} style={{ color: 'var(--status-warning)' }} />;
            default: return <Wallet size={24} style={{ color: 'var(--status-warning)' }} />;
        }
    }

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Financial Accounts</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Manage your bank accounts, wallets, and cash.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={18} /> Add Account
                </button>
            </div>

            <div className="grid-3">
                {accounts.map(account => (
                    <div key={account._id} className="glass-panel interactive" onClick={() => navigate(`/accounts/${account._id}`)} style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
                                <div style={{ padding: '0.75rem', background: 'var(--glass-bg)', borderRadius: 'var(--radius-md)' }}>
                                    {getIconForType(account.type)}
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{account.name}</h3>
                                    <p style={{ margin: 0, color: 'var(--text-secondary)', textTransform: 'capitalize', fontSize: '0.875rem' }}>{account.type}</p>
                                </div>
                            </div>
                            <ChevronRight size={20} style={{ color: 'var(--text-tertiary)' }} />
                        </div>

                        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--glass-border)', paddingTop: 'var(--spacing-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Current Balance</div>
                                <div style={{ fontSize: '1.75rem', fontWeight: '700', color: account.balance >= 0 ? 'var(--text-primary)' : 'var(--status-danger)' }}>
                                    Rs {Number(account.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                            </div>
                            <button className="btn-icon" onClick={(e) => { e.stopPropagation(); handleDelete(account._id); }} title="Delete Account" style={{ padding: '0.25rem' }}>
                                <Trash2 size={18} style={{ color: 'var(--text-tertiary)' }} />
                            </button>
                        </div>
                    </div>
                ))}
                {accounts.length === 0 && (
                    <div className="glass-panel" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 'var(--spacing-xl)' }}>
                        <Wallet size={48} style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--spacing-md)' }} />
                        <h3>No accounts found</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }}>Start tracking your money by adding an account.</p>
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}>Add your first account</button>
                    </div>
                )}
            </div>

            {/* --- Add Account Modal --- */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="glass-panel modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Add New Account</h2>
                            <button className="btn-icon" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="form-group">
                                <label className="form-label">Account Name</label>
                                <input type="text" className="form-control" required placeholder="e.g. Chase Sapphire"
                                    value={newAccount.name} onChange={e => setNewAccount({ ...newAccount, name: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Account Type</label>
                                <select className="form-control" value={newAccount.type} onChange={e => setNewAccount({ ...newAccount, type: e.target.value })}>
                                    <option value="bank">Bank Account</option>
                                    <option value="cash">Physical Cash</option>
                                    <option value="wallet">Digital Wallet</option>
                                    <option value="custom">Custom</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Starting Balance (Rs)</label>
                                <input type="number" step="0.01" className="form-control" required
                                    value={newAccount.balance} onChange={e => setNewAccount({ ...newAccount, balance: parseFloat(e.target.value) })} />
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Create Account</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Accounts;
