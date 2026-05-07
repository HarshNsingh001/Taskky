import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Layers, ArrowLeft, Loader2, Copy, Check } from 'lucide-react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const navigate = useNavigate();
  const { signup, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin');
  const [inviteCode, setInviteCode] = useState('');
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [generatedInviteCode, setGeneratedInviteCode] = useState('');
  const [copied, setCopied] = useState(false);

  if (user && !showInviteCode) {
    return <Navigate to="/dashboard" replace />;
  }

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePassword = (pass: string) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/.test(pass);
  };

  const handleCopyInviteCode = async () => {
    try {
      await navigator.clipboard.writeText(generatedInviteCode);
      setCopied(true);
      toast.success("Invite code copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Please enter your full name");
      return;
    }

    if (!validateEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!validatePassword(password)) {
      toast.error("Password must be at least 8 characters and include uppercase, lowercase, numbers, and special characters");
      return;
    }

    if (role === 'member' && !inviteCode.trim()) {
      toast.error("Team invite code is required to join as a member");
      return;
    }

    setLoading(true);
    try {
      const org = await signup(`${firstName} ${lastName}`, email, password, role, inviteCode);
      toast.success("Account created successfully!");
      
      if (role === 'admin' && org) {
        // Show the invite code to the admin
        setGeneratedInviteCode(org.invite_code);
        setShowInviteCode(true);
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      const msg = err?.message || "Signup failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Show invite code screen after admin signup
  if (showInviteCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md text-center space-y-8"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Layers className="w-8 h-8 text-primary" />
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Workspace Created! 🎉</h1>
            <p className="text-muted-foreground text-sm">
              Share this invite code with your team members so they can join your workspace.
            </p>
          </div>

          <div className="bg-muted/50 border border-border rounded-2xl p-6 space-y-4">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Team Invite Code</Label>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-card border border-border rounded-xl px-4 py-3 text-xl font-mono font-bold tracking-wider text-foreground">
                {generatedInviteCode}
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-xl shrink-0"
                onClick={handleCopyInviteCode}
              >
                {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Members will use this code during signup to join your workspace automatically.
            </p>
          </div>

          <Button
            className="w-full h-11 rounded-xl font-semibold shadow-lg shadow-primary/20"
            onClick={() => navigate('/dashboard')}
          >
            Go to Dashboard →
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background flex-row-reverse">
      <div className="hidden lg:block relative bg-slate-900 text-white p-12 overflow-hidden order-1 lg:order-2">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2670&auto=format&fit=crop')] opacity-20 object-cover bg-center"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>

        <div className="h-full w-full flex flex-col justify-end relative z-10 p-8">
          <blockquote className="text-2xl font-serif italic mb-6">
            "Taskky transformed how our remote team operates. We ship 30% faster and have zero alignment issues. It's the standard."
          </blockquote>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20">
              <img src="/harsh.png" alt="Harsh Narayan Singh" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="font-semibold">Harsh Narayan Singh</div>
              <div className="text-sm text-slate-400">Founder & CEO, Taskky</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-center px-8 md:px-16 lg:px-24 xl:px-32 relative order-2 lg:order-1">
        <div className="absolute top-8 left-8 md:top-12 md:left-12 flex flex-col gap-4">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center transition-transform group-hover:-translate-x-0.5">
              <Layers className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-foreground">Taskky</span>
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
          className="w-full max-w-sm mx-auto mt-20 lg:mt-0"
        >
          <div className="text-center md:text-left mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Create an account</h1>
            <p className="text-muted-foreground text-sm">
              Start your 14-day free trial. No credit card required.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-3 pb-2">
                <Label>I want to...</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div 
                    className={`border rounded-md p-3 cursor-pointer transition-colors text-sm ${role === 'admin' ? 'border-primary bg-primary/5 text-primary font-medium' : 'border-border text-muted-foreground hover:bg-muted/50'}`}
                    onClick={() => { setRole('admin'); setInviteCode(''); }}
                  >
                    Create a new Team
                    <span className="block text-[10px] opacity-70 mt-1">Sign up as Admin</span>
                  </div>
                  <div 
                    className={`border rounded-md p-3 cursor-pointer transition-colors text-sm ${role === 'member' ? 'border-primary bg-primary/5 text-primary font-medium' : 'border-border text-muted-foreground hover:bg-muted/50'}`}
                    onClick={() => setRole('member')}
                  >
                    Join existing Team
                    <span className="block text-[10px] opacity-70 mt-1">Sign up as Member</span>
                  </div>
                </div>
              </div>

              {role === 'member' && (
                <div className="space-y-2">
                  <Label htmlFor="inviteCode">Team Invite Code</Label>
                  <Input id="inviteCode" placeholder="e.g. TASKKY-A3F8X2" required className="h-11 font-mono uppercase tracking-wider" value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} />
                  <p className="text-[10px] text-muted-foreground">Ask your team admin for the invite code</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input id="firstName" placeholder="Jane" required className="h-11" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input id="lastName" placeholder="Doe" required className="h-11" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Work Email</Label>
                <Input id="email" type="email" placeholder="jane@company.com" required className="h-11" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required className="h-11" value={password} onChange={(e) => setPassword(e.target.value)} />
                <p className="text-[10px] text-muted-foreground">Min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special character</p>
              </div>
            </div>

            <Button type="submit" className="w-full h-11 rounded-xl font-semibold shadow-lg shadow-primary/20" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Sign Up'
              )}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
