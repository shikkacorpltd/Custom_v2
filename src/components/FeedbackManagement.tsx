import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Star, TrendingUp, Users, Loader2, Eye, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { format } from 'date-fns';

interface FeedbackSubmission {
  id: string;
  user_id: string;
  category: string;
  rating: number | null;
  nps_score: number | null;
  satisfaction: string | null;
  subject: string | null;
  feedback: string;
  priority: string | null;
  status: string;
  admin_notes: string | null;
  admin_response: string | null;
  responded_at: string | null;
  responded_by: string | null;
  created_at: string;
  user_profiles?: {
    full_name: string;
    role: string;
  };
}

interface Analytics {
  total_submissions: number;
  avg_rating: number;
  avg_nps_score: number;
  nps_percentage: number;
}

export default function FeedbackManagement() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<FeedbackSubmission[]>([]);
  const [filteredFeedback, setFilteredFeedback] = useState<FeedbackSubmission[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackSubmission | null>(null);
  const [analytics, setAnalytics] = useState<Analytics>({
    total_submissions: 0,
    avg_rating: 0,
    avg_nps_score: 0,
    nps_percentage: 0,
  });
  
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [adminResponse, setAdminResponse] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadFeedback();
    loadAnalytics();
  }, [profile?.school_id]);

  useEffect(() => {
    filterFeedback();
  }, [feedback, categoryFilter, statusFilter]);

  const loadFeedback = async () => {
    if (!profile?.school_id) return;

    try {
      const { data, error } = await supabase
        .from('feedback_submissions')
        .select(`
          *,
          user_profiles (
            full_name,
            role
          )
        `)
        .eq('school_id', profile.school_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFeedback(data || []);
    } catch (error: any) {
      console.error('Error loading feedback:', error);
      toast({
        title: "Error",
        description: "Failed to load feedback submissions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    if (!profile?.school_id) return;

    try {
      // Calculate analytics from submissions
      const { data, error } = await supabase
        .from('feedback_submissions')
        .select('rating, nps_score')
        .eq('school_id', profile.school_id)
        .gte('created_at', new Date(new Date().setDate(1)).toISOString()); // This month

      if (error) throw error;

      const submissions = data || [];
      const validRatings = submissions.filter(s => s.rating).map(s => s.rating!);
      const validNPS = submissions.filter(s => s.nps_score !== null).map(s => s.nps_score!);
      
      const promoters = validNPS.filter(score => score >= 9).length;
      const detractors = validNPS.filter(score => score <= 6).length;
      const npsPercentage = validNPS.length > 0 
        ? ((promoters - detractors) / validNPS.length) * 100 
        : 0;

      setAnalytics({
        total_submissions: submissions.length,
        avg_rating: validRatings.length > 0 
          ? validRatings.reduce((a, b) => a + b, 0) / validRatings.length 
          : 0,
        avg_nps_score: validNPS.length > 0 
          ? validNPS.reduce((a, b) => a + b, 0) / validNPS.length 
          : 0,
        nps_percentage: npsPercentage,
      });
    } catch (error: any) {
      console.error('Error loading analytics:', error);
    }
  };

  const filterFeedback = () => {
    let filtered = [...feedback];

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(f => f.category === categoryFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(f => f.status === statusFilter);
    }

    setFilteredFeedback(filtered);
  };

  const getCategoryBadge = (category: string) => {
    const badges: Record<string, { label: string; variant: any }> = {
      general_feedback: { label: 'General', variant: 'default' },
      feature_request: { label: 'Feature Request', variant: 'secondary' },
      bug_report: { label: 'Bug Report', variant: 'destructive' },
      usability_issue: { label: 'Usability', variant: 'outline' },
      nps_survey: { label: 'NPS Survey', variant: 'default' },
    };
    const config = badges[category] || { label: category, variant: 'default' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; color: string; icon: any }> = {
      submitted: { label: 'New', color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
      reviewed: { label: 'Reviewed', color: 'bg-purple-100 text-purple-800', icon: Eye },
      in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      completed: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    };
    const config = badges[status] || { label: status, color: 'bg-gray-100 text-gray-800', icon: AlertCircle };
    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="mr-1 h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string | null) => {
    if (!priority) return null;
    const badges: Record<string, { label: string; variant: any }> = {
      low: { label: 'Low', variant: 'outline' },
      medium: { label: 'Medium', variant: 'secondary' },
      high: { label: 'High', variant: 'default' },
      critical: { label: 'Critical', variant: 'destructive' },
    };
    const config = badges[priority] || { label: priority, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getNPSBadge = (score: number | null) => {
    if (score === null) return null;
    if (score >= 9) return <Badge className="bg-green-100 text-green-800">😊 Promoter</Badge>;
    if (score >= 7) return <Badge className="bg-yellow-100 text-yellow-800">😐 Passive</Badge>;
    return <Badge className="bg-red-100 text-red-800">😞 Detractor</Badge>;
  };

  const handleViewFeedback = (item: FeedbackSubmission) => {
    setSelectedFeedback(item);
    setAdminResponse(item.admin_response || '');
    setAdminNotes(item.admin_notes || '');
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedFeedback) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('feedback_submissions')
        .update({ status: newStatus })
        .eq('id', selectedFeedback.id);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Feedback marked as ${newStatus}`,
      });

      await loadFeedback();
      setSelectedFeedback({ ...selectedFeedback, status: newStatus });
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveResponse = async () => {
    if (!selectedFeedback) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('feedback_submissions')
        .update({
          admin_response: adminResponse.trim() || null,
          admin_notes: adminNotes.trim() || null,
          responded_at: adminResponse.trim() ? new Date().toISOString() : null,
          responded_by: adminResponse.trim() ? profile?.user_id : null,
          status: adminResponse.trim() ? 'reviewed' : selectedFeedback.status,
        })
        .eq('id', selectedFeedback.id);

      if (error) throw error;

      toast({
        title: "Response Saved",
        description: "Your response has been saved successfully",
      });

      await loadFeedback();
      setSelectedFeedback(null);
    } catch (error: any) {
      console.error('Error saving response:', error);
      toast({
        title: "Error",
        description: "Failed to save response",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Total Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.total_submissions}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-600" />
              Average Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.avg_rating > 0 ? analytics.avg_rating.toFixed(1) : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">Out of 5 stars</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              NPS Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.nps_percentage > 0 ? `${analytics.nps_percentage.toFixed(0)}%` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">Net Promoter Score</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-purple-600" />
              Avg NPS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.avg_nps_score > 0 ? analytics.avg_nps_score.toFixed(1) : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">Out of 10</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Feedback Submissions</CardTitle>
              <CardDescription>Review and respond to user feedback</CardDescription>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="general_feedback">General</SelectItem>
                  <SelectItem value="feature_request">Feature Request</SelectItem>
                  <SelectItem value="bug_report">Bug Report</SelectItem>
                  <SelectItem value="usability_issue">Usability</SelectItem>
                  <SelectItem value="nps_survey">NPS Survey</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="submitted">New</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredFeedback.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No feedback submissions found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFeedback.map((item) => (
                <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleViewFeedback(item)}
                >
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {getCategoryBadge(item.category)}
                          {getStatusBadge(item.status)}
                          {getPriorityBadge(item.priority)}
                          {getNPSBadge(item.nps_score)}
                          {item.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm font-medium">{item.rating}</span>
                            </div>
                          )}
                        </div>
                        {item.subject && (
                          <h4 className="font-semibold">{item.subject}</h4>
                        )}
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.feedback}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{item.user_profiles?.full_name || 'Unknown User'}</span>
                          <span>•</span>
                          <span>{format(new Date(item.created_at), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed View Dialog */}
      <Dialog open={!!selectedFeedback} onOpenChange={() => setSelectedFeedback(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Feedback Details</DialogTitle>
            <DialogDescription>
              Review and respond to this feedback submission
            </DialogDescription>
          </DialogHeader>

          {selectedFeedback && (
            <div className="space-y-6">
              {/* Feedback Info */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  {getCategoryBadge(selectedFeedback.category)}
                  {getStatusBadge(selectedFeedback.status)}
                  {getPriorityBadge(selectedFeedback.priority)}
                  {getNPSBadge(selectedFeedback.nps_score)}
                </div>

                {selectedFeedback.subject && (
                  <div>
                    <Label className="text-muted-foreground">Subject</Label>
                    <p className="font-semibold">{selectedFeedback.subject}</p>
                  </div>
                )}

                <div>
                  <Label className="text-muted-foreground">Feedback</Label>
                  <p className="whitespace-pre-wrap">{selectedFeedback.feedback}</p>
                </div>

                {(selectedFeedback.rating || selectedFeedback.nps_score !== null) && (
                  <div className="flex gap-6">
                    {selectedFeedback.rating && (
                      <div>
                        <Label className="text-muted-foreground">Rating</Label>
                        <div className="flex items-center gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-5 w-5 ${
                                star <= selectedFeedback.rating!
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedFeedback.nps_score !== null && (
                      <div>
                        <Label className="text-muted-foreground">NPS Score</Label>
                        <p className="text-2xl font-bold">{selectedFeedback.nps_score}/10</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-6 text-sm text-muted-foreground">
                  <div>
                    <Label className="text-muted-foreground">Submitted By</Label>
                    <p>{selectedFeedback.user_profiles?.full_name || 'Unknown'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Date</Label>
                    <p>{format(new Date(selectedFeedback.created_at), 'PPpp')}</p>
                  </div>
                </div>
              </div>

              {/* Status Update */}
              <div className="space-y-2">
                <Label>Update Status</Label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={selectedFeedback.status === 'reviewed' ? 'default' : 'outline'}
                    onClick={() => handleUpdateStatus('reviewed')}
                    disabled={saving}
                  >
                    Reviewed
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedFeedback.status === 'in_progress' ? 'default' : 'outline'}
                    onClick={() => handleUpdateStatus('in_progress')}
                    disabled={saving}
                  >
                    In Progress
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedFeedback.status === 'completed' ? 'default' : 'outline'}
                    onClick={() => handleUpdateStatus('completed')}
                    disabled={saving}
                  >
                    Completed
                  </Button>
                </div>
              </div>

              {/* Admin Response */}
              <div className="space-y-2">
                <Label htmlFor="admin-response">Admin Response (Visible to User)</Label>
                <Textarea
                  id="admin-response"
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  placeholder="Write a response to the user..."
                  rows={4}
                />
              </div>

              {/* Admin Notes */}
              <div className="space-y-2">
                <Label htmlFor="admin-notes">Internal Notes (Not Visible to User)</Label>
                <Textarea
                  id="admin-notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add internal notes..."
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setSelectedFeedback(null)}
                  disabled={saving}
                >
                  Close
                </Button>
                <Button onClick={handleSaveResponse} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Response'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
