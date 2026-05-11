import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import pickle
import os

class AnomalyDetectionEngine:
    """
    ML ENGINEER: UNSUPERVISED ANOMALY DETECTION ENGINE
    Utilizes Isolation Forest to detect 'Suspicious' patterns in scan metadata.
    """

    def __init__(self, model_path="anomaly_model.pkl"):
        self.model_path = model_path
        self.model = None
        self.scaler = StandardScaler()
        # Features: [port_count, service_variety, total_vulns]
        self.feature_names = ["port_count", "service_variety", "total_vulns"]

    def _generate_normal_baseline(self, samples=500):
        """Generates a synthetic 'Normal' baseline of standard network nodes."""
        np.random.seed(42)
        
        # Normal nodes usually have 1-5 ports, 1-3 service types, and 0-5 vulns
        ports = np.random.randint(1, 10, samples)
        services = np.random.randint(1, 5, samples)
        vulns = np.random.randint(0, 8, samples)
        
        return pd.DataFrame({
            "port_count": ports,
            "service_variety": services,
            "total_vulns": vulns
        })

    def train(self):
        """Trains the Isolation Forest on 'Normal' network behavior."""
        print("[ML] Training Anomaly Detector on baseline network telemetry...")
        df_normal = self._generate_normal_baseline()
        
        X = self.scaler.fit_transform(df_normal)
        
        # contamination=0.05 means we expect 5% outliers in 'normal' training data
        self.model = IsolationForest(contamination=0.05, random_state=42)
        self.model.fit(X)
        
        # Save model
        with open(self.model_path, "wb") as f:
            pickle.dump({"model": self.model, "scaler": self.scaler}, f)
        print(f"[ML] Anomaly model persisted to {self.model_path}")

    def detect(self, port_count, service_variety, total_vulns):
        """Analyzes a live scan pattern and classifies as Normal or Suspicious."""
        if self.model is None:
            if os.path.exists(self.model_path):
                with open(self.model_path, "rb") as f:
                    data = pickle.load(f)
                    self.model = data["model"]
                    self.scaler = data["scaler"]
            else:
                self.train()

        # Prepare feature vector
        X_live = pd.DataFrame([{
            "port_count": port_count,
            "service_variety": service_variety,
            "total_vulns": total_vulns
        }])
        X_scaled = self.scaler.transform(X_live)
        
        # Predict: 1 for Normal, -1 for Anomaly
        prediction = self.model.predict(X_scaled)[0]
        score = self.model.decision_function(X_scaled)[0] # Lower is more anomalous
        
        status = "NORMAL" if prediction == 1 else "SUSPICIOUS"
        severity = "High" if score < -0.2 else "Medium" if score < -0.1 else "Low"
        
        return {
            "status": status,
            "anomaly_score": round(float(score), 4),
            "threat_level": severity if status == "SUSPICIOUS" else "None",
            "features": X_live.iloc[0].to_dict()
        }

if __name__ == "__main__":
    # Machine Learning Engineer Demonstration
    engine = AnomalyDetectionEngine()
    engine.train()
    
    print("\n--- ANOMALY DETECTION TEST SUITE ---")
    
    scenarios = [
        {"ports": 2, "services": 2, "vulns": 1},   # Normal Target
        {"ports": 45, "services": 12, "vulns": 32}, # Suspicious (High Density)
        {"ports": 1, "services": 1, "vulns": 85},  # Suspicious (Extreme Vulns on single port)
        {"ports": 5, "services": 4, "vulns": 3}    # Normal Target
    ]
    
    for case in scenarios:
        res = engine.detect(case["ports"], case["services"], case["vulns"])
        print(f"Pattern: {case}")
        print(f"Classification: {res['status']} | Threat: {res['threat_level']} | Score: {res['anomaly_score']}\n")
