import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { domainsApi, addressesApi, configApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Globe, Plus, Trash2, CheckCircle, AlertCircle, Copy, Loader2, Mail } from 'lucide-react';

export default function DomainsPage() {
  const { t } = useTranslation();
  const [isAddDomainOpen, setIsAddDomainOpen] = useState(false);
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<any>(null);
  const [newDomain, setNewDomain] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [isCatchAll, setIsCatchAll] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: domains, isLoading } = useQuery({
    queryKey: ['domains'],
    queryFn: domainsApi.list,
  });

  const { data: config } = useQuery({
    queryKey: ['config'],
    queryFn: configApi.get,
  });

  const mxHostname = config?.mxHostname || 'mail.flymail.local';

  const createDomainMutation = useMutation({
    mutationFn: domainsApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      setIsAddDomainOpen(false);
      setNewDomain('');
      setSelectedDomain(data);
      toast({ title: t('domains.domainAdded') });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: t('common.error'), description: error.message });
    },
  });

  const verifyDomainMutation = useMutation({
    mutationFn: domainsApi.verify,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      if (data.verified) {
        toast({ title: t('domains.domainVerified') });
      } else {
        toast({ variant: 'destructive', title: t('domains.verificationFailed'), description: data.message });
      }
    },
  });

  const deleteDomainMutation = useMutation({
    mutationFn: domainsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      toast({ title: t('domains.domainDeleted') });
    },
  });

  const createAddressMutation = useMutation({
    mutationFn: addressesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setIsAddAddressOpen(false);
      setNewAddress('');
      setIsCatchAll(false);
      toast({ title: t('addresses.addressCreated') });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: t('common.error'), description: error.message });
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: addressesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast({ title: t('addresses.addressDeleted') });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: t('common.copiedToClipboard') });
  };

  const { data: domainDetail } = useQuery({
    queryKey: ['domain', selectedDomain?.id],
    queryFn: () => domainsApi.get(selectedDomain.id),
    enabled: !!selectedDomain?.id,
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('domains.title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('domains.subtitle')}
          </p>
        </div>
        <Dialog open={isAddDomainOpen} onOpenChange={setIsAddDomainOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t('domains.addDomain')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('domains.addDomain')}</DialogTitle>
              <DialogDescription>
                {t('domains.enterDomain')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="domain">{t('domains.title')}</Label>
                <Input
                  id="domain"
                  placeholder={t('domains.domainPlaceholder')}
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => createDomainMutation.mutate(newDomain)}
                disabled={!newDomain || createDomainMutation.isPending}
              >
                {createDomainMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('domains.addDomain')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !domains || domains.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Globe className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">{t('domains.noDomains')}</h3>
            <p className="text-muted-foreground text-center mb-4">
              {t('domains.addFirstDomainDesc')}
            </p>
            <Button onClick={() => setIsAddDomainOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('domains.addDomain')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {domains.map((domain: any) => (
            <Card key={domain.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-xl">{domain.domain}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    {domain.verified ? (
                      <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-500">
                        <CheckCircle className="h-3 w-3" />
                        {t('domains.verified')}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-500">
                        <AlertCircle className="h-3 w-3" />
                        {t('domains.pending')}
                      </span>
                    )}
                  </div>
                </div>
                <CardDescription>
                  {t('domains.emailAddresses', { count: domain._count?.addresses || 0 })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!domain.verified && (
                  <div className="p-4 rounded-lg bg-muted space-y-3">
                    <p className="text-sm font-medium">{t('domains.addMxRecord')}</p>
                    <div className="flex items-center gap-2 p-2 bg-background rounded border text-sm font-mono">
                      <span className="flex-1 truncate">
                        MX @ {mxHostname} (Priority: 10)
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(mxHostname)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => verifyDomainMutation.mutate(domain.id)}
                      disabled={verifyDomainMutation.isPending}
                    >
                      {verifyDomainMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {t('domains.verifyMxRecord')}
                    </Button>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedDomain(domain);
                      setIsAddAddressOpen(true);
                    }}
                    disabled={!domain.verified}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {t('domains.addAddress')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDomain(domain)}
                  >
                    {t('domains.viewAddresses')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteDomainMutation.mutate(domain.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Domain Detail Dialog */}
      <Dialog open={!!selectedDomain && !isAddAddressOpen} onOpenChange={() => setSelectedDomain(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedDomain?.domain}</DialogTitle>
            <DialogDescription>
              {t('domains.manageAddresses')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {domainDetail?.addresses?.length > 0 ? (
              <div className="space-y-2">
                {domainDetail.addresses.map((addr: any) => (
                  <div
                    key={addr.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono">
                        {addr.catchAll ? '*' : addr.localPart}@{selectedDomain?.domain}
                      </span>
                      {addr.catchAll && (
                        <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">
                          {t('domains.catchAll')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {addr._count?.emails || 0} emails
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteAddressMutation.mutate(addr.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                {t('domains.noAddresses')}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={() => setIsAddAddressOpen(true)}
              disabled={!selectedDomain?.verified}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('domains.addAddress')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Address Dialog */}
      <Dialog open={isAddAddressOpen} onOpenChange={(open) => {
        setIsAddAddressOpen(open);
        if (!open) {
          setNewAddress('');
          setIsCatchAll(false);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('addresses.title')}</DialogTitle>
            <DialogDescription>
              {t('addresses.subtitle', { domain: selectedDomain?.domain })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('addresses.catchAllMode')}</Label>
                <p className="text-xs text-muted-foreground">
                  {t('addresses.catchAllDesc')}
                </p>
              </div>
              <Switch
                checked={isCatchAll}
                onCheckedChange={setIsCatchAll}
              />
            </div>
            {!isCatchAll && (
              <div className="space-y-2">
                <Label htmlFor="address">{t('auth.email')}</Label>
                <div className="flex gap-2">
                  <Input
                    id="address"
                    placeholder={t('addresses.addressPlaceholder')}
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                  />
                  <span className="flex items-center text-muted-foreground">
                    @{selectedDomain?.domain}
                  </span>
                </div>
              </div>
            )}
            {isCatchAll && (
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm font-medium">*@{selectedDomain?.domain}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('addresses.catchAllHint')}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={() => createAddressMutation.mutate({
                localPart: isCatchAll ? '*' : newAddress,
                domainId: selectedDomain?.id,
              })}
              disabled={(!isCatchAll && !newAddress) || createAddressMutation.isPending}
            >
              {createAddressMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('addresses.createAddress')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
