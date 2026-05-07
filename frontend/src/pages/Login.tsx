import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Layers, ArrowLeft, Loader2 } from 'lucide-react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!password) {
      toast.error("Please enter your password");
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="flex flex-col justify-center px-8 md:px-16 lg:px-24 xl:px-32 relative">
        <div className="absolute top-8 left-8 md:top-12 md:left-12 flex flex-col gap-4">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center transition-transform group-hover:-translate-x-0.5">
              <Layers className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight">Taskky</span>
          </Link>
          <Button variant="ghost" size="sm" className="w-fit h-8 px-0 text-muted-foreground hover:text-foreground hover:bg-transparent -ml-1 group" asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-1" />
              <span className="text-xs font-medium">Back to website</span>
            </Link>
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm mx-auto"
        >
          <div className="text-center md:text-left mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome back</h1>
            <p className="text-muted-foreground text-sm">
              Enter your details below to sign in to your workspace
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="m@example.com" required className="h-11" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link to="#" className="text-xs font-medium text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input id="password" type="password" required className="h-11" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="remember" />
              <label htmlFor="remember" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Remember me
              </label>
            </div>

            <Button type="submit" className="w-full h-11 rounded-xl font-semibold shadow-lg shadow-primary/20" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary font-semibold hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </motion.div>
      </div>

      <div className="hidden lg:block relative overflow-hidden bg-background">
        <motion.img 
            initial={{ scale: 1.05 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            src="/assets/auth-banner.png" 
            alt="Taskky Illustration" 
            className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Premium Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/30 to-transparent mix-blend-normal"></div>
        <div className="absolute inset-0 bg-primary/5 mix-blend-overlay"></div>
        
        <div className="h-full w-full flex flex-col justify-end relative z-10 p-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="p-8 rounded-3xl border border-white/20 dark:border-white/10 shadow-2xl backdrop-blur-xl bg-white/30 dark:bg-black/40"
          >
            <blockquote className="text-xl md:text-2xl font-medium mb-8 text-foreground leading-relaxed">
              "Taskky transformed how our remote team operates. We ship 30% faster and have zero alignment issues. It's the standard."
            </blockquote>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden border border-white/40 shadow-sm">
                <img src="/harsh.png" alt="Harsh Narayan Singh" className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="font-semibold text-foreground">Harsh Narayan Singh</div>
                <div className="text-sm text-foreground/80">Founder & CEO, Taskky</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
