import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';

import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import AccountDetails from './pages/AccountDetails';
import Transactions from './pages/Transactions';
import Debts from './pages/Debts';
import Reports from './pages/Reports';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/accounts/:id" element={<AccountDetails />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/debts" element={<Debts />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
