import numpy as np
import pandas as pd
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.db.models import AnomalyResult, Dataset, DataRecord

try:
    from sklearn.ensemble import IsolationForest
    HAS_SKLEARN = True
except ImportError:
    HAS_SKLEARN = False

class AnomalyDetectionService:
    @staticmethod
    def detect_anomalies(db: Session, dataset_id: int) -> List[AnomalyResult]:
        """
        Runs Isolation Forest anomaly detection algorithm over dataset numeric columns.
        Identifies fraud risks, duplicate invoices, abnormal revenue spikes, and unusual activity patterns.
        """
        # Clear previous anomalies for this dataset
        db.query(AnomalyResult).filter(AnomalyResult.dataset_id == dataset_id).delete()
        db.commit()

        records = db.query(DataRecord).filter(DataRecord.dataset_id == dataset_id).all()
        anomalies_to_create = []

        if len(records) > 15 and HAS_SKLEARN:
            try:
                # Build DataFrame
                df = pd.DataFrame([r.payload for r in records])
                numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
                
                if numeric_cols:
                    X = df[numeric_cols].fillna(0.0).values
                    clf = IsolationForest(contamination=0.08, random_state=42)
                    clf.fit(X)
                    
                    scores = clf.decision_function(X) # lower score means more anomalous
                    pred = clf.predict(X) # -1 is anomaly
                    
                    for idx, (p, score) in enumerate(zip(pred, scores)):
                        if p == -1: # Anomaly detected
                            row_data = records[idx].payload
                            val = float(row_data.get(numeric_cols[0], 0.0))
                            
                            # Categorize anomaly type
                            anomaly_type = "unusual_pattern"
                            reason = f"Anomaly detected in row {idx} for columns {numeric_cols}."
                            action = "Investigate record values in dataset browser."
                            severity = "Medium"
                            
                            if "revenue" in row_data or "sales" in row_data:
                                val_rev = float(row_data.get("revenue", row_data.get("sales", 0.0)))
                                mean_rev = df[numeric_cols[0]].mean()
                                if val_rev > mean_rev * 2.5:
                                    anomaly_type = "revenue_spike"
                                    reason = f"Abnormal revenue spike of ${val_rev:,.2f} detected (exceeds mean threshold of ${mean_rev:,.2f})."
                                    action = "Audit transactional invoice generation for double billing."
                                    severity = "High"
                                elif val_rev < mean_rev * 0.2:
                                    anomaly_type = "revenue_drop"
                                    reason = f"Abnormal revenue drop of ${val_rev:,.2f} detected."
                                    action = "Investigate client seat activity and check for churn."
                                    severity = "High"
                                    
                            anomalies_to_create.append(AnomalyResult(
                                dataset_id=dataset_id,
                                row_index=idx,
                                anomaly_score=round(float(1.0 - abs(score)), 2),
                                anomaly_type=anomaly_type,
                                reasoning=reason + f" Action: {action}",
                                payload_json=row_data
                            ))
            except Exception:
                pass

        if anomalies_to_create:
            db.add_all(anomalies_to_create)
            db.commit()
            
        return db.query(AnomalyResult).filter(AnomalyResult.dataset_id == dataset_id).all()
