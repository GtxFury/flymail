import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { domainsApi, addressesApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  const [isAddDomainOpen, setIsAddDomainOpen] = useState(false);
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<any>(null);
  const [newDomain, setNewDomain] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: domains, isLoading } = useQuery({
    queryKey: ['domains'],
    queryFn: domainsApi.list,
  });

  const createDomainMutation = useMutation({
    mutationFn: domainsApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      setIsAddDomainOpen(false);
      setNewDomain('');
      setSelectedDomain(data);
      toast({ title: 'Domain added successfully' });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    },
  });

  const verifyDomainMutation = useMutation({
    mutationFn: domainsApi.verify,
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      if (data.verified) {
        toast({ title: 'Domain verified successfully!' });
      } else {
        toast({ variant: 'destructive', title: 'Verification failed', description: data.message });
      }
    },
  });

  const deleteDomainMutation = useMutation({
    mutationFn: domainsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      toast({ title: 'Domain deleted' });
    },
  });

  const createAddressMutation = useMutation({
    mutationFn: addressesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setIsAddAddressOpen(false);
      setNewAddress('');
      toast({ title: 'Address created successfully' });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: addressesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast({ title: 'Address deleted' });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard' });
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
          <h1 className="text-3xl font-bold tracking-tight">Domains</h1>
          <p className="text-muted-foreground mt-2">
            Manage your email domains and addresses
          </p>
        </div>
        <Dialog open={isAddDomainOpen} onOpenChange={setIsAddDomainOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Domain
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Domain</DialogTitle>
              <DialogDescription>
                Enter your domain name to start receiving emails
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  placeholder="example.com"
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
                Add Domain
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
            <h3 className="text-lg font-medium mb-2">No domains yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add your first domain to start receiving emails
            </p>
            <Button onClick={() => setIsAddDomainOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Domain
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
                        Verified
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-500">
                        <AlertCircle className="h-3 w-3" />
                        Pending
                      </span>
                    )}
                  </div>
                </div>
                <CardDescription>
                  {domain._count?.addresses || 0} email addresses
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!domain.verified && (
                  <div className="p-4 rounded-lg bg-muted space-y-3">
                    <p className="text-sm font-medium">Add this MX record to your DNS:</p>
                    <div className="flex items-center gap-2 p-2 bg-background rounded border text-sm font-mono">
                      <span className="flex-1 truncate">
                        MX @ mail.flymail.local (Priority: 10)
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard('mail.flymail.local')}
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
                      Verify MX Record
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
                    Add Address
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDomain(domain)}
                  >
                    View Addresses
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
              Manage email addresses for this domain
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
                          Catch-all
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
                No email addresses yet
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={() => setIsAddAddressOpen(true)}
              disabled={!selectedDomain?.verified}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Address
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Address Dialog */}
      <Dialog open={isAddAddressOpen} onOpenChange={setIsAddAddressOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Email Address</DialogTitle>
            <DialogDescription>
              Create a new email address for {selectedDomain?.domain}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <div className="flex gap-2">
                <Input
                  id="address"
                  placeholder="hello"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                />
                <span className="flex items-center text-muted-foreground">
                  @{selectedDomain?.domain}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Use * to create a catch-all address
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => createAddressMutation.mutate({
                localPart: newAddress,
                domainId: selectedDomain?.id,
              })}
              disabled={!newAddress || createAddressMutation.isPending}
            >
              {createAddressMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Address
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
