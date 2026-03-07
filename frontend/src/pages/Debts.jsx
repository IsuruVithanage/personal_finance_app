import React, { useState, useEffect, useMemo } from 'react';
import { getAccounts, getTransactions, createTransaction, deleteTransaction } from '../api/client';
import { UserSquare2, CheckCircle2, CircleDollarSign, Trash2, Plus, ChevronDown, ChevronUp, Clock } from 'lucide-react';

const Debts = () => {
    const [transactions, setTransactions] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showAddModal, setShowAddModal] = useState(false);
    const [showSettleModal, setShowSettleModal] = useState(null);
    const [expandedFriend, setExpandedFriend] = useState(null);

    const [newDebt, setNewDebt] = useState({ friend_id: '', amount: '', description: '', date: new Date().toISOString().split('T')[0], type: 'borrowed' });
    const [payment, setPayment] = useState({ amount: '', my_account_id: '', date: new Date().toISOString().split('T')[0] });

    const fetchData = async () => {
        try {
            const [txRes, accRes] = await Promise.all([getTransactions(), getAccounts()]);
            setTransactions(txRes.data);
            setAccounts(accRes.data);
            const myAccs = accRes.data.filter(a => a.type !== 'friend');
            if (myAccs.length > 0) {
                setPayment(prev => ({ ...prev, my_account_id: myAccs[0]._id }));
            }
        } catch (error) {
            console.error("Failed to fetch ledger data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const myAccounts = accounts.filter(a => a.type !== 'friend');
    const friendAccounts = accounts.filter(a => a.type === 'friend');

    const handleCreateDebt = async (e) => {
        e.preventDefault();
        try {
            const amount = parseFloat(newDebt.amount);
            if (!newDebt.friend_id) return alert("Please select a friend account (Add one in Accounts tab if needed).");

            if (newDebt.type === 'lent') {
                // I lent money to friend -> Friend balance goes UP (+ amount).
                // Simplest representation: An "Expense" paid BY my default account, split exclusively to friend
                // To keep it simple, we can just do a Transfer from My Account -> Friend Account.
                const sourceAcc = myAccounts[0]?._id;
                if (!sourceAcc) return alert("You need a personal account to lend money from.");

                await createTransaction({
                    amount: amount,
                    type: 'transfer',
                    account_id: sourceAcc,
                    to_account_id: newDebt.friend_id,
                    date: new Date(newDebt.date).toISOString(),
                    description: newDebt.description || 'Lent money',
                });
            } else {
                // I borrowed from friend -> Friend balance goes DOWN (- amount).
                // Represents an expense for me, paid by my friend!
                await createTransaction({
                    amount: amount,
                    type: 'expense',
                    account_id: newDebt.friend_id,
                    date: new Date(newDebt.date).toISOString(),
                    description: newDebt.description || 'Borrowed money',
                });
            }

            setShowAddModal(false);
            setNewDebt({ friend_id: '', amount: '', description: '', date: new Date().toISOString().split('T')[0], type: 'borrowed' });
            fetchData();
        } catch (error) {
            console.error("Failed to log ledger entry", error);
            alert("Failed to log entry");
        }
    };

    const handleSettle = async (e) => {
        e.preventDefault();
        try {
            const netBalance = showSettleModal.net_balance;
            const amount = parseFloat(payment.amount);

            if (netBalance > 0) {
                // They owe me, so they are paying me back.
                // Transfer from Friend Account to My Account
                await createTransaction({
                    amount: amount,
                    type: 'transfer',
                    account_id: showSettleModal._id, // Source
                    to_account_id: payment.my_account_id, // Dest
                    date: new Date(payment.date).toISOString(),
                    description: `Settlement from ${showSettleModal.friend_name}`
                });
            } else {
                // I owe them, so I am paying them back.
                // Transfer from My Account to Friend Account
                await createTransaction({
                    amount: amount,
                    type: 'transfer',
                    account_id: payment.my_account_id, // Source
                    to_account_id: showSettleModal._id, // Dest
                    date: new Date(payment.date).toISOString(),
                    description: `Settled debt to ${showSettleModal.friend_name}`
                });
            }

            setShowSettleModal(null);
            fetchData();
        } catch (error) {
            console.error("Failed to process settlement", error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Delete this ledger record? Balances will be reverted.")) {
            await deleteTransaction(id);
            fetchData();
        }
    };

    // Build the friend ledgers using the raw Accounts state and associating transactions
    const friendLedgers = useMemo(() => {
        return friendAccounts.map(friendAcc => {
            // Find all transactions where this friend was the primary account OR destination account
            const history = transactions.filter(tx => tx.account_id === friendAcc._id || tx.to_account_id === friendAcc._id);

            return {
                _id: friendAcc._id,
                friend_name: friendAcc.name,
                net_balance: friendAcc.balance,
                history: history
            };
        }).sort((a, b) => a.friend_name.localeCompare(b.friend_name));
    }, [friendAccounts, transactions]);

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Friend Ledgers</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Track running balances and transaction history with friends.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                    <Plus size={18} /> Add Ledger Entry
                </button>
            </div>

            <div className="grid-3" style={{ alignItems: 'start' }}>
                {friendLedgers.map(group => {
                    const isSettled = Math.abs(group.net_balance) < 0.01;
                    const isExpanded = expandedFriend === group._id;

                    return (
                        <div key={group._id} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                            <div className="glass-panel interactive" onClick={() => setExpandedFriend(isExpanded ? null : group._id)} style={{ border: isExpanded ? '1px solid var(--brand-primary)' : '' }}>
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
                                    {group.history.length === 0 && <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>No recorded transactions.</p>}
                                    {group.history.map(record => {
                                        // Determine visual impact on the FRIEND's balance
                                        let impact = 0;
                                        if (record.type === 'expense' && record.account_id === group._id) {
                                            impact = -record.amount; // Friend paid (their balance decreases)
                                        } else if (record.type === 'transfer' && record.account_id === group._id) {
                                            impact = -record.amount; // Friend transferred out (balance decreases)
                                            record.description = record.description || 'Settlement paid out';
                                        } else if (record.type === 'transfer' && record.to_account_id === group._id) {
                                            impact = record.amount; // Friend received transfer (balance increases)
                                            record.description = record.description || 'Received settlement/lent money';
                                        }

                                        return (
                                            <div key={record._id} className="glass-panel" style={{ padding: 'var(--spacing-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <p style={{ fontWeight: '500', fontSize: '0.9rem' }}>{record.description}</p>
                                                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Clock size={12} /> {new Date(record.date).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                                    <span style={{ fontWeight: '600', color: impact > 0 ? 'var(--status-success)' : 'var(--status-danger)' }}>
                                                        {impact > 0 ? '+' : '-'} Rs {Math.abs(impact).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </span>
                                                    <button className="btn-icon" onClick={(e) => { e.stopPropagation(); handleDelete(record._id); }}><Trash2 size={14} /></button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}

                {friendLedgers.length === 0 && (
                    <div className="glass-panel" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 'var(--spacing-xl)' }}>
                        <UserSquare2 size={48} style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--spacing-md)' }} />
                        <h3>No friends added yet</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }}>Go to the Accounts tab and add an account to track IOUs with friends.</p>
                    </div>
                )}
            </div>

            {/* Modals for Add Entry */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="glass-panel modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Manual Ledger Entry</h2>
                            <button className="btn-icon" onClick={() => setShowAddModal(false)}>&times;</button>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }}>
                            Note: Usually, it's easier to record shared expenses natively using the "Split Expense" feature in the Transactions tab.
                        </p>
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
                                <label className="form-label">Friend's Account</label>
                                <select className="form-control" required value={newDebt.friend_id} onChange={e => setNewDebt({ ...newDebt, friend_id: e.target.value })}>
                                    <option value="">Select Friend...</option>
                                    {friendAccounts.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
                                </select>
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
                                <input type="text" className="form-control" placeholder="e.g. Cash for lunch"
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
                                <label className="form-label">{showSettleModal.net_balance > 0 ? 'Deposit to My Account' : 'Pay from My Account'}</label>
                                <select className="form-control" required value={payment.my_account_id} onChange={e => setPayment({ ...payment, my_account_id: e.target.value })}>
                                    {myAccounts.map(acc => <option key={acc._id} value={acc._id}>{acc.name} (Rs {acc.balance})</option>)}
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowSettleModal(null)}>Cancel</button>
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