import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getRoomBookings, getRooms } from "../api/service";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1600&q=80";

function ViewRoomsPage() {
    const [rooms, setRooms] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [activeType, setActiveType] = useState("All");

    useEffect(() => {
        Promise.all([getRooms(), getRoomBookings()])
            .then(([roomsRes, bookingsRes]) => {
                setRooms(roomsRes.data || []);
                setBookings(bookingsRes.data || []);
            })
            .catch(() => {
                setRooms([]);
                setBookings([]);
            });
    }, []);

    const roomTypes = useMemo(() => ["All", ...Array.from(new Set(rooms.map((r) => r.roomType).filter(Boolean)))], [rooms]);

    const visibleRooms = useMemo(() => {
        if (activeType === "All") return rooms;
        return rooms.filter((r) => r.roomType === activeType);
    }, [activeType, rooms]);

    const totalInventoryPerRoomType = rooms.length;

    const activeBookingsByRoomNumber = useMemo(() => {
        const map = new Map();

        bookings.forEach((booking) => {
            const status = (booking.status || "").toUpperCase();
            if (status === "CANCELLED" || status === "CHECKED_OUT") {
                return;
            }

            const roomNumber = (booking.roomNumber || "").trim().toLowerCase();
            if (!roomNumber) {
                return;
            }

            map.set(roomNumber, (map.get(roomNumber) || 0) + 1);
        });

        return map;
    }, [bookings]);

    return (
        <div className="module-page dashboard-luxe">
            <div className="dash-hero luxe-hero">
                <div className="module-head">
                    <p className="eyebrow">Room Catalogue</p>
                    <h2>View Rooms</h2>
                    <p>Browse room types with photos, descriptions, pricing, and availability before booking.</p>
                </div>
                <div className="hero-chip">
                    <i className="bi bi-building" />
                    {rooms.length} Rooms
                </div>
            </div>

            <div className="room-type-tabs">
                {roomTypes.map((type) => (
                    <button key={type} type="button" className={`type-tab ${activeType === type ? "active" : ""}`} onClick={() => setActiveType(type)}>
                        {type}
                    </button>
                ))}
            </div>

            <div className="room-catalog-grid">
                {visibleRooms.map((room) => {
                    const roomNumberKey = (room.roomNumber || "").trim().toLowerCase();
                    const activeBookingsForRoom = activeBookingsByRoomNumber.get(roomNumberKey) || 0;
                    const roomsRemaining = Math.max(totalInventoryPerRoomType - activeBookingsForRoom, 0);
                    const roomStatus = roomsRemaining === 0 ? "RESERVED" : "AVAILABLE";
                    const status = (room.status || "").toUpperCase();
                    const isMaintenance = status === "MAINTENANCE";
                    const isBookable = !isMaintenance && roomsRemaining > 0;

                    return (
                        <article className="room-catalog-card" key={room.id}>
                            <div className="room-photo-wrap">
                                <img src={room.photoUrl || FALLBACK_IMAGE} alt={`${room.roomType || "Room"} ${room.roomNumber || ""}`} className="room-photo" loading="lazy" />
                                <span className={`room-status-badge ${isBookable ? "ok" : "busy"}`}>{isMaintenance ? "MAINTENANCE" : roomStatus}</span>
                            </div>

                            <div className="room-content">
                                <p className="room-type">{room.roomType || "Room Type"}</p>
                                <h3>Room {room.roomNumber}</h3>
                                <p className="room-description">{room.description || "Premium room with modern comforts and curated in-room experience."}</p>

                                <div className="room-meta">
                                    <span>
                                        <i className="bi bi-people" /> {room.capacity || "-"} Guests
                                    </span>
                                    <span>
                                        <i className="bi bi-cash" /> LKR {room.pricePerNight || "-"} / night
                                    </span>
                                </div>

                                <p className={`room-availability ${roomsRemaining <= 1 ? "low" : "ok"}`}>
                                    {roomsRemaining === 0 ? "All rooms reserved" : `${roomsRemaining} ${roomsRemaining === 1 ? "room" : "rooms"} remaining`}
                                </p>

                                <Link to="/book-room" className={`room-cta ${isBookable ? "" : "disabled"}`}>
                                    {isBookable ? "Book This Room" : "Not Available"}
                                </Link>
                            </div>
                        </article>
                    );
                })}
            </div>
        </div>
    );
}

export default ViewRoomsPage;
