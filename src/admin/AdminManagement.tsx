import * as React from 'react';
import { 
  Shield, ShieldCheck, ShieldAlert, 
  UserPlus, MoreVertical, Trash2, Edit
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserProfile, UserRole } from '../types';
import { cn } from '@/lib/utils';

const MOCK_ADMINS: UserProfile[] = [
  { uid: '3', email: 'admin@example.com', username: 'super_admin', firstName: 'Super', lastName: 'Admin', role: 'superadmin', status: 'premium', createdAt: Date.now() },
  { uid: '4', email: 'uploader@example.com', username: 'anime_uploader', firstName: 'Anime', lastName: 'Uploader', role: 'uploader', status: 'standard', createdAt: Date.now() },
  { uid: '5', email: 'support@example.com', username: 'support_pro', firstName: 'Support', lastName: 'Admin', role: 'support', status: 'standard', createdAt: Date.now() },
];

export default function AdminManagement() {
  const [admins, setAdmins] = React.useState<UserProfile[]>(MOCK_ADMINS);

  const roleIcons: Record<UserRole, any> = {
    superadmin: ShieldCheck,
    uploader: Shield,
    support: ShieldAlert,
    user: Shield, // Should not be in this list
  };

  const roleColors: Record<UserRole, string> = {
    superadmin: 'text-red-500 bg-red-500/10',
    uploader: 'text-blue-500 bg-blue-500/10',
    support: 'text-green-500 bg-green-500/10',
    user: 'text-zinc-500 bg-zinc-500/10',
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Admin Management</h2>
          <p className="text-zinc-500 text-sm">Manage administrative roles and permissions.</p>
        </div>
        <Button className="bg-red-500 hover:bg-red-600 text-white rounded-xl h-11 px-6">
          <UserPlus className="mr-2 h-5 w-5" />
          Add New Admin
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Role Definitions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="h-4 w-4 text-red-500" />
                <span className="font-bold text-sm">Super Admin</span>
              </div>
              <p className="text-xs text-zinc-500">Full access to all system features including admin management and financial data.</p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-blue-500" />
                <span className="font-bold text-sm">Anime Uploader</span>
              </div>
              <p className="text-xs text-zinc-500">Can manage the anime catalog, upload videos, and edit metadata.</p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="h-4 w-4 text-green-500" />
                <span className="font-bold text-sm">Support Admin</span>
              </div>
              <p className="text-xs text-zinc-500">Can manage members, edit profiles, and handle support tickets.</p>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-4">
          {admins.map((admin) => {
            const Icon = roleIcons[admin.role] || Shield;
            return (
              <Card key={admin.uid} className="bg-zinc-950 border-zinc-800 hover:border-zinc-700 transition-colors">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", roleColors[admin.role])}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-bold">{admin.firstName} {admin.lastName}</h4>
                      <p className="text-xs text-zinc-500">{admin.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <Badge variant="outline" className={cn("capitalize", roleColors[admin.role])}>
                      {admin.role}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-white">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
