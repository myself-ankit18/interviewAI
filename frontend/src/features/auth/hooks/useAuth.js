// hook layer is responsible for handling the logic of authentication, such as login, logout, register, and getMe. It uses the AuthContext to manage the user state and loading state. It also uses the auth.api to make API calls to the backend for authentication.

import { useContext } from "react";
import { AuthContext } from "../auth.context";
import { login, logout, register, getMe, deleteAccount } from "../services/auth.api";

export const useAuth = () => {
    const { user, setUser, loading, setLoading } = useContext(AuthContext);
    const handleLogin = async ({ email, password }) => {
        setLoading(true);
        try {
            const data = await login({ email, password });
            setUser(data.user);
            return { user: data.user };
        } catch (error) {
            console.error('Error logging in user:', error);
            return { error };
        } finally {
            setLoading(false);
        }
    };
    const handleLogout = async () => {
        setLoading(true);
        try {
            await logout();
            setUser(null);
        } catch (error) {
            console.log('Error logging out user:', error);
        } finally {
            setLoading(false);
        }
    };
    const handleRegister = async ({ username, email, password, securityQuestion, securityAnswer }) => {
        setLoading(true);
        try {
            const data = await register({ username, email, password, securityQuestion, securityAnswer });
            setUser(data.user);
            return { user: data.user };
        } catch (error) {
            console.error('Error registering user:', error);
            return { error };
        } finally {
            setLoading(false);
        }
    };
    const handleGetMe = async () => {
        setLoading(true);
        try {
            const data = await getMe();
            setUser(data.user);
        } catch (error) {
            console.log('Error fetching user data:', error);
        } finally {
            setLoading(false);
        }
    };
    const handleDeleteAccount = async (password) => {
        try {
            const data = await deleteAccount(password);
            setUser(null);
            return { success: true, data };
        } catch (error) {
            console.error('Error deleting account:', error);
            return { success: false, error };
        }
    };
    return { user, setUser, loading, setLoading, handleLogin, handleLogout, handleRegister, handleGetMe, handleDeleteAccount };

}