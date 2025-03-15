'use client';
import { useState } from 'react';
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

export default function LoansList({ loans, onUpdate }) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);

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
        <CardTitle className="text-emerald-800 dark:text-emerald-200">Your Loans</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-emerald-50/50 dark:hover:bg-emerald-950/50">
              <TableHead>Loan Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>EMI</TableHead>
              <TableHead>Next Due</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Actions</TableHead>
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
                    <Badge variant="secondary">Completed</Badge>
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
                        Delete Loan
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
            <AlertDialogTitle>Delete Loan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this loan? This action cannot be undone.
              {selectedLoan && (
                <div className="mt-2 p-2 bg-muted rounded-md">
                  <p><strong>Loan Type:</strong> {selectedLoan.loan_type}</p>
                  <p><strong>Amount:</strong> {formatCurrency(selectedLoan.loan_amount)}</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
