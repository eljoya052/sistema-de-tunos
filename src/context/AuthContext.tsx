import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Profile, Service } from '../types/database';
import { repository } from '../lib/repository';

interface AuthContextType {
  user: Profile | null;
  assignedServices: Service[];
  activeService: Service | null;
  setActiveService: (service: Service | null) => void;
  deskNumber: string;
  setDeskNumber: (desk: string) => void;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  switchUser: (profileId: string) => Promise<void>;
  logout: () => void;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'turno_social_current_user_id';
const DESK_STORAGE_KEY = 'turno_social_desk_number';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [assignedServices, setAssignedServices] = useState<Service[]>([]);
  const [activeService, setActiveService] = useState<Service | null>(null);
  const [deskNumber, setDeskNumberState] = useState<string>(() => {
    return (typeof window !== 'undefined' ? localStorage.getItem(DESK_STORAGE_KEY) : null) || 'Módulo 1';
  });
  const [isLoading, setIsLoading] = useState(true);

  const setDeskNumber = (desk: string) => {
    setDeskNumberState(desk);
    if (typeof window !== 'undefined') {
      localStorage.setItem(DESK_STORAGE_KEY, desk);
    }
  };

  const loadUserServices = async (profile: Profile) => {
    if (profile.role === 'ADMIN') {
      const all = await repository.getServices(true);
      setAssignedServices(all);
      if (!activeService && all.length > 0) {
        setActiveService(all[0]);
      }
    } else {
      const srvs = await repository.getProfessionalServices(profile.id);
      setAssignedServices(srvs);
      if (srvs.length > 0) {
        setActiveService(srvs[0]);
      } else {
        setActiveService(null);
      }
    }
  };

  const refreshUserData = async () => {
    if (!user) return;
    const fresh = await repository.getProfileById(user.id);
    if (fresh) {
      setUser(fresh);
      await loadUserServices(fresh);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedId = typeof window !== 'undefined' ? localStorage.getItem(AUTH_STORAGE_KEY) : null;
        if (storedId) {
          const profile = await repository.getProfileById(storedId);
          if (profile && profile.active) {
            setUser(profile);
            if (profile.desk_number) {
              setDeskNumberState(profile.desk_number);
            }
            await loadUserServices(profile);
          } else {
            localStorage.removeItem(AUTH_STORAGE_KEY);
          }
        }
      } catch (e) {
        console.error('Error loading initial user:', e);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (email: string, _password?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const profile = await repository.getProfileByEmail(email);
      if (!profile) {
        return { success: false, error: 'No se encontró ninguna cuenta registrada con este correo.' };
      }
      if (!profile.active) {
        return { success: false, error: 'Esta cuenta ha sido desactivada por el administrador.' };
      }

      setUser(profile);
      if (profile.desk_number) {
        setDeskNumber(profile.desk_number);
      }
      localStorage.setItem(AUTH_STORAGE_KEY, profile.id);
      await loadUserServices(profile);

      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message || 'Error al iniciar sesión' };
    }
  };

  const switchUser = async (profileId: string) => {
    const profile = await repository.getProfileById(profileId);
    if (profile && profile.active) {
      setUser(profile);
      if (profile.desk_number) {
        setDeskNumber(profile.desk_number);
      }
      localStorage.setItem(AUTH_STORAGE_KEY, profile.id);
      await loadUserServices(profile);
    }
  };

  const logout = () => {
    setUser(null);
    setAssignedServices([]);
    setActiveService(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        assignedServices,
        activeService,
        setActiveService,
        deskNumber,
        setDeskNumber,
        isLoading,
        login,
        switchUser,
        logout,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
