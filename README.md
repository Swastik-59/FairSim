# 🔮 FairSim — Counterfactual Fairness Simulation Engine

> **"What happens to fairness if we change the world?"**

FairSim goes beyond detecting bias — it *simulates alternate realities* to show how AI decisions would change if sensitive factors (gender, race, age) were different. Built for the intersection of causal AI, counterfactual reasoning, and real-world policy impact.

**Powered by:**
- 🤖 **Google Gemini 2.5 Flash** for AI-generated fairness audits, policy recommendations, and bias explanations
- 🔁 **DiCE** (Diverse Counterfactual Explanations) for generating "what-if" scenarios
- 🧠 **DoWhy** for causal inference and treatment effect estimation
- 📊 **XGBoost** for fast, interpretable predictions
- 🎨 **Next.js 14** with Tailwind CSS, Framer Motion, and Three.js for stunning visualizations

---

## ✨ What Makes FairSim Different

| Traditional Bias Tools | FairSim |
|---|---|
| Check if model is biased | Simulate alternate realities |
| Group-level statistics | Individual-level bias detection |
| Correlation-based | Causal inference (DoWhy) |
| Static metrics | Interactive simulation engine |
| Manual analysis | **AI-narrated audit (Gemini)** |
| Limited datasets | **Upload ANY CSV** |

---

## 🚀 Core Features

### 1. 📂 **Upload Any Dataset**
Drop any CSV — loan approvals, hiring records, credit scoring, healthcare decisions. 
- 🤖 Gemini AI auto-detects your target column and sensitive attributes
- 📋 Automatic categorical encoding and missing value imputation
- 🎯 Support for any number of columns and data types

### 2. 🤖 **Gemini-Powered Intelligence**
- **Smart Column Detection**: Auto-identifies sensitive attributes and outcome variable with reasoning
- **AI Fairness Audit**: Plain-English interpretation of all bias metrics for non-technical stakeholders
- **Counterfactual Explainer**: "Why did the prediction flip? Is that fair?"
- **Policy Recommendations**: 5 actionable interventions ranked by priority and timeframe
- **Simulation Story Mode**: Policy brief narrating what-if scenarios for policymakers

### 3. 🔁 **Counterfactual Engine**
*"If this same person had a different gender, would they still get approved?"*
- Generates N counterfactuals per individual using DiCE
- Keeps all features constant except sensitive attributes
- Shows exactly which features caused prediction changes
- Visual diff cards highlighting changed values
- Prediction flip detection (⚠️ bias indicator)

### 4. ⚖️ **Fairness Engine**
- **Counterfactual Fairness Score**: % of cases where sensitive attribute change flips decision
- **Demographic Parity**: Fairness across groups (0=perfect, 1=disparate)
- **Equal Opportunity**: Equal false negative rates across demographics
- **Individual-level bias flagging**: Red-flag cases for manual review
- **Visual bias heatmap**: Color-coded fairness across demographic groups

### 5. 📊 **Interactive Simulation Dashboard**
- **3 Real-time Sliders**: Adjust female applicant %, income distribution, education levels
- **Live fairness recomputation**: Metrics update as you slide
- **Gemini Policy Brief**: AI narrates what your simulation means for policy
- **Before/after comparison**: See impact of your interventions

### 6. 🧠 **Causal Inference Module**
Uses DoWhy causal graphs to estimate:
- **ATE** (Average Treatment Effect) of sensitive attributes on outcomes
- **CATE** (Conditional Treatment Effect) across subgroups
- 3D FairnessGlobe visualization of causal effects

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| **UI/Animation** | Framer Motion, Radix UI, Recharts, Three.js |
| **Backend** | FastAPI (Python) + Uvicorn |
| **ML Model** | XGBoost + scikit-learn (with LogisticRegression fallback) |
| **Counterfactuals** | DiCE (dice-ml) |
| **Causal Inference** | DoWhy + EconML |
| **AI Intelligence** | Google Generative AI (Gemini 2.5 Flash) |
| **3D Graphics** | @react-three/fiber + @react-three/drei |
| **Data Processing** | pandas, numpy |

---

## ⚡ Quick Start

### Prerequisites
- **Python 3.9+**
- **Node.js 18+**
- **Google AI Studio API key** (free at [aistudio.google.com](https://aistudio.google.com))

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY from aistudio.google.com

# Start backend
uvicorn main:app --reload --port 8000
```

✅ Backend running on `http://localhost:8000`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:8000 (already set)

# Start development server
npm run dev
```

✅ Frontend running on `http://localhost:3000`

### 3. First Steps
1. Open http://localhost:3000 in your browser
2. You'll be prompted to upload a CSV dataset
3. Gemini will auto-detect your target column and sensitive attributes
4. Click "Train Model" to begin
5. Explore the fairness, simulation, and causal inference dashboards

---

## 📁 Project Structure

```
FairSim/
├── backend/
│   ├── main.py                    # FastAPI app + all endpoints
│   ├── gemini_service.py          # Gemini AI integration
│   ├── app/
│   │   ├── data_manager.py        # CSV parsing, encoding, preprocessing
│   │   ├── model_manager.py       # XGBoost training & inference
│   │   ├── cf_engine.py           # DiCE counterfactual generator
│   │   ├── fairness_engine.py     # Fairness metrics computation
│   │   ├── causal_engine.py       # DoWhy causal inference
│   │   └── simulation_engine.py   # Distribution shift simulator
│   ├── data/
│   │   └── adult_sample.csv       # Example UCI Adult Income dataset
│   ├── .env.example               # Template for environment variables
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── app/                   # Next.js App Router pages
│   │   │   ├── page.tsx           # 🏠 Landing page with hero scene
│   │   │   ├── dashboard/         # 📊 Metrics & analytics
│   │   │   ├── predict/           # 🔮 Make predictions
│   │   │   ├── counterfactual/    # 🔁 Generate counterfactuals
│   │   │   ├── fairness/          # ⚖️ Fairness audit
│   │   │   ├── simulate/          # 📈 Interactive simulation
│   │   │   ├── causal/            # 🧠 Causal analysis
│   │   │   └── upload/            # 📂 Upload datasets
│   │   │
│   │   ├── components/
│   │   │   ├── layout/            # Navbar, Sidebar, AppShell
│   │   │   ├── ui/                # Base UI primitives (GlassCard, GlowButton, etc.)
│   │   │   ├── charts/            # Recharts components
│   │   │   ├── three/             # Three.js 3D components
│   │   │   ├── upload/
│   │   │   │   └── SmartUploader.tsx  # Multi-step CSV upload wizard
│   │   │   └── gemini/            # AI-powered components
│   │   │       ├── FairnessNarrative.tsx
│   │   │       ├── PolicyRecommendations.tsx
│   │   │       ├── CounterfactualExplainer.tsx
│   │   │       └── SimulationStory.tsx
│   │   │
│   │   └── lib/
│   │       ├── api.ts             # API client with Axios
│   │       ├── types.ts           # TypeScript interfaces
│   │       └── utils.ts           # Utility functions
│   │
│   ├── tailwind.config.ts         # Custom dark theme
│   ├── next.config.mjs            # Next.js configuration
│   ├── tsconfig.json              # TypeScript config
│   ├── package.json               # Dependencies + scripts
│   └── .env.local                 # Frontend environment (localhost:8000)
│
└── README.md                       # This file
```

---

## 🎯 Example Use Cases

### 💰 **Loan Approval System**
Upload bank loan data → Detect if approved/rejected (target) and gender/race (sensitive).
- 📊 See what % of applicants would flip decisions if gender changed
- 🤖 Get Gemini-powered policy brief on discrimination risk
- 💡 5 prioritized recommendations to reduce lending discrimination

### 👔 **Hiring System**
Upload HR records (education, experience, demographics, hired/rejected).
- 🔍 Individual audit: Does this person face bias?
- 🔁 Counterfactuals: Would they be hired with different background?
- 📋 Policy recommendations: Blind resume review, diverse hiring panels, etc.

### 🏥 **Healthcare Treatment Allocation**
Upload patient data (age, comorbidities, demographics, treatment approved/denied).
- ⚖️ Check for racial/age disparities in treatment eligibility
- 🧠 Causal analysis: Is age *causing* lower treatment rates, or just correlated?
- 📊 Simulate impact of age-blind criteria

### 💳 **Credit Scoring**
Upload credit bureau data with approvals and demographics.
- 📈 Fairness simulation: What if we remove hard-to-verify features?
- 🤖 Gemini audit explains why demographics matter to your model
- 💡 Get specific actions: fairness constraints, retraining strategies

---

## 🔑 API Reference

### Data Management

| Endpoint | Method | Description |
|---|---|---|
| `/health` | GET | Health check; returns `model_loaded` status |
| `/upload` | POST | Upload CSV dataset; auto-detect columns via Gemini |
| `/columns` | GET | Get metadata about current dataset columns |
| `/train` | POST | Train XGBoost model on uploaded (or default) dataset |

### Predictions & Explanations

| Endpoint | Method | Description |
|---|---|---|
| `/predict` | POST | Predict outcome for given feature values |
| `/counterfactual` | POST | Generate N counterfactuals; identify bias via prediction flips |

### Fairness Analysis

| Endpoint | Method | Description |
|---|---|---|
| `/fairness` | GET | Compute counterfactual fairness score, demographic parity, equal opportunity, biased individuals |
| `/simulate` | POST | Run distribution shift simulation; recompute fairness under different conditions |
| `/causal` | GET | Estimate average treatment effect (ATE) and conditional treatment effect (CATE) |

### Gemini AI Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/gemini/detect-columns` | POST | Upload CSV → Gemini detects target + sensitive attributes + domain |
| `/gemini/fairness-narrative` | GET | Generate plain-English fairness audit (3 paragraphs) |
| `/gemini/explain-counterfactual` | POST | Explain why a counterfactual changed the prediction |
| `/gemini/simulation-story` | POST | Write policy brief from simulation before/after metrics |
| `/gemini/policy-recommendations` | GET | Generate 5 prioritized recommendations to reduce bias |

### Response Format

All endpoints return standardized JSON envelopes:

**Success:**
```json
{
  "status": "success",
  "data": { ...endpoint-specific data... }
}
```

**Error:**
```json
{
  "status": "error",
  "message": "Error description"
}
```

---

## 🚀 Deployment

### Frontend (Vercel)
```bash
# Build for production
npm run build

# Deploy to Vercel
vercel deploy --prod
```

### Backend (Railway, Heroku, etc.)
```bash
# Set GEMINI_API_KEY environment variable
# Push to your hosting platform
git push heroku main
```

---

## 📄 License

MIT — Use freely for research, education, and nonprofit purposes.

---

## 🤝 Contributing

Found a bug? Want to add bonus features? Issues and PRs welcome!

### Bonus Features (Future Enhancements)

- 🔥 **Bias Heatmap**: 2D heatmap showing fairness intensity across demographic groups
- ⏱️ **Fairness Timeline**: Line chart showing fairness improvement over retraining cycles
- 🔍 **Individual Audit Mode**: Automatic counterfactual + fairness verdict for any individual
- 📊 **Dataset Comparison**: Upload 2 datasets, compare fairness side-by-side
- 📄 **PDF Export**: Download full fairness report as PDF (backend `/export/report`)

---

## 🙏 Acknowledgments

Built at the intersection of:
- **Counterfactual Fairness** ([Kusner et al., 2017](https://arxiv.org/abs/1705.08563))
- **Diverse Counterfactual Explanations** ([Mothilal et al., 2021](https://arxiv.org/abs/1912.08045))
- **Causal Inference** ([Pearl, 2000](https://www.amazon.com/Causality-Reasoning-Inference-Judea-Pearl/dp/0521895685))

Special thanks to Google Generative AI team for Gemini API access.

---

## 💬 Questions?

- **API Issues?** Check `/health` endpoint
- **Training fails?** Ensure CSV has target column + numeric/categorical features
- **Gemini not working?** Verify `GEMINI_API_KEY` in `.env`
- **Frontend crashes?** Check browser console for errors; ensure backend is running

**Get your free Gemini API key:** https://aistudio.google.com

**Happy auditing! 🔮⚖️**
