import * as React from 'react';
import { signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldCheck, Chrome } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function AdminLogin() {
  const { t } = useLanguage();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = React.useState<string | null>(null);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (profile && profile.role !== 'user') {
      navigate('/admin');
    }
  }, [profile, navigate]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email.toLowerCase().trim(), password);
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password authentication is not enabled. Please enable it in the Firebase Console under Authentication > Sign-in method.');
      } else {
        setError(err.message || 'Login failed. Please check your credentials.');
      }
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError('Google login failed.');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]" />
      </div>

      <Card className="w-full max-w-md bg-card border-border relative z-10">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-blue-500/10 flex items-center justify-center">
            <ShieldCheck className="h-10 w-10 text-blue-500" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold tracking-tight text-foreground">{t('admin_panel')}</CardTitle>
            <CardDescription className="text-muted-foreground">
              {t('sign_in_desc')}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
              {error}
            </div>
          )}
          
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">{t('email')}</label>
              <Input 
                type="email" 
                placeholder="admin@meteordub.uz" 
                className="bg-muted border-border h-12"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">{t('password')}</label>
              <Input 
                type="password" 
                placeholder="••••••••" 
                className="bg-muted border-border h-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button 
              type="submit"
              className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl"
              disabled={isLoading}
            >
              {isLoading ? '...' : t('sign_in_btn')}
            </Button>
          </form>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">{t('or_continue')}</span>
            </div>
          </div>

          <Button 
            onClick={handleGoogleLogin}
            variant="outline"
            className="w-full h-12 border-border hover:bg-muted text-foreground font-bold rounded-xl"
          >
            <Chrome className="mr-2 h-5 w-5" />
            {t('sign_in_btn')} with Google
          </Button>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Only users with uploader, support, or superadmin roles can access this area.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
