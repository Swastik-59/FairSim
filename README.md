# FairSim

FairSim is a full-stack fairness analysis and simulation platform for tabular ML systems. It combines model training, prediction, counterfactual analysis, fairness metrics, causal inference, and Gemini-assisted explanations in one workflow.

The goal of the project is to help teams answer practical questions such as:

- Is the model treating sensitive groups differently?
- Would the prediction change if a sensitive attribute changed?
- How do fairness metrics move under simulated policy shifts?
- What does the causal signal say about the relationship between a sensitive attribute and the outcome?

## Current Status

The project is currently implemented as a working local development stack with:

- A FastAPI backend for upload, preprocessing, training, prediction, fairness, counterfactuals, simulation, and causal analysis
- A Next.js 14 frontend with dedicated views for the dashboard, upload flow, prediction, fairness, counterfactuals, simulation, and causal analysis
- Gemini-powered narrative features for fairness summaries, counterfactual explanations, simulation stories, and policy recommendations
- A bundled sample dataset so the app can be explored without preparing a custom CSV first

What is already in place:

- Dataset upload and schema inspection
- Model training with persisted backend state
- Prediction and counterfactual generation
- Fairness metrics and subgroup reporting
- Distribution-shift simulation
- Causal effect estimation with ATE/CATE outputs
- AI-generated explanations and recommendations

How the current flow works:

1. Upload a CSV dataset and identify the target column plus one or more sensitive attributes.
2. Train the backend model on the uploaded dataset.
3. Use prediction, counterfactual, fairness, simulation, and causal endpoints against that trained state.
4. Present the results in the Next.js dashboard and dedicated analysis pages.

Current implementation notes:

- The backend keeps its working dataset and trained model in process state during a session.
- The causal endpoint returns a safe JSON payload even when the estimator produces non-finite values.
- Several AI-generated outputs depend on a configured Gemini API key, but the non-AI core workflow still runs without it.
- Three.js-based visuals are intended to stay client-side inside the App Router.

## Key Features

### Dataset Upload and Preparation

- Upload a CSV dataset and define the target column plus sensitive attributes
- Preview dataset columns, types, sample rows, and missing-value counts
- Automatically preprocess categorical and numerical data for model training
- Use the bundled Adult sample dataset as a starting point
- Validate that the chosen target and sensitive columns exist before training begins
- Preserve the original CSV values for downstream inspection while preparing an encoded training frame internally

### Model Training and Prediction

- Train a tabular classifier on the uploaded dataset
- Persist the trained model in the backend workspace
- Run predictions with default-value fallbacks for partially specified feature inputs
- Return both numeric predictions and human-readable labels
- Produce a probability score alongside the predicted class
- Include a short prediction summary that the frontend can surface directly
- Save the trained model after successful training so later requests can reuse it

### Counterfactual Analysis

- Generate alternative records that preserve most of the original features
- Compare original and counterfactual predictions
- Highlight which feature changes are associated with a different decision
- Provide explanation text for downstream UI and Gemini prompts
- Fall back to randomized counterfactual candidates if the local DiCE generation path is unavailable
- Return the original record, the generated counterfactual set, changed feature lists, and prediction flip flags
- Use the output both for UI comparison cards and for narrative explanations

### Fairness Evaluation

- Counterfactual fairness scoring
- Demographic parity and equal opportunity summaries
- Biased-individual detection for case-by-case review
- Group-level metrics for dashboard visualizations
- Return both aggregate fairness scores and the list of flagged individuals
- Support subgroup comparisons so the UI can show where the model behaves differently across groups
- Provide a compact fairness summary string for the dashboard and AI narrative layers

### Simulation and Causal Analysis

- Simulate distribution shifts across sensitive groups and numeric features
- Recompute fairness metrics after each simulated shift
- Estimate ATE and subgroup-level causal effects with DoWhy
- Surface causal results in a format that can be used directly by the frontend
- Support both explicit feature shifts and higher-level group shift adjustments
- Generate an 8-step fairness timeline so the UI can show change over the simulated progression
- Provide subgroup effects in a label-to-value mapping for chart rendering

### Gemini Assistance

- Column detection for uploaded CSV files
- Plain-English fairness narratives
- Counterfactual explanations
- Simulation policy stories
- Policy recommendation generation
- Designed to translate the technical metrics into stakeholder-friendly language
- Helpful for reports, demos, and non-technical review workflows

## Tech Stack

### Backend

- FastAPI
- Uvicorn
- pandas
- numpy
- scikit-learn
- XGBoost
- DoWhy
- DiCE
- Google Generative AI

### Frontend

- Next.js 14 App Router
- React 18
- TypeScript
- Tailwind CSS
- Framer Motion
- Recharts
- Three.js with React Three Fiber and Drei
- Radix UI components

## Project Structure

```text
FairSim/
├── backend/
│   ├── main.py                # FastAPI application and API routes
│   ├── gemini_service.py      # Gemini integrations
│   ├── app/
│   │   ├── data_manager.py    # CSV loading, preprocessing, encoding
│   │   ├── model_manager.py   # Model training and inference
│   │   ├── cf_engine.py       # Counterfactual generation helpers
│   │   ├── fairness_engine.py # Fairness metrics and subgroup logic
│   │   ├── causal_engine.py   # Causal inference with DoWhy
│   │   └── simulation_engine.py
│   └── data/
│       └── adult_sample.csv   # Bundled example dataset
├── frontend/
│   ├── src/app/
│   │   ├── page.tsx           # Landing page
│   │   ├── dashboard/         # Summary dashboard
│   │   ├── upload/            # Dataset upload flow
│   │   ├── predict/           # Prediction UI
│   │   ├── counterfactual/    # Counterfactual analysis UI
│   │   ├── fairness/          # Fairness metrics UI
│   │   ├── simulate/          # Simulation UI
│   │   └── causal/            # Causal analysis UI
│   ├── src/components/        # UI, charts, layout, AI, and 3D components
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Python 3.12+ recommended
- Node.js 18+
- A Gemini API key if you want the AI narration features

Recommended setup files:

- `backend/.env` for backend secrets and API keys
- `frontend/.env.local` for frontend runtime configuration, if needed

### Backend Setup

```bash
cd backend

python -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt

cp .env.example .env
# Set GEMINI_API_KEY in .env

uvicorn main:app --reload --port 8000
```

Backend runs at `http://localhost:8000`.

If you do not want Gemini features, you can still run the core product as long as the backend dependencies are installed and the sample or uploaded dataset is available.

### Frontend Setup

```bash
cd frontend

npm install
npm run dev
```

Frontend runs at `http://localhost:3000`.

If the frontend cannot reach the backend, verify that the API URL points to the backend server and that CORS is allowed for the local origin.

### Typical Workflow

1. Open the frontend in your browser.
2. Upload a CSV dataset or use the sample dataset.
3. Confirm the target column and sensitive attributes.
4. Train the model.
5. Review prediction, fairness, counterfactual, simulation, and causal results.

For a first smoke test, the bundled Adult sample dataset is the fastest path because it already matches the backend's expected tabular format.

## How The Analysis Chain Works

The project is organized as a sequential analysis pipeline:

- `upload` stores the dataset and metadata for the session.
- `train` preprocesses the data and builds the classifier.
- `predict` runs the model against a feature payload.
- `counterfactual` generates what-if alternatives and checks whether the prediction flips.
- `fairness` aggregates fairness metrics and flags individuals whose outcomes are sensitive to attribute changes.
- `simulate` applies controlled shifts to the dataset and recomputes fairness under the modified distribution.
- `causal` estimates the causal effect of the sensitive attribute on the target outcome.

This ordering matters because later steps depend on the trained model and the dataset state created earlier in the flow.

## API Reference

All backend responses use a standard envelope:

```json
{
  "status": "success",
  "data": {}
}
```

Errors use:

```json
{
  "status": "error",
  "message": "Readable error message"
}
```

### Core Endpoints

| Endpoint | Method | Purpose |
|---|---:|---|
| `/health` | GET | Check backend status and loaded state |
| `/upload` | POST | Upload a CSV and register target/sensitive columns |
| `/columns` | GET | Inspect the current dataset schema |
| `/train` | POST | Train the model on the uploaded dataset |
| `/predict` | POST | Run a prediction for a feature payload |
| `/counterfactual` | POST | Generate counterfactual examples |
| `/fairness` | GET | Compute fairness metrics and biased cases |
| `/simulate` | POST | Simulate distribution shifts and recompute fairness |
| `/causal` | GET | Estimate causal effects for the sensitive attribute |
| `/download/example-dataset` | GET | Download the bundled sample dataset |

Endpoint notes:

- `/upload` expects a CSV file plus form fields for `target_column` and `sensitive_attributes`.
- `/train` uses the uploaded session dataset and stores the trained model in memory and on disk.
- `/predict` accepts a partial feature payload and fills missing values from dataset defaults.
- `/counterfactual` accepts `num_counterfactuals` and returns both generated alternatives and change annotations.
- `/fairness` reports aggregate fairness scores plus individual bias flags.
- `/simulate` accepts distribution-shift parameters and returns before/after metrics plus a fairness timeline.
- `/causal` returns `ate`, `cate`, `group_effects`, and explanatory notes for the analysis view.

### Gemini Endpoints

| Endpoint | Method | Purpose |
|---|---:|---|
| `/gemini/detect-columns` | POST | Detect target and sensitive columns from an uploaded CSV |
| `/gemini/fairness-narrative` | GET | Generate a plain-English fairness summary |
| `/gemini/explain-counterfactual` | POST | Explain why a counterfactual changed the result |
| `/gemini/simulation-story` | POST | Generate a policy-style simulation narrative |
| `/gemini/policy-recommendations` | GET | Produce ranked mitigation recommendations |

These endpoints are optional from a system standpoint, but they add the narrative layer that makes the results easier to present to non-technical stakeholders.

## Configuration

The following settings are the most important when running the project locally:

| Variable | Where | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | Backend `.env` | Enables Gemini-powered narratives and recommendations |
| Backend host/port | Backend startup command | Controls where the API is served locally |
| Frontend API base URL | Frontend env file, if used | Points the UI to the FastAPI backend |

If you customize the host or port, update the frontend to match so the analysis pages can reach the API.

## Development Notes

- The backend expects a trained model before prediction, fairness, counterfactual, simulation, or causal endpoints can be used.
- The frontend is built with the Next.js App Router, so each page lives under `frontend/src/app`.
- Three.js-based components should remain client-side only to avoid server-side rendering issues in the App Router.
- The sample dataset in `backend/data/adult_sample.csv` is useful for quick demos and smoke testing.
- The backend currently keeps state in memory, so restarting the server resets the uploaded dataset and trained model.
- The project is most useful for structured tabular datasets where a single outcome column can be clearly identified.
- If you see `nan` values in causal output, the backend now sanitizes them before serialization.

## Deployment

### Frontend

```bash
cd frontend
npm run build
```

Deploy the built app to your preferred Next.js hosting platform, such as Vercel.

### Backend

Deploy `backend/main.py` with your ASGI host of choice and ensure the environment includes `GEMINI_API_KEY` when Gemini features are enabled.

## Contributing

Contributions are welcome. Good areas for future work include:

- Additional fairness metrics and subgroup views
- Exportable reports and downloadable artifacts
- Expanded simulation controls
- More dataset examples and validation helpers
- End-to-end tests for the upload-to-analysis workflow
- Stronger persistence for trained models and uploaded session state
- Per-page loading and error states in the frontend analysis views
- More configurable causal assumptions and sensitivity analysis

## License

MIT
