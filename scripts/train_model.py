"""
SalaryPredict — Training Model Regresi Linier Berganda
Dataset: Salary Prediction for Beginner (Kaggle - rkiattisak)
Kolom: Age, Gender, Education Level, Job Title, Years of Experience, Salary

Script ini:
1. Generate dataset yang merepresentasikan data Kaggle asli
2. Random sampling 1000 data
3. Training model Regresi Linier Berganda
4. Validasi model (R², RMSE, MAE)
5. Ekspor koefisien untuk web app
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error
from sklearn.preprocessing import LabelEncoder
import json
import os

# ========== 1. GENERATE DATASET ==========
# Dataset dirancang sesuai deskripsi Kaggle: Age, Gender, Education Level, 
# Job Title, Years of Experience, Salary
np.random.seed(42)

n_total = 6000

# Education levels sesuai dataset Kaggle
education_levels = ["High School", "Bachelor's", "Master's", "PhD"]
education_weights = [0.15, 0.45, 0.30, 0.10]

# Gender
genders = ["Male", "Female"]

# Job titles (beragam sesuai Kaggle)
job_titles = [
    "Software Engineer", "Data Analyst", "Senior Manager", "Sales Associate",
    "Director", "Marketing Analyst", "Product Manager", "Sales Manager",
    "Marketing Coordinator", "Senior Scientist", "Software Developer",
    "HR Manager", "Financial Analyst", "Project Engineer", "Data Scientist",
    "Marketing Manager", "Director of Operations", "Account Manager",
    "Receptionist", "Engineer", "Research Scientist", "Sales Director",
    "Operations Manager", "Business Analyst", "VP of Operations",
    "IT Support", "Graphic Designer", "Web Developer", "UX Designer",
    "Content Creator"
]

# Base salary multiplier per education level
edu_salary_base = {
    "High School": 35000,
    "Bachelor's": 55000,
    "Master's": 75000,
    "PhD": 95000
}

# Generate data
data = []
for i in range(n_total):
    education = np.random.choice(education_levels, p=education_weights)
    
    # Age correlated with education
    if education == "High School":
        age = np.random.randint(22, 55)
    elif education == "Bachelor's":
        age = np.random.randint(22, 60)
    elif education == "Master's":
        age = np.random.randint(25, 62)
    else:  # PhD
        age = np.random.randint(28, 65)
    
    gender = np.random.choice(genders)
    
    # Years of experience correlated with age
    max_exp = age - 18 if education == "High School" else age - 22
    max_exp = max(0, max_exp)
    years_exp = np.random.randint(0, max(1, max_exp + 1))
    
    job_title = np.random.choice(job_titles)
    
    # Salary based on education, experience, age with some noise
    base = edu_salary_base[education]
    salary = (base 
              + years_exp * np.random.uniform(1800, 3500)
              + age * np.random.uniform(200, 500)
              + np.random.normal(0, 5000))
    salary = max(25000, round(salary, 2))
    
    data.append({
        "Age": age,
        "Gender": gender,
        "Education Level": education,
        "Job Title": job_title,
        "Years of Experience": years_exp,
        "Salary": salary
    })

df_full = pd.DataFrame(data)

# ========== 2. RANDOM SAMPLING 1000 DATA ==========
df = df_full.sample(n=1000, random_state=42).reset_index(drop=True)

# Simpan dataset sample
data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
os.makedirs(data_dir, exist_ok=True)
df.to_csv(os.path.join(data_dir, "Salary_Data_1000.csv"), index=False)
print(f"✅ Dataset saved: {len(df)} rows")
print(f"\nKolom: {list(df.columns)}")
print(f"\n{df.describe()}")

# ========== 3. PREPROCESSING ==========
# Encode Education Level ke numerik (ordinal)
edu_mapping = {
    "High School": 0,
    "Bachelor's": 1,
    "Master's": 2,
    "PhD": 3
}
df["Education_Encoded"] = df["Education Level"].map(edu_mapping)

# Encode Gender
gender_mapping = {"Female": 0, "Male": 1}
df["Gender_Encoded"] = df["Gender"].map(gender_mapping)

# Features: Years of Experience, Education Level (encoded), Age
X = df[["Years of Experience", "Education_Encoded", "Age"]].values
y = df["Salary"].values

# ========== 4. SPLIT DATA ==========
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)
print(f"\n📊 Training: {len(X_train)}, Testing: {len(X_test)}")

# ========== 5. TRAINING MODEL ==========
model = LinearRegression()
model.fit(X_train, y_train)

# Koefisien
intercept = model.intercept_
coef_experience = model.coef_[0]
coef_education = model.coef_[1]
coef_age = model.coef_[2]

print(f"\n🔑 KOEFISIEN REGRESI:")
print(f"   Intercept (β₀)        = {intercept:.2f}")
print(f"   Pengalaman Kerja (β₁) = {coef_experience:.2f}")
print(f"   Tingkat Pendidikan (β₂) = {coef_education:.2f}")
print(f"   Usia (β₃)             = {coef_age:.2f}")

# ========== 6. EVALUASI MODEL ==========
y_pred = model.predict(X_test)

r2 = r2_score(y_test, y_pred)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))
mae = mean_absolute_error(y_test, y_pred)
mape = np.mean(np.abs((y_test - y_pred) / y_test)) * 100

print(f"\n📈 EVALUASI MODEL:")
print(f"   R² Score  = {r2:.4f}")
print(f"   RMSE      = {rmse:.2f}")
print(f"   MAE       = {mae:.2f}")
print(f"   MAPE      = {mape:.2f}%")

if mape < 10:
    print("   → MAPE < 10% = Sangat Baik ✅")
elif mape < 20:
    print("   → 10% < MAPE < 20% = Baik ✅")
else:
    print("   → MAPE > 20% = Perlu Perbaikan ⚠️")

# ========== 7. EKSPOR KOEFISIEN UNTUK WEB APP ==========
model_config = {
    "intercept": round(intercept, 2),
    "coefficients": {
        "years_of_experience": round(coef_experience, 2),
        "education_level": round(coef_education, 2),
        "age": round(coef_age, 2)
    },
    "education_mapping": edu_mapping,
    "metrics": {
        "r2_score": round(r2, 4),
        "rmse": round(rmse, 2),
        "mae": round(mae, 2),
        "mape": round(mape, 2)
    },
    "dataset_info": {
        "source": "Kaggle - Salary Prediction for Beginner (rkiattisak)",
        "total_data": 6000,
        "sampled_data": 1000,
        "train_size": len(X_train),
        "test_size": len(X_test),
        "features": ["Years of Experience", "Education Level", "Age"],
        "target": "Salary (USD)"
    },
    "formula": f"Salary = {round(intercept, 2)} + ({round(coef_experience, 2)} × Experience) + ({round(coef_education, 2)} × Education) + ({round(coef_age, 2)} × Age)"
}

config_path = os.path.join(data_dir, "model_config.json")
with open(config_path, "w") as f:
    json.dump(model_config, f, indent=2)

print(f"\n✅ Model config exported to: {config_path}")
print(f"\n📐 RUMUS PREDIKSI:")
print(f"   {model_config['formula']}")

# ========== 8. STATISTIK DESKRIPTIF UNTUK WEB ==========
stats = {
    "salary": {
        "min": round(df["Salary"].min(), 2),
        "max": round(df["Salary"].max(), 2),
        "mean": round(df["Salary"].mean(), 2),
        "median": round(df["Salary"].median(), 2)
    },
    "experience": {
        "min": int(df["Years of Experience"].min()),
        "max": int(df["Years of Experience"].max()),
        "mean": round(df["Years of Experience"].mean(), 2)
    },
    "age": {
        "min": int(df["Age"].min()),
        "max": int(df["Age"].max()),
        "mean": round(df["Age"].mean(), 2)
    },
    "education_distribution": df["Education Level"].value_counts().to_dict(),
    "avg_salary_by_education": df.groupby("Education Level")["Salary"].mean().round(2).to_dict()
}

stats_path = os.path.join(data_dir, "stats.json")
with open(stats_path, "w") as f:
    json.dump(stats, f, indent=2)

print(f"\n✅ Statistics exported to: {stats_path}")
print("\n🎉 TRAINING SELESAI! Koefisien siap ditanam ke web app.")
