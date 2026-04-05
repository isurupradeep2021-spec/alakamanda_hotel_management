import http from "./http";

export const loginApi = (payload) => http.post("/auth/login", payload);
export const registerApi = (payload) => http.post("/auth/register", payload);

export const getSummary = () => http.get("/dashboard/summary");
export const getRoomBookingInsights = () => http.get("/dashboard/room-booking-insights");
export const getUsers = () => http.get("/users");
export const getStaffMembers = () => http.get("/staff");
export const createStaffMember = (payload) => http.post("/staff", payload);
export const updateStaffMember = (id, payload) => http.put(`/staff/${id}`, payload);
export const deleteStaffMember = (id) => http.delete(`/staff/${id}`);

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
export const calculateRoomPrice = (roomId, checkInDate, checkOutDate) => http.post("/room-bookings/calculate-price", null, { params: { roomId, checkInDate, checkOutDate } });
export const getRoomPopularity = (roomNumber) => http.get(`/room-bookings/room/${roomNumber}/popularity`);
export const getSeasons = () => http.get("/seasons");
export const getActiveSeasons = () => http.get("/seasons/active");
export const createSeason = (payload) => http.post("/seasons", payload);
export const updateSeason = (id, payload) => http.put(`/seasons/${id}`, payload);
export const deleteSeason = (id) => http.delete(`/seasons/${id}`);

export const getPayroll = () => http.get("/payroll");
export const createPayroll = (payload) => http.post("/payroll", payload);
export const updatePayroll = (id, payload) => http.put(`/payroll/${id}`, payload);
export const deletePayroll = (id) => http.delete(`/payroll/${id}`);
export const payrollSummary = (month) => http.get("/payroll/summary", { params: month ? { month } : {} });
export const getPayrollProfiles = (params) => http.get("/payroll/profiles", { params });
export const createPayrollProfile = (payload) => http.post("/payroll/profiles", payload);
export const updatePayrollProfile = (id, payload) => http.put(`/payroll/profiles/${id}`, payload);
export const archivePayrollProfile = (id) => http.delete(`/payroll/profiles/${id}`);
export const verifyPayrollBank = (id, verified = true) => http.post(`/payroll/profiles/${id}/verify-bank`, null, { params: { verified } });
export const finalSettlementPayrollProfile = (id, carryForwardAmount) =>
  http.post(`/payroll/profiles/${id}/final-settlement`, null, {
    params: carryForwardAmount == null ? {} : { carryForwardAmount }
  });
export const getPayrollRuns = (status) => http.get("/payroll/runs", { params: status ? { status } : {} });
export const createPayrollRun = (payload) => http.post("/payroll/runs", payload);
export const managerReviewPayrollRun = (runId, note) =>
  http.post(`/payroll/runs/${runId}/manager-review`, note ? { note } : {});
export const adminApprovePayrollRun = (runId, note) =>
  http.post(`/payroll/runs/${runId}/admin-approve`, note ? { note } : {});
export const financeReleasePayrollRun = (runId, note) =>
  http.post(`/payroll/runs/${runId}/finance-release`, note ? { note } : {});
export const deletePayrollRun = (runId) => http.delete(`/payroll/runs/${runId}`);
export const getPayrollDashboard = () => http.get("/payroll/runs/dashboard");
export const getPayrollMonthlySummary = (year, month) =>
  http.get("/payroll/runs/reports/monthly-summary", { params: { year, month } });
export const getPayrollYtd = (employeeCode, year) =>
  http.get("/payroll/runs/reports/ytd", { params: { employeeCode, year } });
export const getPayrollTaxLiability = (year) =>
  http.get("/payroll/runs/reports/tax-liability", { params: { year } });
export const getPayrollCostTrend = (months = 12) =>
  http.get("/payroll/runs/reports/cost-trend", { params: { months } });
export const exportPayrollReport = (year, month, format = "excel") =>
  http.get("/payroll/runs/reports/export", {
    params: { year, month, format },
    responseType: "blob"
  });
export const getPayrollAuditLogs = (params) => http.get("/payroll/audit", { params });

export const getStaffProfile = () => http.get("/staff/profile");
export const checkIn = () => http.post("/staff/attendance/check-in");
export const checkOut = () => http.post("/staff/attendance/check-out");
export const getAttendanceSummary = (month, year) => http.get("/staff/attendance/summary", { params: { month, year } });
export const getAttendanceHistory = (month, year) => http.get("/staff/attendance/history", { params: { month, year } });
export const requestLeave = (payload) => http.post("/staff/leave", payload);
export const getLeaveHistory = (month, year) => http.get("/staff/leave", { params: { month, year } });
export const getLatestStaffPayroll = () => http.get("/staff/payroll/latest");
export const downloadPayslip = (payrollId) => http.get(`/staff/payslip/${payrollId}`, { responseType: "blob" });
export const downloadPayrollPayslip = downloadPayslip;

export const generatePayroll = (month, year) => http.post("/payroll/automation/generate", null, { params: { month, year } });
export const getPayrollInsights = (month, year) => http.get("/payroll/automation/insights", { params: { month, year } });
export const setPayrollStatus = (payrollId, status) => http.put(`/payroll/automation/${payrollId}/status`, null, { params: { status } });

export const askChatbot = (question) => http.post("/chatbot/ask", { question });
