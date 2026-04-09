/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AnimeApp from './components/AnimeApp';
import AdminLayout from './admin/AdminLayout';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ShieldCheck, User as UserIcon } from 'lucide-react';
import * as React from 'react';
import DevSwitcher from './components/DevSwitcher';

export default function App() {
  return (
    <AuthProvider>
      <TooltipProvider>
        <Routes>
          <Route path="/admin/*" element={<AdminLayout />} />
          <Route path="/*" element={<AnimeApp />} />
        </Routes>
        <DevSwitcher />
      </TooltipProvider>
    </AuthProvider>
  );
}

