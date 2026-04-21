import pandas as pd
import numpy as np
from typing import List, Dict, Any

class SimulationEngine:
    def __init__(self, data_manager: Any, model_manager: Any):
        self.dm = data_manager
        self.mm = model_manager

    def simulate_distribution_shift(self, group_pct_change: Dict[str, float], feature_shifts: Dict[str, float]):
        """
        Simulates a distribution shift.
        group_pct_change: e.g., {'gender': 0.1} to increase women by 10%
        feature_shifts: e.g., {'income': 1.05} to increase income by 5%
        """
        sim_df = self.dm.get_raw_data().copy()
        
        # Shift features
        for feature, multiplier in feature_shifts.items():
            if feature in sim_df.columns and pd.api.types.is_numeric_dtype(sim_df[feature]):
                sim_df[feature] = sim_df[feature] * multiplier
        
        # Shift group distribution (oversampling/undersampling)
        # Simplified: just return the shifted features for now
        
        # Preprocess and predict
        processed_sim_df = self.dm.processed_df.copy() # Start from processed
        # Apply numerical shifts to processed_df as well (needs scaling)
        for feature, multiplier in feature_shifts.items():
            if feature in self.dm.numerical_features:
                processed_sim_df[feature] = processed_sim_df[feature] * multiplier
        
        X_sim = processed_sim_df[self.dm.feature_names]
        preds, probs = self.mm.predict(X_sim)
        
        return sim_df, preds, probs
