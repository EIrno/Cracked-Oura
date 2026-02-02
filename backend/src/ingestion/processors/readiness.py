import pandas as pd
import uuid
import logging
from backend.src.models import Readiness, Resilience
from backend.src.ingestion.base import IngestionBase

logger = logging.getLogger("ReadinessProcessor")

class ReadinessProcessor(IngestionBase):
    def process_readiness(self, df: pd.DataFrame):
        # Deduplicate by day to avoid unique constraint errors
        if 'day' in df.columns:
            df = df.drop_duplicates(subset=['day'], keep='last')

        records = []
        for _, row in df.iterrows():
            day_val = self._parse_date(row.get('day'))
            if not day_val:
                continue

            contributors = self._parse_json_col(row.get('contributors')) or {}
            
            # Robust ID generation
            id_val = row.get('id')
            if pd.isna(id_val) or str(id_val).lower() == 'nan':
                id_val = str(uuid.uuid4())

            rec = Readiness(
                id=str(id_val),
                day=day_val,
                score=self._parse_int(row.get('score')),
                temperature_deviation=self._parse_float(row.get('temperature_deviation')),
                temperature_trend_deviation=self._parse_float(row.get('temperature_trend_deviation')),
                
                contributors=contributors,
                
                # Merged fields from dailystress.csv
                stress_high=self._parse_int(row.get('stress_high')),
                recovery_high=self._parse_int(row.get('recovery_high')),
                day_summary=row.get('day_summary')
            )
            records.append(rec)
        
        self._upsert(Readiness, records, ['day'])

    def process_resilience(self, df: pd.DataFrame):
        records = []
        for _, row in df.iterrows():
            try:
                day_val = self._parse_date(row.get('day'))
                if not day_val:
                    continue

                contributors = self._parse_json_col(row.get('contributors'))
                
                rec = Resilience(
                    id=str(row.get('id')) if row.get('id') else str(uuid.uuid4()),
                    day=day_val,
                    level=row.get('level'),
                    
                    # Flattened contributors
                    sleep_recovery=float(contributors.get('sleep_recovery')) if contributors and contributors.get('sleep_recovery') is not None else None,
                    daytime_recovery=float(contributors.get('daytime_recovery')) if contributors and contributors.get('daytime_recovery') is not None else None,
                    stress=float(contributors.get('stress')) if contributors and contributors.get('stress') is not None else None
                )
                records.append(rec)
            except Exception as e:
                logger.error(f"Error parsing daily_resilience row: {e}")
                continue
        
        self._upsert(Resilience, records, ['day'])
