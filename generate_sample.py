import pandas as pd
import numpy as np

def generate_sample_csv(n=1000):
    np.random.seed(42)
    gender = np.random.choice(['Male', 'Female'], n)
    race = np.random.choice(['White', 'Black', 'Other'], n)
    age = np.random.randint(18, 70, n)
    education = np.random.choice(['Highschool', 'Bachelors', 'Masters', 'PhD'], n)
    hours_per_week = np.random.randint(20, 60, n)
    
    # Biased income generation
    income_val = (age * 500.0) + (hours_per_week * 200.0)
    income_val += np.where(gender == 'Male', 5000.0, 0.0) # Gender bias
    income_val += np.where(race == 'White', 3000.0, 0.0) # Race bias
    income_val += np.random.normal(0, 5000, n)
    
    income = (income_val > 45000).astype(int)
    
    df = pd.DataFrame({
        'age': age,
        'gender': gender,
        'race': race,
        'education': education,
        'hours_per_week': hours_per_week,
        'income': income
    })
    
    df.to_csv('sample_dataset.csv', index=False)
    print("Generated sample_dataset.csv")

if __name__ == "__main__":
    generate_sample_csv()
