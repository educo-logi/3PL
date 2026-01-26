import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import WarehouseSearch from './pages/WarehouseSearch';
import CustomerSearch from './pages/CustomerSearch';
import WarehouseRegister from './pages/WarehouseRegister';
import CustomerRegister from './pages/CustomerRegister';
import WarehouseDetail from './pages/WarehouseDetail';
import CustomerDetail from './pages/CustomerDetail';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import MyPage from './pages/MyPage';
import PaymentPage from './pages/PaymentPage';
import PremiumApplyPage from './pages/PremiumApplyPage';
import ComparePage from './pages/ComparePage';
import FavoritesPage from './pages/FavoritesPage';
import RecentViewedPage from './pages/RecentViewedPage';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/warehouse-search" element={<WarehouseSearch />} />
          <Route path="/customer-search" element={<CustomerSearch />} />
          <Route path="/warehouse-register" element={<WarehouseRegister />} />
          <Route path="/customer-register" element={<CustomerRegister />} />
          <Route path="/warehouse/:id" element={<WarehouseDetail />} />
          <Route path="/customer/:id" element={<CustomerDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/premium-apply" element={<PremiumApplyPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/recent-viewed" element={<RecentViewedPage />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
