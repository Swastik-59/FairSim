from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io
import os
from typing import List, Dict, Any, Optional

from app.data_manager import DataManager
from app.model_manager import ModelManager
from app.cf_engine import CFEngine
from app.fairness_engine import FairnessEngine
from app.causal_engine import CausalEngine
from app.simulation_engine import SimulationEngine

app = FastAPI(title="FairSim API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instances (in a real app, use a database or session)
dm = DataManager()
mm = ModelManager()
cf_engine = None
fe = None
ce = None
se = None

@app.post("/train")
async def train_model(
    file: UploadFile = File(...), 
    target: str = Form(...), 
    sensitive_attributes: str = Form(...)  # comma-separated
):
    global cf_engine, fe, ce, se
    
    contents = await file.read()
    df = pd.read_csv(io.BytesIO(contents))
    
    sens_attrs = [s.strip() for s in sensitive_attributes.split(",")]
    dm.load_dataset(df, target, sens_attrs)
    
    X, y = dm.get_data_for_training()
    metrics = mm.train(X, y)
    
    # Initialize engines
    cf_engine = CFEngine(dm.get_raw_data(), target, mm.get_model(), dm.numerical_features)
    fe = FairnessEngine(dm, mm)
    
    # Simple causal setup: Treatment is the first sensitive attr
    ce = CausalEngine(dm.get_raw_data(), sens_attrs[0], target, [f for f in dm.feature_names if f not in sens_attrs])
    
    se = SimulationEngine(dm, mm)
    
    return {"status": "success", "metrics": metrics}

@app.post("/predict")
async def predict(input_data: Dict[str, Any]):
    processed_input = dm.transform_input(input_data)
    pred, prob = mm.predict(processed_input)
    return {
        "prediction": int(pred[0]),
        "probability": prob[0].tolist()
    }

@app.post("/counterfactual")
async def get_counterfactuals(input_data: Dict[str, Any], total_cfs: int = 5):
    processed_input = dm.transform_input(input_data)
    dice_exp = cf_engine.generate_counterfactuals(processed_input, total_CFs=total_cfs)
    cf_df = cf_engine.get_cf_dataframe(dice_exp)
    return cf_df.to_dict(orient="records")

@app.get("/fairness")
async def get_fairness_metrics(sensitive_attr: str):
    X, y = dm.get_data_for_training()
    y_pred, _ = mm.predict(X)
    
    score, bias_details = fe.compute_counterfactual_fairness(X, sensitive_attr, cf_engine)
    group_metrics = fe.compute_group_metrics(y, y_pred, dm.df[sensitive_attr])
    
    return {
        "counterfactual_fairness_score": score,
        "bias_details": bias_details,
        "group_metrics": group_metrics
    }

@app.post("/simulate")
async def run_simulation(group_pct_change: Dict[str, float], feature_shifts: Dict[str, float]):
    sim_df, preds, probs = se.simulate_distribution_shift(group_pct_change, feature_shifts)
    # Recompute group metrics for simplicity
    group_metrics = fe.compute_group_metrics(dm.df[dm.target], preds, dm.df[dm.sensitive_attributes[0]])
    return {
        "group_metrics": group_metrics
    }

@app.get("/causal")
async def get_causal_results():
    results = ce.estimate_effect()
    return results

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
