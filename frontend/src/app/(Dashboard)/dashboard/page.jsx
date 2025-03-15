'use client';
import { useState, useEffect } from 'react';
import { useUser } from "@clerk/nextjs";
import { supabase } from '@/lib/supabase';
import { Plus, Bell, LayoutDashboard, PieChart, CalendarClock, ListTodo, Calendar, AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useSearchParams } from 'next/navigation';

import StatsCard from '@/components/dashboard/StatsCard';
import LoansList from '@/components/dashboard/LoansList';
import AddLoanForm from '@/components/dashboard/AddLoanForm';
import EMICalendar from '@/components/dashboard/EMICalendar';
import LoanAnalytics from '@/components/dashboard/LoanAnalytics';
import NotificationsPanel from '@/components/dashboard/NotificationsPanel';

export default function DashboardPage() {
  const { user } = useUser();
  const [showAddLoan, setShowAddLoan] = useState(false);
  const [loans, setLoans] = useState([]);
  const [stats, setStats] = useState({
    totalLoanAmount: 0,
    totalEMI: 0,
    activeLoans: 0,
    completedLoans: 0
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'overview';
  const selectedDate = searchParams.get('date') ? new Date(searchParams.get('date')) : null;

  useEffect(() => {
    if (user) {
      fetchLoans();
      fetchNotifications();
    }
  }, [user]);

  const fetchLoans = async () => {
    try {
      const { data, error } = await supabase
        .from('loans')
        .select('*')
        .eq('clerk_id', user.id);

      if (error) throw error;

      setLoans(data);
      calculateStats(data);
    } catch (error) {
      console.error('Error fetching loans:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const { data: loans } = await supabase
        .from('loans')
        .select('*')
        .eq('clerk_id', user.id)
        .eq('loan_status', 'active');

      const today = new Date();
      const notifs = [];

      loans?.forEach(loan => {
        const emiDate = new Date(today.getFullYear(), today.getMonth(), loan.payment_date);
        const daysUntilDue = Math.ceil((emiDate - today) / (1000 * 60 * 60 * 24));

        if (daysUntilDue <= 5 && daysUntilDue > 0) {
          notifs.push({
            id: `upcoming-${loan.id}`,
            type: 'upcoming',
            title: 'Upcoming EMI Payment',
            message: `${loan.loan_type} EMI of ₹${loan.emi_amount.toLocaleString('en-IN')} is due in ${daysUntilDue} days`,
            icon: Calendar,
            color: 'bg-blue-100 text-blue-600'
          });
        }

        if (daysUntilDue < 0) {
          notifs.push({
            id: `overdue-${loan.id}`,
            type: 'warning',
            title: 'Payment Overdue',
            message: `${loan.loan_type} EMI of ₹${loan.emi_amount.toLocaleString('en-IN')} was due ${Math.abs(daysUntilDue)} days ago`,
            icon: AlertTriangle,
            color: 'bg-red-100 text-red-600'
          });
        }
      });

      setNotifications(notifs);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const calculateStats = (loanData) => {
    const stats = loanData.reduce((acc, loan) => ({
      totalLoanAmount: acc.totalLoanAmount + Number(loan.loan_amount),
      totalEMI: acc.totalEMI + Number(loan.emi_amount),
      activeLoans: acc.activeLoans + (loan.loan_status === 'active' ? 1 : 0),
      completedLoans: acc.completedLoans + (loan.loan_status === 'completed' ? 1 : 0),
    }), {
      totalLoanAmount: 0,
      totalEMI: 0,
      activeLoans: 0,
      completedLoans: 0
    });

    setStats(stats);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Overview</h1>
        <div className="flex items-center gap-4">
          <Sheet open={showNotifications} onOpenChange={setShowNotifications}>
            <SheetTrigger asChild>
              <Button 
                variant="outline" 
                size="icon"
                className="relative"
              >
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Notifications</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                {notifications.length === 0 ? (
                  <p className="text-center text-muted-foreground">No new notifications</p>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="flex gap-4 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                    >
                      <div className={`p-2 rounded-full ${notification.color}`}>
                        <notification.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{notification.title}</p>
                        <p className="text-sm text-muted-foreground">{notification.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </SheetContent>
          </Sheet>
          <Button onClick={() => setShowAddLoan(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Add New Loan
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Total Loan Amount"
          value={stats.totalLoanAmount}
          type="currency"
          icon={PieChart}
        />
        <StatsCard
          title="Monthly EMI"
          value={stats.totalEMI}
          type="currency"
          icon={CalendarClock}
        />
        <StatsCard
          title="Active Loans"
          value={stats.activeLoans}
          type="number"
          icon={ListTodo}
        />
        <StatsCard
          title="Completed Loans"
          value={stats.completedLoans}
          type="number"
          icon={LayoutDashboard}
        />
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="loans" className="flex items-center gap-2">
            <ListTodo className="h-4 w-4" />
            Loans
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4" />
            Calendar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <LoansList loans={loans} onUpdate={fetchLoans} />
            </div>
            <div>
              <NotificationsPanel />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="loans" className="space-y-4">
          <Card className="p-6">
            <LoansList loans={loans} onUpdate={fetchLoans} expanded />
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <LoanAnalytics loans={loans} />
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <EMICalendar 
                loans={loans} 
                onUpdate={fetchLoans}
                selectedDate={selectedDate}
              />
            </div>
            <div>
              <NotificationsPanel />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <AddLoanForm
        open={showAddLoan}
        onOpenChange={setShowAddLoan}
        onSuccess={() => {
          fetchLoans();
          toast.success("Loan added successfully");
        }}
      />
    </div>
  );
}
