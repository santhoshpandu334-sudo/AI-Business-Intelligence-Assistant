import os
from datetime import datetime
import json
import io
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional

from sqlalchemy.orm import Session
from app.db.models import (
    Dataset, DatasetFile, DatasetColumn, DatasetStatistics, 
    DataQualityReport, DataRecord, User, AuditLog
)
from app.services.validation_service import DataValidationEngine
from app.services.cleaning_service import DataCleaningEngine

class DatasetService:
    @staticmethod
    def process_and_save_upload(
        db: Session,
        file_name: str,
        content_bytes: bytes,
        owner_id: int,
        company_name: str = "Acme Corp",
        owner_name: str = "Analyst User"
    ) -> Dataset:
        """
        Processes uploaded files (.csv, .xlsx, .xls, .json):
        1. Reads raw dataset
        2. Executes Data Validation Engine
        3. Executes Data Cleaning Engine
        4. Saves both Original & Cleaned files to storage
        5. Computes column schemas & statistics
        6. Stores Dataset, DatasetFile, DatasetColumn, DatasetStatistics, DataQualityReport
        7. Adds Audit Log
        """
        os.makedirs("./uploads/original", exist_ok=True)
        os.makedirs("./uploads/cleaned", exist_ok=True)

        # 1. Parse File Content
        raw_df = pd.DataFrame()
        mime_type = "text/csv"
        if file_name.endswith('.csv'):
            raw_df = pd.read_csv(io.BytesIO(content_bytes))
            mime_type = "text/csv"
        elif file_name.endswith(('.xls', '.xlsx')):
            raw_df = pd.read_excel(io.BytesIO(content_bytes))
            mime_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        elif file_name.endswith('.json'):
            raw_df = pd.read_json(io.BytesIO(content_bytes))
            mime_type = "application/json"
        else:
            raise ValueError("Unsupported file format. Only .csv, .xlsx, .xls, and .json files are allowed.")

        # Save Original File to disk
        orig_file_path = f"./uploads/original/orig_{owner_id}_{file_name}"
        with open(orig_file_path, "wb") as f:
            f.write(content_bytes)

        # 2. Run Validation Engine
        val_report = DataValidationEngine.validate_dataframe(raw_df, file_name)

        # 3. Run Cleaning Engine
        cleaned_df, cleaning_stats = DataCleaningEngine.clean_dataframe(raw_df)

        # Save Cleaned File to disk
        cleaned_file_path = f"./uploads/cleaned/cleaned_{owner_id}_{file_name.replace('.xlsx', '.csv').replace('.json', '.csv')}"
        cleaned_df.to_csv(cleaned_file_path, index=False)

        # Compute Column Types & Stats
        numeric_cols = cleaned_df.select_dtypes(include=[np.number]).columns.tolist()
        date_cols = [c for c in cleaned_df.columns if 'date' in str(c).lower() or 'time' in str(c).lower()]
        categorical_cols = [c for c in cleaned_df.columns if c not in numeric_cols and c not in date_cols]

        schema_dict = {col: str(dtype) for col, dtype in zip(cleaned_df.columns, cleaned_df.dtypes)}
        memory_bytes = int(cleaned_df.memory_usage(deep=True).sum())

        # 4. Create Main Dataset Entry
        dataset = Dataset(
            owner_id=owner_id,
            company_name=company_name,
            owner_name=owner_name,
            name=file_name,
            description=f"Enterprise Dataset with {len(cleaned_df)} rows and {len(cleaned_df.columns)} columns. Quality Score: {val_report['quality_score']}/100.",
            file_type=file_name.split('.')[-1].lower(),
            file_path=cleaned_file_path,
            row_count=len(cleaned_df),
            column_count=len(cleaned_df.columns),
            quality_score=val_report["quality_score"],
            memory_usage_bytes=memory_bytes,
            schema_json=schema_dict,
            status="processed"
        )
        db.add(dataset)
        db.commit()
        db.refresh(dataset)

        # 5. Create DatasetFile Metadata Entry
        dataset_file = DatasetFile(
            dataset_id=dataset.id,
            original_filename=file_name,
            original_file_path=orig_file_path,
            cleaned_file_path=cleaned_file_path,
            mime_type=mime_type,
            file_size_bytes=len(content_bytes),
            encoding="utf-8"
        )
        db.add(dataset_file)

        # 6. Create DatasetColumn Entries
        for col in cleaned_df.columns:
            series = cleaned_df[col]
            missing = int(series.isna().sum())
            unique_c = int(series.nunique())
            is_num = col in numeric_cols
            is_dt = col in date_cols
            sample_vals = series.dropna().head(5).tolist()
            sample_vals_serializable = [str(v) for v in sample_vals]

            db.add(DatasetColumn(
                dataset_id=dataset.id,
                column_name=col,
                data_type=str(series.dtype),
                missing_count=missing,
                unique_count=unique_c,
                is_numeric=is_num,
                is_date=is_dt,
                sample_values=sample_vals_serializable
            ))

        # 7. Create DatasetStatistics Entry
        num_summary = json.loads(cleaned_df.describe(include=[np.number]).fillna(0).to_json()) if numeric_cols else {}
        cat_summary = {
            col: json.loads(cleaned_df[col].value_counts().head(5).to_json())
            for col in categorical_cols
        }

        dataset_stats = DatasetStatistics(
            dataset_id=dataset.id,
            total_rows=len(cleaned_df),
            total_columns=len(cleaned_df.columns),
            missing_values_count=val_report["missing_values"],
            duplicate_rows_count=val_report["duplicate_rows"],
            numeric_cols_count=len(numeric_cols),
            categorical_cols_count=len(categorical_cols),
            date_cols_count=len(date_cols),
            completeness_pct=val_report["completeness_pct"],
            consistency_pct=val_report["consistency_pct"],
            quality_score=val_report["quality_score"],
            memory_usage_bytes=memory_bytes,
            numeric_summary_json=num_summary,
            categorical_summary_json=cat_summary
        )
        db.add(dataset_stats)

        # 8. Create DataQualityReport Entry
        quality_rep = DataQualityReport(
            dataset_id=dataset.id,
            quality_score=val_report["quality_score"],
            error_count=val_report["error_count"],
            warning_count=val_report["warning_count"],
            issues_json=val_report["issues"]
        )
        db.add(quality_rep)

        # 9. Store DataRecords Batch (First 500 rows for preview/RAG query)
        records = []
        records_dict = cleaned_df.head(500).to_dict(orient="records")
        
        def serialize_value(val):
            import math
            if pd.isna(val) or val is None:
                return None
            if isinstance(val, (pd.Timestamp, datetime)):
                return val.isoformat()
            if isinstance(val, (np.integer, int)):
                return int(val)
            if isinstance(val, (np.floating, float)):
                if math.isnan(val) or math.isinf(val):
                    return None
                return float(val)
            return str(val)

        for idx, row in enumerate(records_dict):
            clean_row = {k: serialize_value(v) for k, v in row.items()}
            records.append(DataRecord(dataset_id=dataset.id, row_index=idx, payload=clean_row))
        db.bulk_save_objects(records)


        # 10. Audit Log Entry
        audit = AuditLog(
            user_id=owner_id,
            action="UPLOAD_DATASET",
            resource=f"Dataset #{dataset.id} ({file_name})",
            details=f"Uploaded {len(cleaned_df)} rows. Quality Score: {val_report['quality_score']}%."
        )
        db.add(audit)

        db.commit()
        db.refresh(dataset)
        return dataset
