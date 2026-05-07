import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, MoreHorizontal, CheckSquare, Plus, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { projectsApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../context/WebSocketContext';
import { toast } from 'sonner';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-600',
  on_hold: 'bg-amber-500/10 text-amber-600',
  completed: 'bg-blue-500/10 text-blue-600',
  archived: 'bg-muted text-muted-foreground',
};

export default function Projects() {
  const { isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', description: '', priority: 'medium' });
  const { lastRefreshEvent } = useWebSocket();

  useEffect(() => { 
    loadProjects(); 
    const interval = setInterval(loadProjects, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (location.state?.create) {
      setShowCreate(true);
      // Clear state so it doesn't reopen on refresh
      navigate('.', { replace: true, state: {} });
    }
  }, [location.state]);

  useEffect(() => {
    if (lastRefreshEvent?.type === 'refresh_projects') {
      loadProjects();
    }
  }, [lastRefreshEvent]);

  const loadProjects = async () => {
    try {
      const res = await projectsApi.list();
      if (res.success) setProjects(res.data || []);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newProject.title.trim()) return;
    setCreating(true);
    try {
      const res = await projectsApi.create(newProject);
      if (res.success) {
        toast.success('Project created');
        setShowCreate(false);
        setNewProject({ title: '', description: '', priority: 'medium' });
        loadProjects();
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await projectsApi.delete(id);
      toast.success('Project deleted');
      loadProjects();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete project');
    }
  };

  const filtered = projects.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6 max-w-[1400px] mx-auto w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2">
            <div className="h-8 w-32 bg-muted/50 rounded-md animate-pulse"></div>
            <div className="h-4 w-64 bg-muted/50 rounded-md animate-pulse"></div>
          </div>
          <div className="h-9 w-32 bg-muted/50 rounded-md animate-pulse"></div>
        </div>
        <div className="h-9 w-full sm:max-w-sm bg-muted/50 rounded-md animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map(i => (
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
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage and track all company initiatives.</p>
        </div>
        {isAdmin && (
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button className="h-9 shadow-sm"><Plus className="w-4 h-4 mr-2" />New Project</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Project</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input placeholder="Project name" value={newProject.title} onChange={e => setNewProject(p => ({ ...p, title: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none" placeholder="Brief description..." value={newProject.description} onChange={e => setNewProject(p => ({ ...p, description: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={newProject.priority} onChange={e => setNewProject(p => ({ ...p, priority: e.target.value }))}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <Button className="w-full" onClick={handleCreate} disabled={creating}>
                  {creating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : 'Create Project'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="relative w-full sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search projects..." className="pl-9 bg-background h-9 border-border/50 text-sm" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border/60 rounded-xl bg-card">
          <p className="text-muted-foreground text-sm font-medium">
            {projects.length === 0 ? 'No projects yet. Create your first project to get started!' : 'No projects match your search.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((project, i) => (
            <motion.div key={project.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }}>
              <Card className="hover:shadow-md hover:border-border transition-all duration-300 h-full flex flex-col group cursor-pointer border-border/50 bg-card overflow-hidden relative">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardContent className="p-5 flex-1 flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs bg-primary/20 text-primary">
                        {project.title.slice(0, 2).toUpperCase()}
                      </div>
                      <h3 className="font-semibold text-sm group-hover:text-primary transition-colors leading-tight">{project.title}</h3>
                    </div>
                    {isAdmin && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity -mr-2 -mt-1 text-muted-foreground hover:bg-muted">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="text-sm">
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(project.id)}>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 mb-6 flex-1 leading-relaxed">{project.description || 'No description'}</p>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="font-medium text-xs text-foreground">{project.completion_percentage}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full ${project.completion_percentage > 80 ? 'bg-emerald-500' : 'bg-primary'}`} style={{ width: `${project.completion_percentage}%` }}></div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-border/40">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                        <div className="flex items-center gap-1.5">
                          <CheckSquare className="w-3.5 h-3.5" />
                          {project.task_count} tasks
                        </div>
                        <div className="flex items-center gap-1.5">
                          {project.member_count} members
                        </div>
                      </div>
                      <Badge variant="secondary" className={`text-[9px] px-1.5 py-0 h-4 font-medium uppercase tracking-wider ${STATUS_COLORS[project.status] || ''}`}>
                        {project.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
