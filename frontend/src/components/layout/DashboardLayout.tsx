import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Search, 
  Menu, 
  LayoutDashboard, 
  FolderKanban, 
  CheckSquare, 
  Users, 
  BarChart, 
  Settings, 
  HelpCircle, 
  Plus, 
  ChevronDown, 
  CreditCard, 
  LogOut, 
  Sun, 
  Moon,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '../theme-provider';
import { useWebSocket } from '../../context/WebSocketContext';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '@/components/ui/badge';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Overview', href: '/dashboard' },
  { icon: FolderKanban, label: 'Projects', href: '/dashboard/projects' },
  { icon: CheckSquare, label: 'Tasks', href: '/dashboard/tasks' },
  { icon: Users, label: 'Team', href: '/dashboard/team' },
  { icon: BarChart, label: 'Analytics', href: '/dashboard/analytics' },
];

export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileExpanded, setIsProfileExpanded] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user, logout, isAdmin } = useAuth();
  const { notifications, unreadCount, markAllAsRead, markAsRead } = useWebSocket();

  const userInitials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-card text-card-foreground border-r border-border/40 overflow-hidden">
      <div className="h-16 flex items-center px-6 border-b border-border/40 shrink-0">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <div className="w-3.5 h-3.5 border-2 border-primary-foreground rounded-sm"></div>
          </div>
          <span className="font-black text-xl tracking-tight">Taskky</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto py-6 custom-scrollbar">
        <div className="px-3 pb-3 text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em]">
          Workspace
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.href;
          if (item.label === 'Analytics' && !isAdmin) return null;
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 font-bold'
                  : 'text-sm font-medium text-muted-foreground hover:bg-primary/5 hover:text-primary'
              }`}
            >
              <item.icon strokeWidth={isActive ? 2.5 : 2} className={`w-4 h-4 transition-transform group-hover:scale-110`} />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}

        <div className="px-3 pt-8 pb-3 text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em]">
          System
        </div>
        <Link
          to="/dashboard/settings"
          onClick={() => setIsSidebarOpen(false)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
            location.pathname === '/dashboard/settings'
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 font-bold'
              : 'text-sm font-medium text-muted-foreground hover:bg-primary/5 hover:text-primary'
          }`}
        >
          <Settings className="w-4 h-4" strokeWidth={location.pathname === '/dashboard/settings' ? 2.5 : 2} />
          <span className="text-sm">Settings</span>
        </Link>
        {isAdmin && (
          <Link
            to="/dashboard/subscription"
            onClick={() => setIsSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
              location.pathname === '/dashboard/subscription'
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 font-bold'
                : 'text-sm font-medium text-muted-foreground hover:bg-primary/5 hover:text-primary'
            }`}
          >
            <CreditCard className="w-4 h-4" strokeWidth={location.pathname === '/dashboard/subscription' ? 2.5 : 2} />
            <span className="text-sm">Subscription</span>
          </Link>
        )}
        <div
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-primary/5 hover:text-primary transition-all duration-200 group cursor-pointer"
        >
          <HelpCircle className="w-4 h-4 group-hover:rotate-12 transition-transform" />
          <span className="text-sm">Help & Support</span>
        </div>
      </nav>

      <div className="p-4 border-t border-border/40 shrink-0 bg-muted/20">
        <div className="flex flex-col rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden">
          <AnimatePresence>
            {isProfileExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden bg-muted/30"
              >
                <div className="p-2 space-y-1">
                  <div
                    onClick={() => {
                      navigate('/dashboard/settings');
                      setIsProfileExpanded(false);
                      setIsSidebarOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-bold text-muted-foreground hover:text-primary rounded-xl transition-colors cursor-pointer"
                  >
                    <Settings className="w-4 h-4" />
                    Profile Settings
                  </div>
                  <div
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-black text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Log out
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div
            onClick={() => setIsProfileExpanded(!isProfileExpanded)}
            className="flex items-center gap-3 w-full p-3 text-left group hover:bg-muted/50 transition-colors outline-none cursor-pointer"
          >
            <Avatar className="h-10 w-10 rounded-xl border-2 border-border/50 group-hover:border-primary/30 transition-colors">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold rounded-lg">{userInitials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-foreground truncate">{user?.full_name || 'User'}</div>
              <div className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">{user?.role || 'member'}</div>
            </div>
            <motion.div animate={{ rotate: isProfileExpanded ? 180 : 0 }}>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#FFFCF5] dark:bg-[#09090b] overflow-hidden font-sans">
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 z-50">
        <SidebarContent />
      </aside>

      <div className="flex-1 flex flex-col lg:pl-64 min-w-0 relative">
        <header className="h-16 flex items-center justify-between px-6 sticky top-0 z-40 bg-card/60 backdrop-blur-md border-b border-border/40 shadow-sm">
          <div className="flex items-center gap-4">
            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden hover:bg-primary/10 hover:text-primary">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72">
                <SidebarContent />
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
              <span className="hidden sm:inline opacity-30">Workspace</span>
              <span className="hidden sm:inline opacity-30">/</span>
              <span className="text-foreground capitalize tracking-tight">
                {location.pathname.split('/').pop() || 'Overview'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">

            
            <DropdownMenu>
              <DropdownMenuTrigger className="relative flex items-center justify-center w-10 h-10 hover:bg-primary/10 hover:text-primary transition-all rounded-xl focus:outline-none">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full ring-2 ring-background animate-pulse" />
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-0 rounded-2xl shadow-2xl border-border/40 overflow-hidden">
                <div className="p-4 bg-muted/30 border-b border-border/40 flex items-center justify-between">
                  <span className="text-sm font-bold text-foreground">Notifications</span>
                  {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-7 text-[10px] uppercase tracking-widest font-bold text-primary hover:bg-primary/10">
                      Mark all read
                    </Button>
                  )}
                </div>
                <div className="max-h-[350px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-10 text-center text-muted-foreground space-y-2">
                      <div className="w-12 h-12 rounded-full bg-muted mx-auto flex items-center justify-center opacity-20">
                        <Bell className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-medium">No new notifications</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <DropdownMenuItem 
                        key={notif.id} 
                        className={`p-4 cursor-pointer border-b border-border/20 last:border-0 focus:bg-primary/5 ${!notif.read ? 'bg-primary/[0.03]' : ''}`}
                        onClick={() => markAsRead(notif.id)}
                      >
                        <div className="flex gap-3">
                          <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${notif.read ? 'bg-transparent' : 'bg-primary'}`} />
                          <div className="space-y-1">
                            <p className={`text-sm leading-tight ${!notif.read ? 'font-bold text-foreground' : 'font-medium text-muted-foreground'}`}>{notif.message}</p>
                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">{notif.time}</p>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>

            <div className="h-6 w-px bg-border/40 mx-1 hidden sm:block" />
            
            <DropdownMenu>
              <DropdownMenuTrigger className="hidden sm:flex items-center gap-2 rounded-xl font-black text-xs uppercase tracking-widest premium-gradient text-primary-foreground shadow-lg shadow-primary/20 h-9 px-5 focus:outline-none">
                <Plus className="w-4 h-4" />
                Create
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 p-2 rounded-xl shadow-xl">
                <Link to="/dashboard/tasks" state={{ create: true }}>
                  <DropdownMenuItem className="cursor-pointer flex items-center gap-2 font-medium">
                    <CheckSquare className="w-4 h-4 text-primary" />
                    New Task
                  </DropdownMenuItem>
                </Link>
                {isAdmin && (
                  <Link to="/dashboard/projects" state={{ create: true }}>
                    <DropdownMenuItem className="cursor-pointer flex items-center gap-2 font-medium">
                      <FolderKanban className="w-4 h-4 text-primary" />
                      New Project
                    </DropdownMenuItem>
                  </Link>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10 bg-background/50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}