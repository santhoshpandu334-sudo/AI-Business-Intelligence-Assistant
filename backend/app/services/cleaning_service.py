import os
import re
import pandas as pd
import numpy as np
from typing import Tuple

class DataCleaningEngine:
    @staticmethod
    def clean_dataframe(df: pd.DataFrame) -> Tuple[pd.DataFrame, dict]:
        """
        Cleans pandas DataFrame:
        - Normalizes column headers to clean snake_case
        - Removes duplicate rows
        - Trims leading/trailing whitespace
        - Cleans currency strings ($1,234.50 -> 1234.50)
        - Converts numeric string columns
        - Standardizes date columns to ISO format (%Y-%m-%d)
        - Fills or handles missing values safely
        """
        cleaning_stats = {
            "initial_rows": len(df),
            "duplicates_removed": 0,
            "whitespace_trimmed_cells": 0,
            "currencies_cleaned": 0,
            "columns_renamed": 0
        }

        cleaned_df = df.copy()

        # 1. Normalize Column Headers (snake_case)
        old_cols = list(cleaned_df.columns)
        new_cols = [
            re.sub(r'[\s\-\/\.]+', '_', str(col)).strip().lower()
            for col in old_cols
        ]
        cleaned_df.columns = new_cols
        cleaning_stats["columns_renamed"] = sum(1 for o, n in zip(old_cols, new_cols) if o != n)

        # 2. Remove Duplicate Rows
        initial_count = len(cleaned_df)
        cleaned_df = cleaned_df.drop_duplicates().reset_index(drop=True)
        cleaning_stats["duplicates_removed"] = initial_count - len(cleaned_df)

        # 3. Process Object/String Columns (Trim Whitespace & Currency Parsing)
        for col in cleaned_df.select_dtypes(include=['object']).columns:
            # Trim whitespace
            cleaned_df[col] = cleaned_df[col].apply(lambda x: x.strip() if isinstance(x, str) else x)
            
            # Check if column is currency (e.g., "$1,250.00" or "€400")
            sample_str = str(cleaned_df[col].dropna().iloc[0]) if not cleaned_df[col].dropna().empty else ""
            if re.search(r'[\$€£₹]', sample_str):
                try:
                    cleaned_df[col] = (
                        cleaned_df[col]
                        .astype(str)
                        .str.replace(r'[\$€£\,\s]', '', regex=True)
                    )
                    cleaned_df[col] = pd.to_numeric(cleaned_df[col], errors='coerce')
                    cleaning_stats["currencies_cleaned"] += 1
                except Exception:
                    pass

        # 4. Standardize Date Columns
        for col in cleaned_df.columns:
            if 'date' in col or 'time' in col:
                try:
                    parsed_dates = pd.to_datetime(cleaned_df[col], errors='coerce')
                    if parsed_dates.notna().sum() > 0.5 * len(cleaned_df):
                        cleaned_df[col] = parsed_dates.dt.strftime('%Y-%m-%d')
                except Exception:
                    pass

        # 5. Convert String Numbers to Numeric
        for col in cleaned_df.select_dtypes(include=['object']).columns:
            try:
                numeric_converted = pd.to_numeric(cleaned_df[col], errors='coerce')
                # If more than 80% successfully convert to numeric, keep numeric
                if numeric_converted.notna().sum() > 0.8 * len(cleaned_df):
                    cleaned_df[col] = numeric_converted
            except Exception:
                pass

        cleaning_stats["final_rows"] = len(cleaned_df)
        return cleaned_df, cleaning_stats
