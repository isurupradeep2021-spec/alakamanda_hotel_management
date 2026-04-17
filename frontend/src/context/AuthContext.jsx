import { createContext, useContext, useMemo, useState } from "react";
import { getLoggedInUser, loginUser, logoutUser } from "../auth/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(getLoggedInUser());
    const effectiveUser = user ?? getLoggedInUser();

    const login = async (credentials) => {
        const nextUser = await loginUser(credentials);
        setUser(nextUser);
        return nextUser;
    };

    const logout = () => {
        logoutUser();
        setUser(null);
    };

    const value = useMemo(() => ({ user: effectiveUser, login, logout }), [effectiveUser]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
