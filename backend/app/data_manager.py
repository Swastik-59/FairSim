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
        
        # Encode categorical variables
        for col in self.categorical_features:
            le = LabelEncoder()
            self.processed_df[col] = le.fit_transform(self.processed_df[col].astype(str))
            self.label_encoders[col] = le
            
        # Standardize numerical features
        if self.numerical_features:
            self.processed_df[self.numerical_features] = self.scaler.fit_transform(self.processed_df[self.numerical_features])

    def get_data_for_training(self):
        X = self.processed_df[self.feature_names]
        y = self.processed_df[self.target]
        return X, y

    def get_raw_data(self):
        return self.df

    def get_processed_data(self):
        return self.processed_df

    def transform_input(self, input_data: Dict[str, Any]):
        input_df = pd.DataFrame([input_data])
        for col, le in self.label_encoders.items():
            if col in input_df.columns:
                input_df[col] = le.transform(input_df[col].astype(str))
        
        if self.numerical_features:
            input_df[self.numerical_features] = self.scaler.transform(input_df[self.numerical_features])
            
        return input_df
