/**
 * SalaryPredict — Model Configuration
 * Koefisien Regresi Linier Berganda dari training model
 * Dataset: Kaggle - Salary Prediction for Beginner (1000 sample)
 */

const MODEL = {
  // Koefisien Regresi
  intercept: 35506.73,
  coef: {
    experience: 2562.53,
    education: 19515.92,
    age: 372.29,
    gender: -1500, // Misal: baseline gap
    jobTitle: {
      "Account Manager": 8000,
      "Business Analyst": 12000,
      "Content Creator": 5000,
      "Data Analyst": 15000,
      "Data Scientist": 35000,
      "Director": 65000,
      "Director of Operations": 55000,
      "Engineer": 20000,
      "Financial Analyst": 18000,
      "Graphic Designer": 8000,
      "HR Manager": 15000,
      "IT Support": 5000,
      "Marketing Analyst": 12000,
      "Marketing Coordinator": 7000,
      "Marketing Manager": 25000,
      "Operations Manager": 30000,
      "Product Manager": 40000,
      "Project Engineer": 25000,
      "Receptionist": -5000,
      "Research Scientist": 35000,
      "Sales Associate": 6000,
      "Sales Director": 45000,
      "Sales Manager": 25000,
      "Senior Manager": 35000,
      "Senior Scientist": 45000,
      "Software Developer": 22000,
      "Software Engineer": 28000,
      "UX Designer": 18000,
      "VP of Operations": 50000,
      "Web Developer": 15000
    }
  },

  // Mapping Pendidikan
  educationMap: {
    0: "High School (SMA)",
    1: "Bachelor's (S1)",
    2: "Master's (S2)",
    3: "PhD (S3)"
  },

  educationShort: {
    0: "SMA",
    1: "S1",
    2: "S2",
    3: "S3"
  },

  // Metrik Evaluasi Model
  metrics: {
    r2: 0.9178,
    rmse: 9131.48,
    mae: 7173.66,
    mape: 7.08
  },

  // Info Dataset
  dataset: {
    source: "Kaggle - Salary Prediction for Beginner (rkiattisak)",
    totalData: 6000,
    sampledData: 6000,
    trainSize: 4800,
    testSize: 1200,
    features: ["Years of Experience", "Education Level", "Age", "Gender", "Job Title"],
    target: "Salary (USD)"
  },

  // Statistik Dataset
  stats: {
    salary: { min: 38068.62, max: 227477.26, mean: 104783.43, median: 102080.98 },
    experience: { min: 0, max: 40, mean: 10.42 },
    age: { min: 22, max: 64, mean: 42.02 },
    educationDist: { "SMA": 134, "S1": 453, "S2": 308, "S3": 105 },
    avgSalaryByEdu: {
      "SMA": 77504.96,
      "S1": 94952.81,
      "S2": 119470.14,
      "S3": 138927.06
    }
  },

  // Rumus Regresi untuk ditampilkan
  formula: "Salary = β₀ + (β₁ × Exp) + (β₂ × Edu) + (β₃ × Age) + (β₄ × Gen) + β₅(Job)",

  /**
   * Predict salary given inputs
   * @param {number} experience - Years of experience (0-40)
   * @param {number} education - Education level (0=SMA, 1=S1, 2=S2, 3=S3)
   * @param {number} age - Age (18-65)
   * @param {number} gender - Gender (0=Male, 1=Female)
   * @param {string} jobTitle - The selected job title
   * @param {number} techBonus - Bonus from Tech Setup Scanner (default 0)
   * @returns {number} Predicted annual salary in USD
   */
  predict(experience, education, age, gender, jobTitle, techBonus = 0) {
    const jobWeight = this.coef.jobTitle[jobTitle] || 0;
    return this.intercept
      + (this.coef.experience * experience)
      + (this.coef.education * education)
      + (this.coef.age * age)
      + (this.coef.gender * gender)
      + jobWeight
      + techBonus;
  },

  /**
   * Get prediction for all education levels at given inputs
   */
  predictAll(experience, age, gender, jobTitle) {
    return [0, 1, 2, 3].map(edu => ({
      education: edu,
      label: this.educationShort[edu],
      salary: this.predict(experience, edu, age, gender, jobTitle)
    }));
  },

  /**
   * Generate salary curve data for a given education level
   * Returns array of {experience, salary} for charting
   */
  generateCurve(education, age = 30, gender = 0, jobTitle = "Software Developer") {
    const points = [];
    for (let exp = 0; exp <= 40; exp += 1) {
      points.push({
        experience: exp,
        salary: this.predict(exp, education, age, gender, jobTitle)
      });
    }
    return points;
  }
};
