import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, MessageSquare, Calendar, MoreHorizontal, CheckCircle2, Loader2, Edit2, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { tasksApi, projectsApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../context/WebSocketContext';
import { toast } from 'sonner';

const COLUMNS = [
  { id: 'todo', title: 'To Do', color: 'bg-slate-500' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-primary' },
  { id: 'review', title: 'In Review', color: 'bg-amber-500' },
  { id: 'done', title: 'Completed', color: 'bg-emerald-500' },
];

const PRIORITY_STYLES: Record<string, string> = {
  urgent: 'text-rose-600 bg-rose-500/10',
  high: 'text-primary bg-primary/10',
  medium: 'text-muted-foreground bg-muted',
  low: 'text-muted-foreground bg-muted',
};

export default function Tasks() {
  const { isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium', project_id: '', due_date: '', assigned_to: '' });
  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const { lastRefreshEvent } = useWebSocket();

  useEffect(() => { 
    loadData(); 
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (location.state?.create) {
      openCreateDialog();
      // Clear state so it doesn't reopen on refresh
      navigate('.', { replace: true, state: {} });
    }
  }, [location.state]);

  useEffect(() => {
    if (lastRefreshEvent?.type === 'refresh_tasks' || lastRefreshEvent?.type === 'refresh_projects') {
      loadData();
    }
  }, [lastRefreshEvent]);

  useEffect(() => {
    if (newTask.project_id) {
      projectsApi.getMembers(newTask.project_id).then(res => {
        if (res.success) setProjectMembers(res.data || []);
      });
    } else {
      setProjectMembers([]);
    }
  }, [newTask.project_id]);

  const loadData = async () => {
    try {
      const [tasksRes, projectsRes] = await Promise.all([
        tasksApi.list(),
        projectsApi.list(),
      ]);
      if (tasksRes.success) setTasks(tasksRes.data || []);
      if (projectsRes.success) setProjects(projectsRes.data || []);
    } catch (err: any) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newTask.title.trim() || !newTask.project_id || !newTask.assigned_to) {
      toast.error('Title, project, and assignee are required');
      return;
    }
    setCreating(true);
    try {
      const payload: any = { title: newTask.title, description: newTask.description || null, priority: newTask.priority, project_id: newTask.project_id, assigned_to: newTask.assigned_to };
      if (newTask.due_date) payload.due_date = new Date(newTask.due_date).toISOString();
      
      let res;
      if (editingTaskId) {
        res = await tasksApi.update(editingTaskId, payload);
      } else {
        res = await tasksApi.create(payload);
      }
      
      if (res.success) {
        toast.success(editingTaskId ? 'Task updated' : 'Task created');
        setShowCreate(false);
        setEditingTaskId(null);
        setNewTask({ title: '', description: '', priority: 'medium', project_id: '', due_date: '', assigned_to: '' });
        loadData();
      }
    } catch (err: any) {
      toast.error(err?.message || (editingTaskId ? 'Failed to update task' : 'Failed to create task'));
    } finally {
      setCreating(false);
    }
  };

  const openCreateDialog = () => {
    setEditingTaskId(null);
    setNewTask({ title: '', description: '', priority: 'medium', project_id: '', due_date: '', assigned_to: '' });
    setShowCreate(true);
  };

  const openEditDialog = (task: any) => {
    setEditingTaskId(task.id);
    setNewTask({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      project_id: task.project_id,
      due_date: task.due_date ? task.due_date.split('T')[0] : '',
      assigned_to: task.assigned_to || ''
    });
    setShowCreate(true);
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await tasksApi.updateStatus(taskId, newStatus);
      loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (taskId: string) => {
    try {
      await tasksApi.delete(taskId);
      toast.success('Task deleted');
      loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete task');
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const VALID_TRANSITIONS: Record<string, string[]> = {
    todo: ['in_progress'],
    in_progress: ['todo', 'review'],
    review: ['in_progress', 'done'],
    done: ['todo']
  };

  const handleDrop = async (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    setDragOverCol(null);
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== colId) {
      const allowedTargets = VALID_TRANSITIONS[task.status] || [];
      if (!allowedTargets.includes(colId)) {
        toast.error(`Invalid move. You cannot move a task from ${task.status.replace('_', ' ')} directly to ${colId.replace('_', ' ')}.`);
        return;
      }
      await handleStatusChange(taskId, colId);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col space-y-4 max-w-full overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2">
            <div className="h-8 w-32 bg-muted/50 rounded-md animate-pulse"></div>
            <div className="h-4 w-64 bg-muted/50 rounded-md animate-pulse"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-64 bg-muted/50 rounded-md animate-pulse hidden sm:block"></div>
            <div className="h-9 w-32 bg-muted/50 rounded-md animate-pulse"></div>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-x-auto pb-4 custom-scrollbar">
          <div className="flex gap-6 h-full min-w-max pb-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-[320px] flex-shrink-0 flex flex-col bg-muted/10 rounded-xl h-full border border-border/50">
                <div className="p-4 border-b border-border/40 flex justify-between items-center bg-muted/20">
                  <div className="h-5 w-24 bg-muted/50 rounded-md animate-pulse"></div>
                  <div className="h-5 w-8 bg-muted/50 rounded-full animate-pulse"></div>
                </div>
                <div className="p-3 flex flex-col gap-3">
                  {[1, 2, 3].map(j => (
                    <div key={j} className="h-32 bg-muted/40 rounded-lg animate-pulse border border-border/50"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-4 max-w-full overflow-hidden">
      <div className="flex justify-between items-center px-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Board</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage tasks and track team progress.</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <Button onClick={openCreateDialog} className="h-9 shadow-sm"><Plus className="w-4 h-4 mr-2" />New Task</Button>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingTaskId ? 'Edit Task' : 'Create Task'}</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input placeholder="Task title" value={newTask.title} onChange={e => setNewTask(t => ({ ...t, title: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Project</Label>
                  <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={newTask.project_id} onChange={e => setNewTask(t => ({ ...t, project_id: e.target.value, assigned_to: '' }))}>
                    <option value="">Select a project</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Assignee</Label>
                  <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50" value={newTask.assigned_to} onChange={e => setNewTask(t => ({ ...t, assigned_to: e.target.value }))} disabled={!newTask.project_id || projectMembers.length === 0}>
                    <option value="">{newTask.project_id ? (projectMembers.length > 0 ? 'Select member' : 'No members found') : 'Select project first'}</option>
                    {projectMembers.map(m => <option key={m.user_id} value={m.user_id}>{m.user?.full_name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={newTask.priority} onChange={e => setNewTask(t => ({ ...t, priority: e.target.value }))}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input type="date" value={newTask.due_date} onChange={e => setNewTask(t => ({ ...t, due_date: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <textarea className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none" placeholder="Optional description..." value={newTask.description} onChange={e => setNewTask(t => ({ ...t, description: e.target.value }))} />
              </div>
              <Button className="w-full" onClick={handleCreate} disabled={creating}>
                {creating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{editingTaskId ? 'Updating...' : 'Creating...'}</> : (editingTaskId ? 'Update Task' : 'Create Task')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-xl leading-tight pr-4">{selectedTask?.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="capitalize">{selectedTask?.status?.replace('_', ' ')}</Badge>
                <Badge variant="outline" className={`capitalize ${PRIORITY_STYLES[selectedTask?.priority] || PRIORITY_STYLES.medium}`}>
                  {selectedTask?.priority} Priority
                </Badge>
                {selectedTask?.due_date && (
                  <Badge variant="secondary" className={`capitalize ${selectedTask?.is_overdue ? 'bg-rose-500/10 text-rose-500' : ''}`}>
                    <Calendar className="w-3 h-3 mr-1" />
                    Due: {new Date(selectedTask.due_date).toLocaleDateString()}
                  </Badge>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground uppercase text-xs tracking-wider">Description</Label>
                <div className="bg-muted/30 p-4 rounded-md text-sm text-foreground whitespace-pre-wrap min-h-[80px] border border-border/50">
                  {selectedTask?.description || <span className="text-muted-foreground italic">No description provided.</span>}
                </div>
              </div>
              {selectedTask?.assignee && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground uppercase text-xs tracking-wider">Assigned To</Label>
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                        {selectedTask.assignee.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{selectedTask.assignee.full_name}</span>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden px-1 pb-4 custom-scrollbar">
        <div className="flex gap-4 h-full items-start w-max min-w-full pt-1">
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter(t => t.status === col.id);
            return (
              <div key={col.id} className="w-[300px] flex flex-col h-full max-h-[85vh] shrink-0">
                <div className="flex items-center justify-between p-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${col.color}`} />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">{col.title}</h3>
                    <Badge variant="secondary" className="font-medium px-1.5 py-0 h-5 text-[10px] ml-1 bg-muted/60 text-muted-foreground">
                      {colTasks.length}
                    </Badge>
                  </div>
                </div>

                <ScrollArea className="flex-1 h-full pr-3 -mr-3 flex flex-col">
                  <div
                    className={`bg-muted/30 rounded-xl p-2 border flex flex-col gap-2 min-h-full transition-colors ${dragOverCol === col.id ? 'border-primary/50 bg-primary/5' : 'border-border/40'}`}
                    onDragOver={e => { e.preventDefault(); setDragOverCol(col.id); }}
                    onDragLeave={() => setDragOverCol(null)}
                    onDrop={e => handleDrop(e, col.id)}
                  >
                    {colTasks.map((task, tIdx) => (
                      <motion.div
                        key={task.id}
                        draggable
                        onDragStart={e => handleDragStart(e, task.id)}
                        onClick={() => setSelectedTask(task)}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: tIdx * 0.03 }}
                        className={`bg-card rounded-lg p-3 shadow-sm border border-border/50 hover:border-primary/50 transition-all cursor-pointer hover:shadow-md active:cursor-grabbing group ${task.is_overdue ? 'border-rose-500/50' : ''} ${col.id === 'done' ? 'opacity-60' : ''}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded uppercase tracking-wider ${PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium}`}>
                            {col.id === 'done' ? 'Done' : task.priority}
                          </span>
                          {isAdmin && (
                            <div onClick={e => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger className="h-6 w-6 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 -mr-1 -mt-1 text-muted-foreground hover:bg-muted hover:text-foreground outline-none transition-all">
                                  <MoreHorizontal className="h-4 w-4" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40 font-sans">
                                  {col.id !== 'done' && (
                                    <DropdownMenuItem className="cursor-pointer flex items-center gap-2" onClick={(e) => { e.stopPropagation(); openEditDialog(task); }}>
                                      <Edit2 className="w-3.5 h-3.5" />
                                      Edit Task
                                    </DropdownMenuItem>
                                  )}
                                  
                                  {col.id === 'in_progress' && (
                                    <DropdownMenuItem className="cursor-pointer flex items-center gap-2 text-amber-600 focus:text-amber-600 focus:bg-amber-500/10" onClick={(e) => { e.stopPropagation(); handleStatusChange(task.id, 'review'); }}>
                                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                                      Move to Review
                                    </DropdownMenuItem>
                                  )}

                                  {col.id === 'review' && (
                                    <DropdownMenuItem className="cursor-pointer flex items-center gap-2 text-emerald-600 focus:text-emerald-600 focus:bg-emerald-500/10" onClick={(e) => { e.stopPropagation(); handleStatusChange(task.id, 'done'); }}>
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      Mark Completed
                                    </DropdownMenuItem>
                                  )}

                                  {col.id === 'todo' && (
                                    <DropdownMenuItem className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive flex items-center gap-2" onClick={(e) => { e.stopPropagation(); handleDelete(task.id); }}>
                                      <Trash2 className="w-3.5 h-3.5" />
                                      Delete Task
                                    </DropdownMenuItem>
                                  )}
                                  
                                  {col.id === 'done' && (
                                    <DropdownMenuItem className="cursor-pointer flex items-center gap-2" onClick={(e) => { e.stopPropagation(); handleStatusChange(task.id, 'todo'); }}>
                                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-rotate-ccw"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                                      Reopen Task
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          )}
                        </div>

                        <p className={`text-xs font-medium leading-relaxed mb-3 pr-2 ${col.id === 'done' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {task.title}
                        </p>

                        <div className="flex items-center justify-between border-t border-border/40 pt-2.5">
                          <div className="flex items-center gap-2.5 text-[10px] font-medium text-muted-foreground">
                            {col.id === 'done' ? (
                              <div className="flex items-center gap-1 text-emerald-500">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Done
                              </div>
                            ) : task.due_date ? (
                              <div className={`flex items-center gap-1 ${task.is_overdue ? 'text-rose-500' : ''}`}>
                                <Calendar className="w-3 h-3" />
                                {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </div>
                            ) : null}
                          </div>
                          {task.assignee && (
                            <Avatar className="w-5 h-5 border-[1.5px] border-card">
                              <AvatarFallback className="text-[8px] bg-secondary text-secondary-foreground">
                                {task.assignee.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      </motion.div>
                    ))}

                    {colTasks.length === 0 && (
                      <div className="py-8 text-center text-xs text-muted-foreground">
                        No tasks
                      </div>
                    )}

                    {dragOverCol === col.id && (
                      <div className="mt-1 flex-1 min-h-[40px] rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 transition-colors"></div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
