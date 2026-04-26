from dotenv import load_dotenv
# Load environment variables FIRST, before any module that reads them
load_dotenv()

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
import pandas as pd
import io
import os
import numpy as np
import logging
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from sklearn.preprocessing import LabelEncoder

from app.data_manager import DataManager
from app.model_manager import ModelManager
from app.cf_engine import CFEngine
from app.fairness_engine import FairnessEngine
from app.causal_engine import CausalEngine
from app.simulation_engine import SimulationEngine
from gemini_service import (
    detect_columns,
    generate_fairness_narrative,
    explain_counterfactual,
    generate_simulation_story,
    generate_policy_recommendations,
)

app = FastAPI(title="FairSim API")
logger = logging.getLogger("fairsim")


def _build_allowed_origins() -> List[str]:
    default_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://fair-sim.vercel.app",
    ]
    configured = os.getenv("FRONTEND_ORIGINS", "")
    if not configured.strip():
        return default_origins

    extra_origins = []
    for origin in configured.split(","):
        cleaned = origin.strip().rstrip("/")
        if cleaned:
            extra_origins.append(cleaned)
    return list(dict.fromkeys(default_origins + extra_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=_build_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

dm = DataManager()
mm = ModelManager()
cf_engine = None
fe = None
ce = None
se = None

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")
DEFAULT_DATASET = os.path.join(DATA_DIR, "adult_sample.csv")


class PredictRequest(BaseModel):
    features: Dict[str, Any]


class CounterfactualRequest(BaseModel):
    features: Dict[str, Any]
    num_counterfactuals: int = Field(default=5, ge=1, le=20)


class SimulationRequest(BaseModel):
    group_shift: float = 0.0
    income_shift: float = 0.0
    education_shift: float = 0.0
    sensitive_attribute: Optional[str] = None
    feature_shifts: Dict[str, float] = Field(default_factory=dict)


def success(data: Dict[str, Any]) -> Dict[str, Any]:
    return {"status": "success", "data": _json_safe(data)}


def _safe_float(value: Any, default: float = 0.0) -> float:
    try:
        numeric_value = float(value)
    except (TypeError, ValueError):
        return default
    return numeric_value if np.isfinite(numeric_value) else default


def _json_safe(value: Any) -> Any:
    if isinstance(value, dict):
        return {key: _json_safe(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_json_safe(item) for item in value]
    if isinstance(value, tuple):
        return [_json_safe(item) for item in value]
    if isinstance(value, np.generic):
        return _json_safe(value.item())
    if isinstance(value, float):
        return value if np.isfinite(value) else 0.0
    if value is pd.NA:
        return None
    return value


def build_engines() -> None:
    global cf_engine, fe, ce, se
    cf_engine = CFEngine(dm.get_raw_data(), dm.target, mm.get_model(), dm.numerical_features)
    fe = FairnessEngine(dm, mm)
    treatment = dm.sensitive_attributes[0] if dm.sensitive_attributes else dm.feature_names[0]
    common_causes = [f for f in dm.feature_names if f not in dm.sensitive_attributes]
    ce = CausalEngine(dm.get_raw_data(), treatment, dm.target, common_causes)
    se = SimulationEngine(dm, mm)


def require_model() -> None:
    if not hasattr(app.state, "model") or app.state.model is None:
        raise HTTPException(
            status_code=400,
            detail="No model trained. Please upload a dataset and train first via POST /upload then POST /train",
        )


def merge_with_defaults(features: Dict[str, Any]) -> Dict[str, Any]:
    normalized = {}
    for key, value in features.items():
        normalized[key] = value
        normalized[key.replace("-", "_")] = value

    base = {}
    if dm.df is not None:
        for col in dm.feature_names:
            if pd.api.types.is_numeric_dtype(dm.df[col]):
                base[col] = float(dm.df[col].median())
            else:
                base[col] = str(dm.df[col].mode().iloc[0])
    for col in dm.feature_names:
        if col in normalized:
            base[col] = normalized[col]
    return base


def infer_sensitive_attr() -> str:
    if dm.sensitive_attributes:
        return dm.sensitive_attributes[0]
    if dm.feature_names:
        return dm.feature_names[0]
    raise HTTPException(status_code=400, detail="No features available")


def safe_counterfactual_fairness(max_samples: int = 150) -> Dict[str, Any]:
    sensitive_attr = infer_sensitive_attr()
    raw = dm.get_raw_data().reset_index(drop=True)
    sample_size = min(len(raw), max_samples)
    flips = 0
    details = []

    candidates = [str(v) for v in raw[sensitive_attr].dropna().unique().tolist()]
    if len(candidates) <= 1:
        return {"score": 1.0, "details": []}

    for i in range(sample_size):
        row = raw.iloc[i].to_dict()
        original = merge_with_defaults({k: v for k, v in row.items() if k in dm.feature_names})
        original_pred = int(mm.predict(dm.transform_input(original))[0][0])
        current_sensitive = str(row.get(sensitive_attr))
        alternatives = [c for c in candidates if c != current_sensitive]
        changed = False
        changed_to = current_sensitive

        for alt in alternatives[:2]:
            cf = dict(original)
            cf[sensitive_attr] = alt
            cf_pred = int(mm.predict(dm.transform_input(cf))[0][0])
            if cf_pred != original_pred:
                changed = True
                changed_to = alt
                break

        if changed:
            flips += 1
        details.append(
            {
                "index": i,
                "original_prediction": original_pred,
                "counterfactual_prediction": 1 - original_pred if changed else original_pred,
                "bias_flag": changed,
                "sensitive_attribute": sensitive_attr,
                "original_value": current_sensitive,
                "counterfactual_value": changed_to,
                "explanation": (
                    f"Prediction changed when {sensitive_attr.replace('_', ' ')} moved from {current_sensitive} to {changed_to}."
                    if changed
                    else f"Prediction stayed the same when {sensitive_attr.replace('_', ' ')} changed from {current_sensitive}."
                ),
            }
        )

    score = 1 - (flips / sample_size if sample_size else 0)
    return {"score": float(max(0.0, min(1.0, score))), "details": details}


def compute_fairness_summary(y_true, y_pred, sensitive_values) -> Dict[str, Any]:
    group_metrics = fe.compute_group_metrics(y_true, y_pred, sensitive_values)
    selection_rates = [m["selection_rate"] for m in group_metrics.values()] if group_metrics else [0]
    tprs = [m["true_positive_rate"] for m in group_metrics.values()] if group_metrics else [0]
    demographic_parity = 1 - (max(selection_rates) - min(selection_rates))
    equal_opportunity = 1 - (max(tprs) - min(tprs))
    return {
        "group_metrics": group_metrics,
        "demographic_parity": float(max(0.0, demographic_parity)),
        "equal_opportunity": float(max(0.0, equal_opportunity)),
    }


def predict_label(value: int) -> str:
    encoder = getattr(app.state, "target_encoder", None)
    if encoder is not None:
        try:
            return str(encoder.inverse_transform([int(value)])[0])
        except Exception:
            pass

    if app.state.target_column and app.state.df is not None and app.state.target_column in app.state.df.columns:
        raw_labels = app.state.df[app.state.target_column].dropna().unique().tolist()
        if len(raw_labels) == 2 and int(value) in (0, 1):
            try:
                ordered_labels = sorted(raw_labels, key=lambda item: float(item))
            except Exception:
                ordered_labels = sorted(raw_labels, key=lambda item: str(item))
            return str(ordered_labels[int(value)])

    return str(int(value))


def prediction_summary(value: int) -> str:
    target = (app.state.target_column or "outcome").replace("_", " ").strip().title()
    return f"Predicted {target}: {predict_label(value)}"


def generate_random_counterfactual(original: Dict[str, Any], rng: np.random.Generator) -> Dict[str, Any]:
    candidate = dict(original)
    mutable = [feature for feature in dm.feature_names if feature in candidate and feature != dm.target]
    if not mutable:
        return candidate

    change_count = int(min(len(mutable), max(2, rng.integers(2, 5))))
    selected = list(rng.choice(mutable, size=change_count, replace=False))

    for feature in selected:
        if feature in dm.numerical_features:
            series = pd.to_numeric(dm.df[feature], errors="coerce").dropna()
            if len(series) > 0:
                quantiles = series.quantile([0.15, 0.35, 0.55, 0.75, 0.9]).tolist()
                current = float(candidate.get(feature, series.median()))
                choices = [float(v) for v in quantiles if float(v) != current]
                if choices:
                    candidate[feature] = float(choices[int(rng.integers(0, len(choices)))])
                else:
                    candidate[feature] = float(current * (1.0 + float(rng.uniform(-0.08, 0.18))))
            continue

        values = [str(v) for v in dm.df[feature].dropna().astype(str).unique().tolist()]
        if values:
            current = str(candidate.get(feature, values[0]))
            choices = [value for value in values if value != current] or values
            candidate[feature] = choices[int(rng.integers(0, len(choices)))]

    return candidate


@app.exception_handler(HTTPException)
async def http_exception_handler(_, exc: HTTPException):
    message = exc.detail if isinstance(exc.detail, str) else "Request failed"
    return JSONResponse(status_code=exc.status_code, content={"status": "error", "message": message})


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_, exc: RequestValidationError):
    return JSONResponse(status_code=422, content={"status": "error", "message": str(exc)})


@app.on_event("startup")
async def startup_event():
    app.state.df = None
    app.state.model = None
    app.state.X = None
    app.state.y = None
    app.state.target_column = None
    app.state.sensitive_attrs = []
    app.state.feature_names = []
    app.state.encoders = {}
    app.state.domain = "general"
    logger.info("FairSim started - waiting for dataset upload")

@app.post("/train")
async def train_model():
    """
    Train model on the uploaded dataset using DataManager preprocessing.
    """
    try:
        if not hasattr(app.state, 'df') or app.state.df is None:
            raise HTTPException(status_code=400, detail="No dataset uploaded. Call POST /upload first.")

        df = app.state.df.copy()
        target_col = getattr(app.state, 'target_column', None)
        sensitive_attrs = getattr(app.state, 'sensitive_attrs', [])
        if not target_col:
            raise HTTPException(status_code=400, detail="Target column is missing. Re-upload dataset.")

        df = df.dropna(thresh=max(1, int(len(df.columns) * 0.5))).reset_index(drop=True)

        dm.load_dataset(df, target_col, sensitive_attrs)

        X_dm, y_dm = dm.get_data_for_training()
        if pd.api.types.is_numeric_dtype(y_dm):
            y_train = y_dm
            app.state.target_encoder = None
        else:
            target_le = LabelEncoder()
            y_train = target_le.fit_transform(y_dm.astype(str))
            app.state.target_encoder = target_le

        metrics = mm.train(X_dm, y_train)
        app.state.model = mm.get_model()
        app.state.df = df
        app.state.X = X_dm
        app.state.y = y_train
        app.state.encoders = dm.label_encoders
        app.state.feature_names = dm.feature_names
        app.state.target_column = target_col
        app.state.sensitive_attrs = sensitive_attrs

        mm.save_model(MODEL_PATH)
        build_engines()

        feature_importance = {}
        if hasattr(mm.get_model(), 'feature_importances_'):
            importances = mm.get_model().feature_importances_
            feature_importance = dict(zip(X_dm.columns.tolist(), importances.tolist()))
        
        return success({
            "accuracy": float(metrics.get("accuracy", 0.0)),
            "n_samples": len(df),
            "n_features": len(X_dm.columns),
            "feature_importance": feature_importance,
            "target_column": target_col,
            "sensitive_attributes": sensitive_attrs
        })
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Training failed: {str(exc)}")

@app.post("/predict")
async def predict(request: PredictRequest):
    try:
        require_model()
        features = merge_with_defaults(request.features)
        processed_input = dm.transform_input(features)
        pred, prob = mm.predict(processed_input)
        prediction_value = int(pred[0])
        target_column = app.state.target_column or dm.target or "outcome"
        return success(
            {
                "prediction": prediction_value,
                "prediction_label": predict_label(prediction_value),
                "prediction_summary": prediction_summary(prediction_value),
                "probability": float(np.max(prob[0])),
                "target_column": target_column,
                "features": features,
            }
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(exc)}")

@app.post("/counterfactual")
async def get_counterfactuals(request: CounterfactualRequest):
    try:
        require_model()
        if cf_engine is None:
            raise HTTPException(status_code=400, detail="Counterfactual engine not initialized")

        rng = np.random.default_rng()
        original = merge_with_defaults(request.features)
        original_df = pd.DataFrame([original])
        cf_records = []

        # DiCE can fail depending on local setup; keep robust fallback behavior.
        try:
            dice_exp = cf_engine.generate_counterfactuals(original_df, total_CFs=request.num_counterfactuals)
            cf_df = cf_engine.get_cf_dataframe(dice_exp)
            if cf_df is not None and not cf_df.empty:
                cf_records = cf_df.to_dict(orient="records")
        except Exception:
            cf_records = []

        if not cf_records:
            for i in range(request.num_counterfactuals):
                cf_records.append(generate_random_counterfactual(original, rng))

        existing_signatures = set()
        for cf in cf_records:
            signature = tuple(sorted((k, str(v)) for k, v in merge_with_defaults(cf).items()))
            existing_signatures.add(signature)

        while len(cf_records) < request.num_counterfactuals:
            candidate = generate_random_counterfactual(original, rng)
            signature = tuple(sorted((k, str(v)) for k, v in candidate.items()))
            if signature not in existing_signatures:
                cf_records.append(candidate)
                existing_signatures.add(signature)

        original_pred = int(mm.predict(dm.transform_input(original))[0][0])
        changed_features = []
        prediction_changed = []
        normalized_cfs = []

        for cf in cf_records:
            normalized = merge_with_defaults(cf)
            normalized_cfs.append(normalized)
            changed = [k for k in dm.feature_names if str(normalized.get(k)) != str(original.get(k))]
            changed_features.append(changed)
            cf_pred = int(mm.predict(dm.transform_input(normalized))[0][0])
            prediction_changed.append(cf_pred != original_pred)

        return success(
            {
                "original": original,
                "counterfactuals": normalized_cfs,
                "changed_features": changed_features,
                "prediction_changed": prediction_changed,
                "summary": "Each alternative changes a small set of dataset-specific features to show how the decision responds under different what-if scenarios.",
            }
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Counterfactual generation failed: {str(exc)}")

@app.get("/fairness")
async def get_fairness_metrics():
    try:
        require_model()
        X, y = dm.get_data_for_training()
        y_pred, _ = mm.predict(X)
        sensitive_attr = infer_sensitive_attr()

        score, bias_details = None, []
        try:
            if cf_engine is not None:
                score, bias_details = fe.compute_counterfactual_fairness(X, sensitive_attr, cf_engine)
        except Exception:
            score, bias_details = None, []

        if score is None or not bias_details:
            fallback = safe_counterfactual_fairness()
            score, bias_details = fallback["score"], fallback["details"]

        fairness = compute_fairness_summary(y, y_pred, dm.df[sensitive_attr])
        biased_individuals = [b for b in bias_details if bool(b.get("bias_flag"))]

        return success(
            {
                "counterfactual_fairness_score": float(score),
                "demographic_parity": fairness["demographic_parity"],
                "equal_opportunity": fairness["equal_opportunity"],
                "biased_individuals": biased_individuals,
                "biased_individuals_count": len(biased_individuals),
                "counterfactual_summary": (
                    f"{len(biased_individuals)} of {len(bias_details)} checked records changed when {sensitive_attr.replace('_', ' ')} changed."
                    if bias_details
                    else "No counterfactual flips were detected in the sampled records."
                ),
                "group_metrics": fairness["group_metrics"],
            }
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Fairness evaluation failed: {str(exc)}")

@app.post("/simulate")
async def run_simulation(request: SimulationRequest):
    try:
        require_model()
        if se is None:
            raise HTTPException(status_code=400, detail="Simulation engine not initialized")

        sensitive_attr = request.sensitive_attribute or infer_sensitive_attr()
        if sensitive_attr not in dm.df.columns:
            raise HTTPException(status_code=400, detail=f"Sensitive attribute '{sensitive_attr}' not found")

        raw_df = dm.get_raw_data().copy().reset_index(drop=True)

        before_X, before_y = dm.get_data_for_training()
        before_pred, _ = mm.predict(before_X)
        before_metrics = compute_fairness_summary(before_y, before_pred, raw_df[sensitive_attr])

        feature_shifts = dict(request.feature_shifts)

        if request.income_shift:
            income_candidates = [c for c in dm.numerical_features if any(t in c.lower() for t in ["income", "hour", "wage", "salary"])]
            if income_candidates:
                feature_shifts.setdefault(income_candidates[0], request.income_shift)
        if request.education_shift:
            numeric_candidates = [c for c in dm.numerical_features if c not in feature_shifts]
            if numeric_candidates:
                feature_shifts.setdefault(numeric_candidates[0], request.education_shift * 10)

        for feature, pct_shift in feature_shifts.items():
            normalized_feature = feature.replace("-", "_")
            if normalized_feature in raw_df.columns and pd.api.types.is_numeric_dtype(raw_df[normalized_feature]):
                raw_df[normalized_feature] = raw_df[normalized_feature] * (1 + (pct_shift / 100.0))

        if request.group_shift != 0 and not pd.api.types.is_numeric_dtype(raw_df[sensitive_attr]):
            counts = raw_df[sensitive_attr].value_counts()
            if len(counts) > 1:
                major_group = counts.index[0]
                minor_group = counts.index[-1]
                from_group = major_group if request.group_shift > 0 else minor_group
                to_group = minor_group if request.group_shift > 0 else major_group
                source_idx = raw_df.index[raw_df[sensitive_attr] == from_group].tolist()
                shift_n = min(len(source_idx), int(abs(request.group_shift) / 100.0 * len(raw_df)))
                if shift_n > 0:
                    picked = np.random.choice(source_idx, size=shift_n, replace=False)
                    raw_df.loc[picked, sensitive_attr] = to_group

        transformed_sim = dm.transform_dataframe(raw_df[dm.feature_names])
        preds, _ = mm.predict(transformed_sim)
        after_metrics = compute_fairness_summary(before_y, preds, raw_df[sensitive_attr])

        before_dp = before_metrics["demographic_parity"]
        after_dp = after_metrics["demographic_parity"]
        timeline = []
        for i in range(8):
            alpha = (i + 1) / 8
            timeline.append({"step": i + 1, "fairness": float(before_dp + (after_dp - before_dp) * alpha)})

        return success(
            {
                "sensitive_attribute": sensitive_attr,
                "feature_shifts": feature_shifts,
                "before": {
                    "demographic_parity": before_metrics["demographic_parity"],
                    "equal_opportunity": before_metrics["equal_opportunity"],
                },
                "after": {
                    "demographic_parity": after_metrics["demographic_parity"],
                    "equal_opportunity": after_metrics["equal_opportunity"],
                },
                "group_metrics": after_metrics["group_metrics"],
                "timeline": timeline,
                "sample_size": int(len(preds)),
            }
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(exc)}")

@app.get("/causal")
async def get_causal_results():
    try:
        require_model()
        if ce is None:
            raise HTTPException(status_code=400, detail="Causal engine not initialized")

        treatment = infer_sensitive_attr()
        outcome = dm.target
        readable_treatment = treatment.replace("_", " ").title()
        readable_outcome = outcome.replace("_", " ").title()

        try:
            results = ce.estimate_effect()
            ate = _safe_float(results.get("ate", 0.0))
            sign = "increases" if ate > 0 else "decreases"
            interpretation = (
                f"Average Treatment Effect (ATE) measures the average change in {readable_outcome} when {readable_treatment} changes. "
                f"Current estimate ({ate:.4f}) suggests treatment typically {sign} the favorable outcome."
            )
        except Exception:
            ate = 0.0
            interpretation = (
                f"ATE captures average causal impact of {readable_treatment} on {readable_outcome}. "
                "DoWhy estimation failed for current assumptions, so a conservative zero effect is shown."
            )

        group_effects = []
        try:
            attr = treatment
            overall_mean_value = pd.to_numeric(dm.processed_df[dm.target], errors="coerce").mean()
            overall_mean = _safe_float(overall_mean_value)
            raw_attr = dm.df[attr]

            if pd.api.types.is_numeric_dtype(raw_attr):
                unique_values = raw_attr.dropna().unique().tolist()
                if len(unique_values) > 8:
                    buckets = pd.qcut(raw_attr.rank(method="first"), q=min(5, len(unique_values)), duplicates="drop")
                    for interval in buckets.cat.categories:
                        mask = buckets.astype(str) == str(interval)
                        subgroup = pd.to_numeric(dm.processed_df.loc[mask, dm.target], errors="coerce")
                        effect = _safe_float(subgroup.mean() - overall_mean) if len(subgroup) else 0.0
                        group_effects.append(
                            {
                                "label": f"{readable_treatment} {interval}",
                                "effect": effect,
                                "explanation": f"Average {readable_outcome.lower()} tendency for records in this range compared with the dataset average.",
                            }
                        )
                else:
                    for val in unique_values[:8]:
                        mask = raw_attr == val
                        subgroup = pd.to_numeric(dm.processed_df.loc[mask, dm.target], errors="coerce")
                        effect = _safe_float(subgroup.mean() - overall_mean) if len(subgroup) else 0.0
                        group_effects.append(
                            {
                                "label": f"{readable_treatment}: {val}",
                                "effect": effect,
                                "explanation": "This subgroup's average outcome compared with the dataset average.",
                            }
                        )
            else:
                for val in raw_attr.dropna().astype(str).unique()[:8]:
                    mask = raw_attr.astype(str) == val
                    subgroup = pd.to_numeric(dm.processed_df.loc[mask, dm.target], errors="coerce")
                    effect = _safe_float(subgroup.mean() - overall_mean) if len(subgroup) else 0.0
                    group_effects.append(
                        {
                            "label": f"{readable_treatment}: {val}",
                            "effect": effect,
                            "explanation": f"Average {readable_outcome.lower()} tendency for this subgroup compared with the dataset average.",
                        }
                    )
        except Exception as exc:
            logger.warning("Causal subgroup breakdown failed: %s", exc)
            group_effects = [
                {
                    "label": "Overall",
                    "effect": ate,
                    "explanation": "Subgroup breakdown could not be computed, so the overall effect is shown instead.",
                }
            ]

        cate = {item["label"]: item["effect"] for item in group_effects}

        notes = [
            f"The ATE value summarizes the overall effect of {readable_treatment} on {readable_outcome}.",
            f"Each CATE bar compares a subgroup against the dataset average. Positive values mean the subgroup trends more favorably than average.",
            "Use the globe labels to spot which subgroups matter most, then read the explanation card for the plain-English interpretation.",
        ]

        return success(
            {
                "ate": ate,
                "cate": cate,
                "group_effects": group_effects,
                "treatment": treatment,
                "outcome": outcome,
                "interpretation": interpretation,
                "notes": notes,
            }
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Causal analysis failed: {str(exc)}")


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_trained": app.state.model is not None,
        "dataset_loaded": app.state.df is not None,
        "n_samples": len(app.state.df) if app.state.df is not None else 0,
        "target_column": app.state.target_column,
        "sensitive_attrs": app.state.sensitive_attrs,
    }


@app.get("/download/example-dataset")
def download_example_dataset():
    if not os.path.exists(DEFAULT_DATASET):
        raise HTTPException(status_code=404, detail="Example dataset not found")
    return FileResponse(DEFAULT_DATASET, media_type="text/csv", filename="adult_sample.csv")


# ==== UPLOAD ENDPOINTS ====

@app.post("/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    target_column: str = Form(...),
    sensitive_attributes: str = Form(...)
):
    """
    Upload a CSV file and store it in app.state for this session.
    Returns metadata about the dataset.
    """
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        # Parse sensitive attributes (comma-separated)
        sensitive_attrs = [s.strip() for s in sensitive_attributes.split(",") if s.strip()]
        
        # Validate that specified columns exist
        missing = [c for c in sensitive_attrs + [target_column] if c not in df.columns]
        if missing:
            raise HTTPException(status_code=400, detail=f"Columns not found: {', '.join(missing)}")
        
        # Store in app.state for this session
        app.state.df = df.copy()
        app.state.target_column = target_column
        app.state.sensitive_attrs = sensitive_attrs
        
        return success({
            "columns": df.columns.tolist(),
            "shape": list(df.shape),
            "dtypes": df.dtypes.astype(str).to_dict(),
            "sample": df.head(5).to_dict(orient="records"),
            "target_distribution": df[target_column].value_counts().to_dict(),
            "missing_values": df.isnull().sum().to_dict()
        })
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@app.get("/columns")
def get_columns():
    """
    Return metadata about columns in the current dataset.
    """
    if not hasattr(app.state, 'df') or app.state.df is None:
        raise HTTPException(status_code=400, detail="No dataset uploaded yet. Call /upload first.")
    
    df = app.state.df
    target = getattr(app.state, 'target_column', None)
    sensitive = getattr(app.state, 'sensitive_attrs', [])

    feature_schema = []
    for col in df.columns:
        if col == target:
            continue
        is_numeric = pd.api.types.is_numeric_dtype(df[col])
        default = float(df[col].median()) if is_numeric else str(df[col].mode(dropna=True).iloc[0])
        options = [] if is_numeric else [str(v) for v in df[col].dropna().astype(str).unique().tolist()[:25]]
        col_min = float(df[col].min()) if is_numeric else None
        col_max = float(df[col].max()) if is_numeric else None
        feature_schema.append(
            {
                "name": col,
                "is_numeric": is_numeric,
                "default": default,
                "options": options,
                "min": col_min,
                "max": col_max,
            }
        )

    return success({
        "all_columns": df.columns.tolist(),
        "numeric_columns": df.select_dtypes(include=['number']).columns.tolist(),
        "categorical_columns": df.select_dtypes(include=['object']).columns.tolist(),
        "current_target": target,
        "current_sensitive": sensitive,
        "feature_schema": feature_schema,
        "sample_row": df.head(1).to_dict(orient="records")[0] if len(df) else {},
    })


# ==== GEMINI AI ENDPOINTS ====

@app.post("/gemini/detect-columns")
async def gemini_detect_columns(file: UploadFile = File(...)):
    """
    Upload CSV and use Gemini to auto-detect target and sensitive columns.
    """
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        # Get first 3 rows as sample
        sample = df.head(3).to_dict(orient="records")
        columns = df.columns.tolist()
        
        # Call Gemini to detect
        result = detect_columns(sample, columns)
        
        # Store preview for later
        app.state.df_preview = df.copy()
        
        return success(result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Column detection failed: {str(e)}")


@app.get("/gemini/fairness-narrative")
def gemini_fairness_narrative():
    """
    Generate AI fairness audit narrative from current metrics.
    """
    try:
        # Get current fairness metrics
        X, y = dm.get_data_for_training()
        y_pred, _ = mm.predict(X)
        sensitive_attr = dm.sensitive_attributes[0] if dm.sensitive_attributes else dm.feature_names[0]
        
        fairness = compute_fairness_summary(y, y_pred, dm.df[sensitive_attr])
        
        metrics = {
            "counterfactual_fairness_score": fairness.get("demographic_parity", 0),
            "demographic_parity": fairness.get("demographic_parity", 0),
            "equal_opportunity": fairness.get("equal_opportunity", 0),
            "biased_individuals_count": 0,
            "ate": 0.0
        }
        sensitive = getattr(app.state, 'sensitive_attrs', dm.sensitive_attributes)
        domain = getattr(app.state, 'domain', 'general')
        
        narrative = generate_fairness_narrative(metrics, sensitive, domain)
        return success({"narrative": narrative})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Narrative generation failed: {str(e)}")


@app.post("/gemini/explain-counterfactual")
def gemini_explain_cf(body: dict):
    """
    Explain a counterfactual change using Gemini.
    """
    try:
        explanation = explain_counterfactual(
            body.get("original", {}),
            body.get("counterfactual", {}),
            body.get("prediction_changed", False),
            body.get("changed_features", [])
        )
        return success({"explanation": explanation})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"CF explanation failed: {str(e)}")


@app.post("/gemini/simulation-story")
def gemini_simulation_story(body: dict):
    """
    Generate a policy brief from simulation results.
    """
    try:
        story = generate_simulation_story(
            body.get("params", {}),
            body.get("before_metrics", {}),
            body.get("after_metrics", {})
        )
        return success({"story": story})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation story failed: {str(e)}")


@app.get("/gemini/policy-recommendations")
def gemini_policy_recommendations():
    """
    Generate policy recommendations using Gemini.
    """
    try:
        X, y = dm.get_data_for_training()
        y_pred, _ = mm.predict(X)
        sensitive_attr = dm.sensitive_attributes[0] if dm.sensitive_attributes else dm.feature_names[0]
        
        fairness = compute_fairness_summary(y, y_pred, dm.df[sensitive_attr])
        
        metrics = {
            "counterfactual_fairness_score": fairness.get("demographic_parity", 0),
            "demographic_parity": fairness.get("demographic_parity", 0),
            "equal_opportunity": fairness.get("equal_opportunity", 0),
            "biased_individuals_count": 0,
            "ate": 0.0
        }
        sensitive = getattr(app.state, 'sensitive_attrs', dm.sensitive_attributes)
        domain = getattr(app.state, 'domain', 'general')
        
        recommendations = generate_policy_recommendations(metrics, domain, sensitive)
        return success({"recommendations": recommendations})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation generation failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
