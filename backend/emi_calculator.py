import base64
import io
from flask import Blueprint, request, jsonify, send_file
import numpy as np
import json
from groq import Groq
import os
from dotenv import load_dotenv
import pandas as pd
import markdown
from weasyprint import HTML, CSS
import logging
import matplotlib
matplotlib.use('Agg')  # Set backend before importing pyplot

load_dotenv()
emi_calculator = Blueprint("emi_calculator", __name__)
import matplotlib.pyplot as plt
import seaborn as sns

logger = logging.getLogger(__name__)


class SmartEMICalculator:
    def __init__(self, language="English", monthly_salary=0, monthly_expenses=0):
        self.loan_amount = 0
        self.interest_rate = 0
        self.loan_term = 0
        self.monthly_interest_rate = 0
        self.language = language
        self.monthly_salary = monthly_salary
        self.monthly_expenses = monthly_expenses

        try:
            self.api_key = "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"
            self.client = Groq(api_key=self.api_key)
        except:
            raise Exception("Please set GROQ_API_KEY in Colab Secrets")

    def set_loan_details(self, amount, rate, term_years):
        """Set the basic loan details"""
        self.loan_amount = float(amount)
        self.interest_rate = float(rate)
        # Convert term_years to months and ensure it's an integer
        self.loan_term = int(float(term_years) * 12)
        self.monthly_interest_rate = float(rate) / (12 * 100)

    def set_user_details(self, monthly_salary, monthly_expenses):
        """Set user's financial details"""
        self.monthly_salary = monthly_salary
        self.monthly_expenses = monthly_expenses

    def calculate_emi(self):
        """Calculate the monthly EMI"""
        if self.loan_amount <= 0 or self.interest_rate <= 0 or self.loan_term <= 0:
            return 0
        numerator = (
            self.loan_amount
            * self.monthly_interest_rate
            * (1 + self.monthly_interest_rate) ** self.loan_term
        )
        denominator = (1 + self.monthly_interest_rate) ** self.loan_term - 1
        return round(numerator / denominator, 2)

    def calculate_total_interest(self):
        """Calculate total interest paid over the loan term"""
        emi = self.calculate_emi()
        total_amount = emi * self.loan_term
        return round(total_amount - self.loan_amount, 2)

    def calculate_smart_payment_impact(self, extra_payment):
        """Calculate how extra payments reduce loan term and interest"""
        original_emi = self.calculate_emi()
        original_total_interest = self.calculate_total_interest()

        balance = self.loan_amount
        months = 0
        total_interest = 0

        while balance > 0 and months < self.loan_term:
            interest = balance * self.monthly_interest_rate
            principal = original_emi - interest + extra_payment
            balance -= principal
            total_interest += interest
            months += 1

        return {
            "Original_Term": self.loan_term,
            "New_Term": months,
            "Original_Interest": original_total_interest,
            "New_Interest": round(total_interest, 2),
            "Interest_Saved": round(original_total_interest - total_interest, 2),
        }

    def get_amortization_schedule(self, extra_payment=0):
        """Generate amortization schedule for a given extra payment"""
        original_emi = self.calculate_emi()
        balance = self.loan_amount
        schedule = []
        months = 0

        # Convert loan_term to integer for range operations
        term = int(self.loan_term)

        while balance > 0 and months < term:
            interest = balance * self.monthly_interest_rate
            principal = original_emi - interest + extra_payment
            balance -= principal
            schedule.append(max(balance, 0))
            months += 1

        return schedule

    def get_groq_recommendations(self, loan_details):
        """Get smart payment recommendations from Groq in specified language"""
        disposable_income = self.monthly_salary - self.monthly_expenses
        try:
            prompt = f"""
            As a financial advisor, give smart payment advice for this loan in {self.language}:

            - Amount: ₹{loan_details['amount']:,}
            - Interest Rate: {loan_details['rate']}%
            - Term: {loan_details['term']} years
            - Monthly EMI: ₹{loan_details['emi']:,}
            - Total Interest: ₹{loan_details['total_interest']:,}
            - User’s Monthly Salary: ₹{self.monthly_salary:,}
            - User’s Monthly Expenses: ₹{self.monthly_expenses:,}
            - Disposable Income: ₹{disposable_income:,}

            Include:
            1. Payment strategies based on user’s income
            2. Effects of extra payments with examples
            3. Ways to shorten the loan term
            4. Tax benefits and other options
            5. Useful tips for Indian borrowers
            """

            response = self.client.chat.completions.create(
                model="qwen-qwq-32b",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.6,
                max_completion_tokens=4096,
                top_p=0.95,
                stream=True,
            )

            recommendations = []
            for chunk in response:
                if chunk.choices:
                    recommendations.append(chunk.choices[0].delta.content or "")

            if not recommendations:
                suggested_extra = min(
                    max(disposable_income - loan_details["emi"], 0), 5000
                )
                return f"""
### Recommendations for ₹{loan_details['amount']:,} Loan ({loan_details['rate']}% for {loan_details['term']} years)

**Your Finances:**
- Monthly Salary: ₹{self.monthly_salary:,}
- Monthly Expenses: ₹{self.monthly_expenses:,}
- Disposable Income: ₹{disposable_income:,}

1. **Payment Strategies Based on Your Income**
   - Pay the EMI of ₹{loan_details['emi']:,} on time using auto-debit.
   - With ₹{disposable_income:,} left after expenses, add ₹{suggested_extra:,} monthly to your EMI to reduce interest.
   - Use bonuses or extra income (e.g., 10% of your salary) for lump-sum prepayments.

2. **Effects of Extra Payments**
   - **₹{suggested_extra:,} Extra Monthly**: New payment becomes ₹{loan_details['emi'] + suggested_extra:,}. Cuts term from {int(loan_details['term'] * 12)} months to ~{self.calculate_smart_payment_impact(suggested_extra)['New_Term']} months, saving ~₹{self.calculate_smart_payment_impact(suggested_extra)['Interest_Saved']:,}.
   - **₹50,000 Yearly**: Paying this annually reduces term to ~17 years, saving ~₹150,000–₹200,000 in interest.

3. **Ways to Shorten the Loan Term**
   - Increase EMI to ₹{round(loan_details['emi'] * 1.15):,} (15% more) if your salary grows, aiming for a 15-year term.
   - Pay ₹{suggested_extra:,} extra monthly now, then raise it as income increases—could finish in 10–12 years.
   - Use a one-time ₹1 lakh payment (e.g., from savings) to cut ~2–3 years.

4. **Tax Benefits and Other Options**
   - Claim ₹1.5 lakh on principal (Section 80C) and ₹2 lakh on interest (Section 24) yearly if it’s a home loan.
   - If mutual funds earn >{loan_details['rate']}%, invest some of your ₹{disposable_income:,} disposable income there.
   - PPF at 7.1% is less than {loan_details['rate']}%, so prepaying saves more than investing there.

5. **Useful Tips for Indian Borrowers**
   - Confirm no prepayment penalties with your bank.
   - Automate EMI payments to avoid late fees.
   - Keep ₹{round(self.monthly_expenses * 3):,} as an emergency fund before extra payments.
   - If rates drop below {loan_details['rate']}%, consider refinancing.
   - Consult an advisor to optimize based on your goals.
"""
            return "".join(recommendations)

        except Exception as e:
            return f"Error getting recommendations: {str(e)}"

    def generate_detailed_report(self, extra_payment=5000):
        """Generate a comprehensive loan analysis report with dynamic visualizations"""
        emi = self.calculate_emi()
        total_interest = self.calculate_total_interest()
        smart_payment_impact = self.calculate_smart_payment_impact(extra_payment)
        loan_details = {
            "amount": self.loan_amount,
            "rate": self.interest_rate,
            "term": self.loan_term / 12,
            "emi": emi,
            "total_interest": total_interest,
        }
        recommendations = self.get_groq_recommendations(loan_details)

        # Create visualizations and capture as base64 images
        disposable_income = self.monthly_salary - self.monthly_expenses
        extra_payments = [0, 2500, 5000, min(disposable_income - emi, 7500)]
        extra_payments = [x for x in extra_payments if x >= 0]

        # Visualization 1: Loan Balance Over Time
        plt.figure(figsize=(10, 5))
        # Ensure integer months for range
        months = range(1, int(self.loan_term) + 1)
        colors = ["#FF9999", "#66B2FF", "#99FF99", "#FFCC99"]
        for i, extra in enumerate(extra_payments):
            schedule = self.get_amortization_schedule(extra)
            plt.plot(
                months[: len(schedule)],
                schedule,
                label=f"₹{extra:,}/mo",
                color=colors[i],
                linewidth=2,
            )
        plt.xlabel("Months", fontsize=10)
        plt.ylabel("Balance (₹)", fontsize=10)
        plt.title("Loan Balance Projection", fontsize=12, pad=15)
        plt.legend(fontsize=8)
        plt.grid(True, linestyle="--", alpha=0.7)
        buf1 = io.BytesIO()
        plt.savefig(buf1, format="png", dpi=300)
        plt.close()
        loan_balance_img = base64.b64encode(buf1.getvalue()).decode("utf-8")

        # Visualization 2: Term Comparison
        plt.figure(figsize=(10, 5))
        categories = [f"₹{extra:,}" for extra in extra_payments]
        terms = [
            self.calculate_smart_payment_impact(extra)["New_Term"] / 12
            for extra in extra_payments
        ]
        sns.barplot(x=categories, y=terms, palette="Blues")
        plt.ylabel("Years", fontsize=10)
        plt.title("Loan Term Comparison", fontsize=12, pad=15)
        plt.xticks(fontsize=8)
        plt.yticks(fontsize=8)
        buf2 = io.BytesIO()
        plt.savefig(buf2, format="png", dpi=300)
        plt.close()
        term_comparison_img = base64.b64encode(buf2.getvalue()).decode("utf-8")

        # Create structured markdown report
        report = f"""


# Loan Analysis Report

---

### Loan Overview
#### Basic Details
| Parameter          | Value              |
|---------------------|--------------------|
| Loan Amount         | ₹{self.loan_amount:,}  |
| Interest Rate       | {self.interest_rate}%  |
| Loan Term           | {self.loan_term//12} years |
| Monthly EMI         | ₹{emi:,.2f}        |
| Total Interest      | ₹{total_interest:,.2f}  |

#### User Financials
| Category            | Amount             |
|---------------------|--------------------|
| Monthly Salary      | ₹{self.monthly_salary:,} |
| Monthly Expenses    | ₹{self.monthly_expenses:,} |
| Disposable Income   | ₹{disposable_income:,} |

---

### Visual Analysis
![Loan Balance Projection](data:image/png;base64,{loan_balance_img})
![Term Comparison](data:image/png;base64,{term_comparison_img})

---

### Payment Scenarios
#### Smart Payment Impact
| Scenario            | Value              |
|---------------------|--------------------|
| Original Term       | {smart_payment_impact['Original_Term']} months |
| New Term            | {smart_payment_impact['New_Term']} months |
| Interest Saved      | ₹{smart_payment_impact['Interest_Saved']:,.2f} |

#### Payment Strategy
| Component           | Amount             |
|---------------------|--------------------|
| Regular EMI         | ₹{emi:,.2f}        |
| Extra Payment       | ₹{extra_payment:,} |
| Total Payment       | ₹{emi + extra_payment:,.2f} |
| Term Reduction      | {smart_payment_impact['Original_Term'] - smart_payment_impact['New_Term']} months |

---

### AI Recommendations
{recommendations}
        """
        return report


def generate_pdf_report(html_content, logo_path, output_path):
    # Read logo and convert to base64
    with open(logo_path, "rb") as logo_file:
        logo_data = base64.b64encode(logo_file.read()).decode("utf-8")

    css = CSS(
        string=f"""
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;700&display=swap');

        /* Define page layout */
        @page {{
            size: A4;
            margin: 1cm;

            /* Header on every page */
            @top-left {{
                content: element(pageHeader);
            }}
        }}

        /* Header styling */
        #divHeader {{
            position: running(pageHeader); /* Define header as reusable element */
            height: 2.5cm;
            width: 100%;
            display: flex;
            align-items: center;
        }}

        /* Body styling */
        body {{
            font-family: 'Noto Sans', sans-serif;
            font-size: 9pt;
            line-height: 1.4;
            margin-top: 3cm; /* Add margin to push content below header */
        }}

        /* Header content styling */
        .header {{
            display: flex;
            align-items: center;
        }}

        .header img {{
            height: 30pt;
            width: 30pt;
            margin-right: 10pt;
        }}

        .header-text {{
            font-size: 14pt;
            color: white;
            font-weight: bold;
        }}

        /* Table styling */
        h1 {{ font-size: 14pt; }}
        h2 {{ font-size: 12pt; }}
        h3 {{ font-size: 11pt; }}
        table {{ width: 100%; border-collapse: collapse; }}
        th, td {{ border: 1px solid #ddd; padding: 4pt; font-size: 8.5pt; }}
        img {{ width: 100%; margin: 10pt 0; }}

        /* Styling for <think> tag */
        think {{
            display: block;
            font-size: 8pt; /* Smaller text */
            border: 1px solid #ccc; /* Border around the content */
            padding: 10pt; /* Padding inside the box */
            margin: 10pt 0; /* Space above and below the box */
            background-color: #f9f9f9; /* Light background */
            position: relative; /* For positioning the title */
        }}

        /* Add "Reasoning" title above the <think> content */
        think::before {{
            content: "Reasoning";
            display: block;
            font-size: 10pt;
            font-weight: bold;
            margin-bottom: 5pt; /* Space between title and content */
            color: #333; /* Darker text for the title */
        }}
    """
    )

    HTML(string=html_content).write_pdf(
        output_path, stylesheets=[css], presentational_hints=True
    )


def generate_loan_suggestions(
    csv_path,
    user_loan_amount,
    user_loan_term,
    user_salary,
    user_expenses,
    language="English",
):
    # 1. Process and analyze CSV data
    loan_data = pd.read_csv(csv_path)
    loan_data = loan_data[["bank_name", "loan_type", "interest_rate"]]
    loan_data = loan_data.dropna(subset=["interest_rate"])
    loan_data["interest_rate"] = pd.to_numeric(
        loan_data["interest_rate"], errors="coerce"
    )

    # 2. Find optimal loans (lowest rate per category)
    best_personal = loan_data[loan_data["loan_type"] == "Personal Loan"].nsmallest(
        1, "interest_rate"
    )
    best_education = loan_data[loan_data["loan_type"] == "Education Loan"].nsmallest(
        1, "interest_rate"
    )
    best_home = loan_data[loan_data["loan_type"] == "Home Loan"].nsmallest(
        1, "interest_rate"
    )

    top_loans = pd.concat([best_personal, best_education, best_home])

    # 3. Generate smart suggestions
    suggestions = []
    for _, row in top_loans.iterrows():
        calculator = SmartEMICalculator(language, user_salary, user_expenses)
        calculator.set_loan_details(
            user_loan_amount, row["interest_rate"], user_loan_term
        )

        # Generate AI-powered recommendation
        report = calculator.generate_detailed_report(extra_payment=5000)

        suggestions.append(
            {
                "Bank": row["bank_name"],
                "Loan Type": row["loan_type"],
                "Interest Rate": row["interest_rate"],
                "Recommendation": report.split("AI Recommendations")[1]
                .split("Smart Payment Strategy")[0]
                .strip(),
            }
        )

    # 4. Create comparison summary
    summary = f"""
    === Smart Loan Suggestions ===
    Based on {len(loan_data)} loan products analyzed:

    1. Best Personal Loan: {best_personal['bank_name'].values[0]} ({best_personal['interest_rate'].values[0]}%)
    2. Best Education Loan: {best_education['bank_name'].values[0]} ({best_education['interest_rate'].values[0]}%)
    3. Best Home Loan: {best_home['bank_name'].values[0]} ({best_home['interest_rate'].values[0]}%)

    Detailed recommendations:
    """

    for s in suggestions:
        summary += f"\n--- {s['Bank']} ({s['Loan Type']}) ---\n{s['Recommendation']}\n"

    return summary


@emi_calculator.route("/calculate", methods=["POST"])
def calculate_emi():
    try:
        logger.info("Starting EMI calculation")
        if not request.is_json:
            raise ValueError("Request must be JSON")

        data = request.json
        logger.debug(f"Received data: {data}")

        # Validate required fields
        required_fields = ["loan_amount", "interest_rate", "loan_term"]
        missing_fields = [field for field in required_fields if not data.get(field)]
        if missing_fields:
            raise ValueError(f"Missing required fields: {', '.join(missing_fields)}")

        calculator = SmartEMICalculator(
            language=data.get("language", "English"),
            monthly_salary=float(data.get("monthly_salary", 0)),
            monthly_expenses=float(data.get("monthly_expenses", 0)),
        )

        calculator.set_loan_details(
            amount=float(data.get("loan_amount", 0)),
            rate=float(data.get("interest_rate", 0)),
            term_years=float(data.get("loan_term", 0)),
        )

        extra_payment = float(data.get("extra_payment", 0))
        logger.info("Generating detailed report")
        report = calculator.generate_detailed_report(extra_payment)

        # Convert report to HTML with error handling
        try:
            logger.debug("Converting report to HTML")
            html_content = markdown.markdown(report, extensions=["tables"])
        except Exception as e:
            logger.error(f"Failed to convert markdown to HTML: {e}")
            raise

        # Generate PDF with error handling
        try:
            logger.debug("Generating PDF report")
            pdf_path = os.path.join(os.getcwd(), "temp_report.pdf")
            logo_path = os.path.join(os.getcwd(), "static", "loansaathi.png")

            if not os.path.exists(logo_path):
                logger.warning("Logo file not found, skipping logo")
                logo_path = None

            generate_pdf_report(html_content, logo_path, pdf_path)

            # Convert PDF to base64
            with open(pdf_path, "rb") as pdf_file:
                pdf_base64 = base64.b64encode(pdf_file.read()).decode("utf-8")

            # Clean up temporary file
            os.remove(pdf_path)
        except Exception as e:
            logger.error(f"Failed to generate PDF: {e}")
            pdf_base64 = None

        # Get loan suggestions with error handling
        try:
            logger.debug("Getting loan suggestions")
            csv_path = os.path.join(os.getcwd(), "data", "loan_data.csv")
            if os.path.exists(csv_path):
                suggestions = generate_loan_suggestions(
                    csv_path,
                    calculator.loan_amount,
                    calculator.loan_term / 12,
                    calculator.monthly_salary,
                    calculator.monthly_expenses,
                    calculator.language,
                )
            else:
                logger.warning("Loan data CSV not found")
                suggestions = None
        except Exception as e:
            logger.error(f"Failed to generate loan suggestions: {e}")
            suggestions = None

        result = {
            "emi": calculator.calculate_emi(),
            "total_interest": calculator.calculate_total_interest(),
            "smart_payment_impact": calculator.calculate_smart_payment_impact(
                extra_payment
            ),
            "amortization_schedule": calculator.get_amortization_schedule(
                extra_payment
            ),
            "report": report,
            "pdf_report": pdf_base64,
            "loan_suggestions": suggestions,
            "loan_details": {
                "amount": calculator.loan_amount,
                "rate": calculator.interest_rate,
                "term": calculator.loan_term / 12,
            },
        }

        logger.info("EMI calculation completed successfully")
        return jsonify({"success": True, "data": result})

    except ValueError as e:
        logger.error(f"Validation error: {e}")
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        logger.error("Failed to calculate EMI", exc_info=True)
        return jsonify({"success": False, "error": str(e)}), 500
