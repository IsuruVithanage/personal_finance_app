import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAccount, getTransactions } from '../api/client';
import { ArrowLeft, Wallet, Building2, CreditCard, ArrowRight } from 'lucide-react';

const AccountDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [account, setAccount] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ income: 0, expense: 0 });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [accRes, txRes] = await Promise.all([
                getAccount(id),
                getTransactions(id)
            ]);
            setAccount(accRes.data);
            setTransactions(txRes.data);

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
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AccountDetails;
