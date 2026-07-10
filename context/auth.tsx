import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

const TOKEN_KEY = 'sapa_umat_token';
const USER_KEY = 'sapa_umat_user';

export type UserRole = 'umat' | 'ketua_lingkungan' | 'ketua_wilayah' | 'admin_paroki' | 'pastor';

export interface AuthUser {
    id: string;
    email: string;
    role: UserRole;
    nama_lengkap: string | null;
}

interface AuthContextType {
    user: AuthUser | null;
    token: string | null;
    isLoading: boolean;
    isInitialized: boolean;
    login: (email: string, password: string) => Promise<string | null>;
    register: (email: string, password: string, namaLengkap: string) => Promise<string | null>;
    logout: () => Promise<void>;
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    // Restore session on app start
    useEffect(() => {
        const restoreSession = async () => {
            try {
                const savedToken = await SecureStore.getItemAsync(TOKEN_KEY);
                const savedUser = await SecureStore.getItemAsync(USER_KEY);
                if (savedToken && savedUser) {
                    setToken(savedToken);
                    setUser(JSON.parse(savedUser));
                }
            } catch {
                // Failed to restore session, user will need to login again
            } finally {
                setIsInitialized(true);
            }
        };
        restoreSession();
    }, []);

    const saveSession = async (userData: AuthUser, tokenData: string) => {
        setUser(userData);
        setToken(tokenData);
        await SecureStore.setItemAsync(TOKEN_KEY, tokenData);
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(userData));
    };

    const clearSession = async () => {
        try {
            await SecureStore.deleteItemAsync(TOKEN_KEY);
            await SecureStore.deleteItemAsync(USER_KEY);
        } catch (error) {
            console.error('Error clearing secure store:', error);
        }
        setUser(null);
        setToken(null);
    };

    const login = async (email: string, password: string): Promise<string | null> => {
        setIsLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const json = await res.json();
            if (json.error || !json.data) {
                return json.error || 'Login gagal.';
            }
            const userData: AuthUser = {
                id: json.data.user.id,
                email: json.data.user.email,
                role: json.data.user.role ?? 'umat',
                nama_lengkap: json.data.user.nama_lengkap ?? null,
            };
            await saveSession(userData, json.data.session?.access_token || '');
            return null;
        } catch {
            return 'Tidak dapat terhubung ke server.';
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (email: string, password: string, namaLengkap: string): Promise<string | null> => {
        setIsLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, nama_lengkap: namaLengkap }),
            });
            const json = await res.json();
            if (json.error || !json.data) {
                return json.error || 'Registrasi gagal.';
            }
            // After registration, login automatically
            return await login(email, password);
        } catch {
            return 'Tidak dapat terhubung ke server.';
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        // Clear local session first so UI immediately updates
        await clearSession();
        // Redirect to login page
        router.replace('/login' as any);
        
        // Best effort logout on server in background
        if (token) {
            try {
                fetch(`${BASE_URL}/auth/logout`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                }).catch(() => {});
            } catch { }
        }
    };

    const isAdmin = user?.role === 'admin_paroki' || user?.role === 'pastor';

    return (
        <AuthContext.Provider value={{ user, token, isLoading, isInitialized, login, register, logout, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
