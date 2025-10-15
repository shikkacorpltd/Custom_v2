import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Star, Loader2, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type FeedbackCategory = 'general_feedback' | 'feature_request' | 'bug_report' | 'usability_issue' | 'nps_survey';
type Priority = 'low' | 'medium' | 'high' | 'critical';
type Satisfaction = 'excellent' | 'good' | 'average' | 'poor' | 'very_poor';

const StarRating = ({ value, onChange }: { value: number; onChange: (val: number) => void }) => {
  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`h-8 w-8 ${
              star <= value ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        </button>
      ))}
      <span className="ml-2 text-sm text-muted-foreground">
        {value === 0 ? 'Not rated' : `${value} star${value !== 1 ? 's' : ''}`}
      </span>
    </div>
  );
};

const NPSScale = ({ value, onChange }: { value: number; onChange: (val: number) => void }) => {
  const getNPSColor = (score: number) => {
    if (score <= 6) return 'bg-red-500 hover:bg-red-600';
    if (score <= 8) return 'bg-yellow-500 hover:bg-yellow-600';
    return 'bg-green-500 hover:bg-green-600';
  };

  const getNPSLabel = (score: number) => {
    if (score <= 6) return '😞 Detractor';
    if (score <= 8) return '😐 Passive';
    return '😊 Promoter';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-1">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
          <button
            key={score}
            type="button"
            onClick={() => onChange(score)}
            className={`flex h-10 w-10 items-center justify-center rounded-lg font-semibold text-white transition-all ${
              value === score
                ? getNPSColor(score) + ' scale-110'
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
          >
            {score}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Not likely at all</span>
        <span>{value >= 0 && getNPSLabel(value)}</span>
        <span>Extremely likely</span>
      </div>
    </div>
  );
};

export default function FeedbackSurvey() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [category, setCategory] = useState<FeedbackCategory>('general_feedback');
  const [rating, setRating] = useState(0);
  const [npsScore, setNpsScore] = useState(-1);
  const [satisfaction, setSatisfaction] = useState<Satisfaction>('good');
  const [subject, setSubject] = useState('');
  const [feedback, setFeedback] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [improvementArea, setImprovementArea] = useState('');

  const resetForm = () => {
    setCategory('general_feedback');
    setRating(0);
    setNpsScore(-1);
    setSatisfaction('good');
    setSubject('');
    setFeedback('');
    setPriority('medium');
    setImprovementArea('');
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedback.trim()) {
      toast({
        title: "Error",
        description: "Please provide your feedback",
        variant: "destructive",
      });
      return;
    }

    if (category === 'nps_survey' && npsScore < 0) {
      toast({
        title: "Error",
        description: "Please select a score from 0-10",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('feedback_submissions')
        .insert({
          user_id: profile?.user_id,
          school_id: profile?.school_id,
          category,
          rating: rating > 0 ? rating : null,
          nps_score: npsScore >= 0 ? npsScore : null,
          satisfaction: category === 'general_feedback' ? satisfaction : null,
          subject: subject.trim() || null,
          feedback: feedback.trim(),
          priority: ['feature_request', 'bug_report'].includes(category) ? priority : 'medium',
          status: 'submitted',
        });

      if (error) throw error;

      setSuccess(true);
      toast({
        title: "Thank you!",
        description: "Your feedback has been submitted successfully.",
      });

      // Reset and close after 2 seconds
      setTimeout(() => {
        resetForm();
        setOpen(false);
      }, 2000);
    } catch (error: any) {
      console.error('Feedback submission error:', error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) {
        setTimeout(resetForm, 300);
      }
    }}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg transition-all hover:scale-110 hover:shadow-xl"
          title="Send Feedback"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Send Us Feedback
          </DialogTitle>
          <DialogDescription>
            Help us improve SchoolXNow by sharing your thoughts, suggestions, or reporting issues.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <CheckCircle2 className="h-16 w-16 text-green-600 mb-4 animate-in zoom-in" />
              <h3 className="text-xl font-semibold text-green-900 mb-2">Thank You!</h3>
              <p className="text-green-700 text-center">
                Your feedback has been submitted successfully. We appreciate your input!
              </p>
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category Selection */}
            <div className="space-y-2">
              <Label htmlFor="category">Feedback Category</Label>
              <Select value={category} onValueChange={(val) => setCategory(val as FeedbackCategory)}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general_feedback">General Feedback</SelectItem>
                  <SelectItem value="feature_request">Feature Request</SelectItem>
                  <SelectItem value="bug_report">Bug Report</SelectItem>
                  <SelectItem value="usability_issue">Usability Issue</SelectItem>
                  <SelectItem value="nps_survey">Rate Your Experience (NPS)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* NPS Scale - Only for NPS Survey */}
            {category === 'nps_survey' && (
              <div className="space-y-2">
                <Label>How likely are you to recommend SchoolXNow to a colleague?</Label>
                <NPSScale value={npsScore} onChange={setNpsScore} />
              </div>
            )}

            {/* Star Rating - For General Feedback */}
            {category === 'general_feedback' && (
              <div className="space-y-2">
                <Label>Overall Rating</Label>
                <StarRating value={rating} onChange={setRating} />
              </div>
            )}

            {/* Satisfaction - For General Feedback */}
            {category === 'general_feedback' && (
              <div className="space-y-2">
                <Label>Satisfaction Level</Label>
                <RadioGroup value={satisfaction} onValueChange={(val) => setSatisfaction(val as Satisfaction)}>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="excellent" id="excellent" />
                      <Label htmlFor="excellent" className="cursor-pointer">Excellent</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="good" id="good" />
                      <Label htmlFor="good" className="cursor-pointer">Good</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="average" id="average" />
                      <Label htmlFor="average" className="cursor-pointer">Average</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="poor" id="poor" />
                      <Label htmlFor="poor" className="cursor-pointer">Poor</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="very_poor" id="very_poor" />
                      <Label htmlFor="very_poor" className="cursor-pointer">Very Poor</Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* Subject - For Feature Request and Bug Report */}
            {['feature_request', 'bug_report', 'usability_issue'].includes(category) && (
              <div className="space-y-2">
                <Label htmlFor="subject">
                  {category === 'feature_request' ? 'Feature Title' : category === 'bug_report' ? 'Bug Title' : 'Issue Title'}
                </Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={
                    category === 'feature_request'
                      ? 'e.g., Export attendance to Excel'
                      : category === 'bug_report'
                      ? 'e.g., Unable to save attendance'
                      : 'e.g., Navigation menu confusing'
                  }
                />
              </div>
            )}

            {/* Improvement Area - For Usability Issue */}
            {category === 'usability_issue' && (
              <div className="space-y-2">
                <Label htmlFor="improvement-area">Area for Improvement</Label>
                <Select value={improvementArea} onValueChange={setImprovementArea}>
                  <SelectTrigger id="improvement-area">
                    <SelectValue placeholder="Select area" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dashboard">Dashboard</SelectItem>
                    <SelectItem value="attendance">Attendance Management</SelectItem>
                    <SelectItem value="exams">Exam Management</SelectItem>
                    <SelectItem value="timetable">Timetable</SelectItem>
                    <SelectItem value="reports">Reports & Analytics</SelectItem>
                    <SelectItem value="students">Student Management</SelectItem>
                    <SelectItem value="navigation">Navigation</SelectItem>
                    <SelectItem value="mobile">Mobile Experience</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Priority - For Feature Request and Bug Report */}
            {['feature_request', 'bug_report'].includes(category) && (
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={(val) => setPriority(val as Priority)}>
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - Nice to have</SelectItem>
                    <SelectItem value="medium">Medium - Would be helpful</SelectItem>
                    <SelectItem value="high">High - Important</SelectItem>
                    <SelectItem value="critical">Critical - Blocking work</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Feedback Text */}
            <div className="space-y-2">
              <Label htmlFor="feedback">
                {category === 'feature_request'
                  ? 'Describe the feature you would like'
                  : category === 'bug_report'
                  ? 'Describe the bug and steps to reproduce'
                  : category === 'usability_issue'
                  ? 'Describe the usability issue'
                  : category === 'nps_survey'
                  ? 'What is the main reason for your score? (Optional)'
                  : 'Your feedback'}
              </Label>
              <Textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder={
                  category === 'feature_request'
                    ? 'Please describe the feature in detail...'
                    : category === 'bug_report'
                    ? 'What happened? What were you expecting? Steps to reproduce...'
                    : category === 'usability_issue'
                    ? 'What makes this difficult to use? How could it be improved?'
                    : 'Share your thoughts, suggestions, or concerns...'
                }
                rows={6}
                required
                className="resize-none"
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Feedback'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
