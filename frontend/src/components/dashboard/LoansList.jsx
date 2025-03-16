'use client';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/languageContext';
import { translateBatch } from '@/lib/translation';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format } from 'date-fns';
import { MoreVertical, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const TABLE_TRANSLATIONS = {
  'en-IN': {
    yourLoans: 'Your Loans',
    loanType: 'Loan Type',
    amount: 'Amount',
    emi: 'EMI',
    dueDate: 'Due Date',
    status: 'Status',
    progress: 'Progress',
    actions: 'Actions',
    completed: 'Completed',
    deleteLoan: 'Delete Loan',
    cancel: 'Cancel',
    delete: 'Delete',
    confirmDelete: 'Are you sure you want to delete this loan?',
    deleteWarning: 'This action cannot be undone.'
  },
  'hi-IN': {
    yourLoans: 'आपके लोन',
    loanType: 'लोन प्रकार',
    amount: 'राशि',
    emi: 'ईएमआई',
    dueDate: 'देय तिथि',
    status: 'स्थिति',
    progress: 'प्रगति',
    actions: 'कार्रवाई',
    completed: 'पूर्ण',
    deleteLoan: 'लोन हटाएं',
    cancel: 'रद्द करें',
    delete: 'हटाएं',
    confirmDelete: 'क्या आप वाकई इस लोन को हटाना चाहते हैं?',
    deleteWarning: 'यह क्रिया वापस नहीं ली जा सकती.'
  },
  // Add other languages...
};

export default function LoansList({ loans, onUpdate, expanded }) {
  const { language } = useLanguage();
  const translations = TABLE_TRANSLATIONS[language] || TABLE_TRANSLATIONS['en-IN'];
  const [translatedHeaders, setTranslatedHeaders] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);

  useEffect(() => {
    const translateHeaders = async () => {
      const headers = await translateBatch([
        'Loan Type',
        'Amount',
        'EMI',
        'Due Date',
        'Status'
      ], language);
      
      setTranslatedHeaders({
        loanType: headers[0],
        amount: headers[1],
        emi: headers[2],
        dueDate: headers[3],
        status: headers[4]
      });
    };

    translateHeaders();
  }, [language]);

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('loans')
        .delete()
        .eq('id', selectedLoan.id);

      if (error) throw error;

      toast.success("Loan deleted successfully");
      onUpdate?.();
    } catch (error) {
      console.error('Error deleting loan:', error);
      toast.error("Failed to delete loan");
    } finally {
      setDeleteDialogOpen(false);
      setSelectedLoan(null);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const calculateProgress = (loan) => {
    const totalAmount = parseFloat(loan.loan_amount);
    const remainingAmount = parseFloat(loan.remaining_amount);
    return ((totalAmount - remainingAmount) / totalAmount) * 100;
  };

  const getNextDueDate = (loan) => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Create date for this month's EMI
    let nextDue = new Date(currentYear, currentMonth, loan.payment_date);
    
    // If today's date is past this month's EMI date, get next month's date
    if (today > nextDue) {
      nextDue = new Date(currentYear, currentMonth + 1, loan.payment_date);
    }

    return nextDue;
  };

  return (
    <Card className="border-emerald-200/50">
      <CardHeader>
        <CardTitle className="text-emerald-800 dark:text-emerald-200">
          {translations.yourLoans}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-emerald-50/50 dark:hover:bg-emerald-950/50">
              <TableHead>{translations.loanType}</TableHead>
              <TableHead>{translations.amount}</TableHead>
              <TableHead>{translations.emi}</TableHead>
              <TableHead>{translations.dueDate}</TableHead>
              <TableHead>{translations.status}</TableHead>
              <TableHead>{translations.progress}</TableHead>
              <TableHead>{translations.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loans.map((loan) => (
              <TableRow 
                key={loan.id}
                className="hover:bg-emerald-50/50 dark:hover:bg-emerald-950/50"
              >
                <TableCell className="font-medium">{loan.loan_type}</TableCell>
                <TableCell>{formatCurrency(loan.loan_amount)}</TableCell>
                <TableCell>{formatCurrency(loan.emi_amount)}</TableCell>
                <TableCell>
                  {loan.loan_status === 'completed' ? (
                    <Badge variant="secondary">{translations.completed}</Badge>
                  ) : (
                    format(getNextDueDate(loan), 'dd MMM yyyy')
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={loan.loan_status === 'active' ? 'default' : 'secondary'}>
                    {loan.loan_status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="w-[100px]">
                    <Progress 
                      value={calculateProgress(loan)} 
                      className="h-2 bg-emerald-100 dark:bg-emerald-900"
                      indicatorClassName="bg-gradient-to-r from-emerald-500 to-teal-500"
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => {
                          setSelectedLoan(loan);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {translations.deleteLoan}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{translations.deleteLoan}</AlertDialogTitle>
            <AlertDialogDescription>
              {translations.confirmDelete}
              {translations.deleteWarning}
              {selectedLoan && (
                <div className="mt-2 p-2 bg-muted rounded-md">
                  <p><strong>{translations.loanType}:</strong> {selectedLoan.loan_type}</p>
                  <p><strong>{translations.amount}:</strong> {formatCurrency(selectedLoan.loan_amount)}</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{translations.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {translations.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
