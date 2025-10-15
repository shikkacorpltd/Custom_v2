import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Shield, AlertCircle, CheckCircle, Search, Filter } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface AuditLog {
  id: string;
  timestamp: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: any;
  new_values: any;
  success: boolean;
  error_message: string | null;
  metadata: any;
}

const AuditLogViewer = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [successFilter, setSuccessFilter] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching audit logs:', error);
        toast({
          title: "Error",
          description: "Failed to load audit logs",
          variant: "destructive",
        });
        return;
      }

      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadgeVariant = (action: string): "default" | "secondary" | "destructive" | "outline" => {
    if (action.includes('CREATE') || action.includes('ASSIGNED')) return 'default';
    if (action.includes('UPDATE')) return 'secondary';
    if (action.includes('DELETE') || action.includes('REMOVED')) return 'destructive';
    if (action.includes('BOOTSTRAP')) return 'outline';
    return 'secondary';
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      searchTerm === "" ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.error_message?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    const matchesSuccess = 
      successFilter === "all" || 
      (successFilter === "success" && log.success) ||
      (successFilter === "failure" && !log.success);

    return matchesSearch && matchesAction && matchesSuccess;
  });

  const uniqueActions = Array.from(new Set(logs.map(log => log.action)));

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Audit Trail</CardTitle>
          </div>
          <CardDescription>
            View system activity and security events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {uniqueActions.map(action => (
                  <SelectItem key={action} value={action}>{action}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={successFilter} onValueChange={setSuccessFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success Only</SelectItem>
                <SelectItem value="failure">Failures Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No audit logs found</p>
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <Card key={log.id} className={!log.success ? "border-destructive/50" : ""}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          {log.success ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-destructive" />
                          )}
                          <Badge variant={getActionBadgeVariant(log.action)}>
                            {log.action}
                          </Badge>
                          <Badge variant="outline">{log.entity_type}</Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(log.timestamp), 'PPpp')}
                        </span>
                      </div>

                      {log.error_message && (
                        <div className="text-sm text-destructive mb-2">
                          Error: {log.error_message}
                        </div>
                      )}

                      {log.new_values && (
                        <div className="text-sm">
                          <details className="cursor-pointer">
                            <summary className="font-medium text-muted-foreground hover:text-foreground">
                              View Details
                            </summary>
                            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                              {JSON.stringify(log.new_values, null, 2)}
                            </pre>
                          </details>
                        </div>
                      )}

                      {log.metadata && (
                        <div className="text-xs text-muted-foreground mt-2">
                          {JSON.stringify(log.metadata)}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLogViewer;