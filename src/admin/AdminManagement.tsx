import * as React from 'react';
import { 
  Shield, ShieldCheck, ShieldAlert, 
  UserPlus, MoreVertical, Trash2, Edit, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogTrigger, DialogFooter 
} from '@/components/ui/dialog';
import { UserProfile, UserRole } from '../types';
import { cn } from '@/lib/utils';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, where, doc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';

export default function AdminManagement() {
  const { t } = useLanguage();
  const [admins, setAdmins] = React.useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [newAdmin, setNewAdmin] = React.useState<Partial<UserProfile>>({
    role: 'uploader',
    status: 'standard'
  });

  const HARDCODED_ADMIN_EMAIL = "abdulazizov0117@gmail.com";

  React.useEffect(() => {
    const q = query(collection(db, 'users'), where('role', 'in', ['uploader', 'support', 'superadmin']));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })) as UserProfile[];
      setAdmins(data);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddAdmin = async () => {
    if (!newAdmin.email || !newAdmin.firstName) return;
    try {
      await addDoc(collection(db, 'users'), {
        ...newAdmin,
        createdAt: Date.now(),
        status: 'premium'
      });
      setIsAddDialogOpen(false);
      setNewAdmin({ role: 'uploader', status: 'standard' });
    } catch (error) {
      console.error('Error adding admin:', error);
    }
  };

  const handleDeleteAdmin = async (admin: UserProfile) => {
    if (admin.email.toLowerCase() === HARDCODED_ADMIN_EMAIL) {
      alert("This system administrator cannot be deleted.");
      return;
    }
    if (!confirm(`Are you sure you want to delete ${admin.firstName}?`)) return;
    try {
      await deleteDoc(doc(db, 'users', admin.uid));
    } catch (error) {
      console.error('Error deleting admin:', error);
    }
  };

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
          <h2 className="text-2xl font-bold">{t('admins')}</h2>
          <p className="text-muted-foreground text-sm">Manage administrative roles and permissions.</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger render={<Button className="bg-red-500 hover:bg-red-600 text-white rounded-xl h-11 px-6" />}>
            <UserPlus className="mr-2 h-5 w-5" />
            {t('add_new')}
          </DialogTrigger>
          <DialogContent className="bg-card border-border text-foreground">
            <DialogHeader>
              <DialogTitle>{t('add_new')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">{t('first_name')}</label>
                  <Input 
                    placeholder="Admin"
                    value={newAdmin.firstName || ''} 
                    onChange={(e) => setNewAdmin({ ...newAdmin, firstName: e.target.value })}
                    className="bg-muted border-border"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">{t('last_name')}</label>
                  <Input 
                    placeholder="User"
                    value={newAdmin.lastName || ''} 
                    onChange={(e) => setNewAdmin({ ...newAdmin, lastName: e.target.value })}
                    className="bg-muted border-border"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">{t('email')}</label>
                <Input 
                  type="email"
                  placeholder="admin@meteordub.uz"
                  value={newAdmin.email || ''} 
                  onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  className="bg-muted border-border"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">{t('role')}</label>
                <select 
                  className="w-full bg-muted border border-border rounded-lg h-10 px-3 outline-none"
                  value={newAdmin.role}
                  onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value as any })}
                >
                  <option value="uploader">Uploader</option>
                  <option value="support">Support</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)}>{t('cancel')}</Button>
              <Button className="bg-red-500 hover:bg-red-600 text-white" onClick={handleAddAdmin}>{t('add_new')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Role Definitions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-muted/50 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="h-4 w-4 text-red-500" />
                <span className="font-bold text-sm">Super Admin</span>
              </div>
              <p className="text-xs text-muted-foreground">Full access to all system features including admin management and financial data.</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/50 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-blue-500" />
                <span className="font-bold text-sm">Anime Uploader</span>
              </div>
              <p className="text-xs text-muted-foreground">Can manage the anime catalog, upload videos, and edit metadata.</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/50 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="h-4 w-4 text-green-500" />
                <span className="font-bold text-sm">Support Admin</span>
              </div>
              <p className="text-xs text-muted-foreground">Can manage members, edit profiles, and handle support tickets.</p>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-4">
          {admins.map((admin) => {
            const Icon = roleIcons[admin.role] || Shield;
            return (
              <Card key={admin.uid} className="bg-card border-border hover:border-accent transition-colors">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", roleColors[admin.role])}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-bold">{admin.firstName} {admin.lastName}</h4>
                      <p className="text-xs text-muted-foreground">{admin.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <Badge variant="outline" className={cn("capitalize", roleColors[admin.role])}>
                      {admin.role}
                    </Badge>
                    <div className="flex items-center gap-2">
                      {admin.email.toLowerCase() !== HARDCODED_ADMIN_EMAIL && (
                        <>
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-muted-foreground hover:text-red-500"
                            onClick={() => handleDeleteAdmin(admin)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {admin.email.toLowerCase() === HARDCODED_ADMIN_EMAIL && (
                        <Badge className="bg-muted text-muted-foreground border-border">SYSTEM</Badge>
                      )}
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
