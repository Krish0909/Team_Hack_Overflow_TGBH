'use client';
import { useEffect, useState } from 'react';
import { useUser } from "@clerk/nextjs";
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Bell, AlertTriangle, CheckCircle, Calendar } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";

export default function NotificationsPanel() {
  const { user } = useUser();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    try {
      // Fetch active loans
      const { data: loans } = await supabase
        .from('loans')
        .select('*')
        .eq('clerk_id', user.id)
        .eq('loan_status', 'active');

      const today = new Date();
      const notifications = [];

      loans?.forEach(loan => {
        const emiDate = new Date(today.getFullYear(), today.getMonth(), loan.payment_date);
        const daysUntilDue = Math.ceil((emiDate - today) / (1000 * 60 * 60 * 24));

        // Upcoming EMI notifications
        if (daysUntilDue <= 5 && daysUntilDue > 0) {
          notifications.push({
            id: `upcoming-${loan.id}`,
            type: 'upcoming',
            title: 'Upcoming EMI Payment',
            message: `Your ${loan.loan_type} EMI of ₹${loan.emi_amount.toLocaleString('en-IN')} is due in ${daysUntilDue} days`,
            icon: Calendar,
            color: 'bg-blue-100 text-blue-600'
          });
        }

        // Overdue EMI notifications
        if (daysUntilDue < 0) {
          notifications.push({
            id: `overdue-${loan.id}`,
            type: 'warning',
            title: 'Payment Overdue',
            message: `Your ${loan.loan_type} EMI of ₹${loan.emi_amount.toLocaleString('en-IN')} was due ${Math.abs(daysUntilDue)} days ago`,
            icon: AlertTriangle,
            color: 'bg-red-100 text-red-600'
          });
        }

        // Payment success notifications (from loan_payments table)
        // You can add more notification types based on your requirements
      });

      setNotifications(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = (notification) => {
    const matches = notification.message.match(/due in (\d+) days|due (\d+) days ago/);
    if (matches) {
      const days = parseInt(matches[1] || matches[2]);
      const date = new Date();
      date.setDate(date.getDate() + (notification.type === 'upcoming' ? days : -days));
      router.push(`/dashboard?tab=calendar&date=${date.toISOString()}`);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px]">
            <span>Loading notifications...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-background via-background to-emerald-500/5 border-emerald-200/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            Notifications
          </CardTitle>
          {notifications.length > 0 && (
            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              {notifications.length} New
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <AnimatePresence>
            {notifications.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-[200px] text-center"
              >
                <Bell className="h-12 w-12 text-emerald-500/20 dark:text-emerald-400/20 mb-4" />
                <p className="text-muted-foreground">All caught up!</p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification, index) => (
                  <motion.button
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "w-full text-left",
                      "p-4 rounded-lg border transition-all duration-200",
                      "hover:shadow-md hover:scale-[1.02]",
                      notification.type === 'warning' 
                        ? 'hover:border-red-500/50 bg-red-50/30 dark:bg-red-950/30' 
                        : 'hover:border-emerald-500/50 bg-emerald-50/30 dark:bg-emerald-950/30'
                    )}
                  >
                    <div className="flex gap-4">
                      <div className={cn(
                        " h-full p-2 rounded-full shrink-0",
                        notification.type === 'warning' 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-blue-100 text-blue-700'
                      )}>
                        <notification.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold">{notification.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-2">
                          Click to view in calendar
                        </p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </AnimatePresence>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
