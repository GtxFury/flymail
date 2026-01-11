import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { domainsApi, addressesApi, emailsApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Globe, Inbox, Plus, ArrowRight } from 'lucide-react';

export default function DashboardPage() {
  const { data: domains } = useQuery({
    queryKey: ['domains'],
    queryFn: domainsApi.list,
  });

  const { data: addresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: addressesApi.list,
  });

  const { data: unreadData } = useQuery({
    queryKey: ['unreadCount'],
    queryFn: emailsApi.unreadCount,
  });

  const stats = [
    {
      title: 'Total Domains',
      value: domains?.length || 0,
      icon: Globe,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Email Addresses',
      value: addresses?.length || 0,
      icon: Mail,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Unread Emails',
      value: unreadData?.unreadCount || 0,
      icon: Inbox,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome to Flymail. Manage your email domains and addresses.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`rounded-full p-2 ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>
              Add your first domain to start receiving emails
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(!domains || domains.length === 0) ? (
              <div className="text-center py-6">
                <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  No domains configured yet
                </p>
                <Button asChild>
                  <Link to="/domains">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Domain
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {domains.slice(0, 3).map((domain: any) => (
                  <div
                    key={domain.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">{domain.domain}</span>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        domain.verified
                          ? 'bg-green-500/10 text-green-500'
                          : 'bg-yellow-500/10 text-yellow-500'
                      }`}
                    >
                      {domain.verified ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                ))}
                {domains.length > 3 && (
                  <Button variant="ghost" className="w-full" asChild>
                    <Link to="/domains">
                      View all domains
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Emails</CardTitle>
            <CardDescription>
              Your latest incoming messages
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(unreadData?.unreadCount || 0) > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary p-2">
                      <Mail className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {unreadData?.unreadCount} unread messages
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Check your inbox
                      </p>
                    </div>
                  </div>
                </div>
                <Button className="w-full" asChild>
                  <Link to="/inbox">
                    Go to Inbox
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-6">
                <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No unread emails
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
