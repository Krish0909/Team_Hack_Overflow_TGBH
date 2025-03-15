from flask import Blueprint, request, jsonify
import numpy as np
import json
from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()
emi_calculator = Blueprint('emi_calculator', __name__)

class SmartEMICalculator:
    def __init__(self, language="English", monthly_salary=0, monthly_expenses=0):
        self.loan_amount = 0
        self.interest_rate = 0
        self.loan_term = 0
        self.monthly_interest_rate = 0
        self.language = language
        self.monthly_salary = float(monthly_salary)
        self.monthly_expenses = float(monthly_expenses)
        
        try:
            self.client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
        except:
            raise Exception("Please set GROQ_API_KEY in environment variables")

    def set_loan_details(self, amount, rate, term_years):
        """Set the basic loan details"""
        self.loan_amount = float(amount)
        self.interest_rate = float(rate)
        self.loan_term = int(term_years * 12)  # Convert years to months
        self.monthly_interest_rate = float(rate) / (12 * 100)  # Convert annual rate to monthly decimal

    def calculate_emi(self):
        """Calculate the monthly EMI"""
        try:
            if self.loan_amount <= 0 or self.interest_rate <= 0 or self.loan_term <= 0:
                return 0
            numerator = self.loan_amount * self.monthly_interest_rate * (1 + self.monthly_interest_rate) ** self.loan_term
            denominator = (1 + self.monthly_interest_rate) ** self.loan_term - 1
            return round(numerator / denominator, 2)
        except Exception as e:
            print(f"Error calculating EMI: {str(e)}")
            return 0

    def calculate_total_interest(self):
        """Calculate total interest paid over the loan term"""
        try:
            emi = self.calculate_emi()
            total_amount = emi * self.loan_term
            return round(total_amount - self.loan_amount, 2)
        except Exception as e:
            print(f"Error calculating total interest: {str(e)}")
            return 0

    def calculate_smart_payment_impact(self, extra_payment):
        """Calculate how extra payments reduce loan term and interest"""
        try:
            extra_payment = float(extra_payment)
            original_emi = self.calculate_emi()
            original_total_interest = self.calculate_total_interest()

            if original_emi == 0:
                return {
                    'Original_Term': self.loan_term,
                    'New_Term': self.loan_term,
                    'Original_Interest': 0,
                    'New_Interest': 0,
                    'Interest_Saved': 0,
                    'amortization_with_extra': []
                }

            balance = self.loan_amount
            months = 0
            total_interest = 0
            amortization_with_extra = []

            while balance > 0 and months < self.loan_term:
                interest = balance * self.monthly_interest_rate
                principal = min(balance, original_emi - interest + extra_payment)
                balance = max(0, balance - principal)
                total_interest += interest
                months += 1
                amortization_with_extra.append(balance)

            return {
                'Original_Term': self.loan_term,
                'New_Term': months,
                'Original_Interest': original_total_interest,
                'New_Interest': round(total_interest, 2),
                'Interest_Saved': round(original_total_interest - total_interest, 2),
                'amortization_with_extra': amortization_with_extra
            }
        except Exception as e:
            print(f"Error calculating smart payment impact: {str(e)}")
            return {
                'Original_Term': self.loan_term,
                'New_Term': self.loan_term,
                'Original_Interest': 0,
                'New_Interest': 0,
                'Interest_Saved': 0,
                'amortization_with_extra': []
            }

    def get_amortization_schedule(self, extra_payment=0):
        """Generate amortization schedule"""
        try:
            extra_payment = float(extra_payment)
            original_emi = self.calculate_emi()
            balance = self.loan_amount
            schedule = []

            while balance > 0 and len(schedule) < self.loan_term:
                interest = balance * self.monthly_interest_rate
                principal = min(balance, original_emi - interest)
                balance = max(0, balance - principal)
                schedule.append(balance)

            return schedule
        except Exception as e:
            print(f"Error generating amortization schedule: {str(e)}")
            return []

    def generate_detailed_report(self, extra_payment=0):
        """Generate a comprehensive loan analysis report"""
        try:
            emi = self.calculate_emi()
            total_interest = self.calculate_total_interest()
            impact = self.calculate_smart_payment_impact(extra_payment)
            
            # Calculate key metrics
            monthly_savings = max(0, self.monthly_salary - self.monthly_expenses - emi)
            debt_to_income = (emi / self.monthly_salary * 100) if self.monthly_salary > 0 else 0
            
            report = f"""
### Loan Analysis Summary

**Basic Details:**
- Loan Amount: ₹{self.loan_amount:,.2f}
- Interest Rate: {self.interest_rate}%
- Loan Term: {self.loan_term/12:.1f} years
- Monthly EMI: ₹{emi:,.2f}

**Financial Impact:**
- Total Interest: ₹{total_interest:,.2f}
- Monthly Income: ₹{self.monthly_salary:,.2f}
- Monthly Expenses: ₹{self.monthly_expenses:,.2f}
- Available for EMI: ₹{monthly_savings:,.2f}
- Debt-to-Income Ratio: {debt_to_income:.1f}%

**Smart Payment Analysis:**
With extra payment of ₹{extra_payment:,.2f} per month:
- Loan paid off in: {impact['New_Term']} months ({impact['New_Term']/12:.1f} years)
- Interest saved: ₹{impact['Interest_Saved']:,.2f}
- New total interest: ₹{impact['New_Interest']:,.2f}

**Recommendations:**
1. {self._get_affordability_recommendation(emi, monthly_savings)}
2. {self._get_extra_payment_recommendation(monthly_savings, extra_payment)}
3. {self._get_term_recommendation(debt_to_income)}
"""
            return report
        except Exception as e:
            print(f"Error generating report: {str(e)}")
            return "Error generating loan analysis report."

    def _get_affordability_recommendation(self, emi, monthly_savings):
        if monthly_savings < 0:
            return "WARNING: The EMI exceeds your disposable income. Consider a lower loan amount or longer term."
        elif monthly_savings < emi * 0.2:
            return "Your budget is tight. Consider building an emergency fund before taking the loan."
        else:
            return "The loan appears affordable based on your current income and expenses."

    def _get_extra_payment_recommendation(self, monthly_savings, extra_payment):
        if monthly_savings > extra_payment + 5000:
            return f"Consider increasing your extra payment to ₹{min(monthly_savings * 0.3, extra_payment + 5000):,.0f} to save more on interest."
        elif monthly_savings < extra_payment:
            return "The planned extra payment might strain your budget. Consider a lower amount."
        else:
            return "Your planned extra payment is well-balanced with your budget."

    def _get_term_recommendation(self, debt_to_income):
        if debt_to_income > 40:
            return "Your debt-to-income ratio is high. Consider a longer term or lower loan amount."
        elif debt_to_income > 30:
            return "Your debt-to-income ratio is moderate. Monitor your expenses carefully."
        else:
            return "Your debt-to-income ratio is healthy for this loan."

@emi_calculator.route("/calculate", methods=["POST"])
def calculate_emi():
    try:
        data = request.json
        calculator = SmartEMICalculator(
            language=data.get('language', 'English'),
            monthly_salary=float(data.get('monthly_salary', 0)),
            monthly_expenses=float(data.get('monthly_expenses', 0))
        )

        calculator.set_loan_details(
            amount=float(data.get('loan_amount', 0)),
            rate=float(data.get('interest_rate', 0)),
            term_years=float(data.get('loan_term', 0))
        )

        extra_payment = float(data.get('extra_payment', 0))
        report = calculator.generate_detailed_report(extra_payment)

        result = {
            'emi': calculator.calculate_emi(),
            'total_interest': calculator.calculate_total_interest(),
            'smart_payment_impact': calculator.calculate_smart_payment_impact(extra_payment),
            'amortization_schedule': calculator.get_amortization_schedule(extra_payment),
            'report': report,
            'loan_details': {
                'amount': calculator.loan_amount,
                'rate': calculator.interest_rate,
                'term': calculator.loan_term/12
            }
        }

        return jsonify({'success': True, 'data': result})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
