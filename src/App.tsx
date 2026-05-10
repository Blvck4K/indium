import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Assets from './pages/Assets';
import Hub from './pages/Hub';
import Rewards from './pages/Rewards';
import Deposit from './pages/Deposit';
import Referral from './pages/Referral';
import Withdraw from './pages/Withdraw';
import Transactions from './pages/Transactions';

function App() {
  return (
    <Routes>
      {/* Public Routes without Layout */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Authenticated Routes with Layout */}
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/assets" element={<Assets />} />
        <Route path="/hub" element={<Hub />} />
        <Route path="/rewards" element={<Rewards />} />
        <Route path="/deposit" element={<Deposit />} />
        <Route path="/referral" element={<Referral />} />
        <Route path="/withdraw" element={<Withdraw />} />
        <Route path="/transactions" element={<Transactions />} />
      </Route>
    </Routes>
  );
}

export default App;
