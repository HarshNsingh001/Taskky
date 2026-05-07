import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, UserPlus, Mail, Loader2, Copy, Check, ChevronDown, FolderKanban, User as UserIcon, X } from 'lucide-react';
import { projectsApi, usersApi, organizationApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../context/WebSocketContext';
import { toast } from 'sonner';
import { fuzzySearch, highlightMatches } from '../../lib/search';

// --- Glass Dropdown Component ---
function GlassDropdown({ value, onChange, options, placeholder, icon: Icon, renderOption }: {
  value: string;
  onChange: (val: string) => void;
  options: { id: string; label: string; sub?: string }[];
  placeholder?: string;
  icon?: React.ElementType;
  renderOption?: (opt: { id: string; label: string; sub?: string }, isSelected: boolean) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find(o => o.id === value);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="group flex items-center gap-2.5 h-9 px-3.5 rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200 text-sm font-medium text-foreground min-w-[160px]"
      >
        {Icon && <Icon className="w-4 h-4 text-primary/70 shrink-0" />}
        <span className="truncate flex-1 text-left">{selected?.label || placeholder || 'Select...'}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            className="absolute top-[calc(100%+6px)] left-0 z-50 min-w-[220px] max-h-[280px] overflow-y-auto rounded-xl border border-border/40 bg-card/70 backdrop-blur-xl shadow-xl shadow-black/10 ring-1 ring-white/[0.06] p-1.5"
          >
            {options.length === 0 ? (
              <div className="px-3 py-4 text-xs text-muted-foreground text-center">No options available</div>
            ) : (
              options.map(opt => {
                const isSelected = opt.id === value;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => { onChange(opt.id); setOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 text-left ${
                      isSelected
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-foreground hover:bg-muted/60'
                    }`}
                  >
                    {renderOption ? renderOption(opt, isSelected) : (
                      <>
                        <span className="flex-1 truncate">{opt.label}</span>
                        {opt.sub && <span className="text-[10px] text-muted-foreground truncate">{opt.sub}</span>}
                        {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                      </>
                    )}
                  </button>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Team() {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteUserId, setInviteUserId] = useState('');
  const [inviteProjectId, setInviteProjectId] = useState('');
  const [inviteProjectMembers, setInviteProjectMembers] = useState<any[]>([]);
  const [inviting, setInviting] = useState(false);
  const [orgInviteCode, setOrgInviteCode] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);
  const { lastRefreshEvent } = useWebSocket();

  useEffect(() => { 
    loadData(); 
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (lastRefreshEvent?.type.startsWith('refresh_')) {
      loadData();
    }
  }, [lastRefreshEvent]);

  useEffect(() => {
    if (inviteProjectId) {
      projectsApi.getMembers(inviteProjectId).then(res => {
        if (res.success) setInviteProjectMembers(res.data || []);
      });
    } else {
      setInviteProjectMembers([]);
    }
  }, [inviteProjectId]);

  const loadData = async () => {
    try {
      const [projRes, usersRes, orgRes] = await Promise.all([
        projectsApi.list(),
        isAdmin ? usersApi.list() : Promise.resolve({ success: true, data: [] }),
        isAdmin ? organizationApi.getInfo() : Promise.resolve({ success: false }),
      ]);
      
      if (usersRes.success) setAllUsers(usersRes.data || []);
      if (orgRes.success && orgRes.data) setOrgInviteCode(orgRes.data.invite_code || '');
      
      if (projRes.success && projRes.data?.length > 0) {
        setProjects(projRes.data);
        setSelectedProject(current => {
          if (!current) {
            loadMembers(projRes.data[0].id);
            return projRes.data[0].id;
          }
          loadMembers(current);
          return current;
        });
      }
    } catch (err: any) {
      toast.error('Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async (projectId: string) => {
    try {
      const res = await projectsApi.getMembers(projectId);
      if (res.success) setMembers(res.data || []);
    } catch {}
  };

  const handleProjectChange = async (projectId: string) => {
    setSelectedProject(projectId);
    await loadMembers(projectId);
  };

  const handleInvite = async () => {
    if (!inviteUserId.trim() || !inviteProjectId) return;
    setInviting(true);
    try {
      await projectsApi.addMember(inviteProjectId, inviteUserId);
      toast.success('Member added');
      setShowInvite(false);
      setInviteUserId('');
      if (inviteProjectId === selectedProject) await loadMembers(selectedProject);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add member');
    } finally {
      setInviting(false);
    }
  };

  const filtered = fuzzySearch(members, search, (m) => [
    m.user?.full_name || '',
    m.user?.email || '',
  ]);

  const availableUsersToInvite = allUsers.filter(u => 
    !inviteProjectMembers.some(m => m.user_id === u.id)
  );

  if (loading) {
    return (
      <div className="space-y-6 max-w-[1400px] mx-auto w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2">
            <div className="h-8 w-24 bg-muted/50 rounded-md animate-pulse"></div>
            <div className="h-4 w-64 bg-muted/50 rounded-md animate-pulse"></div>
          </div>
          <div className="h-9 w-32 bg-muted/50 rounded-md animate-pulse"></div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-card p-4 rounded-xl border border-border/50">
          <div className="h-9 w-64 bg-muted/50 rounded-md animate-pulse"></div>
          <div className="h-9 w-full sm:max-w-sm bg-muted/50 rounded-md animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="h-[200px] bg-muted/50 rounded-xl animate-pulse border border-border/50"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team</h1>
          <div className="flex items-center gap-3 mt-0.5">
            <p className="text-muted-foreground text-sm">View and manage project team members.</p>
            {isAdmin && orgInviteCode && (
              <button 
                className="flex items-center gap-2 bg-muted px-2.5 py-0.5 rounded-md text-xs font-medium border border-border/50 hover:bg-muted/80 transition-colors cursor-pointer"
                onClick={() => {
                  navigator.clipboard.writeText(orgInviteCode);
                  setCodeCopied(true);
                  toast.success('Invite code copied!');
                  setTimeout(() => setCodeCopied(false), 2000);
                }}
                title="Click to copy invite code"
              >
                <span className="text-muted-foreground">Invite Code:</span>
                <span className="font-mono text-primary select-all">{orgInviteCode}</span>
                {codeCopied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
              </button>
            )}
          </div>
        </div>
        {isAdmin && (
          <Dialog open={showInvite} onOpenChange={setShowInvite}>
            <DialogTrigger asChild>
              <Button className="h-9 shadow-sm"><UserPlus className="w-4 h-4 mr-2" />Add Member</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Team Member</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Project</Label>
                  <GlassDropdown
                    value={inviteProjectId}
                    onChange={(val) => { setInviteProjectId(val); setInviteUserId(''); }}
                    options={projects.map(p => ({ id: p.id, label: p.title }))}
                    placeholder="Select project"
                    icon={FolderKanban}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Select User</Label>
                  <GlassDropdown
                    value={inviteUserId}
                    onChange={setInviteUserId}
                    options={availableUsersToInvite.map(u => ({ id: u.id, label: u.full_name, sub: u.email }))}
                    placeholder={!inviteProjectId ? 'Select project first' : (availableUsersToInvite.length > 0 ? 'Choose a user' : 'All added')}
                    icon={UserIcon}
                  />
                </div>
                <Button className="w-full" onClick={handleInvite} disabled={inviting || !inviteUserId}>
                  {inviting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Adding...</> : 'Add to Project'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {projects.length > 0 && (
        <div className="flex items-center gap-4">
          <GlassDropdown
            value={selectedProject}
            onChange={handleProjectChange}
            options={projects.map(p => ({ id: p.id, label: p.title }))}
            placeholder="Select project"
            icon={FolderKanban}
            renderOption={(opt, isSelected) => (
              <>
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FolderKanban className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="flex-1 truncate">{opt.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
              </>
            )}
          />
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search members..." 
              className="pl-9 pr-8 h-9 text-sm" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
            {search && (
              <button 
                onClick={() => setSearch('')} 
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border/60 rounded-xl bg-card">
          <p className="text-muted-foreground text-sm">No projects found. Create a project first to manage team members.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border/60 rounded-xl bg-card">
          <p className="text-muted-foreground text-sm">
            {members.length === 0 ? 'No members in this project yet. Add team members to get started!' : 'No members match your search.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((member, i) => (
            <motion.div key={member.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: i * 0.05 }}>
              <Card className="shadow-sm border-border/50 hover:shadow-md transition-all">
                <CardContent className="p-4 flex items-center gap-4">
                  <Avatar className="h-10 w-10 rounded-lg border border-border/50">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm rounded-lg">
                      {member.user?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {highlightMatches(member.user?.full_name || 'Unknown', search).map((seg, si) => 
                        seg.highlight ? <mark key={si} className="bg-primary/20 text-primary rounded-sm px-0.5">{seg.text}</mark> : <span key={si}>{seg.text}</span>
                      )}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                      <Mail className="w-3 h-3" />
                      <span className="truncate">
                        {highlightMatches(member.user?.email || '', search).map((seg, si) => 
                          seg.highlight ? <mark key={si} className="bg-primary/20 text-primary rounded-sm px-0.5">{seg.text}</mark> : <span key={si}>{seg.text}</span>
                        )}
                      </span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[10px] px-2 shrink-0 capitalize">
                    {new Date(member.joined_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Badge>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
