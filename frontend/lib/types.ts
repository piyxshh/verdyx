export interface CompanyFeatures {
  "Borrowing dependency": number;
  "Total debt/Total net worth": number;
  "Persistent EPS in the Last Four Seasons": number;
  "Net Income to Total Assets": number;
  "Retained Earnings to Total Assets": number;
  "Continuous interest rate (after tax)": number;
  "Debt ratio %": number;
  "Net worth/Assets": number;
  "Net profit before tax/Paid-in capital": number;
  "After-tax net Interest Rate": number;
  [key: string]: number;
}

export interface TopFactor {
  feature: string;
  importance: number;
}

export interface AgentReports {
  finance: string;
  market: string;
  risk: string;
}

export interface FinalVerdict {
  tier: "Low Risk" | "Medium Risk" | "High Risk" | string;
  confidence: number;
  reasoning: string;
}

/**
 * Mirrors backend PredictionResultResponse (Pydantic schema).
 *
 * Key contract points:
 *  - distress_probability, risk_tier, agent_reports, final_verdict are all Optional
 *    on the backend (null when pipeline is still processing or failed).
 *  - top_factors defaults to [] on the backend.
 *  - status is one of "processing" | "completed" | "failed".
 */
export interface PredictionResult {
  prediction_id: string;
  status: "processing" | "completed" | "failed";
  distress_probability: number | null;
  risk_tier: string | null;
  top_factors: TopFactor[];
  agent_reports: AgentReports | null;
  final_verdict: FinalVerdict | null;
  company_features?: CompanyFeatures;
  created_at: string;
  completed_at?: string | null;
}

export interface FormFieldConfig {
  label: string;
  category: "solvency" | "operations";
  description: string;
  min: number;
  max: number;
  step: number;
  default_median: number;
  unit?: string;
  healthy_direction: "higher" | "lower";
}

export interface DemoPreset {
  id: string;
  name: string;
  tagline: string;
  risk_tier: "High Risk" | "Medium Risk" | "Low Risk";
  badge_color: string;
  description: string;
  features: CompanyFeatures;
}
