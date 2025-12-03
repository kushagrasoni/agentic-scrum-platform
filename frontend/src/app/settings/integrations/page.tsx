"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Github, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ExternalLink,
  Key,
  Globe,
  User,
  Lock,
  Trash2,
  RefreshCw,
  AlertCircle,
  Settings,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api-client";

// Jira icon component
function JiraIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.571 11.513H0l5.785 5.786 5.786-5.786zm0 0l-5.786 5.786L11.571 23.3l5.786-5.785-5.786-5.786v-.216zm0 0L5.785 5.727 0 11.513h11.571zm0 0l5.786-5.786L11.571 0 5.785 5.727l5.786 5.786z"/>
    </svg>
  );
}

interface JiraConnection {
  connected: boolean;
  url: string;
  email: string;
  projects: string[];
  lastTested?: string;
}

interface GitHubConnection {
  connected: boolean;
  username: string;
  repos: string[];
  lastTested?: string;
}

export default function IntegrationsPage() {
  const { toast } = useToast();
  
  // Connection states
  const [jiraConnection, setJiraConnection] = useState<JiraConnection>({
    connected: false,
    url: '',
    email: '',
    projects: [],
  });
  
  const [githubConnection, setGitHubConnection] = useState<GitHubConnection>({
    connected: false,
    username: '',
    repos: [],
  });
  
  // Form states
  const [jiraForm, setJiraForm] = useState({
    url: '',
    email: '',
    apiToken: '',
  });
  
  const [githubForm, setGitHubForm] = useState({
    token: '',
  });
  
  // UI states
  const [isTestingJira, setIsTestingJira] = useState(false);
  const [isTestingGitHub, setIsTestingGitHub] = useState(false);
  const [isSavingJira, setIsSavingJira] = useState(false);
  const [isSavingGitHub, setIsSavingGitHub] = useState(false);
  const [disconnectDialog, setDisconnectDialog] = useState<'jira' | 'github' | null>(null);

  // Auto-push settings
  const [autoPushEnabled, setAutoPushEnabled] = useState(false);
  const [defaultTarget, setDefaultTarget] = useState<'jira' | 'github' | 'none'>('none');

  // Load integration status on mount
  useEffect(() => {
    loadIntegrationStatus();
  }, []);

  const loadIntegrationStatus = async () => {
    try {
      const [jiraRes, githubRes] = await Promise.all([
        apiClient.integrations.jira.status(),
        apiClient.integrations.github.status(),
      ]);

      if (jiraRes.success && jiraRes.data?.connected) {
        setJiraConnection({
          connected: true,
          url: jiraRes.data.details?.url || '',
          email: jiraRes.data.details?.email || '',
          projects: jiraRes.data.details?.projects || [],
          lastTested: jiraRes.data.last_tested,
        });
      }

      if (githubRes.success && githubRes.data?.connected) {
        setGitHubConnection({
          connected: true,
          username: githubRes.data.details?.user || '',
          repos: githubRes.data.details?.repos || [],
          lastTested: githubRes.data.last_tested,
        });
      }
    } catch (err) {
      console.error("Failed to load integration status:", err);
    }
  };

  const handleTestJira = async () => {
    if (!jiraForm.url || !jiraForm.email || !jiraForm.apiToken) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please fill in all Jira connection fields",
      });
      return;
    }

    setIsTestingJira(true);
    
    try {
      const response = await apiClient.integrations.jira.connect({
        url: jiraForm.url,
        email: jiraForm.email,
        api_token: jiraForm.apiToken,
      });
      
      if (response.success && response.data?.connected) {
        setJiraConnection({
          connected: true,
          url: jiraForm.url,
          email: jiraForm.email,
          projects: response.data.projects || [],
          lastTested: new Date().toISOString(),
        });
        
        toast({
          title: "Connection successful",
          description: `Jira connection verified. Found ${response.data.projects?.length || 0} projects.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Connection failed",
          description: response.message || "Failed to connect to Jira",
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Connection failed",
        description: err instanceof Error ? err.message : "Failed to connect to Jira",
      });
    }
    
    setIsTestingJira(false);
  };

  const handleSaveJira = async () => {
    setIsSavingJira(true);
    
    // Simulate saving (replace with actual API call)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Settings saved",
      description: "Jira integration settings have been saved.",
    });
    
    setIsSavingJira(false);
  };

  const handleTestGitHub = async () => {
    if (!githubForm.token) {
      toast({
        variant: "destructive",
        title: "Missing token",
        description: "Please enter your GitHub personal access token",
      });
      return;
    }

    setIsTestingGitHub(true);
    
    try {
      const response = await apiClient.integrations.github.connect({
        token: githubForm.token,
      });
      
      if (response.success && response.data?.connected) {
        setGitHubConnection({
          connected: true,
          username: response.data.user || '',
          repos: response.data.repos || [],
          lastTested: new Date().toISOString(),
        });
        
        toast({
          title: "Connection successful",
          description: `GitHub connection verified. Found ${response.data.repos?.length || 0} repositories.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Connection failed",
          description: response.message || "Failed to connect to GitHub",
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Connection failed",
        description: err instanceof Error ? err.message : "Failed to connect to GitHub",
      });
    }
    
    setIsTestingGitHub(false);
  };

  const handleSaveGitHub = async () => {
    setIsSavingGitHub(true);
    
    // Simulate saving (replace with actual API call)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Settings saved",
      description: "GitHub integration settings have been saved.",
    });
    
    setIsSavingGitHub(false);
  };

  const handleDisconnect = async (target: 'jira' | 'github') => {
    try {
      if (target === 'jira') {
        await apiClient.integrations.jira.disconnect();
        setJiraConnection({
          connected: false,
          url: '',
          email: '',
          projects: [],
        });
        setJiraForm({ url: '', email: '', apiToken: '' });
      } else {
        await apiClient.integrations.github.disconnect();
        setGitHubConnection({
          connected: false,
          username: '',
          repos: [],
        });
        setGitHubForm({ token: '' });
      }
      
      setDisconnectDialog(null);
      
      toast({
        title: "Disconnected",
        description: `${target === 'jira' ? 'Jira' : 'GitHub'} integration has been disconnected.`,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Disconnect failed",
        description: err instanceof Error ? err.message : "Failed to disconnect",
      });
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/configure">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Settings className="h-8 w-8" />
            Integration Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Connect to Jira and GitHub for one-click exports
          </p>
        </div>
      </div>

      {/* Jira Integration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <JiraIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle>Jira Cloud</CardTitle>
                <CardDescription>Push user stories directly to Jira</CardDescription>
              </div>
            </div>
            <Badge variant={jiraConnection.connected ? "default" : "secondary"}>
              {jiraConnection.connected ? (
                <><CheckCircle2 className="h-3 w-3 mr-1" /> Connected</>
              ) : (
                <><XCircle className="h-3 w-3 mr-1" /> Not Connected</>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {jiraConnection.connected ? (
            // Connected State
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Instance URL</p>
                  <p className="font-medium flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    {jiraConnection.url}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Connected User</p>
                  <p className="font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {jiraConnection.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Available Projects</p>
                  <div className="flex gap-1 mt-1">
                    {jiraConnection.projects.map(project => (
                      <Badge key={project} variant="outline">{project}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Verified</p>
                  <p className="font-medium">
                    {jiraConnection.lastTested ? new Date(jiraConnection.lastTested).toLocaleString() : 'Never'}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleTestJira} disabled={isTestingJira}>
                  {isTestingJira ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Test Connection
                </Button>
                <Button variant="outline" asChild>
                  <a href={jiraConnection.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Jira
                  </a>
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => setDisconnectDialog('jira')}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              </div>
            </div>
          ) : (
            // Not Connected State - Show Form
            <div className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jira-url">Jira Instance URL</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="jira-url"
                      placeholder="https://yourcompany.atlassian.net"
                      value={jiraForm.url}
                      onChange={(e) => setJiraForm(prev => ({ ...prev, url: e.target.value }))}
                      className="pl-9"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="jira-email">Email Address</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="jira-email"
                      type="email"
                      placeholder="your.email@company.com"
                      value={jiraForm.email}
                      onChange={(e) => setJiraForm(prev => ({ ...prev, email: e.target.value }))}
                      className="pl-9"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="jira-token">API Token</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="jira-token"
                      type="password"
                      placeholder="Your Jira API token"
                      value={jiraForm.apiToken}
                      onChange={(e) => setJiraForm(prev => ({ ...prev, apiToken: e.target.value }))}
                      className="pl-9"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Create an API token at{" "}
                    <a 
                      href="https://id.atlassian.com/manage-profile/security/api-tokens" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Atlassian Account Settings
                    </a>
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        {!jiraConnection.connected && (
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleTestJira} disabled={isTestingJira}>
              {isTestingJira ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Test Connection
            </Button>
            <Button onClick={handleSaveJira} disabled={isSavingJira || !jiraConnection.connected}>
              {isSavingJira ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Save Settings
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* GitHub Integration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Github className="h-6 w-6 text-gray-700" />
              </div>
              <div>
                <CardTitle>GitHub</CardTitle>
                <CardDescription>Create issues in GitHub repositories</CardDescription>
              </div>
            </div>
            <Badge variant={githubConnection.connected ? "default" : "secondary"}>
              {githubConnection.connected ? (
                <><CheckCircle2 className="h-3 w-3 mr-1" /> Connected</>
              ) : (
                <><XCircle className="h-3 w-3 mr-1" /> Not Connected</>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {githubConnection.connected ? (
            // Connected State
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Connected Account</p>
                  <p className="font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    @{githubConnection.username}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Available Repositories</p>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {githubConnection.repos.map(repo => (
                      <Badge key={repo} variant="outline">{repo}</Badge>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleTestGitHub} disabled={isTestingGitHub}>
                  {isTestingGitHub ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Test Connection
                </Button>
                <Button variant="outline" asChild>
                  <a href={`https://github.com/${githubConnection.username}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open GitHub
                  </a>
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => setDisconnectDialog('github')}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              </div>
            </div>
          ) : (
            // Not Connected State - Show Form
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="github-token">Personal Access Token</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="github-token"
                    type="password"
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    value={githubForm.token}
                    onChange={(e) => setGitHubForm(prev => ({ ...prev, token: e.target.value }))}
                    className="pl-9"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Create a token with 'repo' scope at{" "}
                  <a 
                    href="https://github.com/settings/tokens/new" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    GitHub Settings
                  </a>
                </p>
              </div>
              
              <Alert>
                <Lock className="h-4 w-4" />
                <AlertDescription>
                  Your token is encrypted and stored securely. We only request the minimum permissions needed.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
        {!githubConnection.connected && (
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleTestGitHub} disabled={isTestingGitHub}>
              {isTestingGitHub ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Test Connection
            </Button>
            <Button onClick={handleSaveGitHub} disabled={isSavingGitHub || !githubConnection.connected}>
              {isSavingGitHub ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Save Settings
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Export Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Export Preferences</CardTitle>
          <CardDescription>Configure default export behavior</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-push after execution</Label>
              <p className="text-sm text-muted-foreground">
                Automatically push artifacts after workflow completion
              </p>
            </div>
            <Switch
              checked={autoPushEnabled}
              onCheckedChange={setAutoPushEnabled}
            />
          </div>
          
          {autoPushEnabled && (
            <div className="space-y-2 pl-4 border-l-2">
              <Label>Default Export Target</Label>
              <div className="flex gap-2">
                <Button
                  variant={defaultTarget === 'jira' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDefaultTarget('jira')}
                  disabled={!jiraConnection.connected}
                >
                  <JiraIcon className="h-4 w-4 mr-2" />
                  Jira
                </Button>
                <Button
                  variant={defaultTarget === 'github' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDefaultTarget('github')}
                  disabled={!githubConnection.connected}
                >
                  <Github className="h-4 w-4 mr-2" />
                  GitHub
                </Button>
              </div>
              {(!jiraConnection.connected && !githubConnection.connected) && (
                <p className="text-sm text-muted-foreground">
                  Connect to Jira or GitHub to enable auto-push
                </p>
              )}
            </div>
          )}
          
          <Separator />
          
          <div className="space-y-2">
            <Label>Default Labels</Label>
            <Input placeholder="ai-generated, automated" />
            <p className="text-xs text-muted-foreground">
              Comma-separated labels to add to all exported items
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Disconnect Confirmation Dialog */}
      <Dialog open={!!disconnectDialog} onOpenChange={() => setDisconnectDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect {disconnectDialog === 'jira' ? 'Jira' : 'GitHub'}?</DialogTitle>
            <DialogDescription>
              This will remove your {disconnectDialog === 'jira' ? 'Jira' : 'GitHub'} credentials. 
              You'll need to reconnect to push artifacts to this platform.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisconnectDialog(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => disconnectDialog && handleDisconnect(disconnectDialog)}
            >
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
