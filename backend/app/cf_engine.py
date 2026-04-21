import dice_ml
import pandas as pd
from typing import List, Dict, Any, Optional

class CFEngine:
    def __init__(self, df: pd.DataFrame, target: str, model: Any, continuous_features: List[str]):
        self.d = dice_ml.Data(dataframe=df, continuous_features=continuous_features, outcome_name=target)
        self.m = dice_ml.Model(model=model, backend="sklearn")
        self.exp = dice_ml.Dice(self.d, self.m, method="random")

    def generate_counterfactuals(self, query_instances: pd.DataFrame, total_CFs: int = 5, features_to_vary: List[str] = "all"):
        # Generate counterfactuals
        dice_exp = self.exp.generate_counterfactuals(
            query_instances, 
            total_CFs=total_CFs, 
            desired_class="opposite",
            features_to_vary=features_to_vary
        )
        return dice_exp

    def get_cf_dataframe(self, dice_exp):
        return dice_exp.cf_examples_list[0].final_cfs_df
