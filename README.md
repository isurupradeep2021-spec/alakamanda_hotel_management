# Hotel Management System (Spring Boot + React + MySQL)

Full-stack project for:
- User Management
- Room Management
- Restaurant & Dining Management
- Event Management
- Payroll Management

Role access implemented:
- `CUSTOMER`: login, view dashboard data, create room/dining/event bookings, view profile/booking modules
- `MANAGER`: full access + edit/create/delete for room, dining, event management
- `FINANCIAL_MANAGER`: view payroll management
- `STAFF`: login + view booking and user information (read-only)

## Project Paths
- Backend: `/Users/isurupradeep/Documents/New project/backend`
- Frontend: `/Users/isurupradeep/Documents/New project/frontend`

## Full File Structure

```text
/Users/isurupradeep/Documents/New project
├── .gitignore
├── README.md
├── backend
│   ├── pom.xml
│   └── src
│       ├── main
│       │   ├── java/com/hotelmanagement
│       │   │   ├── HotelManagementApplication.java
│       │   │   ├── config
│       │   │   │   ├── DataSeeder.java
│       │   │   │   ├── GlobalExceptionHandler.java
│       │   │   │   └── SecurityConfig.java
│       │   │   ├── controller
│       │   │   │   ├── AuthController.java
│       │   │   │   ├── DashboardController.java
│       │   │   │   ├── DiningBookingController.java
│       │   │   │   ├── EventBookingController.java
│       │   │   │   ├── PayrollController.java
│       │   │   │   ├── RoomBookingController.java
│       │   │   │   ├── RoomController.java
│       │   │   │   └── UserController.java
│       │   │   ├── dto
│       │   │   │   ├── AuthResponse.java
│       │   │   │   ├── LoginRequest.java
│       │   │   │   ├── RegisterRequest.java
│       │   │   │   └── UserDto.java
│       │   │   ├── entity
│       │   │   │   ├── DiningBooking.java
│       │   │   │   ├── EventBooking.java
│       │   │   │   ├── PayrollRecord.java
│       │   │   │   ├── Role.java
│       │   │   │   ├── Room.java
│       │   │   │   ├── RoomBooking.java
│       │   │   │   └── User.java
│       │   │   ├── repository
│       │   │   │   ├── DiningBookingRepository.java
│       │   │   │   ├── EventBookingRepository.java
│       │   │   │   ├── PayrollRecordRepository.java
│       │   │   │   ├── RoomBookingRepository.java
│       │   │   │   ├── RoomRepository.java
│       │   │   │   └── UserRepository.java
│       │   │   ├── security
│       │   │   │   ├── JwtAuthenticationFilter.java
│       │   │   │   ├── JwtService.java
│       │   │   │   └── UserDetailsServiceImpl.java
│       │   │   └── service
│       │   │       ├── AuthService.java
│       │   │       ├── UserService.java
│       │   │       └── impl
│       │   │           ├── AuthServiceImpl.java
│       │   │           └── UserServiceImpl.java
│       │   ├── resources
│       │   │   └── application.properties
│       │   └── test/java/com/hotelmanagement/HotelManagementApplicationTests.java
└── frontend
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src
        ├── App.jsx
        ├── api
        │   ├── http.js
        │   └── service.js
        ├── components
        │   └── ProtectedRoute.jsx
        ├── context
        │   └── AuthContext.jsx
        ├── layouts
        │   └── DashboardLayout.jsx
        ├── main.jsx
        ├── pages
        │   ├── DashboardPage.jsx
        │   ├── LoginPage.jsx
        │   └── RegisterPage.jsx
        └── styles
            └── main.css
```

## Database Setup (MySQL)

Create MySQL user/password (or use your own), then update:
- `/Users/isurupradeep/Documents/New project/backend/src/main/resources/application.properties`

Current default:
- DB: `hotel_management`
- Username: `root`
- Password: `root`

## Run Backend (IntelliJ)
1. Open folder `/Users/isurupradeep/Documents/New project/backend` as Maven project in IntelliJ.
2. Ensure JDK 17 is selected.
3. Run `HotelManagementApplication`.
4. Backend runs at `http://localhost:8080`.

## Run Frontend
```bash
cd "/Users/isurupradeep/Documents/New project/frontend"
npm install
npm run dev
```
Frontend runs at `http://localhost:5173`.

## Seed Login Accounts
- Manager: `manager@hotel.com` / `Password@123`
- Financial Manager: `finance@hotel.com` / `Password@123`
- Staff: `staff@hotel.com` / `Password@123`
- Customer: `customer@hotel.com` / `Password@123`

## Main API Endpoints
- Auth: `/api/auth/login`, `/api/auth/register`
- Users: `/api/users`
- Rooms: `/api/rooms`
- Room Bookings: `/api/room-bookings`
- Dining: `/api/dining-bookings`
- Events: `/api/event-bookings`
- Payroll: `/api/payroll`
- Dashboard summary: `/api/dashboard/summary`
