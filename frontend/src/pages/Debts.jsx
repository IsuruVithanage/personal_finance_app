import React, { useState, useEffect, useMemo } from 'react';
import { getDebts, createDebt, deleteDebt, getAccounts } from '../api/client';
import { UserSquare2, CheckCircle2, Trash2, Plus, ChevronDown, ChevronUp, ArrowRightLeft, MoveDownLeft, MoveUpRight } from 'lucide-react';

const Debts = () => {
    const [debts, setDebts] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showAddModal, setShowAddModal] = useState(false);
    const [expandedFriend, setExpandedFriend] = useState(null);

    const initialDebtState = {
        friend_name: '',
        amount: '',
        type: 'lent',
        description: '',
        date: new Date().toISOString().split('T')[0],
        linked_account_id: ''
    };
    const [newDebt, setNewDebt] = useState(initialDebtState);

    const fetchData = async () => {
        try {
            const [debtRes, accRes] = await Promise.all([getDebts(), getAccounts()]);
            setDebts(debtRes.data);
            setAccounts(accRes.data);
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
                amount: parseFloat(newDebt.amount),
                date: new Date(newDebt.date).toISOString(),
                linked_account_id: newDebt.linked_account_id || null
            });
            setShowAddModal(false);
            setNewDebt(initialDebtState);
            fetchData();
        } catch (error) {
            console.error("Failed to create debt", error);
            alert(error.response?.data?.detail || "Failed to create debt record");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this debt record? If this was linked to an account, the bank transaction will NOT be automatically deleted.")) {
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
                    balance: 0,
                    debts: []
                };
            }
            if (debt.type === 'lent' || debt.type === 'repaid') {
                groups[name].balance += debt.amount;
            } else if (debt.type === 'borrowed' || debt.type === 'collected') {
                groups[name].balance -= debt.amount;
            }
            groups[name].debts.push(debt);
        });

        // Convert to array and sort alphabetically
        return Object.values(groups).sort((a, b) => a.friend_name.localeCompare(b.friend_name));
    }, [debts]);

    if (loading) return <div>Loading...</div>;

    const getBadgeStyle = (type) => {
        switch (type) {
            case 'lent': return 'badge-danger'; // Money went out
            case 'repaid': return 'badge-danger';
            case 'borrowed': return 'badge-success'; // Money came in
            case 'collected': return 'badge-success';
            default: return 'badge-secondary';
        }
    };

    const getBadgeText = (type) => {
        switch (type) {
            case 'lent': return 'You Lent';
            case 'repaid': return 'You Repaid';
            case 'borrowed': return 'You Borrowed';
            case 'collected': return 'They Paid';
            default: return type;
        }
    };

    const getTypeIcon = (type) => {
        if (type === 'lent' || type === 'repaid') return <MoveUpRight size={14} style={{ marginRight: '4px' }} />;
        if (type === 'borrowed' || type === 'collected') return <MoveDownLeft size={14} style={{ marginRight: '4px' }} />;
        return null;
    }

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Debt Tracking</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Track running balances with your friends.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                    <Plus size={18} /> Add Record
                </button>
            </div>

            <div className="grid-3" style={{ alignItems: 'start' }}>
                {groupedDebts.map(group => {
                    const isSettled = Math.abs(group.balance) < 0.01;
                    const owesUs = group.balance > 0.01;
                    const weOwe = group.balance < -0.01;
                    const isExpanded = expandedFriend === group.friend_name;

                    let statusColor = 'var(--text-secondary)';
                    let statusText = 'Settled Up';
                    if (owesUs) {
                        statusColor = 'var(--status-success)';
                        statusText = `Owes you Rs ${group.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
                    } else if (weOwe) {
                        statusColor = 'var(--status-danger)';
                        statusText = `You owe Rs ${Math.abs(group.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
                    }

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
                                                {group.debts.length} record(s)
                                            </span>
                                        </div>
                                    </div>
                                    {isExpanded ? <ChevronUp size={20} style={{ color: 'var(--text-tertiary)' }} /> : <ChevronDown size={20} style={{ color: 'var(--text-tertiary)' }} />}
                                </div>

                                <div style={{ background: 'rgba(0,0,0,0.2)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Net Balance</span>
                                    <span style={{ color: statusColor, fontSize: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        {isSettled && <CheckCircle2 size={16} />}
                                        {statusText}
                                    </span>
                                </div>
                            </div>

                            {/* Individual Debt Records (Expanded View) */}
                            {isExpanded && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', paddingLeft: 'var(--spacing-md)', borderLeft: '2px solid var(--glass-border)' }}>
                                    {group.debts.map(debt => (
                                        <div key={debt._id} className="glass-panel" style={{ padding: 'var(--spacing-md)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div style={{ flex: 1 }}>
                                                    <p style={{ fontWeight: '500', fontSize: '1rem', marginBottom: '4px' }}>{debt.description || 'Unspecified detail'}</p>
                                                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        {new Date(debt.date).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '4px' }}>
                                                        Rs {debt.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </div>
                                                    <span className={`badge ${getBadgeStyle(debt.type)}`} style={{ display: 'inline-flex', alignItems: 'center' }}>
                                                        {getTypeIcon(debt.type)}
                                                        {getBadgeText(debt.type)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--glass-border)', paddingTop: 'var(--spacing-sm)', marginTop: 'var(--spacing-xs)' }}>
                                                <button className="btn-icon" onClick={(e) => { e.stopPropagation(); handleDelete(debt._id); }} title="Delete record" style={{ color: 'var(--text-tertiary)', padding: '0.25rem' }}>
                                                    <Trash2 size={16} />
                                                </button>
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
                        <p style={{ color: 'var(--text-secondary)' }}>You don't have any running balances with friends.</p>
                    </div>
                )}
            </div>

            {/* --- Add Debt Record Modal --- */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="glass-panel modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">New Balance Record</h2>
                            <button className="btn-icon" onClick={() => setShowAddModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleCreateDebt}>

                            <div className="form-group">
                                <label className="form-label">Transaction Type</label>
                                <select className="form-control" required value={newDebt.type} onChange={e => setNewDebt({ ...newDebt, type: e.target.value })}>
                                    <option value="lent">I paid for them / Lent them money (+ they owe me)</option>
                                    <option value="borrowed">They paid for me / I borrowed money (- I owe them)</option>
                                    <option value="collected">They paid me back (- they owe me less)</option>
                                    <option value="repaid">I paid them back (+ I owe them less)</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Friend's Name</label>
                                <input type="text" className="form-control" required placeholder="e.g. John Doe" list="friend-names"
                                    value={newDebt.friend_name} onChange={e => setNewDebt({ ...newDebt, friend_name: e.target.value })} />
                                <datalist id="friend-names">
                                    {groupedDebts.map(g => <option key={g.friend_name} value={g.friend_name} />)}
                                </datalist>
                            </div>

                            <div className="grid-2">
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">Amount (Rs)</label>
                                    <input type="number" step="0.01" min="0.01" className="form-control" required
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
                                <input type="text" className="form-control" placeholder="e.g. Cinema tickets, Dinner split"
                                    value={newDebt.description} onChange={e => setNewDebt({ ...newDebt, description: e.target.value })} />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Link to Bank Account (Optional)</label>
                                <select className="form-control" value={newDebt.linked_account_id} onChange={e => setNewDebt({ ...newDebt, linked_account_id: e.target.value })}>
                                    <option value="">-- No Account / Outside Cash --</option>
                                    {accounts.map(acc => (
                                        <option key={acc._id} value={acc._id}>{acc.name} (Rs {acc.balance.toLocaleString()})</option>
                                    ))}
                                </select>
                                <small style={{ color: 'var(--text-tertiary)', marginTop: '4px', display: 'block' }}>
                                    Linking an account will automatically create the corresponding Income/Expense transaction.
                                </small>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Record</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Debts;
