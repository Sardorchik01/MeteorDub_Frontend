/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AnimeApp from './components/AnimeApp';
import AdminLayout from './admin/AdminLayout';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { ShieldCheck, User as UserIcon } from 'lucide-react';
import * as React from 'react';

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <LanguageProvider>
          <NotificationProvider>
            <TooltipProvider>
              <Routes>
                <Route path="/admin/*" element={<AdminLayout />} />
                <Route path="/*" element={<AnimeApp />} />
              </Routes>
            </TooltipProvider>
          </NotificationProvider>
        </LanguageProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

