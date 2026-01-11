import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/auth';
import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Mail,
  Globe,
  Settings,
  LayoutDashboard,
  LogOut,
  Sun,
  Moon,
  Monitor,
  Languages,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Layout() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: t('nav.dashboard') },
    { to: '/domains', icon: Globe, label: t('nav.domains') },
    { to: '/inbox', icon: Mail, label: t('nav.inbox') },
    { to: '/settings', icon: Settings, label: t('nav.settings') },
    ...(user?.isAdmin ? [{ to: '/admin', icon: Shield, label: t('admin.title') }] : []),
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'zh' ? 'en' : 'zh';
    i18n.changeLanguage(newLang);
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) return name.charAt(0).toUpperCase();
    if (email) return email.charAt(0).toUpperCase();
    return 'U';
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-card">
        <div className="p-6">
          <div className="flex items-center gap-2">
            <Mail className="h-8 w-8" />
            <span className="text-xl font-bold">Flymail</span>
          </div>
        </div>

        <ScrollArea className="flex-1 px-3">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </ScrollArea>

        <div className="p-4 border-t">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {getInitials(user?.name, user?.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium truncate">
                    {user?.name || user?.email}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>{t('nav.myAccount')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setTheme('light')}>
                <Sun className="mr-2 h-4 w-4" />
                {t('settings.theme.light')}
                {theme === 'light' && <span className="ml-auto text-xs">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                <Moon className="mr-2 h-4 w-4" />
                {t('settings.theme.dark')}
                {theme === 'dark' && <span className="ml-auto text-xs">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>
                <Monitor className="mr-2 h-4 w-4" />
                {t('settings.theme.system')}
                {theme === 'system' && <span className="ml-auto text-xs">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={toggleLanguage}>
                <Languages className="mr-2 h-4 w-4" />
                {i18n.language === 'zh' ? 'English' : '中文'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                {t('auth.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="container py-6">
            <Outlet />
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}
