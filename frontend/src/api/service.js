import http from "./http";

export const loginApi = (payload) => http.post("/auth/login", payload);
export const registerApi = (payload) => http.post("/auth/register", payload);

export const getSummary = () => http.get("/dashboard/summary");
export const getUsers = () => http.get("/users");

export const getRooms = () => http.get("/rooms");
export const createRoom = (payload) => http.post("/rooms", payload);
export const updateRoom = (id, payload) => http.put(`/rooms/${id}`, payload);
export const deleteRoom = (id) => http.delete(`/rooms/${id}`);
export const roomAvailability = (checkIn, checkOut) => http.get("/rooms/availability", { params: { checkIn, checkOut } });

export const getDiningBookings = () => http.get("/dining-bookings");
export const createDiningBooking = (payload) => http.post("/dining-bookings", payload);
export const updateDiningBooking = (id, payload) => http.put(`/dining-bookings/${id}`, payload);
export const deleteDiningBooking = (id) => http.delete(`/dining-bookings/${id}`);
export const diningAnalytics = () => http.get("/dining-bookings/analytics");

export const getEventBookings = () => http.get("/event-bookings");
export const createEventBooking = (payload) => http.post("/event-bookings", payload);
export const updateEventBooking = (id, payload) => http.put(`/event-bookings/${id}`, payload);
export const deleteEventBooking = (id) => http.delete(`/event-bookings/${id}`);
export const eventAnalytics = () => http.get("/event-bookings/analytics");

export const getRoomBookings = () => http.get("/room-bookings");
export const createRoomBooking = (payload) => http.post("/room-bookings", payload);
export const updateRoomBooking = (id, payload) => http.put(`/room-bookings/${id}`, payload);
export const checkoutRoomBooking = (id) => http.post(`/room-bookings/${id}/checkout`);
export const deleteRoomBooking = (id) => http.delete(`/room-bookings/${id}`);
export const roomBookingAnalytics = () => http.get("/room-bookings/analytics");
export const completeRoomCleaning = (id) => http.post(`/rooms/${id}/complete-cleaning`);

export const getPayroll = () => http.get("/payroll");
export const createPayroll = (payload) => http.post("/payroll", payload);
export const updatePayroll = (id, payload) => http.put(`/payroll/${id}`, payload);
export const deletePayroll = (id) => http.delete(`/payroll/${id}`);
export const payrollSummary = (month) => http.get("/payroll/summary", { params: month ? { month } : {} });

export const getStaffProfile = () => http.get("/staff/profile");
export const checkIn = () => http.post("/staff/attendance/check-in");
export const checkOut = () => http.post("/staff/attendance/check-out");
export const getAttendanceSummary = (month, year) => http.get("/staff/attendance/summary", { params: { month, year } });
export const getAttendanceHistory = (month, year) => http.get("/staff/attendance/history", { params: { month, year } });
export const requestLeave = (payload) => http.post("/staff/leave", payload);
export const getLeaveHistory = (month, year) => http.get("/staff/leave", { params: { month, year } });
export const getLatestStaffPayroll = () => http.get("/staff/payroll/latest");
export const downloadPayslip = (payrollId) => http.get(`/staff/payslip/${payrollId}`, { responseType: "blob" });

export const generatePayroll = (month, year) => http.post("/payroll/automation/generate", null, { params: { month, year } });
export const getPayrollInsights = (month, year) => http.get("/payroll/automation/insights", { params: { month, year } });
export const setPayrollStatus = (payrollId, status) => http.put(`/payroll/automation/${payrollId}/status`, null, { params: { status } });

export const askChatbot = (question) => http.post("/chatbot/ask", { question });
