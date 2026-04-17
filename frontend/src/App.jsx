import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AccessDeniedPage from './pages/AccessDeniedPage';
import OperationsPage from './pages/OperationsPage';
import ViewRoomsPage from './pages/ViewRoomsPage';
import ViewMenuPage from './pages/ViewMenuPage';
import RestaurantDetailsPage from './pages/RestaurantDetailsPage';
import PayrollCenterPage from './pages/PayrollCenterPage';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import { routeAccess } from './auth/role';
import {
  BookingHistoryPage,
  CustomersPage,
  GuestListPage,
  ProfilePage,
  ReportsPage,
  UserManagementPage
} from './pages/RolePages';

function withRoleGuard(path, element) {
  return (
    <ProtectedRoute allowedRoles={routeAccess[path]}>
      {element}
    </ProtectedRoute>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/access-denied" element={<AccessDeniedPage />} />

      <Route
        element={(
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        )}
      >
        <Route path="/dashboard" element={withRoleGuard('/dashboard', <DashboardPage />)} />
        <Route path="/payroll-center" element={withRoleGuard('/payroll-center', <PayrollCenterPage />)} />

        <Route path="/users" element={withRoleGuard('/users', <UserManagementPage />)} />
        <Route path="/rooms" element={withRoleGuard('/rooms', <OperationsPage type="rooms" />)} />
        <Route path="/restaurant-buffet" element={withRoleGuard('/restaurant-buffet', <OperationsPage type="restaurant" />)} />
        <Route path="/events" element={withRoleGuard('/events', <OperationsPage type="events" />)} />
        <Route path="/payroll" element={withRoleGuard('/payroll', <OperationsPage type="payroll" />)} />
        <Route path="/reports" element={withRoleGuard('/reports', <ReportsPage />)} />

        <Route path="/restaurant" element={withRoleGuard('/restaurant', <OperationsPage type="restaurant" />)} />

        <Route path="/room-booking" element={withRoleGuard('/room-booking', <OperationsPage type="rooms" />)} />
        <Route path="/customers" element={withRoleGuard('/customers', <CustomersPage />)} />
        <Route path="/booking-history" element={withRoleGuard('/booking-history', <BookingHistoryPage />)} />

        <Route path="/menu-management" element={withRoleGuard('/menu-management', <OperationsPage type="restaurant" />)} />
        <Route path="/buffet-management" element={withRoleGuard('/buffet-management', <OperationsPage type="restaurant" />)} />
        <Route path="/orders" element={withRoleGuard('/orders', <OperationsPage type="restaurant" />)} />

        <Route path="/event-booking" element={withRoleGuard('/event-booking', <OperationsPage type="events" />)} />
        <Route path="/event-management" element={withRoleGuard('/event-management', <OperationsPage type="events" />)} />
        <Route path="/guest-list" element={withRoleGuard('/guest-list', <GuestListPage />)} />

        <Route path="/view-rooms" element={withRoleGuard('/view-rooms', <ViewRoomsPage />)} />
        <Route path="/book-room" element={withRoleGuard('/book-room', <OperationsPage type="rooms" />)} />
        <Route path="/view-menu" element={withRoleGuard('/view-menu', <ViewMenuPage />)} />
        <Route path="/restaurant/:id" element={withRoleGuard('/view-menu', <RestaurantDetailsPage />)} />
        <Route path="/book-event" element={withRoleGuard('/book-event', <OperationsPage type="events" />)} />
        <Route path="/profile" element={withRoleGuard('/profile', <ProfilePage />)} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
