import React, { useState, useEffect, useMemo } from 'react';
import { getAccounts } from '../api/client';
// Note: Ensure you export createDebt, deleteDebt, and add a settleDebt endpoint in your api/client.js
import { getDebts, createDebt, settleDebt, deleteDebt } from '../api/client';
import { UserSquare2, CheckCircle2, CircleDollarSign, Trash2, Plus, ChevronDown, ChevronUp, ArrowRightLeft } from 'lucide-react';

const Debts = () => {
    const [debts, setDebts] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showAddModal, setShowAddModal] = useState(false);
    const [showSettleModal, setShowSettleModal] = useState(null);
    const [expandedFriend, setExpandedFriend] = useState(null);

    const [newDebt, setNewDebt] = useState({ friend_name: '', amount: '', description: '', date: new Date().toISOString().split('T')[0], type: 'borrowed' });
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
            // Negative amount if you borrowed, positive if you lent
            const amountToLog = newDebt.type === 'borrowed' ? -Math.abs(parseFloat(newDebt.amount)) : Math.abs(parseFloat(newDebt.amount));
            await createDebt({
                friend_name: newDebt.friend_name,
                amount: amountToLog,
                description: newDebt.description,
                date: new Date(newDebt.date).toISOString()
            });
            setShowAddModal(false);
            setNewDebt({ friend_name: '', amount: '', description: '', date: new Date().toISOString().split('T')[0], type: 'borrowed' });
            fetchData();
        } catch (error) {
            console.error("Failed to create debt", error);
        }
    };

    const handleSettle = async (e) => {
        e.preventDefault();
        try {
            const netBalance = showSettleModal.net_balance;
            await settleDebt({
                friend_name: showSettleModal.friend_name,
                amount: parseFloat(payment.amount),
                is_receiving: netBalance > 0, // If balance > 0, friend owes you, so you receive money
                account_id: payment.account_id,
                date: new Date(payment.date).toISOString()
            });
            setShowSettleModal(null);
            fetchData();
        } catch (error) {
            console.error("Failed to process settlement", error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Delete this ledger record?")) {
            await deleteDebt(id);
            fetchData();
        }
    };

    // Calculate Running Ledger
    const groupedDebts = useMemo(() => {
        const groups = {};
        debts.forEach(debt => {
            const name = debt.friend_name;
            if (!groups[name]) {
                groups[name] = { friend_name: name, net_balance: 0, history: [] };
            }
            groups[name].net_balance += debt.amount;
            groups[name].history.push(debt);
        });
        return Object.values(groups).sort((a, b) => a.friend_name.localeCompare(b.friend_name));
    }, [debts]);

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Friend Ledgers</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Track running balances with friends.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                    <Plus size={18} /> Add Ledger Entry
                </button>
            </div>

            <div className="grid-3" style={{ alignItems: 'start' }}>
                {groupedDebts.map(group => {
                    const isSettled = Math.abs(group.net_balance) < 0.01;
                    const isExpanded = expandedFriend === group.friend_name;

                    return (
                        <div key={group.friend_name} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                            <div className="glass-panel interactive" onClick={() => setExpandedFriend(isExpanded ? null : group.friend_name)} style={{ border: isExpanded ? '1px solid var(--brand-primary)' : '' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                                    <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
                                        <UserSquare2 size={24} style={{ color: 'var(--brand-secondary)' }} />
                                        <h3 style={{ fontSize: '1.25rem' }}>{group.friend_name}</h3>
                                    </div>
                                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </div>

                                <div style={{ background: 'rgba(0,0,0,0.2)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                                    {isSettled ? (
                                        <span style={{ color: 'var(--status-success)', fontWeight: 'bold' }}><CheckCircle2 size={16} /> All settled up!</span>
                                    ) : (
                                        <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: group.net_balance > 0 ? 'var(--status-success)' : 'var(--status-danger)' }}>
                                            {group.net_balance > 0 ? 'They owe you' : 'You owe them'}: Rs {Math.abs(group.net_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                    )}
                                </div>

                                {!isSettled && (
                                    <button className="btn btn-secondary" style={{ width: '100%', marginTop: 'var(--spacing-sm)' }} onClick={(e) => { e.stopPropagation(); setPayment({ ...payment, amount: Math.abs(group.net_balance) }); setShowSettleModal(group); }}>
                                        <CircleDollarSign size={16} /> Settle Up
                                    </button>
                                )}
                            </div>

                            {/* Ledger History */}
                            {isExpanded && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', paddingLeft: 'var(--spacing-md)', borderLeft: '2px solid var(--glass-border)' }}>
                                    {group.history.map(record => (
                                        <div key={record._id} className="glass-panel" style={{ padding: 'var(--spacing-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <p style={{ fontWeight: '500', fontSize: '0.9rem' }}>{record.description}</p>
                                                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>{new Date(record.date).toLocaleDateString()} • {record.type}</p>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                                <span style={{ fontWeight: '600', color: record.amount > 0 ? 'var(--status-success)' : 'var(--status-danger)' }}>
                                                    {record.amount > 0 ? '+' : '-'} Rs {Math.abs(record.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </span>
                                                <button className="btn-icon" onClick={(e) => { e.stopPropagation(); handleDelete(record._id); }}><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Modals for Add Entry & Settle Up */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="glass-panel modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Add Ledger Entry</h2>
                            <button className="btn-icon" onClick={() => setShowAddModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleCreateDebt}>
                            <div className="form-group" style={{ marginBottom: 'var(--spacing-md)' }}>
                                <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                        <input
                                            type="radio"
                                            name="debtType"
                                            value="borrowed"
                                            checked={newDebt.type === 'borrowed'}
                                            onChange={(e) => setNewDebt({ ...newDebt, type: e.target.value })}
                                        />
                                        I borrowed from friend
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                        <input
                                            type="radio"
                                            name="debtType"
                                            value="lent"
                                            checked={newDebt.type === 'lent'}
                                            onChange={(e) => setNewDebt({ ...newDebt, type: e.target.value })}
                                        />
                                        I lent to friend
                                    </label>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Friend's Name</label>
                                <input type="text" className="form-control" required placeholder="e.g. John Doe"
                                    value={newDebt.friend_name} onChange={e => setNewDebt({ ...newDebt, friend_name: e.target.value })} />
                            </div>
                            <div className="grid-2">
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">Amount (Rs)</label>
                                    <input type="number" step="0.01" className="form-control" required
                                        value={newDebt.amount} onChange={e => setNewDebt({ ...newDebt, amount: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Date</label>
                                    <input type="date" className="form-control" required
                                        value={newDebt.date} onChange={e => setNewDebt({ ...newDebt, date: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description / Reason</label>
                                <input type="text" className="form-control" placeholder="e.g. Cinema tickets"
                                    value={newDebt.description} onChange={e => setNewDebt({ ...newDebt, description: e.target.value })} />
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Entry</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showSettleModal && (
                <div className="modal-overlay" onClick={() => setShowSettleModal(null)}>
                    <div className="glass-panel modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Settle Balance with {showSettleModal.friend_name}</h2>
                            <button className="btn-icon" onClick={() => setShowSettleModal(null)}>&times;</button>
                        </div>
                        <form onSubmit={handleSettle}>
                            <div className="form-group">
                                <label className="form-label">Settle Amount (Rs)</label>
                                <input type="number" step="0.01" className="form-control" required value={payment.amount} onChange={e => setPayment({ ...payment, amount: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{showSettleModal.net_balance > 0 ? 'Deposit to Account (You are receiving)' : 'Pay from Account (You are paying)'}</label>
                                <select className="form-control" required value={payment.account_id} onChange={e => setPayment({ ...payment, account_id: e.target.value })}>
                                    {accounts.map(acc => <option key={acc._id} value={acc._id}>{acc.name}</option>)}
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button type="submit" className="btn btn-primary">Confirm Settlement</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


        </div>
    );
};

export default Debts;