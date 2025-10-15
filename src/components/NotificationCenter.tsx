import { useState, useEffect } from 'react';
import { Bell, X, Check, Trash2, Settings as SettingsIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  related_id: string | null;
  related_type: string | null;
  action_url: string | null;
  created_at: string;
}

interface NotificationSettings {
  email_enabled: boolean;
  inapp_enabled: boolean;
  push_enabled: boolean;
  schedule_changes: boolean;
  exam_reminders: boolean;
  assignment_reminders: boolean;
  attendance_reminders: boolean;
  grade_updates: boolean;
  announcements: boolean;
  reminder_advance_days: number;
  quiet_hours_start: string;
  quiet_hours_end: string;
}

export default function NotificationCenter() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    email_enabled: true,
    inapp_enabled: true,
    push_enabled: false,
    schedule_changes: true,
    exam_reminders: true,
    assignment_reminders: true,
    attendance_reminders: true,
    grade_updates: true,
    announcements: true,
    reminder_advance_days: 1,
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00',
  });

  useEffect(() => {
    if (profile?.user_id) {
      fetchNotifications();
      loadSettings();
      subscribeToNotifications();
    }
  }, [profile?.user_id]);

  const fetchNotifications = async () => {
    if (!profile?.user_id) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.user_id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.read).length || 0);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    if (!profile?.user_id) return;

    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('settings')
        .eq('user_id', profile.user_id)
        .maybeSingle();

      if (error) throw error;

      if (data?.settings) {
        setSettings(data.settings as NotificationSettings);
      }
    } catch (error: any) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    if (!profile?.user_id) return;

    try {
      const { error } = await supabase
        .from('notification_settings')
        .upsert({
          user_id: profile.user_id,
          settings: settings,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: 'Settings Saved',
        description: 'Your notification preferences have been updated.',
      });
      setSettingsOpen(false);
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const subscribeToNotifications = () => {
    if (!profile?.user_id) return;

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.user_id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);

          // Show browser notification if enabled
          if (settings.push_enabled && Notification.permission === 'granted') {
            new Notification(newNotification.title, {
              body: newNotification.message,
              icon: '/logo.png',
              tag: newNotification.id,
              requireInteraction: newNotification.priority === 'urgent',
            });
          }

          // Show toast for urgent notifications
          if (newNotification.priority === 'urgent') {
            toast({
              title: newNotification.title,
              description: newNotification.message,
              duration: 5000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error: any) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!profile?.user_id) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', profile.user_id)
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);

      toast({
        title: 'All marked as read',
        description: 'All notifications have been marked as read.',
      });
    } catch (error: any) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      const wasUnread = notifications.find(n => n.id === id)?.read === false;
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error: any) {
      console.error('Error deleting notification:', error);
    }
  };

  const clearAllNotifications = async () => {
    if (!profile?.user_id) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', profile.user_id);

      if (error) throw error;

      setNotifications([]);
      setUnreadCount(0);

      toast({
        title: 'All cleared',
        description: 'All notifications have been cleared.',
      });
    } catch (error: any) {
      console.error('Error clearing notifications:', error);
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setSettings(prev => ({ ...prev, push_enabled: true }));
        toast({
          title: 'Push notifications enabled',
          description: 'You will now receive push notifications.',
        });
      } else {
        toast({
          title: 'Permission denied',
          description: 'Push notifications are disabled in your browser.',
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'Not supported',
        description: 'Push notifications are not supported in your browser.',
        variant: 'destructive',
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    // Return emoji based on notification type
    switch (type) {
      case 'schedule_change': return '📅';
      case 'exam_date': return '📝';
      case 'assignment_deadline': return '📚';
      case 'attendance_reminder': return '✅';
      case 'grade_updated': return '🎓';
      case 'announcement': return '📢';
      default: return '🔔';
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-600 text-white text-xs"
                variant="destructive"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[380px] p-0"
          align="end"
          sideOffset={5}
        >
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <Badge variant="secondary">{unreadCount} new</Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSettingsOpen(true)}
                className="h-8 w-8"
                title="Notification Settings"
              >
                <SettingsIcon className="h-4 w-4" />
              </Button>
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs h-8"
                  disabled={unreadCount === 0}
                >
                  Mark all read
                </Button>
              )}
            </div>
          </div>

          <ScrollArea className="h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Bell className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-muted/50 transition-colors ${
                      !notification.read ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="text-2xl flex-shrink-0 mt-0.5">
                        {getTypeIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium text-sm leading-tight">
                            {notification.title}
                          </h4>
                          {notification.priority !== 'low' && (
                            <Badge
                              variant="outline"
                              className={`text-xs ${getPriorityColor(notification.priority)} flex-shrink-0`}
                            >
                              {notification.priority}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                            })}
                          </span>
                          <div className="flex items-center gap-1">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => markAsRead(notification.id)}
                                title="Mark as read"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => deleteNotification(notification.id)}
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {notifications.length > 0 && (
            <div className="p-2 border-t flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllNotifications}
                className="text-xs text-destructive hover:text-destructive"
              >
                Clear all notifications
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Notification Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Notification Settings</DialogTitle>
            <DialogDescription>
              Customize how and when you receive notifications
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Delivery Methods */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Delivery Methods</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>In-App Notifications</Label>
                    <p className="text-xs text-muted-foreground">
                      Show notifications in the app
                    </p>
                  </div>
                  <Switch
                    checked={settings.inapp_enabled}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, inapp_enabled: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-xs text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={settings.email_enabled}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, email_enabled: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-xs text-muted-foreground">
                      Receive browser push notifications
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {settings.push_enabled && Notification.permission === 'granted' ? (
                      <Badge variant="outline" className="text-green-600">
                        Enabled
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={requestNotificationPermission}
                      >
                        Enable
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Notification Types */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Notification Types</h3>
              <div className="space-y-3">
                {[
                  { key: 'schedule_changes', label: 'Schedule Changes', icon: '📅' },
                  { key: 'exam_reminders', label: 'Exam Reminders', icon: '📝' },
                  { key: 'assignment_reminders', label: 'Assignment Deadlines', icon: '📚' },
                  { key: 'attendance_reminders', label: 'Attendance Reminders', icon: '✅' },
                  { key: 'grade_updates', label: 'Grade Updates', icon: '🎓' },
                  { key: 'announcements', label: 'Announcements', icon: '📢' },
                ].map(({ key, label, icon }) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{icon}</span>
                      <Label>{label}</Label>
                    </div>
                    <Switch
                      checked={settings[key as keyof NotificationSettings] as boolean}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, [key]: checked })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Reminder Settings */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Reminder Settings</h3>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Remind Me In Advance</Label>
                  <Select
                    value={String(settings.reminder_advance_days)}
                    onValueChange={(value) =>
                      setSettings({ ...settings, reminder_advance_days: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">On the day</SelectItem>
                      <SelectItem value="1">1 day before</SelectItem>
                      <SelectItem value="2">2 days before</SelectItem>
                      <SelectItem value="3">3 days before</SelectItem>
                      <SelectItem value="7">1 week before</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Quiet Hours Start</Label>
                    <Input
                      type="time"
                      value={settings.quiet_hours_start}
                      onChange={(e) =>
                        setSettings({ ...settings, quiet_hours_start: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Quiet Hours End</Label>
                    <Input
                      type="time"
                      value={settings.quiet_hours_end}
                      onChange={(e) =>
                        setSettings({ ...settings, quiet_hours_end: e.target.value })
                      }
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  No notifications will be sent during quiet hours
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setSettingsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveSettings}>Save Settings</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
