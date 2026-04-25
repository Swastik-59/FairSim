import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
from typing import List, Dict, Any, Optional
import os

class DataManager:
    def __init__(self):
        self.df = None
        self.processed_df = None
        self.target = None
        self.sensitive_attributes = []
        self.feature_names = []
        self.categorical_features = []
        self.numerical_features = []
        self.label_encoders = {}
        self.scaler = StandardScaler()
        self.feature_defaults = {}

    def load_dataset(self, file_path_or_df: Any, target: str, sensitive_attributes: List[str]):
        if isinstance(file_path_or_df, str):
            if file_path_or_df.endswith('.csv'):
                self.df = pd.read_csv(file_path_or_df)
            else:
                raise ValueError("Unsupported file format. Please provide a CSV file.")
        elif isinstance(file_path_or_df, pd.DataFrame):
            self.df = file_path_or_df
        else:
            raise ValueError("Invalid input. Provide a file path or a pandas DataFrame.")

        self.target = target
        self.sensitive_attributes = sensitive_attributes
        self._identify_features()
        self._preprocess()

    def _identify_features(self):
        self.feature_names = [col for col in self.df.columns if col != self.target]
        self.categorical_features = self.df[self.feature_names].select_dtypes(include=['object', 'category']).columns.tolist()
        self.numerical_features = self.df[self.feature_names].select_dtypes(include=['number', 'float', 'int']).columns.tolist()

    def _preprocess(self):
        self.processed_df = self.df.copy()

        self.feature_defaults = {}
        for col in self.feature_names:
            if pd.api.types.is_numeric_dtype(self.df[col]):
                self.feature_defaults[col] = float(self.df[col].median())
            else:
                mode = self.df[col].mode(dropna=True)
                self.feature_defaults[col] = str(mode.iloc[0]) if not mode.empty else ""
        
        # Encode categorical variables
        for col in self.categorical_features:
            le = LabelEncoder()
            self.processed_df[col] = self.processed_df[col].fillna("Unknown").astype(str)
            self.processed_df[col] = le.fit_transform(self.processed_df[col])
            self.label_encoders[col] = le

        for col in self.numerical_features:
            self.processed_df[col] = pd.to_numeric(self.processed_df[col], errors="coerce")
            self.processed_df[col] = self.processed_df[col].fillna(float(self.feature_defaults.get(col, 0.0)))
            
        # Standardize numerical features
        if self.numerical_features:
            self.processed_df[self.numerical_features] = self.scaler.fit_transform(self.processed_df[self.numerical_features])

    def _normalize_feature_dict(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        normalized = {}
        for key, value in input_data.items():
            normalized[key] = value
            normalized[key.replace("-", "_")] = value

        result = {}
        for col in self.feature_names:
            result[col] = normalized.get(col, self.feature_defaults.get(col))
        return result

    def transform_dataframe(self, input_df: pd.DataFrame) -> pd.DataFrame:
        working = input_df.copy()

        for col in self.feature_names:
            if col not in working.columns:
                working[col] = self.feature_defaults.get(col)

        working = working[self.feature_names]

        for col, le in self.label_encoders.items():
            if col in working.columns:
                classes = set(str(c) for c in le.classes_)
                fallback = str(le.classes_[0]) if len(le.classes_) else ""
                values = []
                for raw in working[col].astype(str).tolist():
                    values.append(raw if raw in classes else fallback)
                working[col] = le.transform(values)

        for col in self.numerical_features:
            if col in working.columns:
                working[col] = pd.to_numeric(working[col], errors="coerce")
                working[col] = working[col].fillna(float(self.feature_defaults.get(col, 0.0)))

        if self.numerical_features:
            working[self.numerical_features] = self.scaler.transform(working[self.numerical_features])

        return working

    def get_data_for_training(self):
        X = self.processed_df[self.feature_names]
        y = self.processed_df[self.target]
        return X, y

    def get_raw_data(self):
        return self.df

    def get_processed_data(self):
        return self.processed_df

    def transform_input(self, input_data: Dict[str, Any]):
        normalized = self._normalize_feature_dict(input_data)
        return self.transform_dataframe(pd.DataFrame([normalized]))
