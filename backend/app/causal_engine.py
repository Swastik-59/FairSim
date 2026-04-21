from dowhy import CausalModel
import pandas as pd
from typing import List, Dict, Any

class CausalEngine:
    def __init__(self, df: pd.DataFrame, treatment: str, outcome: str, common_causes: List[str]):
        self.df = df
        self.treatment = treatment
        self.outcome = outcome
        self.common_causes = common_causes
        self.model = None

    def estimate_effect(self):
        # Define the causal model
        self.model = CausalModel(
            data=self.df,
            treatment=self.treatment,
            outcome=self.outcome,
            common_causes=self.common_causes
        )
        
        # Identify the causal effect
        identified_estimand = self.model.identify_effect(proceed_when_unidentifiable=True)
        
        # Estimate the causal effect
        estimate = self.model.estimate_effect(
            identified_estimand,
            method_name="backdoor.linear_regression"
        )
        
        return {
            "ate": estimate.value,
            "estimand": str(identified_estimand)
        }
