'use client';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { addDays, format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Check, CheckCircle2, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useLanguage } from '@/lib/languageContext';
import { translateBatch } from '@/lib/translation';

const CALENDAR_TRANSLATIONS = {
  'en-IN': {
    title: 'EMI Calendar',
    events: 'Events for',
    upcoming: 'Upcoming EMI',
    dueToday: 'Due Today',
    overdue: 'Overdue',
    paid: 'Paid',
    noEmis: 'No EMIs due',
    paymentDue: 'Payment Due',
    markAsPaid: 'Mark as Paid',
    paidOn: 'Paid on',
    mode: 'Mode',
    ref: 'Reference'
  },
  'hi-IN': {
    title: 'ईएमआई कैलेंडर',
    events: 'के लिए भुगतान',
    upcoming: 'आगामी ईएमआई',
    dueToday: 'आज देय',
    overdue: 'बकाया',
    paid: 'भुगतान किया',
    noEmis: 'कोई ईएमआई देय नहीं',
    paymentDue: 'भुगतान देय',
    markAsPaid: 'भुगतान के रूप में चिह्नित करें',
    paidOn: 'भुगतान दिनांक',
    mode: 'भुगतान मोड',
    ref: 'संदर्भ'
  },
  // Add other languages...
};

export default function EMICalendar({ loans, onUpdate, selectedDate: propSelectedDate }) {
  const { language } = useLanguage();
  const translations = CALENDAR_TRANSLATIONS[language] || CALENDAR_TRANSLATIONS['en-IN'];
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [payments, setPayments] = useState({});

  useEffect(() => {
    fetchPayments();
  }, [loans]);

  const fetchPayments = async () => {
    try {
      const { data: payments } = await supabase
        .from('loan_payments')
        .select('*, loans(*)')
        .in('loan_id', loans.map(loan => loan.id));

      const paymentMap = {};
      payments?.forEach(payment => {
        paymentMap[`${payment.loan_id}-${format(new Date(payment.payment_date), 'yyyy-MM-dd')}`] = {
          ...payment,
          loan: payment.loans
        };
      });
      setPayments(paymentMap);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const markAsPaid = async (event) => {
    try {
      const payment = {
        loan_id: event.loan.id,
        payment_amount: event.loan.emi_amount,
        payment_date: format(event.date, 'yyyy-MM-dd'),
        payment_status: 'completed',
        payment_mode: 'manual'
      };

      const { data, error } = await supabase
        .from('loan_payments')
        .insert(payment);

      if (error) throw error;

      // Update remaining amount in loans table
      const newRemainingAmount = event.loan.remaining_amount - event.loan.emi_amount;
      await supabase
        .from('loans')
        .update({ 
          remaining_amount: newRemainingAmount,
          loan_status: newRemainingAmount <= 0 ? 'completed' : 'active'
        })
        .eq('id', event.loan.id);

      toast.success('EMI marked as paid');
      fetchPayments();
      onUpdate?.();
    } catch (error) {
      console.error('Error marking payment:', error);
      toast.error('Failed to mark EMI as paid');
    }
  };

  useEffect(() => {
    const today = new Date();
    const upcomingDates = [];

    loans.forEach(loan => {
      // Get previous month and next 2 months EMIs
      for (let i = -1; i < 2; i++) {
        const emiDate = new Date(today.getFullYear(), today.getMonth() + i, loan.payment_date);
        if (emiDate > new Date(loan.start_date) && emiDate < new Date(loan.end_date)) {
          upcomingDates.push({
            date: emiDate,
            loan: loan,
            isPast: emiDate < today,
            isToday: emiDate.toDateString() === today.toDateString(),
            isPaid: !!payments[`${loan.id}-${format(emiDate, 'yyyy-MM-dd')}`]
          });
        }
      }
    });

    setEvents(upcomingDates.sort((a, b) => a.date - b.date));
  }, [loans, payments]);

  const getDaysWithEvents = (date) => {
    return events.filter(event => 
      event.date.getMonth() === date.getMonth() &&
      event.date.getDate() === date.getDate()
    );
  };

  return (
    <Card className="border-emerald-200/50 bg-gradient-to-br from-background via-background to-emerald-500/5">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            {translations.title || 'EMI Calendar'}
          </div>
          <Badge 
            variant="outline" 
            className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          >
            {events.filter(e => !e.isPaid).length} {translations.paymentDue || 'Pending EMIs'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid lg:grid-cols-[1fr,300px] gap-4">
          <div className="space-y-4">
            <Card className="p-4 border-2">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md"
                classNames={{
                  months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                  month: "space-y-4",
                  caption: "flex justify-center pt-1 relative items-center",
                  caption_label: "text-sm font-medium",
                  nav: "space-x-1 flex items-center",
                  nav_button: cn(
                    "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
                  ),
                  nav_button_previous: "absolute left-1",
                  nav_button_next: "absolute right-1",
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex",
                  head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                  row: "flex w-full mt-2",
                  cell: cn(
                    "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent",
                    "h-9 w-9 text-center flex items-center justify-center rounded-md"
                  ),
                  day: cn(
                    "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md"
                  ),
                  day_selected:
                    "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                  day_today: "bg-accent text-accent-foreground",
                  day_outside: "text-muted-foreground opacity-50",
                  day_disabled: "text-muted-foreground opacity-50",
                  day_range_middle:
                    "aria-selected:bg-accent aria-selected:text-accent-foreground",
                  day_hidden: "invisible",
                }}
                components={{
                  DayContent: ({ date }) => {
                    const dayEvents = getDaysWithEvents(date);
                    const hasEvents = dayEvents.length > 0;
                    const isOverdue = dayEvents.some(e => !e.isPaid && e.isPast);
                    const isDueToday = dayEvents.some(e => e.isToday);
                    const isPaid = dayEvents.every(e => e.isPaid);
                    
                    return (
                      <div className="relative h-9 w-9 p-0">
                        {/* Date number */}
                        <div className={cn(
                          "h-full w-full flex items-center justify-center",
                          hasEvents && "font-medium",
                          isOverdue && "text-red-600",
                          isDueToday && "text-primary font-bold",
                          isPaid && "text-green-600"
                        )}>
                          {date.getDate()}
                        </div>
                        
                        {/* Event indicators */}
                        {hasEvents && (
                          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                            {dayEvents.map((event, idx) => (
                              <div
                                key={idx}
                                className={cn(
                                  "h-1.5 w-1.5 rounded-full",
                                  event.isPaid && "bg-green-500",
                                  !event.isPaid && event.isPast && "bg-red-500",
                                  !event.isPaid && !event.isPast && event.isToday && "bg-yellow-500",
                                  !event.isPaid && !event.isPast && !event.isToday && "bg-emerald-400"
                                )}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }
                }}
              />

              {/* Calendar Legend */}
              <div className="mt-4 flex flex-wrap gap-3 justify-center text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span>{translations.paymentDue || 'Upcoming EMI'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-yellow-500" />
                  <span>{translations.paymentDue || 'Due Today'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  <span>{translations.overdue || 'Overdue'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  <span>{translations.paid || 'Paid'}</span>
                </div>
              </div>
            </Card>
          </div>
          <Card className="p-4">
            <h3 className="font-medium mb-4">
              {translations.title || 'Events for'} {format(selectedDate || new Date(), "MMMM d, yyyy")}
            </h3>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-4">
                {getDaysWithEvents(selectedDate).length > 0 ? (
                  getDaysWithEvents(selectedDate).map((event, idx) => (
                    <div
                      key={`${event.loan.id}-${idx}`}
                      className={`p-4 rounded-lg border transition-colors ${
                        event.isPaid ? 'border-green-200 bg-green-50/50' :
                        event.isPast ? 'border-red-200 bg-red-50/50' :
                        event.isToday ? 'border-yellow-200 bg-yellow-50/50' :
                        'border-emerald-200 bg-emerald-50/50'
                      }`}
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{event.loan.loan_type}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(event.loan.emi_amount)}
                            </p>
                          </div>
                          <Badge variant={
                            event.isPaid ? 'success' :
                            event.isPast ? 'destructive' :
                            event.isToday ? 'warning' : 'default'
                          }>
                            {event.isPaid ? translations.paid || 'Paid' :
                             event.isPast ? translations.overdue || 'Overdue' :
                             event.isToday ? translations.paymentDue || 'Due Today' : translations.paymentDue || 'Upcoming'}
                          </Badge>
                        </div>
                        {!event.isPaid && (
                          <Button
                            size="sm"
                            className="w-full mt-2"
                            onClick={() => markAsPaid(event)}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            {translations.paid || 'Mark as Paid'}
                          </Button>
                        )}
                        {event.isPaid && (
                          <div className="mt-2 text-sm text-muted-foreground">
                            <p>{translations.paid || 'Paid on'}: {format(new Date(payments[`${event.loan.id}-${format(event.date, 'yyyy-MM-dd')}`].created_at), 'dd MMM yyyy')}</p>
                            <p>{translations.paid || 'Mode'}: {payments[`${event.loan.id}-${format(event.date, 'yyyy-MM-dd')}`].payment_mode}</p>
                            {payments[`${event.loan.id}-${format(event.date, 'yyyy-MM-dd')}`].transaction_reference && (
                              <p>{translations.paid || 'Ref'}: {payments[`${event.loan.id}-${format(event.date, 'yyyy-MM-dd')}`].transaction_reference}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    {translations.noEmis || 'No EMIs due on this date'}
                  </div>
                )}
              </div>
            </ScrollArea>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
};
