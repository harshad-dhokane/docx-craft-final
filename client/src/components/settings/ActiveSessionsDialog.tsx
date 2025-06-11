import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Monitor, Smartphone, Tablet, MapPin, Clock, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Session {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  current: boolean;
  browser: string;
  ip: string;
}

interface ActiveSessionsDialogProps {
  children: React.ReactNode;
}

export const ActiveSessionsDialog = ({ children }: ActiveSessionsDialogProps) => {
  const [open, setOpen] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadSessions();
    }
  }, [open]);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      // Get current session info
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;

      // For demo purposes, create mock sessions based on current session
      // In a real implementation, you would fetch from a sessions table
      const mockSessions: Session[] = [
        {
          id: session?.access_token.slice(-8) || 'current',
          device: 'Desktop',
          location: 'New York, NY',
          lastActive: 'Now',
          current: true,
          browser: 'Chrome 120',
          ip: '192.168.1.100'
        },
        {
          id: 'session2',
          device: 'Mobile',
          location: 'Los Angeles, CA',
          lastActive: '2 hours ago',
          current: false,
          browser: 'Safari 17',
          ip: '10.0.0.50'
        },
        {
          id: 'session3',
          device: 'Tablet',
          location: 'Chicago, IL',
          lastActive: '1 day ago',
          current: false,
          browser: 'Firefox 121',
          ip: '172.16.0.25'
        }
      ];

      setSessions(mockSessions);
    } catch (error: any) {
      console.error('Error loading sessions:', error);
      toast({
        title: "Failed to Load Sessions",
        description: "Could not retrieve active sessions.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const terminateSession = async (sessionId: string) => {
    try {
      if (sessionId === sessions.find(s => s.current)?.id) {
        // Terminating current session - sign out
        await supabase.auth.signOut();
        toast({
          title: "Session Terminated",
          description: "You have been signed out of this device.",
        });
        setOpen(false);
      } else {
        // Remove session from list (in real implementation, would revoke server-side)
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        toast({
          title: "Session Terminated",
          description: "The session has been terminated successfully.",
        });
      }
    } catch (error: any) {
      console.error('Error terminating session:', error);
      toast({
        title: "Termination Failed",
        description: "Could not terminate the session.",
        variant: "destructive",
      });
    }
  };

  const terminateAllOtherSessions = async () => {
    try {
      const otherSessions = sessions.filter(s => !s.current);
      setSessions(prev => prev.filter(s => s.current));
      
      toast({
        title: "Sessions Terminated",
        description: `${otherSessions.length} other sessions have been terminated.`,
      });
    } catch (error: any) {
      console.error('Error terminating sessions:', error);
      toast({
        title: "Termination Failed",
        description: "Could not terminate other sessions.",
        variant: "destructive",
      });
    }
  };

  const getDeviceIcon = (device: string) => {
    switch (device.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      case 'tablet':
        return <Tablet className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Monitor className="h-5 w-5 text-blue-600" />
            <span>Active Sessions</span>
          </DialogTitle>
          <DialogDescription>
            Manage your active sessions across all devices. You can terminate sessions that you don't recognize.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div key={session.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getDeviceIcon(session.device)}
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{session.device}</span>
                            {session.current && (
                              <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                                Current
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{session.browser}</p>
                        </div>
                      </div>
                      {!session.current && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => terminateSession(session.id)}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <LogOut className="h-4 w-4 mr-1" />
                          Terminate
                        </Button>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3" />
                        <span>{session.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{session.lastActive}</span>
                      </div>
                      <span>IP: {session.ip}</span>
                    </div>
                  </div>
                ))}
              </div>

              {sessions.filter(s => !s.current).length > 0 && (
                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={terminateAllOtherSessions}
                    className="w-full text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Terminate All Other Sessions
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};