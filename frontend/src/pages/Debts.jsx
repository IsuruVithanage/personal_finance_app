import React, { useState, useEffect, useMemo } from 'react';
import { getDebts, createDebt, payDebt, deleteDebt, getAccounts } from '../api/client';
import { UserSquare2, CheckCircle2, CircleDollarSign, Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react';

const Debts = () => {
    const [debts, setDebts] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showAddModal, setShowAddModal] = useState(false);
    const [showPayModal, setShowPayModal] = useState(null); // stores the debt object being paid
    const [expandedFriend, setExpandedFriend] = useState(null);

    const [newDebt, setNewDebt] = useState({ friend_name: '', amount_owed: '', description: '', date_incurred: new Date().toISOString().split('T')[0] });
    const [payment, setPayment] = useState({ amount: '', account_id: '', date: new Date().toISOString().split('T')[0] });

    const fetchData = async () => {
        try {
            const [debtRes, accRes] = await Promise.all([getDebts(), getAccounts()]);
            setDebts(debtRes.data);
            setAccounts(accRes.data);
            if (accRes.data.length > 0) {
                setPayment(prev => ({ ...prev, account_id: accRes.data[0]._id }));
            }
        } catch (error) {
            console.error("Failed to fetch debts", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateDebt = async (e) => {
        e.preventDefault();
        try {
            await createDebt({
                ...newDebt,
                amount_owed: parseFloat(newDebt.amount_owed),
                date_incurred: new Date(newDebt.date_incurred).toISOString()
            });
            setShowAddModal(false);
            setNewDebt({ friend_name: '', amount_owed: '', description: '', date_incurred: new Date().toISOString().split('T')[0] });
            fetchData();
        } catch (error) {
            console.error("Failed to create debt", error);
        }
    };

    const handlePayDebt = async (e) => {
        e.preventDefault();
        try {
            await payDebt(showPayModal._id, {
                amount: parseFloat(payment.amount),
                account_id: payment.account_id,
                date: new Date(payment.date).toISOString()
            });
            setShowPayModal(null);
            setPayment({ amount: '', account_id: accounts[0]?._id || '', date: new Date().toISOString().split('T')[0] });
            fetchData();
        } catch (error) {
            console.error("Failed to register payment", error);
            alert(error.response?.data?.detail || "Failed to process payment");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this debt record? This won't affect transactions already logged as payments.")) {
            try {
                await deleteDebt(id);
                fetchData();
            } catch (error) {
                console.error("Failed to delete", error);
            }
        }
    }

    // --- Grouping Logic ---
    const groupedDebts = useMemo(() => {
        const groups = {};
        debts.forEach(debt => {
            const name = debt.friend_name;
            if (!groups[name]) {
                groups[name] = {
                    friend_name: name,
                    total_owed: 0,
                    total_paid: 0,
                    debts: []
                };
            }
            groups[name].total_owed += debt.amount_owed;
            groups[name].total_paid += debt.amount_paid;
            groups[name].debts.push(debt);
        });
        // Convert to array and sort alphabetically
        return Object.values(groups).sort((a, b) => a.friend_name.localeCompare(b.friend_name));
    }, [debts]);

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Debt Tracking</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Track money you lent to friends.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                    <Plus size={18} /> Add Debt
                </button>
            </div>

            <div className="grid-3" style={{ alignItems: 'start' }}>
                {groupedDebts.map(group => {
                    const netRemaining = group.total_owed - group.total_paid;
                    const isFullyPaid = Math.abs(netRemaining) < 0.01;
                    const progress = group.total_owed !== 0 ? (group.total_paid / group.total_owed) * 100 : 0;
                    const isExpanded = expandedFriend === group.friend_name;

                    return (
                        <div key={group.friend_name} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                            {/* Friend Summary Card */}
                            <div
                                className="glass-panel interactive"
                                style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', cursor: 'pointer', border: isExpanded ? '1px solid var(--brand-primary)' : '' }}
                                onClick={() => setExpandedFriend(isExpanded ? null : group.friend_name)}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
                                        <div style={{ padding: '0.75rem', background: 'var(--glass-bg)', borderRadius: 'var(--radius-md)' }}>
                                            <UserSquare2 size={24} style={{ color: 'var(--brand-secondary)' }} />
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '1.25rem', marginBottom: '2px' }}>{group.friend_name}</h3>
                                            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                                {group.debts.length} debt record(s)
                                            </span>
                                        </div>
                                    </div>
                                    {isExpanded ? <ChevronUp size={20} style={{ color: 'var(--text-tertiary)' }} /> : <ChevronDown size={20} style={{ color: 'var(--text-tertiary)' }} />}
                                </div>

                                <div style={{ background: 'rgba(0,0,0,0.2)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-xs)' }}>
                                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{group.total_owed >= 0 ? 'Lent' : 'Borrowed'}: Rs {Math.abs(group.total_owed).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        <span style={{ color: 'var(--status-success)', fontSize: '0.875rem', fontWeight: 'bold' }}>{group.total_paid === 0 ? 'Paid: Rs 0.00' : `Paid: Rs ${Math.abs(group.total_paid).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}</span>
                                    </div>
                                    <div style={{ width: '100%', height: '6px', background: 'var(--glass-border)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', background: isFullyPaid ? 'var(--status-success)' : 'var(--brand-primary)', width: `${Math.min(100, progress)}%`, transition: 'width 0.3s ease' }}></div>
                                    </div>
                                </div>

                                {isFullyPaid && (
                                    <div style={{ color: 'var(--status-success)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', fontWeight: 'bold', justifyContent: 'center' }}>
                                        <CheckCircle2 size={16} /> All settled up!
                                    </div>
                                )}
                                {!isFullyPaid && (
                                    <div style={{ padding: 'var(--spacing-md)', background: 'var(--glass-bg)', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>{netRemaining > 0 ? 'They owe you:' : 'You owe them:'}</span>
                                        <span style={{ fontWeight: 'bold' }}>Rs {Math.abs(netRemaining).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>
                                )}
                            </div>

                            {/* Individual Debt Records (Expanded View) */}
                            {isExpanded && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', paddingLeft: 'var(--spacing-md)', borderLeft: '2px solid var(--glass-border)' }}>
                                    {group.debts.map(debt => (
                                        <div key={debt._id} className="glass-panel" style={{ padding: 'var(--spacing-md)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div>
                                                    <p style={{ fontWeight: '500', fontSize: '1rem', marginBottom: '2px' }}>{debt.description || 'Unspecified debt'}</p>
                                                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>{new Date(debt.date_incurred).toLocaleDateString()}</p>
                                                </div>
                                                <span className={`badge badge-${debt.status === 'paid' ? 'success' : debt.status === 'partial' ? 'warning' : 'danger'}`}>
                                                    {debt.status === 'paid' ? 'Paid' : debt.status === 'partial' ? 'Part. Paid' : 'Unpaid'}
                                                </span>
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--spacing-xs)', borderTop: '1px solid var(--glass-border)', paddingTop: 'var(--spacing-sm)' }}>
                                                <div style={{ fontWeight: '600', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                                    <span style={{ color: 'var(--text-secondary)' }}>Rs {Math.abs(debt.amount_paid).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                    <span style={{ color: 'var(--text-tertiary)' }}> / Rs {Math.abs(debt.amount_owed).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                </div>

                                                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                                    {debt.status !== 'paid' && (
                                                        <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setPayment({ ...payment, amount: Math.abs(debt.amount_owed - debt.amount_paid) });
                                                                setShowPayModal(debt);
                                                            }}>
                                                            <CircleDollarSign size={14} style={{ marginRight: '4px' }} /> Pay
                                                        </button>
                                                    )}
                                                    <button className="btn-icon" onClick={(e) => { e.stopPropagation(); handleDelete(debt._id); }} title="Delete record" style={{ color: 'var(--text-tertiary)', padding: '0.25rem' }}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
                {groupedDebts.length === 0 && (
                    <div className="glass-panel" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 'var(--spacing-xl)' }}>
                        <CheckCircle2 size={48} style={{ color: 'var(--status-success)', marginBottom: 'var(--spacing-md)' }} />
                        <h3>All clear!</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>Nobody owes you money right now.</p>
                    </div>
                )}
            </div>

            {/* --- Add Debt Modal --- */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="glass-panel modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">New Debt</h2>
                            <button className="btn-icon" onClick={() => setShowAddModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleCreateDebt}>
                            <div className="form-group">
                                <label className="form-label">Friend's Name</label>
                                <input type="text" className="form-control" required placeholder="e.g. John Doe"
                                    value={newDebt.friend_name} onChange={e => setNewDebt({ ...newDebt, friend_name: e.target.value })} />
                            </div>
                            <div className="grid-2">
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">Amount Lent (Rs)</label>
                                    <input type="number" step="0.01" className="form-control" required
                                        value={newDebt.amount_owed} onChange={e => setNewDebt({ ...newDebt, amount_owed: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Date Lent</label>
                                    <input type="date" className="form-control" required
                                        value={newDebt.date_incurred} onChange={e => setNewDebt({ ...newDebt, date_incurred: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description / Reason</label>
                                <input type="text" className="form-control" placeholder="e.g. Cinema tickets"
                                    value={newDebt.description} onChange={e => setNewDebt({ ...newDebt, description: e.target.value })} />
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Debt</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- Record Payment Modal --- */}
            {showPayModal && (
                <div className="modal-overlay" onClick={() => setShowPayModal(null)}>
                    <div className="glass-panel modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">{showPayModal.amount_owed < 0 ? 'Pay' : 'Receive from'} {showPayModal.friend_name}</h2>
                            <button className="btn-icon" onClick={() => setShowPayModal(null)}>&times;</button>
                        </div>
                        <div style={{ padding: 'var(--spacing-sm)', background: 'var(--glass-bg)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--spacing-lg)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            Remaining balance: Rs {Math.abs(showPayModal.amount_owed - showPayModal.amount_paid).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>

                        <form onSubmit={handlePayDebt}>
                            <div className="grid-2">
                                <div className="form-group">
                                    <label className="form-label">Payment Amount (Rs)</label>
                                    <input type="number" step="0.01" max={Math.abs(showPayModal.amount_owed - showPayModal.amount_paid)} className="form-control" required
                                        value={payment.amount} onChange={e => setPayment({ ...payment, amount: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Date Received</label>
                                    <input type="date" className="form-control" required
                                        value={payment.date} onChange={e => setPayment({ ...payment, date: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">{showPayModal.amount_owed < 0 ? 'Withdraw From Account' : 'Deposit To Account'}</label>
                                <select className="form-control" required value={payment.account_id} onChange={e => setPayment({ ...payment, account_id: e.target.value })}>
                                    <option value="">Select Account...</option>
                                    {accounts.map(acc => (
                                        <option key={acc._id} value={acc._id}>{acc.name} (Rs {acc.balance.toLocaleString()})</option>
                                    ))}
                                </select>
                                <small style={{ color: 'var(--text-tertiary)', marginTop: '4px', display: 'block' }}>
                                    This will automatically create {showPayModal.amount_owed < 0 ? 'an expense' : 'an income'} transaction.
                                </small>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowPayModal(null)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ background: 'var(--status-success)' }}>Confirm Payment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Debts;
