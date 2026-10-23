import { Type } from '@google/genai';

/**
 * Tier-2 Genie tool: home-loan EMI + indicative eligibility. Pure math, no DB.
 * Gemini calls this so the numbers are exact rather than hallucinated.
 */

export const calculateEmiDeclaration = {
  name: 'calculate_emi',
  description:
    'Calculate an exact home-loan EMI (equated monthly instalment), total interest and ' +
    'total payment. Optionally estimate indicative loan eligibility from monthly income. ' +
    'Call this for any EMI / loan affordability / "how much can I borrow" question. Always ' +
    'use this tool instead of computing EMI yourself.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      loanAmount: { type: Type.NUMBER, description: 'Loan principal in absolute INR (e.g. 5000000 for 50 lakh).' },
      annualRatePercent: { type: Type.NUMBER, description: 'Annual interest rate percent (e.g. 8.5). Default 8.75 if unknown.' },
      tenureYears: { type: Type.NUMBER, description: 'Loan tenure in years (e.g. 20). Default 20 if unknown.' },
      monthlyIncomeInr: { type: Type.NUMBER, description: 'Optional net monthly income in INR for eligibility estimate.' },
    },
    required: ['loanAmount'],
  },
} as const;

export interface EmiArgs {
  loanAmount: number;
  annualRatePercent?: number;
  tenureYears?: number;
  monthlyIncomeInr?: number;
}

export interface EmiResult {
  loanAmount: number;
  annualRatePercent: number;
  tenureYears: number;
  emi: number;
  totalInterest: number;
  totalPayment: number;
  eligibility?: {
    monthlyIncomeInr: number;
    maxAffordableEmi: number; // 50% FOIR
    affordable: boolean;
    indicativeMaxLoan: number;
  };
  note: string;
}

export function runEmiCalculation(args: EmiArgs): EmiResult {
  const loanAmount = Math.max(args.loanAmount || 0, 0);
  const annualRatePercent = args.annualRatePercent ?? 8.75;
  const tenureYears = args.tenureYears ?? 20;

  const monthlyRate = annualRatePercent / 12 / 100;
  const months = Math.round(tenureYears * 12);

  let emi: number;
  if (monthlyRate === 0) {
    emi = months > 0 ? loanAmount / months : 0;
  } else {
    const pow = Math.pow(1 + monthlyRate, months);
    emi = (loanAmount * monthlyRate * pow) / (pow - 1);
  }
  emi = Math.round(emi);
  const totalPayment = emi * months;
  const totalInterest = Math.max(totalPayment - loanAmount, 0);

  const result: EmiResult = {
    loanAmount,
    annualRatePercent,
    tenureYears,
    emi,
    totalInterest,
    totalPayment,
    note: 'Indicative only — actual EMI depends on the lender, credit profile and processing fees.',
  };

  if (args.monthlyIncomeInr && args.monthlyIncomeInr > 0) {
    // Common lender heuristic: EMIs should stay within ~50% of net income (FOIR).
    const maxAffordableEmi = Math.round(args.monthlyIncomeInr * 0.5);
    // Invert the EMI formula to an indicative max loan for that EMI ceiling.
    let indicativeMaxLoan: number;
    if (monthlyRate === 0) {
      indicativeMaxLoan = maxAffordableEmi * months;
    } else {
      const pow = Math.pow(1 + monthlyRate, months);
      indicativeMaxLoan = Math.round((maxAffordableEmi * (pow - 1)) / (monthlyRate * pow));
    }
    result.eligibility = {
      monthlyIncomeInr: args.monthlyIncomeInr,
      maxAffordableEmi,
      affordable: emi <= maxAffordableEmi,
      indicativeMaxLoan,
    };
  }

  return result;
}
