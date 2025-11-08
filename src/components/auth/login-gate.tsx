"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plane, Lock, AlertCircle } from "lucide-react";

interface LoginGateProps {
  onLogin: (password: string) => boolean;
}

export function LoginGate({ onLogin }: LoginGateProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const success = onLogin(password);

    if (!success) {
      setError('Incorrect password. Please try again.');
      setPassword('');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-robair-light flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg border-0">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-robair-green">
              <Plane className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-robair-black">
                Welcome to Rob Air
              </CardTitle>
              <CardDescription className="text-robair-black/70 mt-2">
                Enter the access code to continue to your flight dashboard
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-robair-black">
                  Access Code
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-robair-black/50" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter access code"
                    className="pl-10"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center space-x-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-robair-green hover:bg-robair-green/90"
                disabled={isLoading}
              >
                {isLoading ? 'Verifying...' : 'Access Dashboard'}
              </Button>
            </form>

            <div className="mt-6 text-center text-xs text-robair-black/50">
              Rob Air Flight Tracking System
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}