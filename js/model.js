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
    age: 372.29
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
    sampledData: 1000,
    trainSize: 800,
    testSize: 200,
    features: ["Years of Experience", "Education Level", "Age"],
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
  formula: "Salary = 35,506.73 + (2,562.53 × Experience) + (19,515.92 × Education) + (372.29 × Age)",

  /**
   * Predict salary given inputs
   * @param {number} experience - Years of experience (0-40)
   * @param {number} education - Education level (0=SMA, 1=S1, 2=S2, 3=S3)
   * @param {number} age - Age (18-65)
   * @returns {number} Predicted annual salary in USD
   */
  predict(experience, education, age) {
    return this.intercept
      + (this.coef.experience * experience)
      + (this.coef.education * education)
      + (this.coef.age * age);
  },

  /**
   * Get prediction for all education levels at given experience & age
   */
  predictAll(experience, age) {
    return [0, 1, 2, 3].map(edu => ({
      education: edu,
      label: this.educationShort[edu],
      salary: this.predict(experience, edu, age)
    }));
  },

  /**
   * Generate salary curve data for a given education level
   * Returns array of {experience, salary} for charting
   */
  generateCurve(education, age = 30) {
    const points = [];
    for (let exp = 0; exp <= 40; exp += 1) {
      points.push({
        experience: exp,
        salary: this.predict(exp, education, age)
      });
    }
    return points;
  }
};
