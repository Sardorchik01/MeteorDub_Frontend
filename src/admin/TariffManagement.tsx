import * as React from 'react';
import { 
  Plus, Search, Edit, Trash2, 
  ExternalLink, CreditCard, Settings2,
  CheckCircle2, AlertCircle, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogTrigger, DialogFooter 
} from '@/components/ui/dialog';
import { Tariff } from '../types';
import { db } from '../lib/firebase';
import { useLanguage } from '../contexts/LanguageContext';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { cn } from '@/lib/utils';

export default function TariffManagement() {
  const { t } = useLanguage();
  const [tariffs, setTariffs] = React.useState<Tariff[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [editingTariff, setEditingTariff] = React.useState<Tariff | null>(null);
  const [formData, setFormData] = React.useState<Partial<Tariff>>({
    name: '',
    description: '',
    buttonLabel: 'Upgrade Now',
    redirectUrl: '',
    price: ''
  });

  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const q = query(collection(db, 'tariffs'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Tariff[];
      setTariffs(data);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    if (!formData.name || !formData.redirectUrl) {
      alert('Please fill in required fields (Name and Redirect URL)');
      return;
    }

    try {
      if (editingTariff) {
        await updateDoc(doc(db, 'tariffs', editingTariff.id), {
          ...formData,
          updatedAt: Date.now()
        });
      } else {
        await addDoc(collection(db, 'tariffs'), {
          ...formData,
          createdAt: Date.now()
        });
      }
      setIsAddDialogOpen(false);
      setEditingTariff(null);
      setFormData({ name: '', description: '', buttonLabel: 'Upgrade Now', redirectUrl: '', price: '' });
    } catch (error) {
      console.error('Error saving tariff:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // First clear the deletingId to close the dialog immediately
      setDeletingId(null);
      // Then perform the deletion in Firestore
      await deleteDoc(doc(db, 'tariffs', id));
    } catch (error) {
      console.error('Error deleting tariff:', error);
      // If it fails, we might want to notify the user, but onSnapshot will handle the UI state
    }
  };

  const openEdit = (tariff: Tariff) => {
    setEditingTariff(tariff);
    setFormData(tariff);
    setIsAddDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{t('tariffs')}</h2>
          <p className="text-muted-foreground text-sm">Create and manage access plans for your content.</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) {
            setEditingTariff(null);
            setFormData({ name: '', description: '', buttonLabel: 'Upgrade Now', redirectUrl: '', price: '' });
          }
        }}>
          <DialogTrigger render={<Button className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl h-11 px-6" />}>
            <Plus className="mr-2 h-5 w-5" />
            {t('add_new')}
          </DialogTrigger>
          <DialogContent className="bg-card border-border text-foreground max-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                {editingTariff ? t('edit') : t('add_new')}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">{t('tariff_plan')} *</label>
                <Input 
                  placeholder="e.g. Premium VIP" 
                  className="bg-muted border-border"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">{t('price')} (Optional)</label>
                <Input 
                  placeholder="e.g. $9.99/mo" 
                  className="bg-muted border-border"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">{t('anime_desc')}</label>
                <textarea 
                  placeholder="What does this tariff offer?" 
                  className="w-full bg-muted border border-border rounded-lg p-3 min-h-[80px] text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">{t('button_label')}</label>
                <Input 
                  placeholder="e.g. Upgrade Now" 
                  className="bg-muted border-border"
                  value={formData.buttonLabel}
                  onChange={(e) => setFormData({ ...formData, buttonLabel: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">{t('redirect_url')} (Telegram Bot, etc.) *</label>
                <Input 
                  placeholder="https://t.me/your_bot" 
                  className="bg-muted border-border"
                  value={formData.redirectUrl}
                  onChange={(e) => setFormData({ ...formData, redirectUrl: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)}>{t('cancel')}</Button>
              <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={handleSave}>
                {editingTariff ? t('save') : t('add_new')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tariffs.map((tariff) => (
            <Card key={tariff.id} className="bg-card border-border hover:border-blue-500/50 transition-all group">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => openEdit(tariff)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500" onClick={() => setDeletingId(tariff.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-xl font-bold mt-4">{tariff.name}</CardTitle>
                <p className="text-blue-500 font-bold text-sm">{tariff.price || 'Free'}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">{tariff.description}</p>
                <div className="pt-4 border-t border-border space-y-2">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-widest">
                    <span>Button Label</span>
                    <span className="text-foreground">{tariff.buttonLabel}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-widest">
                    <span>Redirect</span>
                    <span className="text-foreground truncate max-w-[150px]">{tariff.redirectUrl}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {tariffs.length === 0 && (
            <div className="md:col-span-3 py-20 text-center border-2 border-dashed border-border rounded-3xl">
              <Settings2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No tariffs created yet. Create one to start restricting content.</p>
            </div>
          )}
        </div>
      )}

      <Dialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <DialogContent className="bg-card border-border text-foreground max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Tariff</DialogTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Are you sure you want to delete this tariff? This action cannot be undone and may affect users subscribed to this plan.
            </p>
          </DialogHeader>
          <DialogFooter className="mt-6 gap-2">
            <Button variant="ghost" onClick={() => setDeletingId(null)}>Cancel</Button>
            <Button 
              className="bg-red-500 hover:bg-red-600 text-white" 
              onClick={() => deletingId && handleDelete(deletingId)}
            >
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
