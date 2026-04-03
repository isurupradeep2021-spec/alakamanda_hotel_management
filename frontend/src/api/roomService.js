import axios from "axios";

const roomServiceHttp = axios.create({
  baseURL:
    import.meta.env.VITE_NEST_API_BASE_URL || "http://127.0.0.1:3001/api",
});

roomServiceHttp.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const getHousekeepingTasks = () => roomServiceHttp.get("/housekeeping");
export const getHousekeepingStats = () =>
  roomServiceHttp.get("/housekeeping/stats");
export const createHousekeepingTask = (payload) =>
  roomServiceHttp.post("/housekeeping", payload);
export const updateHousekeepingTask = (id, payload) =>
  roomServiceHttp.put(`/housekeeping/${id}`, payload);
export const deleteHousekeepingTask = (id) =>
  roomServiceHttp.delete(`/housekeeping/${id}`);

export const getMaintenanceTickets = () => roomServiceHttp.get("/maintenance");
export const getMaintenanceStats = () =>
  roomServiceHttp.get("/maintenance/stats");
export const createMaintenanceTicket = (payload) =>
  roomServiceHttp.post("/maintenance", payload);
export const updateMaintenanceTicket = (id, payload) =>
  roomServiceHttp.put(`/maintenance/${id}`, payload);
export const deleteMaintenanceTicket = (id) =>
  roomServiceHttp.delete(`/maintenance/${id}`);

export const getRoomServiceStaff = () => roomServiceHttp.get("/staff");
export const createRoomServiceStaff = (payload) =>
  roomServiceHttp.post("/staff", payload);
export const updateRoomServiceStaff = (id, payload) =>
  roomServiceHttp.put(`/staff/${id}`, payload);
export const deleteRoomServiceStaff = (id) =>
  roomServiceHttp.delete(`/staff/${id}`);
