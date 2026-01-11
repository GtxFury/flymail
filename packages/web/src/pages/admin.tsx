import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, User } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Settings,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Shield,
  User as UserIcon,
  Mail,
  Globe,
  Inbox,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function AdminPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  // Queries
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: adminApi.listUsers,
  });

  const { data: stats } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: adminApi.getStats,
  });

  const { data: settings } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: adminApi.getSettings,
  });

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: adminApi.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      toast({ title: t('admin.userCreated') });
      closeCreateDialog();
    },
    onError: (error: Error) => {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminApi.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast({ title: t('admin.userUpdated') });
      setEditingUser(null);
    },
    onError: (error: Error) => {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: adminApi.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      toast({ title: t('admin.userDeleted') });
      setDeletingUser(null);
    },
    onError: (error: Error) => {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: adminApi.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
      toast({ title: t('admin.settingsUpdated') });
    },
    onError: (error: Error) => {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    },
  });

  const closeCreateDialog = () => {
    setIsCreateDialogOpen(false);
    setEmail('');
    setPassword('');
    setName('');
    setIsAdmin(false);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate({ email, password, name: name || undefined, isAdmin });
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const data: any = { name: name || undefined, isAdmin };
    if (password) {
      data.password = password;
    }
    updateUserMutation.mutate({ id: editingUser.id, data });
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setEmail(user.email);
    setName(user.name || '');
    setIsAdmin(user.isAdmin);
    setPassword('');
  };

  const closeEditDialog = () => {
    setEditingUser(null);
    setEmail('');
    setPassword('');
    setName('');
    setIsAdmin(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('admin.title')}</h1>
        <p className="text-muted-foreground">{t('admin.manageUsers')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.totalUsers')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.users || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.totalDomains')}</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.domains || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.totalAddresses')}</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.addresses || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.totalEmails')}</CardTitle>
            <Inbox className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.emails || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t('admin.systemSettings')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('admin.allowPublicRegister')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('admin.allowPublicRegisterDesc')}
              </p>
            </div>
            <Switch
              checked={settings?.allowPublicRegister ?? true}
              onCheckedChange={(checked) =>
                updateSettingsMutation.mutate({ allowPublicRegister: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('admin.userManagement')}
            </CardTitle>
            <CardDescription>{t('admin.manageUsers')}</CardDescription>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('admin.addUser')}
          </Button>
        </CardHeader>
        <CardContent>
          {isLoadingUsers ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : users && users.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.email')}</TableHead>
                  <TableHead>{t('admin.name')}</TableHead>
                  <TableHead>{t('admin.role')}</TableHead>
                  <TableHead>{t('admin.status')}</TableHead>
                  <TableHead>{t('admin.domainsCount')}</TableHead>
                  <TableHead>{t('admin.createdAt')}</TableHead>
                  <TableHead className="text-right">{t('admin.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>{user.name || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={user.isAdmin ? 'default' : 'secondary'}>
                        {user.isAdmin ? (
                          <><Shield className="h-3 w-3 mr-1" />{t('admin.admin')}</>
                        ) : (
                          <><UserIcon className="h-3 w-3 mr-1" />{t('admin.user')}</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? 'outline' : 'destructive'}>
                        {user.isActive ? t('admin.active') : t('admin.disabled')}
                      </Badge>
                    </TableCell>
                    <TableCell>{user._count?.domains || 0}</TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingUser(user)}
                          disabled={user.id === currentUser?.id}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {t('admin.noUsers')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.createUser')}</DialogTitle>
            <DialogDescription>{t('admin.manageUsers')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('admin.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t('admin.password')}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">{t('admin.name')}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="isAdmin">{t('admin.admin')}</Label>
                <Switch
                  id="isAdmin"
                  checked={isAdmin}
                  onCheckedChange={setIsAdmin}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeCreateDialog}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={createUserMutation.isPending}>
                {createUserMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {t('admin.createUser')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => closeEditDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.editUser')}</DialogTitle>
            <DialogDescription>{editingUser?.email}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateUser}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">{t('admin.name')}</Label>
                <Input
                  id="edit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-password">{t('admin.password')}</Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave empty to keep current"
                  minLength={6}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-isAdmin">{t('admin.admin')}</Label>
                <Switch
                  id="edit-isAdmin"
                  checked={isAdmin}
                  onCheckedChange={setIsAdmin}
                  disabled={editingUser?.id === currentUser?.id}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-isActive">{t('admin.status')}</Label>
                <Switch
                  id="edit-isActive"
                  checked={editingUser?.isActive ?? true}
                  onCheckedChange={(checked) => {
                    if (editingUser) {
                      updateUserMutation.mutate({ id: editingUser.id, data: { isActive: checked } });
                    }
                  }}
                  disabled={editingUser?.id === currentUser?.id}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeEditDialog}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={updateUserMutation.isPending}>
                {updateUserMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {t('common.save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingUser} onOpenChange={() => setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.deleteUser')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.confirmDeleteUser')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingUser && deleteUserMutation.mutate(deletingUser.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUserMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
