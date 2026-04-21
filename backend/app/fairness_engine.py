import pandas as pd
import numpy as np
from typing import List, Dict, Any

class FairnessEngine:
    def __init__(self, data_manager: Any, model_manager: Any):
        self.dm = data_manager
        self.mm = model_manager

    def compute_counterfactual_fairness(self, test_df: pd.DataFrame, sensitive_attr: str, cf_engine: Any):
        """
        Calculates the percentage of cases where the prediction changes when the sensitive attribute is changed.
        """
        results = []
        flips = 0
        total = len(test_df)

        for i in range(min(total, 100)): # Limit to 100 for performance in simulation
            instance = test_df.iloc[[i]]
            original_pred = self.mm.predict(instance)[0][0]
            
            # Generate CF by ONLY varying the sensitive attribute
            cf_exp = cf_engine.generate_counterfactuals(instance, total_CFs=1, features_to_vary=[sensitive_attr])
            cf_df = cf_engine.get_cf_dataframe(cf_exp)
            
            if cf_df is not None and not cf_df.empty:
                cf_instance = cf_df.drop(columns=[self.dm.target])
                cf_pred = self.mm.predict(cf_instance)[0][0]
                
                if original_pred != cf_pred:
                    flips += 1
                    results.append({"index": i, "original": original_pred, "counterfactual": cf_pred, "bias_flag": True})
                else:
                    results.append({"index": i, "original": original_pred, "counterfactual": cf_pred, "bias_flag": False})

        score = 1 - (flips / min(total, 100))
        return score, results

    def compute_group_metrics(self, y_true, y_pred, sensitive_values):
        """
        Computes Demographic Parity and Equal Opportunity.
        """
        groups = np.unique(sensitive_values)
        metrics = {}
        
        for group in groups:
            group_mask = (sensitive_values == group)
            group_pred = y_pred[group_mask]
            group_true = y_true[group_mask]
            
            selection_rate = np.mean(group_pred)
            
            # Equal Opportunity: True Positive Rate
            tp = np.sum((group_pred == 1) & (group_true == 1))
            fn = np.sum((group_pred == 0) & (group_true == 1))
            tpr = tp / (tp + fn) if (tp + fn) > 0 else 0
            
            metrics[str(group)] = {
                "selection_rate": float(selection_rate),
                "true_positive_rate": float(tpr)
            }
            
        return metrics
