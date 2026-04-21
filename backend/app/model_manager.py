try:
    import xgboost as xgb
    HAS_XGB = True
except Exception:
    import logging
    logging.warning("XGBoost could not be loaded (likely missing libomp on Mac). Falling back to Logistic Regression.")
    HAS_XGB = False

from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import pickle
import os

class ModelManager:
    def __init__(self):
        self.model = None
        self.feature_names = []

    def train(self, X, y):
        self.feature_names = X.columns.tolist()
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        if HAS_XGB:
            self.model = xgb.XGBClassifier(use_label_encoder=False, eval_metric='logloss')
        else:
            self.model = LogisticRegression(max_iter=1000)
            
        self.model.fit(X_train, y_train)
        
        y_pred = self.model.predict(X_test)
        metrics = {
            "accuracy": accuracy_score(y_test, y_pred),
            "report": classification_report(y_test, y_pred, output_dict=True)
        }
        return metrics

    def predict(self, X):
        if self.model is None:
            raise ValueError("Model not trained yet.")
        return self.model.predict(X), self.model.predict_proba(X)

    def save_model(self, path):
        with open(path, 'wb') as f:
            pickle.dump({'model': self.model, 'feature_names': self.feature_names}, f)

    def load_model(self, path):
        with open(path, 'rb') as f:
            data = pickle.load(f)
            self.model = data['model']
            self.feature_names = data['feature_names']
            
    def get_model(self):
        return self.model
