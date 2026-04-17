import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { checkRoleAccess } from "../auth/role";
import { getLoggedInUser, isLoggedIn } from "../auth/auth";

function ProtectedRoute({ children, allowedRoles }) {
    const { user } = useAuth();
    const location = useLocation();
    const currentUser = user || getLoggedInUser();

    if (!isLoggedIn() || !currentUser) {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }

    if (allowedRoles && !checkRoleAccess(allowedRoles)) {
        return <Navigate to="/access-denied" replace state={{ from: location.pathname }} />;
    }

    return children;
}

export default ProtectedRoute;
