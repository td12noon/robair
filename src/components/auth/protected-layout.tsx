"use client";

import { useAuth } from '@/contexts/auth-context';
import { LoginGate } from './login-gate';
import { Navigation } from '@/components/layout/navigation';

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const { isAuthenticated, login } = useAuth();

  if (!isAuthenticated) {
    return <LoginGate onLogin={login} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}