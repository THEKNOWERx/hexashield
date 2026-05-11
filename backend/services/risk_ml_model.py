import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
from sklearn.preprocessing import LabelEncoder
import pickle
import os

class RiskMLModel:
    """
    MACHINE LEARNING RISK PREDICTION ENGINE
    Trains and deploys a Random Forest model for tactical risk assessment.
    """

    def __init__(self, model_path="risk_model.pkl"):
        self.model_path = model_path
        self.model = None
        self.le_service = LabelEncoder()
        # Pre-seed labels to ensure consistent encoding
        self.service_types = ["WEB", "DBMS", "SSH", "SMB", "RDP", "FTP", "DNS", "IOT"]
        self.le_service.fit(self.service_types)

    def generate_synthetic_data(self, samples=5000):
        """Generates a high-fidelity synthetic dataset for cybersecurity training."""
        np.random.seed(42)
        
        cvss = np.random.uniform(0, 10, samples)
        importance = np.random.randint(1, 11, samples)
        service = np.random.choice(self.service_types, samples)
        
        # Heuristic Logic for Labeling (Simulating expert analyst decisions)
        risk_scores = (cvss * 1.5) + (importance * 1.2)
        # Service weight: SMB and RDP are riskier
        for i, s in enumerate(service):
            if s in ["SMB", "RDP", "DBMS"]: risk_scores[i] += 5
            if s in ["DNS", "IOT"]: risk_scores[i] += 2

        # Convert to Categories
        risk_level = []
        for score in risk_scores:
            if score >= 22: risk_level.append("CRITICAL")
            elif score >= 16: risk_level.append("HIGH")
            elif score >= 10: risk_level.append("MEDIUM")
            elif score >= 5: risk_level.append("LOW")
            else: risk_level.append("NONE")
            
        return pd.DataFrame({
            "cvss": cvss,
            "asset_importance": importance,
            "service_type": service,
            "risk_level": risk_level
        })

    def train(self):
        """Trains the Random Forest Classifier with full evaluation."""
        print("[ML] Generating synthetic training corpus...")
        df = self.generate_synthetic_data()
        
        # Features & Labels
        X = df[["cvss", "asset_importance", "service_type"]].copy()
        X["service_type"] = self.le_service.transform(X["service_type"])
        y = df["risk_level"]
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        print("[ML] Training Random Forest Classifier...")
        self.model = RandomForestClassifier(n_estimators=200, max_depth=20, random_state=42)
        self.model.fit(X_train, y_train)
        
        # Evaluation
        y_pred = self.model.predict(X_test)
        acc = accuracy_score(y_test, y_pred)
        report = classification_report(y_test, y_pred)
        
        print(f"[ML] Training Complete. Accuracy: {acc:.2%}")
        print("[ML] Classification Report:\n", report)
        
        # Save Model Artifact
        with open(self.model_path, "wb") as f:
            pickle.dump({"model": self.model, "le": self.le_service}, f)
        print(f"[ML] Model artifact saved to {self.model_path}")
        
        # Save Dataset for MATLAB
        if not os.path.exists('reports_out'):
            os.makedirs('reports_out')
        df.to_csv("reports_out/risk_ml_full_dataset.csv", index=False)
        print("[ML] Full Dataset exported to 'reports_out/risk_ml_full_dataset.csv' for MATLAB")
        
        return acc, report

    def predict(self, cvss, importance, service_type):
        """Predicts risk level for a live exposure."""
        if self.model is None:
            if os.path.exists(self.model_path):
                with open(self.model_path, "rb") as f:
                    data = pickle.load(f)
                    self.model = data["model"]
                    self.le_service = data["le"]
            else:
                raise Exception("Model not trained. Run train() first.")

        # Handle unknown services safely
        if service_type not in self.le_service.classes_:
            service_enc = self.le_service.transform(["IOT"])[0] # Default
        else:
            service_enc = self.le_service.transform([service_type])[0]
            
        X_live = pd.DataFrame([{
            "cvss": float(cvss),
            "asset_importance": int(importance),
            "service_type": service_enc
        }])
        
        prediction = self.model.predict(X_live)[0]
        probabilities = self.model.predict_proba(X_live)[0]
        confidence = np.max(probabilities)
        
        return {
            "prediction": prediction,
            "confidence": f"{confidence:.2%}",
            "features": {"cvss": cvss, "importance": importance, "service": service_type}
        }

if __name__ == "__main__":
    # Machine Learning Engineer Demonstration
    engine = RiskMLModel()
    acc, report = engine.train()
    
    print("\n--- LIVE INFERENCE TEST ---")
    test_cases = [
        {"cvss": 9.8, "importance": 10, "service": "SMB"}, # Critical
        {"cvss": 4.5, "importance": 3, "service": "WEB"},  # Low/Medium
        {"cvss": 7.0, "importance": 5, "service": "DBMS"}  # High
    ]
    
    for case in test_cases:
        res = engine.predict(case["cvss"], case["importance"], case["service"])
        print(f"Features: {case}")
        print(f"Prediction: {res['prediction']} (Confidence: {res['confidence']})\n")
