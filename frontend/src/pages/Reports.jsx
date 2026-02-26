import React, { useState, useEffect } from 'react';
import { getMonthlyReport } from '../api/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const Reports = () => {
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [months, setMonths] = useState(6);

    useEffect(() => {
        const fetchReports = async () => {
            setLoading(true);
            try {
                const res = await getMonthlyReport(months);
                const formatted = res.data.map(d => ({
                    ...d,
                    income: Number(d.income),
                    expense: Number(d.expense),
                    savings: Number(d.savings)
                }));
                setReportData(formatted.reverse());
            } catch (error) {
                console.error("Failed to fetch reports", error);
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, [months]);

    if (loading) return <div>Loading reports...</div>;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Financial Reports</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Analyze your income vs expense trends.</p>
                </div>
                <div>
                    <select className="form-control" style={{ width: 'auto' }} value={months} onChange={e => setMonths(Number(e.target.value))}>
                        <option value={3}>Last 3 Months</option>
                        <option value={6}>Last 6 Months</option>
                        <option value={12}>Last 12 Months</option>
                    </select>
                </div>
            </div>

            <div className="glass-panel" style={{ height: '500px', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ marginBottom: 'var(--spacing-md)', fontSize: '1.25rem' }}>Income vs Expenses ({months} Month Trend)</h3>

                <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={reportData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--glass-border)" />
                            <XAxis dataKey="month" stroke="var(--text-tertiary)" tickLine={false} axisLine={false} />
                            <YAxis stroke="var(--text-tertiary)" tickLine={false} axisLine={false} tickFormatter={(val) => `Rs ${val}`} />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'var(--bg-color-accent)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}
                                itemStyle={{ color: 'var(--text-primary)' }}
                                cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                formatter={(value) => `Rs ${value.toLocaleString()}`}
                            />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                            <Bar dataKey="income" name="Income" fill="var(--status-success)" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="expense" name="Expenses" fill="var(--status-danger)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid-3" style={{ marginTop: 'var(--spacing-xl)' }}>
                {reportData.map((data, index) => (
                    <div key={index} className="glass-panel" style={{ padding: 'var(--spacing-md)' }}>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', marginBottom: 'var(--spacing-sm)' }}>
                            {data.month}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ color: 'var(--text-tertiary)' }}>Income</span>
                            <span style={{ color: 'var(--status-success)' }}>+Rs {data.income?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-sm)', paddingBottom: 'var(--spacing-sm)', borderBottom: '1px solid var(--glass-border)' }}>
                            <span style={{ color: 'var(--text-tertiary)' }}>Expenses</span>
                            <span style={{ color: 'var(--status-danger)' }}>-Rs {data.expense?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                            <span>Net Savings</span>
                            <span style={{ color: data.savings >= 0 ? 'var(--status-success)' : 'var(--status-danger)' }}>
                                {data.savings >= 0 ? '+' : ''}Rs {data.savings?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Reports;
