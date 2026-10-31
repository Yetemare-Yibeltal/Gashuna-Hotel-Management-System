import { Routes, Route } from 'react-router-dom';
import PublicLayout from '../components/layout/PublicLayout';
import AdminLayout from '../components/layout/AdminLayout';
import ProtectedRoute from './ProtectedRoute';

import Home from '../pages/Home';
import Rooms from '../pages/Rooms';
import RoomDetail from '../pages/RoomDetail';
import Booking from '../pages/Booking';
import Restaurant from '../pages/Restaurant';
import Services from '../pages/Services';
import Gallery from '../pages/Gallery';
import About from '../pages/About';
import Contact from '../pages/Contact';
import PaymentSuccess from '../pages/PaymentSuccess';
import PaymentFailed from '../pages/PaymentFailed';
import NotFound from '../pages/NotFound';

import Login from '../pages/admin/Login';
import Dashboard from '../pages/admin/Dashboard';
import Reservations from '../pages/admin/Reservations';
import RoomsManager from '../pages/admin/RoomsManager';
import Guests from '../pages/admin/Guests';
import Billing from '../pages/admin/Billing';
import Staff from '../pages/admin/Staff';
import Reports from '../pages/admin/Reports';
import Inventory from '../pages/admin/Inventory';
import Settings from '../pages/admin/Settings';
import Housekeeping from '../pages/admin/Housekeeping';
import Maintenance from '../pages/admin/Maintenance';
import FoodOrders from '../pages/admin/FoodOrders';
import AdminServices from '../pages/admin/Services';
import Payroll from '../pages/admin/Payroll';
import AuditLogs from '../pages/admin/AuditLogs';
import AIAssistantPage from '../pages/ai/AIAssistantPage';
import PredictionPage from '../pages/ai/PredictionPage';

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/rooms" element={<Rooms />} />
        <Route path="/rooms/:id" element={<RoomDetail />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/restaurant" element={<Restaurant />} />
        <Route path="/services" element={<Services />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/failed" element={<PaymentFailed />} />
      </Route>

      <Route path="/admin/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/reservations" element={<Reservations />} />
          <Route path="/admin/rooms" element={<RoomsManager />} />
          <Route path="/admin/guests" element={<Guests />} />
          <Route path="/admin/billing" element={<Billing />} />
          <Route path="/admin/staff" element={<Staff />} />
          <Route path="/admin/reports" element={<Reports />} />
          <Route path="/admin/inventory" element={<Inventory />} />
          <Route path="/admin/settings" element={<Settings />} />
          <Route path="/admin/housekeeping" element={<Housekeeping />} />
          <Route path="/admin/maintenance" element={<Maintenance />} />
          <Route path="/admin/food-orders" element={<FoodOrders />} />
          <Route path="/admin/services" element={<AdminServices />} />
          <Route path="/admin/payroll" element={<Payroll />} />
          <Route path="/admin/audit-logs" element={<AuditLogs />} />
          <Route path="/admin/ai" element={<AIAssistantPage />} />
          <Route path="/admin/ai/predictions" element={<PredictionPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
