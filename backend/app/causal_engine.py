from dowhy import CausalModel
import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder
from typing import List, Dict, Any

class CausalEngine:
    def __init__(self, df: pd.DataFrame, treatment: str, outcome: str, common_causes: List[str]):
        self.df = df.copy()
        self.treatment = treatment
        self.outcome = outcome
        self.common_causes = common_causes
        self.model = None
        self._treatment_encoder = None

    def _prepare_data(self) -> pd.DataFrame:
        """Prepare a copy of the dataframe with all columns encoded as numeric."""
        prepared = self.df.copy()

        # Encode treatment column if categorical
        if not pd.api.types.is_numeric_dtype(prepared[self.treatment]):
            self._treatment_encoder = LabelEncoder()
            prepared[self.treatment] = self._treatment_encoder.fit_transform(
                prepared[self.treatment].fillna("Unknown").astype(str)
            )

        # Encode outcome if categorical
        if not pd.api.types.is_numeric_dtype(prepared[self.outcome]):
            le = LabelEncoder()
            prepared[self.outcome] = le.fit_transform(
                prepared[self.outcome].fillna("Unknown").astype(str)
            )

        # Encode any categorical common causes
        for col in self.common_causes:
            if col in prepared.columns and not pd.api.types.is_numeric_dtype(prepared[col]):
                le = LabelEncoder()
                prepared[col] = le.fit_transform(
                    prepared[col].fillna("Unknown").astype(str)
                )

        # Fill remaining NaNs with 0
        prepared = prepared.fillna(0)

        return prepared

    def estimate_effect(self):
        prepared = self._prepare_data()

        # Filter common_causes to only include columns that exist
        valid_causes = [c for c in self.common_causes if c in prepared.columns]

        # Define the causal model
        self.model = CausalModel(
            data=prepared,
            treatment=self.treatment,
            outcome=self.outcome,
            common_causes=valid_causes
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
