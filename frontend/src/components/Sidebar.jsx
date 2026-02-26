import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Wallet, ArrowRightLeft, UserSquare2, LineChart } from 'lucide-react';

const Sidebar = () => {
    const navItems = [
        { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
        { name: 'Accounts', path: '/accounts', icon: <Wallet size={20} /> },
        { name: 'Transactions', path: '/transactions', icon: <ArrowRightLeft size={20} /> },
        { name: 'Debts', path: '/debts', icon: <UserSquare2 size={20} /> },
        { name: 'Reports', path: '/reports', icon: <LineChart size={20} /> },
    ];

    return (
        <aside className="app-navigation glass-panel">
            <div className="sidebar-header" style={{ marginBottom: 'var(--spacing-xl)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                <div style={{ background: 'var(--brand-gradient)', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                    PF
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>Finance<span style={{ color: 'var(--brand-primary)' }}>App</span></h2>
            </div>

            <nav className="nav-list">
                {navItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                        {item.icon}
                        <span>{item.name}</span>
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
};

export default Sidebar;
