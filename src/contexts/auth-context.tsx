"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const CORRECT_PASSWORD = process.env.NEXT_PUBLIC_SITE_PASSWORD || "trevor";

  useEffect(() => {
    // Minimal timeout to handle Safari hydration
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined') {
        try {
          const authStatus = localStorage.getItem('robair-authenticated');
          if (authStatus === 'true') {
            setIsAuthenticated(true);
          }
        } catch (error) {
          // Handle localStorage errors (private browsing, storage quota, etc.)
          console.warn('localStorage access failed:', error);
        }
      }
      setIsLoading(false);
    }, 100); // Short delay for Safari

    return () => clearTimeout(timer);
  }, []);

  const login = (password: string): boolean => {
    if (password === CORRECT_PASSWORD) {
      setIsAuthenticated(true);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('robair-authenticated', 'true');
        } catch (error) {
          console.warn('localStorage write failed:', error);
        }
      }
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('robair-authenticated');
      } catch (error) {
        console.warn('localStorage remove failed:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-robair-light flex items-center justify-center">
        <div className="text-robair-black">Loading...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}