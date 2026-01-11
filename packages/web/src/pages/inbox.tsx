import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { addressesApi, emailsApi } from '@/lib/api';
import { cn, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import {
  Mail,
  Star,
  Trash2,
  Search,
  Inbox,
  Loader2,
  ChevronLeft,
  Paperclip,
  MailOpen,
} from 'lucide-react';

export default function InboxPage() {
  const { addressId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: addresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: addressesApi.list,
  });

  const { data: emailsData, isLoading: isLoadingEmails } = useQuery({
    queryKey: ['emails', addressId, searchQuery],
    queryFn: () => emailsApi.list({
      addressId,
      search: searchQuery || undefined,
      limit: 50,
    }),
  });

  const { data: selectedEmail, isLoading: isLoadingEmail } = useQuery({
    queryKey: ['email', selectedEmailId],
    queryFn: () => emailsApi.get(selectedEmailId!),
    enabled: !!selectedEmailId,
  });

  const updateEmailMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => emailsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      queryClient.invalidateQueries({ queryKey: ['email', selectedEmailId] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });

  const deleteEmailMutation = useMutation({
    mutationFn: emailsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
      setSelectedEmailId(null);
      toast({ title: 'Email deleted' });
    },
  });

  const emails = emailsData?.emails || [];

  return (
    <div className="h-[calc(100vh-6rem)] flex gap-4">
      {/* Sidebar - Address List */}
      <div className="w-64 flex-shrink-0 border rounded-lg bg-card">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Mailboxes</h2>
        </div>
        <ScrollArea className="h-[calc(100%-57px)]">
          <div className="p-2 space-y-1">
            <button
              onClick={() => {
                navigate('/inbox');
                setSelectedEmailId(null);
              }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                !addressId
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              )}
            >
              <Inbox className="h-4 w-4" />
              All Inboxes
            </button>
            <Separator className="my-2" />
            {addresses?.map((addr: any) => (
              <button
                key={addr.id}
                onClick={() => {
                  navigate(`/inbox/${addr.id}`);
                  setSelectedEmailId(null);
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left',
                  addressId === addr.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                )}
              >
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{addr.fullAddress}</span>
                {addr._count?.emails > 0 && (
                  <span className="ml-auto text-xs opacity-70">
                    {addr._count.emails}
                  </span>
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Email List */}
      <div className="w-80 flex-shrink-0 border rounded-lg bg-card flex flex-col">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search emails..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          {isLoadingEmails ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : emails.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Inbox className="h-12 w-12 mb-4" />
              <p>No emails yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {emails.map((email: any) => (
                <button
                  key={email.id}
                  onClick={() => setSelectedEmailId(email.id)}
                  className={cn(
                    'w-full p-4 text-left transition-colors',
                    selectedEmailId === email.id
                      ? 'bg-accent'
                      : 'hover:bg-accent/50',
                    !email.isRead && 'bg-primary/5'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {!email.isRead && (
                          <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                        )}
                        <span className={cn(
                          'text-sm truncate',
                          !email.isRead && 'font-semibold'
                        )}>
                          {email.fromName || email.fromAddress}
                        </span>
                        <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">
                          {formatDate(email.receivedAt)}
                        </span>
                      </div>
                      <p className={cn(
                        'text-sm truncate',
                        !email.isRead ? 'font-medium' : 'text-muted-foreground'
                      )}>
                        {email.subject}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {email.preview}
                      </p>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      {email.isStarred && (
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      )}
                      {email.attachmentCount > 0 && (
                        <Paperclip className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Email Detail */}
      <div className="flex-1 border rounded-lg bg-card flex flex-col">
        {selectedEmailId && selectedEmail ? (
          <>
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedEmailId(null)}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h2 className="font-semibold">{selectedEmail.subject}</h2>
                  <p className="text-sm text-muted-foreground">
                    From: {selectedEmail.fromName ? `${selectedEmail.fromName} <${selectedEmail.fromAddress}>` : selectedEmail.fromAddress}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => updateEmailMutation.mutate({
                    id: selectedEmail.id,
                    data: { isStarred: !selectedEmail.isStarred },
                  })}
                >
                  <Star className={cn(
                    'h-5 w-5',
                    selectedEmail.isStarred && 'fill-yellow-400 text-yellow-400'
                  )} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => updateEmailMutation.mutate({
                    id: selectedEmail.id,
                    data: { isRead: !selectedEmail.isRead },
                  })}
                >
                  {selectedEmail.isRead ? (
                    <Mail className="h-5 w-5" />
                  ) : (
                    <MailOpen className="h-5 w-5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteEmailMutation.mutate(selectedEmail.id)}
                >
                  <Trash2 className="h-5 w-5 text-destructive" />
                </Button>
              </div>
            </div>
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>To: {selectedEmail.toAddress}</span>
                  <span>{new Date(selectedEmail.receivedAt).toLocaleString()}</span>
                </div>
                {selectedEmail.attachments?.length > 0 && (
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm font-medium mb-2">
                      Attachments ({selectedEmail.attachments.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedEmail.attachments.map((att: any) => (
                        <div
                          key={att.id}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background border text-sm"
                        >
                          <Paperclip className="h-4 w-4" />
                          <span>{att.filename}</span>
                          <span className="text-muted-foreground">
                            ({(att.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <Separator />
                {selectedEmail.htmlContent ? (
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: selectedEmail.htmlContent }}
                  />
                ) : (
                  <pre className="whitespace-pre-wrap font-sans text-sm">
                    {selectedEmail.textContent}
                  </pre>
                )}
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Mail className="h-12 w-12 mx-auto mb-4" />
              <p>Select an email to read</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
