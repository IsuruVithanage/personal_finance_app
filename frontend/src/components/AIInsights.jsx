import React, { useState } from 'react';
import { getAIInsights } from '../api/client';
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, Loader2 } from 'lucide-react';

const AIInsights = () => {
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleAnalyze = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getAIInsights();
            setInsights(res.data);
        } catch (err) {
            console.error(err);
            // Provide a user friendly error if the API key is missing or something fails
            setError("Unable to generate insights at this time. Please ensure the AI service is configured correctly.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                    <div style={{ background: 'var(--brand-gradient)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
                        <Sparkles size={24} color="var(--bg-color-main)" strokeWidth={1.5} />
                    </div>
                    <h2 style={{ fontSize: '1.25rem', margin: 0 }}>AI Financial Advisor</h2>
                </div>
                {!insights && !loading && (
                    <button className="btn btn-primary" onClick={handleAnalyze} style={{ border: 'none' }}>
                        <Sparkles size={16} /> Analyze My Finances
                    </button>
                )}
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                {!insights && !loading && !error && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--text-tertiary)', padding: 'var(--spacing-xl) 0' }}>
                        <Sparkles size={48} style={{ opacity: 0.2, marginBottom: 'var(--spacing-md)' }} />
                        <p style={{ maxWidth: '300px' }}>Click analyze to receive personalized financial insights, risk warnings, and recommendations based on your recent activity.</p>
                    </div>
                )}

                {loading && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--spacing-xl) 0' }}>
                        <Loader2 size={40} className="spinner" style={{ color: 'var(--brand-primary)', marginBottom: 'var(--spacing-md)' }} />
                        <p style={{ color: 'var(--text-secondary)' }}>Analyzing your financial data...</p>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>This usually takes 5-10 seconds.</p>
                    </div>
                )}

                {error && (
                    <div style={{ padding: 'var(--spacing-md)', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--status-danger)', borderRadius: 'var(--radius-md)', color: 'var(--status-danger)' }}>
                        <AlertTriangle size={20} style={{ marginBottom: '0.5rem' }} />
                        <p style={{ margin: 0 }}>{error}</p>
                        <button className="btn btn-secondary" onClick={handleAnalyze} style={{ marginTop: 'var(--spacing-sm)' }}>Try Again</button>
                    </div>
                )}

                {insights && !loading && (
                    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>

                        {/* Summary Section */}
                        <div style={{ padding: 'var(--spacing-md)', background: 'var(--glass-bg)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--brand-primary)' }}>
                            <p style={{ margin: 0, fontSize: '1.05rem', lineHeight: '1.6' }}>{insights.summary}</p>
                        </div>

                        {/* Insights Section */}
                        <div>
                            <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 'var(--spacing-sm)' }}>
                                <TrendingUp size={18} style={{ color: 'var(--status-info)' }} /> Key Insights
                            </h3>
                            <ul style={{ margin: 0, paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {insights.insights.map((insight, index) => (
                                    <li key={index} style={{ color: 'var(--text-primary)', lineHeight: '1.5' }}>{insight}</li>
                                ))}
                            </ul>
                        </div>

                        {/* Recommendations Section */}
                        <div>
                            <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 'var(--spacing-sm)' }}>
                                <Lightbulb size={18} style={{ color: 'var(--status-warning)' }} /> Actionable Recommendations
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {insights.recommendations.map((rec, index) => (
                                    <div key={index} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', background: 'var(--bg-primary)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                                        <div style={{ background: 'var(--glass-bg)', color: 'var(--text-primary)', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: 'bold', flexShrink: 0 }}>
                                            {index + 1}
                                        </div>
                                        <p style={{ margin: 0, lineHeight: '1.5' }}>{rec}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ textAlign: 'right', marginTop: 'auto' }}>
                            <button className="btn-icon" onClick={handleAnalyze} title="Refresh Analysis" style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.25rem', marginLeft: 'auto' }}>
                                <Sparkles size={14} /> Re-analyze
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <style jsx="true">{`
                .spinner {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    100% { transform: rotate(360deg); }
                }
                .fade-in {
                    animation: fadeIn 0.5s ease-in-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default AIInsights;
