import * as React from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldCheck, Chrome } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AdminLogin() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (profile && profile.role !== 'user') {
      navigate('/admin');
    }
  }, [profile, navigate]);

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      // AuthContext will handle profile fetching and redirection
    } catch (err) {
      setError('Login failed. Please try again.');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]" />
      </div>

      <Card className="w-full max-w-md bg-zinc-950 border-zinc-800 relative z-10">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-blue-500/10 flex items-center justify-center">
            <ShieldCheck className="h-10 w-10 text-blue-500" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold tracking-tight text-white">Admin Access</CardTitle>
            <CardDescription className="text-zinc-500">
              Please sign in with your authorized admin account.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
              {error}
            </div>
          )}
          
          <Button 
            onClick={handleGoogleLogin}
            className="w-full h-12 bg-white hover:bg-zinc-200 text-black font-bold rounded-xl"
          >
            <Chrome className="mr-2 h-5 w-5" />
            Sign in with Google
          </Button>

          <div className="text-center">
            <p className="text-xs text-zinc-600">
              Only users with uploader, support, or superadmin roles can access this area.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
