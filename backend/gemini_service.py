from google import genai
import os
import json
from typing import Optional, Dict, List, Any

# Lazy-init: defer configuration until first use so load_dotenv() has time to run
_client = None


def _get_client():
    """Lazily configure the Gemini SDK client and return it."""
    global _client
    if _client is None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError(
                "GEMINI_API_KEY environment variable is not set. "
                "Get a free key from https://aistudio.google.com and add it to backend/.env"
            )
        _client = genai.Client(api_key=api_key)
    return _client


def _get_model_name() -> str:
    return os.getenv("GEMINI_MODEL", "gemini-2.5-flash")


def _generate(prompt: str) -> str:
    """Generate content using the Gemini API and return the text."""
    client = _get_client()
    response = client.models.generate_content(
        model=_get_model_name(),
        contents=prompt,
    )
    return response.text.strip()


def detect_columns(df_sample: List[Dict], columns: List[str]) -> Dict[str, Any]:
    """
    Given column names + sample data, Gemini auto-detects:
    - Which column is likely the target (outcome)
    - Which columns are sensitive attributes
    - Dataset domain (hiring, loans, healthcare, etc.)
    
    Returns JSON with suggested_target, suggested_sensitive, domain, confidence, reasoning
    """
    prompt = f"""
You are an AI fairness expert analyzing a dataset for bias detection.

Dataset columns: {columns}
Sample data (first 3 rows):
{json.dumps(df_sample, indent=2)}

Analyze this dataset and respond ONLY with valid JSON in this exact format:
{{
  "suggested_target": "<column name most likely to be the outcome/decision>",
  "suggested_sensitive": ["<column1>", "<column2>"],
  "domain": "<hiring|loans|healthcare|education|other>",
  "confidence": "<high|medium|low>",
  "reasoning": "<one sentence explanation>"
}}

Rules:
- Target column should be binary outcome (approved/rejected, hired/not hired, yes/no, 0/1, true/false)
- Sensitive attributes are demographics: gender, race, age, ethnicity, religion, nationality
- Only include columns that actually exist in the provided list
- Return ONLY the JSON, no markdown or extra text
"""
    try:
        text = _generate(prompt)
        # Strip markdown code blocks if present
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        result = json.loads(text.strip())
        return result
    except Exception as e:
        # Fallback if Gemini fails
        return {
            "suggested_target": columns[-1] if columns else "target",
            "suggested_sensitive": [c for c in columns if any(x in c.lower() for x in ["gender", "race", "age", "sex"])],
            "domain": "other",
            "confidence": "low",
            "reasoning": f"Gemini failed to analyze. Error: {str(e)}"
        }


def generate_fairness_narrative(metrics: Dict[str, Any], sensitive_attrs: List[str], domain: str) -> str:
    """
    Generate a plain-English fairness audit narrative from metrics.
    Returns 3 paragraphs: findings, risk assessment, recommendations.
    """
    prompt = f"""
You are an AI ethics auditor writing a fairness report for a {domain} decision system.

Fairness Metrics:
- Counterfactual Fairness Score: {metrics.get('counterfactual_fairness_score', 'N/A')} 
  (% of cases where prediction changes when sensitive attribute changes)
- Demographic Parity: {metrics.get('demographic_parity', 'N/A')}
  (0=perfect fairness, 1=completely disparate)
- Equal Opportunity: {metrics.get('equal_opportunity', 'N/A')}
- Biased Individual Cases: {metrics.get('biased_individuals_count', 0)}
- Average Treatment Effect (ATE): {metrics.get('ate', 'N/A')}

Sensitive Attributes Analyzed: {', '.join(sensitive_attrs)}

Write a 3-paragraph fairness audit report:
1. Summary of findings (what the numbers mean in plain English for a non-technical reader)
2. Risk assessment (is this system fair or biased? severity level: low/medium/high/critical)
3. Top 1-2 specific policy recommendations to reduce bias

Keep it professional, concrete, and actionable. Maximum 200 words total.
No JSON, just plain text.
"""
    try:
        return _generate(prompt)
    except Exception as e:
        return f"Fairness audit generation failed: {str(e)}"


def explain_counterfactual(
    original: Dict[str, Any], 
    counterfactual: Dict[str, Any], 
    prediction_changed: bool, 
    changed_features: List[str]
) -> str:
    """
    Explain in plain English why a counterfactual flipped the prediction.
    """
    prompt = f"""
You are an AI fairness explainer. A machine learning model made different decisions based on the following:

Original person's data: {json.dumps(original, indent=2)}
Counterfactual (what-if) scenario: {json.dumps(counterfactual, indent=2)}
Features that were changed: {', '.join(changed_features)}
Did the prediction change (bias detected)?: {"YES - BIAS DETECTED" if prediction_changed else "No change"}

In 2-3 sentences, explain in simple language:
- What changed between the two scenarios
- Whether this indicates bias in the model
- Why this matters for the affected individual

Be direct, human-readable. No jargon. No JSON.
"""
    try:
        return _generate(prompt)
    except Exception as e:
        return f"Counterfactual explanation failed: {str(e)}"


def generate_simulation_story(
    simulation_params: Dict[str, Any], 
    before_metrics: Dict[str, Any], 
    after_metrics: Dict[str, Any]
) -> str:
    """
    Generate a policy brief narrating the simulation results.
    """
    prompt = f"""
You are a policy analyst writing a brief about a fairness simulation.

Simulation Parameters Applied:
{json.dumps(simulation_params, indent=2)}

Fairness Metrics BEFORE simulation:
{json.dumps(before_metrics, indent=2)}

Fairness Metrics AFTER simulation:
{json.dumps(after_metrics, indent=2)}

Write a 2-paragraph policy brief:
1. What changed in the fairness metrics and what it means for policy
2. Whether this intervention improved or worsened fairness, and what policymakers should do

Write as if presenting to a non-technical audience. Maximum 150 words total.
No JSON, just plain text.
"""
    try:
        return _generate(prompt)
    except Exception as e:
        return f"Simulation story generation failed: {str(e)}"


def generate_policy_recommendations(
    metrics: Dict[str, Any], 
    domain: str, 
    sensitive_attrs: List[str]
) -> List[Dict[str, str]]:
    """
    Generate 3-5 specific, actionable policy recommendations.
    Returns list of dicts with priority, action, impact, timeframe.
    """
    prompt = f"""
You are an AI ethics consultant. Based on this bias analysis of a {domain} system:

Metrics: {json.dumps(metrics, indent=2)}
Sensitive attributes showing potential bias: {sensitive_attrs}

Generate exactly 5 specific, actionable policy recommendations to reduce bias.
Respond ONLY with valid JSON array in this format, NO MARKDOWN:
[
  {{"priority": "high|medium|low", "action": "specific action", "impact": "expected outcome", "timeframe": "immediate|short-term|long-term"}},
  {{"priority": "high", "action": "second action", "impact": "second outcome", "timeframe": "immediate"}},
  ...
]

Rules:
- All 5 items must be present
- priority values only: high, medium, low
- timeframe values only: immediate, short-term, long-term
- action and impact should be 1-2 sentences each
- Return ONLY valid JSON array, no markdown code blocks
"""
    try:
        text = _generate(prompt)
        # Strip markdown code blocks if present
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        result = json.loads(text.strip())
        # Ensure we have exactly 5 items
        if isinstance(result, list):
            return result[:5] if len(result) >= 5 else result + [
                {
                    "priority": "medium",
                    "action": "Placeholder recommendation",
                    "impact": "System failed to generate full recommendations",
                    "timeframe": "short-term"
                }
            ] * (5 - len(result))
        return result
    except Exception as e:
        # Fallback recommendations
        return [
            {
                "priority": "high",
                "action": f"Investigate bias in {sensitive_attrs[0] if sensitive_attrs else 'sensitive attributes'}",
                "impact": "Understand root cause of disparities",
                "timeframe": "immediate"
            },
            {
                "priority": "high",
                "action": "Audit historical decisions for disparate impact",
                "impact": "Identify cases that may need review or remedy",
                "timeframe": "immediate"
            },
            {
                "priority": "medium",
                "action": "Retrain model with balanced data sampling",
                "impact": "Reduce demographic disparities in predictions",
                "timeframe": "short-term"
            },
            {
                "priority": "medium",
                "action": "Add fairness constraints to model optimization",
                "impact": "Incorporate fairness as explicit objective",
                "timeframe": "short-term"
            },
            {
                "priority": "low",
                "action": f"Gemini recommendation generation failed. Error: {str(e)}",
                "impact": "Use human review and domain expertise",
                "timeframe": "long-term"
            }
        ]
