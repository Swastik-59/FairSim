# FairSim: The Stealth-Luxe Fairness Audit Engine

> [!IMPORTANT]
> **DATA PRIVACY NOTICE**: Never push raw datasets (`.csv`), virtual environments (`.venv`), or environment secrets (`.env`) to public repositories. These are excluded by default in the system `.gitignore`.

**FairSim** is an industrial-grade, full-stack AI auditing platform designed to surface hidden structural bias using **Causal Inference**, **Counterfactual Simulations**, and **Stochastic Distribution Shifting**. 

Built for high-stakes environments (Finance, Healthcare, Legal), FairSim moves beyond basic "Selection Rate" charts to evaluate the **structural integrity** of AI decision-making.

---

## 💎 Core Architecture

### 1. Causal Manifold Theory (`causal_engine.py`)
Unlike standard audits that confuse correlation with causation, FairSim utilizes **Structural Equation Modeling (SEM)** via the `DoWhy` library.
*   **Identification**: Automatically discovers backdoor paths and confounding vectors.
*   **Isolation**: Calculates the **Average Treatment Effect (ATE)** to isolate the pure causal impact of protected attributes (Race, Gender).
*   **Verification**: Proves whether a disparity is a result of model bias or explained by structural variables in the data.

### 2. Counterfactual "What-If" Probes (`cf_engine.py`)
Powered by `DiCE` (Diverse Counterfactual Explanations), FairSim allows you to probe the manifold for individual outcomes.
*   **Parallel Realities**: For any rejected candidate, find the *minimal* change required to flip the outcome.
*   **Robustness Scoring**: Measure the global "Counterfactual Fairness Score" — the percentage of individuals whose outcome remains stable across protected group transformations.

### 3. Simulation & Distribution Shift (`simulation_engine.py`)
A forward-looking stress-test engine for models in a changing world.
*   **Stochastic Warping**: Simulate changes in applicant demographics or economic conditions.
*   **Feature Multipliers**: Adjust numerical vectors (e.g., "What if interest rates rise by 2%?") to see the impact on fairness metrics in real-time.
*   **Robustness Evaluation**: Predict how your model’s fairness will degrade before it happens in production.

---

## 🛠 Tech Stack

*   **Backend**: FastAPI, XGBoost, DiCE, DoWhy, EconML
*   **Frontend**: React, Vite, TypeScript, Tailwind CSS, Framer Motion
*   **Visuals**: High-blur Glassmorphism, Responsive Area Charts (Recharts), Lucide Icons
*   **Data**: Pandas, Scikit-learn, NumPy

---

## 📦 Rapid Deployment

### 1. Backend Initialization
```bash
cd backend
pip install -r requirements.txt
python main.py
```

### 2. Dashboard Activation
```bash
cd frontend
npm install
npm run dev
```

### 3. Dataset Generation
```bash
python generate_sample.py
```
This generates `sample_dataset.csv`. Upload this file via the **System Initiation** screen to calibrate the engine.

---

## 🎯 Usage Protocol

1.  **Inject Data**: Upload CSV and define `target` and `sensitive_attributes`.
2.  **Probe Inference**: Use the **Inference Probe** to test individual entries and see parallel counterfactual states.
3.  **Audit Disparity**: Review the **Strategic Audit Layer** for global demographic parity and selection velocity.
4.  **Execute Simulation**: Adjust **Economic Vectors** and **Group Volatility** sliders to project future performance.
5.  **Analyze Logic**: Review the **Identifiability Layer** to see the true causal ATE.

---
*Created for Advanced Agentic AI Auditing.*
