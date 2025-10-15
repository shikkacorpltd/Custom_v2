import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  subscriptionManager, 
  useRealtimeSubscription, 
  getRealtimeStatus 
} from '@/lib/realtime-manager';

/**
 * This component is a diagnostic tool for testing Supabase Realtime functionality
 */
export default function RealtimeTest() {
  const [realtimeStatus, setRealtimeStatus] = useState(getRealtimeStatus());
  const [messages, setMessages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Add a message to the log
  const addMessage = (message: string) => {
    setMessages(prev => [message, ...prev.slice(0, 19)]);
  };

  // Test direct channel subscription
  const testDirectSubscription = async () => {
    try {
      setError(null);
      addMessage("🔄 Testing direct channel subscription...");
      
      const channel = supabase
        .channel('test-direct-channel')
        .on(
          'postgres_changes' as any,
          {
            event: '*',
            schema: 'public',
            table: 'schools',
          },
          (payload) => {
            addMessage(`✅ Received direct event: ${payload.eventType}`);
            toast({
              title: "Event Received",
              description: `Received ${payload.eventType} event on schools table`,
            });
          }
        )
        .subscribe((status) => {
          addMessage(`🔔 Channel status: ${status}`);
          if (status === 'SUBSCRIBED') {
            toast({
              title: "Channel Subscribed",
              description: "Successfully subscribed to test channel",
            });
          }
        });
        
      // Cleanup after 30 seconds
      setTimeout(() => {
        supabase.removeChannel(channel);
        addMessage("🧹 Cleaned up test channel");
      }, 30000);
      
      addMessage("✅ Channel setup complete");
    } catch (err: any) {
      const errorMsg = `❌ Error: ${err.message || 'Unknown error'}`;
      setError(errorMsg);
      addMessage(errorMsg);
    }
  };
  
  // Test subscription manager
  const testSubscriptionManager = () => {
    try {
      setError(null);
      addMessage("🔄 Testing subscription manager...");
      
      subscriptionManager.subscribe('test-manager-channel', 'schools', {
        event: '*',
        onInsert: () => {
          addMessage("✅ School inserted");
          toast({ title: "School Created", description: "A new school was added" });
        },
        onUpdate: () => {
          addMessage("✅ School updated");
          toast({ title: "School Updated", description: "A school was updated" });
        },
        onDelete: () => {
          addMessage("✅ School deleted");
          toast({ title: "School Deleted", description: "A school was removed" });
        },
        onChange: () => {
          addMessage("✅ Any school change detected");
        }
      });
      
      // Cleanup after 30 seconds
      setTimeout(() => {
        subscriptionManager.unsubscribe('test-manager-channel');
        addMessage("🧹 Cleaned up manager channel");
      }, 30000);
      
      addMessage("✅ Subscription manager setup complete");
    } catch (err: any) {
      const errorMsg = `❌ Error: ${err.message || 'Unknown error'}`;
      setError(errorMsg);
      addMessage(errorMsg);
    }
  };

  // Monitor realtime status
  useEffect(() => {
    const interval = setInterval(() => {
      setRealtimeStatus(getRealtimeStatus());
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Return component
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Realtime Connection Diagnostic</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex space-x-4">
              <Button 
                onClick={testDirectSubscription} 
                variant="default"
              >
                Test Direct Channel
              </Button>
              <Button 
                onClick={testSubscriptionManager} 
                variant="outline"
              >
                Test Subscription Manager
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Realtime Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Connected:</span>
                      <Badge variant={realtimeStatus.connected ? "default" : "destructive"}>
                        {realtimeStatus.connected ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Active Subscriptions:</span>
                      <span>{realtimeStatus.activeSubscriptions}</span>
                    </div>
                    {realtimeStatus.subscriptionNames.map((name, i) => (
                      <div key={i} className="text-xs text-muted-foreground">{name}</div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Event Log</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] overflow-y-auto">
                  {error && (
                    <div className="bg-destructive/10 text-destructive p-2 rounded mb-2 text-sm">
                      {error}
                    </div>
                  )}
                  <div className="space-y-1">
                    {messages.map((msg, i) => (
                      <div key={i} className="text-xs border-b border-gray-100 pb-1 mb-1">
                        {msg}
                      </div>
                    ))}
                    {messages.length === 0 && (
                      <div className="text-xs text-muted-foreground">No events yet. Click a test button to begin.</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}