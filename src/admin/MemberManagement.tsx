import * as React from 'react';
import { 
  Search, Filter, MoreVertical, 
  Edit, Trash2, UserPlus, Mail,
  Calendar, Shield, Crown, User as UserIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogTrigger, DialogFooter 
} from '@/components/ui/dialog';
import { UserProfile, UserRole, Tariff } from '../types';
import { db } from '../lib/firebase';
import { useLanguage } from '../contexts/LanguageContext';
import { collection, onSnapshot, query, orderBy, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';


export default function MemberManagement() {
  const { t } = useLanguage();
  const [users, setUsers] = React.useState<UserProfile[]>([]);
  const [tariffs, setTariffs] = React.useState<Tariff[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [editingUser, setEditingUser] = React.useState<UserProfile | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [newUser, setNewUser] = React.useState<Partial<UserProfile>>({
    role: 'user',
    status: 'standard'
  });

  React.useEffect(() => {
    // Fetch Users
    const qUsers = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })) as UserProfile[];
      setUsers(data);
      setIsLoading(false);
    });

    // Fetch Tariffs
    const qTariffs = query(collection(db, 'tariffs'), orderBy('createdAt', 'desc'));
    const unsubTariffs = onSnapshot(qTariffs, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Tariff[];
      setTariffs(data);
    });

    return () => {
      unsubUsers();
      unsubTariffs();
    };
  }, []);

  const HARDCODED_ADMIN_EMAIL = "abdulazizov0117@gmail.com";

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    
    // Protect hardcoded superadmin
    if (editingUser.email.toLowerCase() === HARDCODED_ADMIN_EMAIL && editingUser.role !== 'superadmin') {
      alert("This system administrator's role cannot be changed.");
      return;
    }

    try {
      const { uid, ...updateData } = editingUser;
      await updateDoc(doc(db, 'users', uid), updateData);
      setEditingUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleDeleteUser = async (uid: string) => {
    try {
      await deleteDoc(doc(db, 'users', uid));
      setDeletingId(null);
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleAddUser = () => {
    const userToAdd = {
      ...newUser,
      uid: Date.now().toString(),
      createdAt: Date.now(),
    } as UserProfile;
    setUsers([userToAdd, ...users]);
    setIsAddDialogOpen(false);
    setNewUser({ role: 'user', status: 'standard' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{t('members')}</h2>
          <p className="text-zinc-500 text-sm">View and edit user profiles, subscription status, and roles.</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger render={<Button className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl h-11 px-6" />}>
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
                    placeholder="John"
                    value={newUser.firstName || ''} 
                    onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                    className="bg-muted border-border"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">{t('last_name')}</label>
                  <Input 
                    placeholder="Doe"
                    value={newUser.lastName || ''} 
                    onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                    className="bg-muted border-border"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">{t('email_or_username')}</label>
                <Input 
                  type="email"
                  placeholder="user@example.com"
                  value={newUser.email || ''} 
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="bg-muted border-border"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">{t('username')}</label>
                <Input 
                  placeholder="johndoe"
                  value={newUser.username || ''} 
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="bg-muted border-border"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">{t('role')}</label>
                <select 
                  className="w-full bg-muted border border-border rounded-lg h-10 px-3 outline-none"
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                >
                  <option value="user">User</option>
                  <option value="uploader">Uploader</option>
                  <option value="support">Support</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)}>{t('cancel')}</Button>
              <Button className="bg-blue-500 hover:bg-blue-600" onClick={handleAddUser}>{t('save')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4 bg-card p-4 rounded-2xl border border-border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t('search')} className="pl-10 bg-muted border-none" />
        </div>
        <Button variant="outline" className="border-border">
          <Filter className="mr-2 h-4 w-4" />
          {t('filter')}
        </Button>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('members')}</th>
              <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('status')}</th>
              <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('role')}</th>
              <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('joined_at')}</th>
              <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.uid} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold">
                      {user.firstName[0]}{user.lastName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <Badge className={cn(
                    "text-[10px] px-2 py-0.5",
                    user.status === 'premium' ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/50" : "bg-muted text-muted-foreground border-border"
                  )}>
                    {user.status === 'premium' ? (tariffs.find(t => t.id === user.tariffId)?.name || 'PREMIUM') : 'STANDARD'}
                  </Badge>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    {user.role === 'superadmin' ? <Shield className="h-3 w-3 text-red-500" /> : <UserIcon className="h-3 w-3 text-muted-foreground" />}
                    <span className="text-xs capitalize">{user.role}</span>
                  </div>
                </td>
                <td className="p-4 text-xs text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {user.email.toLowerCase() !== HARDCODED_ADMIN_EMAIL ? (
                        <>
                          <Dialog open={!!editingUser && editingUser.uid === user.uid} onOpenChange={(open) => !open && setEditingUser(null)}>
                            <DialogTrigger render={<Button variant="ghost" size="icon" onClick={() => setEditingUser(user)} />}>
                              <Edit className="h-4 w-4" />
                            </DialogTrigger>
                            <DialogContent className="bg-card border-border text-foreground">
                              <DialogHeader>
                                <DialogTitle>{t('edit')}</DialogTitle>
                              </DialogHeader>
                              {editingUser && (
                                <div className="space-y-4 py-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <label className="text-xs font-medium text-muted-foreground">{t('first_name')}</label>
                                      <Input 
                                        value={editingUser.firstName} 
                                        onChange={(e) => setEditingUser({ ...editingUser, firstName: e.target.value })}
                                        className="bg-muted border-border"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-xs font-medium text-muted-foreground">{t('last_name')}</label>
                                      <Input 
                                        value={editingUser.lastName} 
                                        onChange={(e) => setEditingUser({ ...editingUser, lastName: e.target.value })}
                                        className="bg-muted border-border"
                                      />
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground">{t('birth_year')}</label>
                                    <Input 
                                      type="number"
                                      value={editingUser.birthYear || ''} 
                                      onChange={(e) => setEditingUser({ ...editingUser, birthYear: parseInt(e.target.value) })}
                                      className="bg-muted border-border"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground">{t('status')}</label>
                                    <div className="flex gap-2">
                                      <Button 
                                        variant={editingUser.status === 'standard' ? 'default' : 'outline'}
                                        className="flex-1"
                                        onClick={() => setEditingUser({ ...editingUser, status: 'standard' })}
                                      >
                                        Standard
                                      </Button>
                                      <Button 
                                        variant={editingUser.status === 'premium' ? 'default' : 'outline'}
                                        className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                                        onClick={() => setEditingUser({ ...editingUser, status: 'premium' })}
                                      >
                                        Premium
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground">{t('tariff_plan')}</label>
                                    <select 
                                      className="w-full bg-muted border border-border rounded-lg h-10 px-3 outline-none"
                                      value={editingUser.tariffId || ''}
                                      onChange={(e) => setEditingUser({ ...editingUser, tariffId: e.target.value, status: e.target.value ? 'premium' : 'standard' })}
                                    >
                                      <option value="">None (Standard)</option>
                                      {tariffs.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground">{t('role')}</label>
                                    <select 
                                      className="w-full bg-muted border border-border rounded-lg h-10 px-3 outline-none"
                                      value={editingUser.role}
                                      onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
                                    >
                                      <option value="user">User</option>
                                      <option value="uploader">Uploader</option>
                                      <option value="support">Support</option>
                                      <option value="superadmin">Super Admin</option>
                                    </select>
                                  </div>
                                </div>
                              )}
                              <DialogFooter>
                                <Button variant="ghost" onClick={() => setEditingUser(null)}>{t('cancel')}</Button>
                                <Button className="bg-blue-500 hover:bg-blue-600" onClick={handleUpdateUser}>{t('save')}</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-red-500" onClick={() => setDeletingId(user.uid)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Badge className="bg-zinc-900 text-zinc-500 border-zinc-800">SYSTEM</Badge>
                      )}
                    </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <DialogContent className="bg-card border-border text-foreground max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('delete')}</DialogTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Are you sure you want to delete this member? This action cannot be undone.
            </p>
          </DialogHeader>
          <DialogFooter className="mt-6 gap-2">
            <Button variant="ghost" onClick={() => setDeletingId(null)}>{t('cancel')}</Button>
            <Button 
              className="bg-red-500 hover:bg-red-600 text-white" 
              onClick={() => deletingId && handleDeleteUser(deletingId)}
            >
              {t('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
