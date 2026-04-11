import * as React from 'react';
import { 
  Plus, Search, Edit, Trash2, 
  Bot, Shield, Save, Loader2,
  CheckCircle2, XCircle, Key
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogTrigger, DialogFooter 
} from '@/components/ui/dialog';
import { AIModelConfig } from '../types';
import { db } from '../lib/firebase';
import { useLanguage } from '../contexts/LanguageContext';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { cn } from '@/lib/utils';

export default function AISettings() {
  const { t } = useLanguage();
  const [configs, setConfigs] = React.useState<AIModelConfig[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [editingConfig, setEditingConfig] = React.useState<AIModelConfig | null>(null);
  const [formData, setFormData] = React.useState<Partial<AIModelConfig>>({
    name: '',
    provider: 'gemini',
    apiKey: '',
    modelName: '',
    isEnabled: true,
    isDefault: false
  });

  React.useEffect(() => {
    const q = query(collection(db, 'ai_configs'), orderBy('updatedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AIModelConfig[];
      setConfigs(data);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    if (!formData.name || !formData.apiKey || !formData.modelName) {
      alert('Please fill all required fields');
      return;
    }

    try {
      const data = {
        ...formData,
        updatedAt: Date.now()
      };

      if (editingConfig) {
        await updateDoc(doc(db, 'ai_configs', editingConfig.id), data);
      } else {
        // If this is the first config, make it default
        if (configs.length === 0) data.isDefault = true;
        await addDoc(collection(db, 'ai_configs'), data);
      }
      setIsAddDialogOpen(false);
      setEditingConfig(null);
      setFormData({ name: '', provider: 'gemini', apiKey: '', modelName: '', isEnabled: true, isDefault: false });
    } catch (error) {
      console.error('Error saving AI config:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this AI configuration?')) return;
    try {
      await deleteDoc(doc(db, 'ai_configs', id));
    } catch (error) {
      console.error('Error deleting AI config:', error);
    }
  };

  const setDefault = async (id: string) => {
    try {
      // Unset current default
      const currentDefault = configs.find(c => c.isDefault);
      if (currentDefault) {
        await updateDoc(doc(db, 'ai_configs', currentDefault.id), { isDefault: false });
      }
      // Set new default
      await updateDoc(doc(db, 'ai_configs', id), { isDefault: true });
    } catch (error) {
      console.error('Error setting default AI:', error);
    }
  };

  const openEdit = (config: AIModelConfig) => {
    setEditingConfig(config);
    setFormData(config);
    setIsAddDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{t('ai_settings')}</h2>
          <p className="text-muted-foreground text-sm">Manage multiple AI models and API keys for the chatbot.</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) {
            setEditingConfig(null);
            setFormData({ name: '', provider: 'gemini', apiKey: '', modelName: '', isEnabled: true, isDefault: false });
          }
        }}>
          <DialogTrigger render={<Button className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl h-11 px-6" />}>
            <Plus className="mr-2 h-5 w-5" />
            {t('add_new')}
          </DialogTrigger>
          <DialogContent className="bg-card border-border text-foreground max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                {editingConfig ? t('edit') : t('add_new')}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">{t('first_name')}</label>
                  <Input 
                    placeholder="e.g. Gemini Pro"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-muted border-border"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">{t('role')}</label>
                  <select 
                    className="w-full bg-muted border border-border rounded-lg h-10 px-3 outline-none"
                    value={formData.provider}
                    onChange={(e) => setFormData({ ...formData, provider: e.target.value as any })}
                  >
                    <option value="gemini">Google Gemini</option>
                    <option value="openai">OpenAI (GPT)</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Model Name (ID)</label>
                <Input 
                  placeholder="e.g. gemini-1.5-pro"
                  value={formData.modelName}
                  onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                  className="bg-muted border-border"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">API Key</label>
                <div className="relative">
                  <Input 
                    type="password"
                    placeholder="sk-..."
                    value={formData.apiKey}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    className="bg-muted border-border pr-10"
                  />
                  <Key className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="isEnabled"
                    checked={formData.isEnabled}
                    onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
                    className="h-4 w-4 rounded border-border bg-muted"
                  />
                  <label htmlFor="isEnabled" className="text-sm text-muted-foreground">Enabled</label>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="isDefault"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="h-4 w-4 rounded border-border bg-muted"
                  />
                  <label htmlFor="isDefault" className="text-sm text-muted-foreground">Set as Default</label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)}>{t('cancel')}</Button>
              <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                {editingConfig ? t('save') : t('add_new')}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {configs.map((config) => (
            <Card key={config.id} className={cn(
              "bg-card border-border transition-all",
              !config.isEnabled && "opacity-60",
              config.isDefault && "border-blue-500/50 bg-blue-500/5"
            )}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "h-12 w-12 rounded-xl flex items-center justify-center",
                      config.isEnabled ? "bg-blue-500/10 text-blue-500" : "bg-muted text-muted-foreground"
                    )}>
                      <Bot className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold">{config.name}</h4>
                        {config.isDefault && <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded font-bold">DEFAULT</span>}
                      </div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">{config.provider} • {config.modelName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!config.isDefault && config.isEnabled && (
                      <Button variant="ghost" size="sm" className="text-blue-500 hover:text-blue-400 h-8" onClick={() => setDefault(config.id)}>
                        {t('make_default')}
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => openEdit(config)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500" onClick={() => handleDelete(config.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {config.isEnabled ? (
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-500" />
                    )}
                    <span className="text-[10px] text-muted-foreground">{config.isEnabled ? 'Active' : 'Inactive'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Key className="h-3 w-3 text-muted-foreground/50" />
                    <span className="text-[10px] text-muted-foreground/50">••••••••••••</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
