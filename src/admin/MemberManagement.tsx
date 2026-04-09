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
import { UserProfile } from '../types';
import { cn } from '@/lib/utils';

const MOCK_USERS: UserProfile[] = [
  { uid: '1', email: 'user1@example.com', username: 'john_doe', firstName: 'John', lastName: 'Doe', birthYear: 1995, role: 'user', status: 'premium', createdAt: Date.now() },
  { uid: '2', email: 'user2@example.com', username: 'jane_smith', firstName: 'Jane', lastName: 'Smith', birthYear: 1998, role: 'user', status: 'standard', createdAt: Date.now() },
  { uid: '3', email: 'admin@example.com', username: 'super_admin', firstName: 'Super', lastName: 'Admin', birthYear: 1990, role: 'superadmin', status: 'premium', createdAt: Date.now() },
];

export default function MemberManagement() {
  const [users, setUsers] = React.useState<UserProfile[]>(MOCK_USERS);
  const [editingUser, setEditingUser] = React.useState<UserProfile | null>(null);

  const handleUpdateUser = () => {
    if (!editingUser) return;
    setUsers(users.map(u => u.uid === editingUser.uid ? editingUser : u));
    setEditingUser(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Member Management</h2>
          <p className="text-zinc-500 text-sm">View and edit user profiles, subscription status, and roles.</p>
        </div>
        <Button className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl h-11 px-6">
          <UserPlus className="mr-2 h-5 w-5" />
          Add New Member
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input placeholder="Search members by name or email..." className="pl-10 bg-zinc-900 border-none" />
        </div>
        <Button variant="outline" className="border-zinc-800">
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/50">
              <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Member</th>
              <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Status</th>
              <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Role</th>
              <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Joined</th>
              <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.uid} className="border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold">
                      {user.firstName[0]}{user.lastName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-zinc-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <Badge className={cn(
                    "text-[10px] px-2 py-0.5",
                    user.status === 'premium' ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/50" : "bg-zinc-500/20 text-zinc-400 border-zinc-800"
                  )}>
                    {user.status.toUpperCase()}
                  </Badge>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    {user.role === 'superadmin' ? <Shield className="h-3 w-3 text-red-500" /> : <UserIcon className="h-3 w-3 text-zinc-500" />}
                    <span className="text-xs capitalize">{user.role}</span>
                  </div>
                </td>
                <td className="p-4 text-xs text-zinc-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Dialog open={!!editingUser && editingUser.uid === user.uid} onOpenChange={(open) => !open && setEditingUser(null)}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => setEditingUser(user)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
                        <DialogHeader>
                          <DialogTitle>Edit Member Profile</DialogTitle>
                        </DialogHeader>
                        {editingUser && (
                          <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-xs font-medium text-zinc-500">First Name</label>
                                <Input 
                                  value={editingUser.firstName} 
                                  onChange={(e) => setEditingUser({ ...editingUser, firstName: e.target.value })}
                                  className="bg-zinc-900 border-zinc-800"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-xs font-medium text-zinc-500">Last Name</label>
                                <Input 
                                  value={editingUser.lastName} 
                                  onChange={(e) => setEditingUser({ ...editingUser, lastName: e.target.value })}
                                  className="bg-zinc-900 border-zinc-800"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-medium text-zinc-500">Birth Year</label>
                              <Input 
                                type="number"
                                value={editingUser.birthYear || ''} 
                                onChange={(e) => setEditingUser({ ...editingUser, birthYear: parseInt(e.target.value) })}
                                className="bg-zinc-900 border-zinc-800"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-medium text-zinc-500">Subscription Status</label>
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
                              <label className="text-xs font-medium text-zinc-500">Role</label>
                              <select 
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg h-10 px-3 outline-none"
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
                          <Button variant="ghost" onClick={() => setEditingUser(null)}>Cancel</Button>
                          <Button className="bg-blue-500 hover:bg-blue-600" onClick={handleUpdateUser}>Save Changes</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
