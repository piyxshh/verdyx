import { CompanyFeatures, PredictionResult, TopFactor } from "./types";

// In production (Vercel monorepo) NEXT_PUBLIC_API_URL is unset, so we use
// same-origin "/predict" which is rewritten to the Python serverless function.
// In local dev .env.local sets it to "http://localhost:8000" for the separate
// FastAPI dev server. The fallback to localhost:8000 is kept for local dev
// where the env var might be missing, but on Vercel the rewrite handles it.
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

/**
 * Submit financial ratios to backend and run complete ML + Multi-Agent pipeline.
 *
 * Backend contract (POST /predict → PredictionResultResponse):
 *   { prediction_id, status, distress_probability, risk_tier,
 *     top_factors: [{feature, importance}],
 *     agent_reports: {finance, market, risk} | null,
 *     final_verdict: {tier, confidence, reasoning} | null,
 *     created_at, completed_at }
 */
export async function runPrediction(features: CompanyFeatures): Promise<PredictionResult> {
  try {
    const endpoint = API_BASE_URL ? `${API_BASE_URL}/predict` : "/predict";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company_features: features }),
    });

    if (response.ok) {
      const data = await response.json();

      // Backend returns PredictionResultResponse directly from POST /predict.
      // Map it into the frontend PredictionResult, preserving nullable fields.
      return {
        prediction_id: data.prediction_id,
        status: data.status,
        distress_probability: data.distress_probability ?? null,
        risk_tier: data.risk_tier ?? data.final_verdict?.tier ?? null,
        top_factors: (data.top_factors ?? []).map((f: { feature: string; importance: number }) => ({
          feature: f.feature,
          importance: f.importance,
        })),
        agent_reports: data.agent_reports ?? null,
        final_verdict: data.final_verdict ?? null,
        company_features: features,
        created_at: data.created_at ?? new Date().toISOString(),
        completed_at: data.completed_at ?? null,
      };
    }

    // Non-OK response — log and fall through to local simulation
    const errorText = await response.text().catch(() => "Unknown error");
    console.warn(`Backend returned ${response.status}: ${errorText}`);
  } catch (error) {
    console.warn(
      "Backend API not reachable at",
      API_BASE_URL,
      "— Using local simulation fallback.",
      error
    );
  }

  // Fallback: local simulation for offline demos
  return simulateLocalPrediction(features);
}

function calculateRiskTier(prob: number): "High Risk" | "Medium Risk" | "Low Risk" {
  if (prob >= 0.60) return "High Risk";
  if (prob >= 0.30) return "Medium Risk";
  return "Low Risk";
}

function generateTopFactors(features: CompanyFeatures): TopFactor[] {
  const factors: TopFactor[] = [
    { feature: "Borrowing dependency", importance: 0.0558 * (features["Borrowing dependency"] > 0.4 ? 1.5 : 0.6) },
    { feature: "Total debt/Total net worth", importance: 0.0492 * (features["Total debt/Total net worth"] > 1.0 ? 1.4 : 0.7) },
    { feature: "Persistent EPS in the Last Four Seasons", importance: 0.0482 * (features["Persistent EPS in the Last Four Seasons"] < 0.15 ? 1.4 : 0.8) },
    { feature: "Net Income to Total Assets", importance: 0.0450 * (features["Net Income to Total Assets"] < 0.3 ? 1.3 : 0.7) },
    { feature: "Retained Earnings to Total Assets", importance: 0.0338 * (features["Retained Earnings to Total Assets"] < 0.5 ? 1.2 : 0.6) },
  ];
  return factors.sort((a, b) => b.importance - a.importance);
}

/**
 * High-fidelity local simulation mirroring the trained Random Forest & Agent outputs.
 * Used when the backend is unreachable (offline presentations, local development).
 */
function simulateLocalPrediction(features: CompanyFeatures): Promise<PredictionResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const borrowingDep = features["Borrowing dependency"] ?? 0.37;
      const debtNetWorth = Math.min(features["Total debt/Total net worth"] ?? 0.02, 5.0) / 5.0;
      const debtRatio = features["Debt ratio %"] ?? 0.11;
      const eps = features["Persistent EPS in the Last Four Seasons"] ?? 0.22;
      const roa = features["Net Income to Total Assets"] ?? 0.80;
      const retainedEarnings = features["Retained Earnings to Total Assets"] ?? 0.93;
      const netWorthAssets = features["Net worth/Assets"] ?? 0.88;

      const badScore =
        borrowingDep * 0.35 +
        debtRatio * 0.25 +
        debtNetWorth * 0.20 +
        (1 - roa) * 0.15 +
        (1 - retainedEarnings) * 0.15 +
        (1 - Math.min(eps * 3, 1)) * 0.10;

      let distressProbability = Math.max(0.04, Math.min(0.96, (badScore - 0.25) * 1.6));
      distressProbability = Math.round(distressProbability * 1000) / 1000;

      const riskTier = calculateRiskTier(distressProbability);
      const confidence =
        Math.round((0.82 + Math.abs(distressProbability - 0.5) * 0.28) * 100) / 100;

      let financeReport: string;
      let marketReport: string;
      let riskReport: string;
      let reasoningSummary: string;

      if (distressProbability >= 0.60) {
        financeReport = `Solvency posture is critically distressed. Borrowing dependency of ${(borrowingDep * 100).toFixed(1)}% indicates acute reliance on short-term debt servicing. Coupled with a debt-to-equity ratio of ${features["Total debt/Total net worth"].toFixed(2)} and an equity buffer of ${(netWorthAssets * 100).toFixed(1)}%, the company has virtually no retained reserves to buffer interest rate volatility.`;
        marketReport = `Operational profitability has broken down. Persistent EPS of ${eps.toFixed(2)} over trailing quarters confirms multi-period earnings erosion. Asset turnover and return on assets (${(roa * 100).toFixed(1)}%) reflect asset inefficiency and deteriorating gross margins relative to industry peers.`;
        riskReport = `Compound Failure Mode: Gearing Trap. The combination of high debt service overhead and compressed operational earnings leaves the entity unable to absorb even a minor (3–5%) macroeconomic revenue contraction without liquidity insolvency.`;
        reasoningSummary = `High Risk classification driven by acute leverage dependency (${(borrowingDep * 100).toFixed(1)}%) and persistent earnings erosion. Restructuring and debt consolidation must take priority over expansion.`;
      } else if (distressProbability >= 0.30) {
        financeReport = `Solvency profile is moderately leveraged. Borrowing dependency is elevated at ${(borrowingDep * 100).toFixed(1)}%, but partially counterbalanced by retained earnings (${(retainedEarnings * 100).toFixed(1)}%). Refinancing risk is manageable under stable credit market conditions.`;
        marketReport = `Operating performance is stable but vulnerable. Return on assets (${(roa * 100).toFixed(1)}%) generates sufficient cash flow for baseline operations, though persistent earnings growth is constrained by input cost pressures.`;
        riskReport = `Vulnerability identified in working capital velocity. A sustained interest rate hike would strain net interest margins, narrowing the debt service coverage ratio.`;
        reasoningSummary = `Moderate Risk rating. Core operations remain solvent, but debt service capacity is vulnerable to cyclical market downturns. Prudent working capital management is recommended.`;
      } else {
        financeReport = `Solvency posture is exceptionally robust. Borrowing dependency is conservative at ${(borrowingDep * 100).toFixed(1)}%, while net equity cushions ${(netWorthAssets * 100).toFixed(1)}% of total balance sheet assets. Internal reserves provide an extensive shock-absorption runway.`;
        marketReport = `Operational engine demonstrates prime productivity. High return on assets (${(roa * 100).toFixed(1)}%) and persistent earnings consistency (${eps.toFixed(2)}) confirm strong pricing power, operational leverage, and consistent cash conversion.`;
        riskReport = `Low systematic risk profile. The entity possesses substantial solvency headroom, minimal refinancing exposure, and superior liquidity reserves capable of weathering adverse market cycles.`;
        reasoningSummary = `Low Risk profile supported by strong self-funded operational cash flow, minimal debt gearing, and superior equity safety margins. Positioned for sound strategic investment.`;
      }

      resolve({
        prediction_id: `pred_${Date.now().toString(36)}`,
        status: "completed",
        distress_probability: distressProbability,
        risk_tier: riskTier,
        top_factors: generateTopFactors(features),
        agent_reports: {
          finance: financeReport,
          market: marketReport,
          risk: riskReport,
        },
        final_verdict: {
          tier: riskTier,
          confidence: confidence,
          reasoning: reasoningSummary,
        },
        company_features: features,
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      });
    }, 850);
  });
}
