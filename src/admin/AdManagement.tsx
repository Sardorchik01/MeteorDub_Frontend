import * as React from 'react';
import { 
  Plus, Search, Edit, Trash2, 
  Layout, Eye, EyeOff, Save,
  Megaphone, AlertCircle, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogTrigger, DialogFooter 
} from '@/components/ui/dialog';
import { AdConfig } from '../types';
import { db } from '../lib/firebase';
import { useLanguage } from '../contexts/LanguageContext';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { cn } from '@/lib/utils';

export default function AdManagement() {
  const { t } = useLanguage();
  const [ads, setAds] = React.useState<AdConfig[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [editingAd, setEditingAd] = React.useState<AdConfig | null>(null);
  const [formData, setFormData] = React.useState<Partial<AdConfig>>({
    location: 'top',
    content: '',
    isEnabled: true
  });

  React.useEffect(() => {
    const q = query(collection(db, 'ads'), orderBy('updatedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AdConfig[];
      setAds(data);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    if (!formData.content) {
      alert('Please enter ad content (HTML/Script)');
      return;
    }

    try {
      if (editingAd) {
        await updateDoc(doc(db, 'ads', editingAd.id), {
          ...formData,
          updatedAt: Date.now()
        });
      } else {
        await addDoc(collection(db, 'ads'), {
          ...formData,
          updatedAt: Date.now()
        });
      }
      setIsAddDialogOpen(false);
      setEditingAd(null);
      setFormData({ location: 'top', content: '', isEnabled: true });
    } catch (error) {
      console.error('Error saving ad:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ad?')) return;
    try {
      await deleteDoc(doc(db, 'ads', id));
    } catch (error) {
      console.error('Error deleting ad:', error);
    }
  };

  const toggleStatus = async (ad: AdConfig) => {
    try {
      await updateDoc(doc(db, 'ads', ad.id), {
        isEnabled: !ad.isEnabled,
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const openEdit = (ad: AdConfig) => {
    setEditingAd(ad);
    setFormData(ad);
    setIsAddDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{t('ads')}</h2>
          <p className="text-muted-foreground text-sm">Manage Google Ads and custom banners for standard users.</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) {
            setEditingAd(null);
            setFormData({ location: 'top', content: '', isEnabled: true });
          }
        }}>
          <DialogTrigger render={<Button className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl h-11 px-6" />}>
            <Plus className="mr-2 h-5 w-5" />
            {t('add_new')}
          </DialogTrigger>
          <DialogContent className="bg-card border-border text-foreground max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                {editingAd ? t('edit') : t('add_new')}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">{t('placement_location')}</label>
                <select 
                  className="w-full bg-muted border border-border rounded-lg h-10 px-3 outline-none"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value as any })}
                >
                  <option value="top">Top Banner (Home)</option>
                  <option value="sidebar">Sidebar (Desktop)</option>
                  <option value="bottom">Bottom Banner (Home)</option>
                  <option value="popup">Popup (Coming Soon)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">{t('ad_content')}</label>
                <textarea 
                  placeholder="Paste your <ins> or <div> code here..." 
                  className="w-full bg-muted border border-border rounded-lg p-3 min-h-[150px] text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                />
                <p className="text-[10px] text-muted-foreground">
                  Tip: Use inline styles for custom banners (e.g., &lt;div style="color:red"&gt;...&lt;/div&gt;)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="isEnabled"
                  checked={formData.isEnabled}
                  onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
                  className="h-4 w-4 rounded border-border bg-muted"
                />
                <label htmlFor="isEnabled" className="text-sm text-muted-foreground">Enable this advertisement immediately</label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)}>{t('cancel')}</Button>
              <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                {editingAd ? t('save') : t('add_new')}
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
        <div className="grid grid-cols-1 gap-6">
          {ads.map((ad) => (
            <Card key={ad.id} className={cn(
              "bg-card border-border transition-all",
              !ad.isEnabled && "opacity-60"
            )}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={cn(
                      "h-12 w-12 rounded-xl flex items-center justify-center shrink-0",
                      ad.isEnabled ? "bg-blue-500/10 text-blue-500" : "bg-muted text-muted-foreground"
                    )}>
                      <Megaphone className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold capitalize">{ad.location} Placement</h4>
                        {!ad.isEnabled && <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">Disabled</span>}
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3 border border-border font-mono text-[10px] text-muted-foreground line-clamp-2">
                        {ad.content}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-2">
                        Last updated: {new Date(ad.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={cn(
                        "h-9 px-3",
                        ad.isEnabled ? "text-muted-foreground hover:text-yellow-500" : "text-blue-500 hover:text-blue-400"
                      )}
                      onClick={() => toggleStatus(ad)}
                    >
                      {ad.isEnabled ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                      {ad.isEnabled ? 'Disable' : 'Enable'}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground" onClick={() => openEdit(ad)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-red-500" onClick={() => handleDelete(ad.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {ads.length === 0 && (
            <div className="py-20 text-center border-2 border-dashed border-border rounded-3xl">
              <Layout className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No advertisements configured. Create one to show ads to standard users.</p>
            </div>
          )}
        </div>
      )}
      
      <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex gap-4">
        <AlertCircle className="h-5 w-5 text-blue-500 shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong className="text-blue-500">Note:</strong> Advertisements are automatically hidden for users with <span className="text-yellow-500">Premium</span> status. 
          Standard users and guest visitors will see these ads in the designated locations. 
          You can paste Google AdSense code or custom HTML banners here.
        </p>
      </div>
    </div>
  );
}
