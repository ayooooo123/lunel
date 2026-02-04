import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface AuthContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const AUTH_TOKEN_STORAGE_KEY = "@lunel_auth_token";

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const authToken = await AsyncStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
      setIsLoggedIn(!!authToken);
    } catch (error) {
      console.error("Error checking auth status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async () => {
    try {
      // Replace this with your actual login logic
      await AsyncStorage.setItem(AUTH_TOKEN_STORAGE_KEY, "your-auth-token");
      setIsLoggedIn(true);
    } catch (error) {
      console.error("Error logging in:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
      setIsLoggedIn(false);
    } catch (error) {
      console.error("Error logging out:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
