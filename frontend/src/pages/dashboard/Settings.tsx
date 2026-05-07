import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { useState, useEffect } from 'react';
import { useTheme } from '../../components/theme-provider';
import { useAuth } from '../../context/AuthContext';
import { usersApi, organizationApi } from '../../lib/api';
import { toast } from 'sonner';
import { Edit2, Check, X, Loader2, Copy, Building2 } from 'lucide-react';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { user, updateUser, isAdmin } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [saving, setSaving] = useState(false);
  const [orgInfo, setOrgInfo] = useState<any>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      organizationApi.getInfo().then(res => {
        if (res.success && res.data) setOrgInfo(res.data);
      }).catch(() => {});
    }
  }, [isAdmin]);

  useEffect(() => {
    if (user?.full_name) setFullName(user.full_name);
  }, [user]);

  const handleSave = async () => {
    if (!fullName.trim() || fullName === user?.full_name) {
      setIsEditing(false);
      return;
    }
    setSaving(true);
    try {
      const res = await usersApi.updateMe({ full_name: fullName });
      if (res.success) {
        toast.success("Profile updated successfully");
        updateUser({ full_name: fullName });
        setIsEditing(false);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const userInitials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Manage your account preferences.</p>
      </div>

      <Tabs defaultValue="profile" className="flex flex-col space-y-6">
        <TabsList className="bg-muted/50 border border-border/50 p-1 w-full sm:w-fit h-auto inline-flex items-center">
          <TabsTrigger value="profile" className="text-sm px-6 py-1.5 data-[state=active]:shadow-sm">Profile</TabsTrigger>
          {isAdmin && <TabsTrigger value="workspace" className="text-sm px-6 py-1.5 data-[state=active]:shadow-sm">Workspace</TabsTrigger>}
          <TabsTrigger value="appearance" className="text-sm px-6 py-1.5 data-[state=active]:shadow-sm">Appearance</TabsTrigger>
          <TabsTrigger value="notifications" className="text-sm px-6 py-1.5 data-[state=active]:shadow-sm">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="m-0 space-y-6">
          <Card className="shadow-sm border-border/50">
            <CardHeader className="border-b border-border/40 flex flex-row items-center justify-between pb-4">
              <div className="space-y-1.5">
                <CardTitle className="text-base font-semibold">Personal Information</CardTitle>
                <CardDescription className="text-xs">Your profile information from your account.</CardDescription>
              </div>
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="h-8 gap-1.5">
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => { setIsEditing(false); setFullName(user?.full_name || ''); }} className="h-8 text-muted-foreground" disabled={saving}>
                    <X className="w-4 h-4" />
                  </Button>
                  <Button size="sm" onClick={handleSave} className="h-8 gap-1.5" disabled={saving}>
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Save
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 rounded-xl border-2 border-border/50">
                  <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold rounded-xl">{userInitials}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-sm">{user?.full_name || 'User'}</h3>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                  <Badge variant="secondary" className="mt-1 text-[10px] capitalize">{user?.role}</Badge>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Full Name</Label>
                  <Input 
                    value={fullName} 
                    onChange={e => setFullName(e.target.value)} 
                    disabled={!isEditing || saving} 
                    className={`h-9 text-sm ${!isEditing ? 'bg-muted/30' : ''}`} 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <Input value={user?.email || ''} disabled className="h-9 text-sm bg-muted/30" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Role</Label>
                  <Input value={user?.role || ''} disabled className="h-9 text-sm bg-muted/30 capitalize" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Account Status</Label>
                  <Input value={user?.is_active ? 'Active' : 'Inactive'} disabled className="h-9 text-sm bg-muted/30" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Account ID</Label>
                <Input value={user?.id || ''} disabled className="h-9 text-sm bg-muted/30 font-mono text-xs" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="workspace" className="m-0 space-y-6">
            <Card className="shadow-sm border-border/50">
              <CardHeader className="border-b border-border/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">{orgInfo?.name || 'Your Workspace'}</CardTitle>
                    <CardDescription className="text-xs">Organization settings & team invite code</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Team Invite Code</Label>
                  <p className="text-[11px] text-muted-foreground">Share this code with team members so they can sign up and join your workspace.</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex-1 bg-muted/50 border border-border rounded-xl px-4 py-3 font-mono text-lg font-bold tracking-widest text-foreground">
                      {orgInfo?.invite_code || '...'}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-12 w-12 rounded-xl shrink-0"
                      onClick={() => {
                        if (orgInfo?.invite_code) {
                          navigator.clipboard.writeText(orgInfo.invite_code);
                          setCodeCopied(true);
                          toast.success('Invite code copied to clipboard!');
                          setTimeout(() => setCodeCopied(false), 2000);
                        }
                      }}
                    >
                      {codeCopied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                    </Button>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Workspace Name</Label>
                    <Input value={orgInfo?.name || ''} disabled className="h-9 text-sm bg-muted/30" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Created At</Label>
                    <Input value={orgInfo?.created_at ? new Date(orgInfo.created_at).toLocaleDateString() : ''} disabled className="h-9 text-sm bg-muted/30" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="appearance" className="m-0 space-y-6">
          <Card className="shadow-sm border-border/50">
            <CardHeader className="border-b border-border/40">
              <CardTitle className="text-base font-semibold">Theme</CardTitle>
              <CardDescription className="text-xs">Choose your preferred appearance.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex gap-4">
                {(['light', 'dark', 'system'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                      theme === t ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-border'
                    }`}
                  >
                    <div className={`w-full aspect-video rounded-lg mb-3 ${
                      t === 'light' ? 'bg-white border border-zinc-200' :
                      t === 'dark' ? 'bg-zinc-900 border border-zinc-700' :
                      'bg-gradient-to-r from-white to-zinc-900 border border-zinc-300'
                    }`} />
                    <span className="text-sm font-medium capitalize">{t}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="m-0 space-y-6">
          <Card className="shadow-sm border-border/50">
            <CardHeader className="border-b border-border/40">
              <CardTitle className="text-base font-semibold">Notification Preferences</CardTitle>
              <CardDescription className="text-xs">Control how you receive updates.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {[
                { title: 'Email Notifications', desc: 'Receive task updates via email' },
                { title: 'Push Notifications', desc: 'Browser push notifications for new assignments' },
                { title: 'Weekly Digest', desc: 'Summary of project activity every Monday' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch defaultChecked={i === 0} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
