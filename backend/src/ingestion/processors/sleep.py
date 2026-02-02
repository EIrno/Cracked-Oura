import pandas as pd
import uuid
import logging
from datetime import datetime
from backend.src.models import Sleep, SleepSession
from backend.src.ingestion.base import IngestionBase

logger = logging.getLogger("SleepProcessor")

class SleepProcessor(IngestionBase):
    def process_sleep(self, df: pd.DataFrame):
        records = []
        for _, row in df.iterrows():
            day_val = self._parse_date(row.get('day'))
            if not day_val:
                continue

            # Handle merged fields
            recommendation = row.get('recommendation')
            if pd.isna(recommendation): recommendation = None
            
            status = row.get('status')
            if pd.isna(status): status = None

            # SpO2 parsing
            spo2_data = self._parse_json_col(row.get('spo2_percentage'))
            avg_spo2 = None
            if isinstance(spo2_data, dict):
                avg_spo2 = self._parse_float(spo2_data.get('average'))
            
            breathing_index = self._parse_int(row.get('breathing_disturbance_index'))

            # Robust ID generation
            id_val = row.get('id')
            if pd.isna(id_val) or str(id_val).lower() == 'nan' or str(id_val).strip() == '':
                id_val = str(uuid.uuid4())

            rec = Sleep(
                id=str(id_val),
                day=day_val,
                score=self._parse_int(row.get('score')),
                # timestamp field removed from model, ignoring here if present
                contributors=self._parse_json_col(row.get('contributors')),
                
                # Merged fields
                optimal_bedtime=self._parse_json_col(row.get('optimal_bedtime')),
                recommendation=recommendation,
                status=status,
                
                # SpO2 fields
                average_spo2=avg_spo2,
                breathing_disturbance_index=breathing_index
            )
            records.append(rec)
        self._upsert(Sleep, records, ['day'])

    def process_sleep_session(self, file_path: str):
        df = self._read_csv_robust(file_path)
        if df is None or df.empty:
            return

        records = []
        for _, row in df.iterrows():
            if pd.isna(row.get('day')):
                continue

            try:
                bedtime_start = self._parse_datetime(row.get('bedtime_start'))
                if not bedtime_start:
                    day_val = self._parse_date(row.get('day'))
                    if day_val:
                        bedtime_start = datetime.combine(day_val, datetime.min.time())
                
                if not bedtime_start:
                    continue

                sleep = SleepSession(
                    id=str(row.get('id', uuid.uuid4())),
                    day=self._parse_date(row.get('day')),
                    start_time=bedtime_start,
                    end_time=self._parse_datetime(row.get('bedtime_end')),
                    type=row.get('type'),
                    efficiency=self._parse_int(row.get('efficiency')),
                    latency=self._parse_int(row.get('latency')),
                    total_sleep_duration=self._parse_int(row.get('total_sleep_duration')),
                    deep_sleep_duration=self._parse_int(row.get('deep_sleep_duration')),
                    rem_sleep_duration=self._parse_int(row.get('rem_sleep_duration')),
                    light_sleep_duration=self._parse_int(row.get('light_sleep_duration')),
                    awake_time=self._parse_int(row.get('awake_time')),
                    average_heart_rate=self._parse_float(row.get('average_heart_rate')),
                    average_hrv=self._parse_int(row.get('average_hrv')),
                    
                    # Sequences converted to Timestamped Lists
                    sleep_phase_5_min=self._parse_sequence_to_timestamped_list(row.get('sleep_phase_5_min'), bedtime_start, 300),
                    sleep_phase_30_sec=self._parse_sequence_to_timestamped_list(row.get('sleep_phase_30_sec'), bedtime_start, 30),
                    movement_30_sec=self._parse_sequence_to_timestamped_list(row.get('movement_30_sec'), bedtime_start, 30),
                    
                    # Detailed fields
                    average_breath=self._parse_float(row.get('average_breath')),
                    bedtime_end=self._parse_datetime(row.get('bedtime_end')),
                    bedtime_start=bedtime_start,
                    lowest_heart_rate=self._parse_int(row.get('lowest_heart_rate')),
                    low_battery_alert=bool(self._parse_int(row.get('low_battery_alert'))) if row.get('low_battery_alert') else None,
                    period=self._parse_int(row.get('period')),
                    restless_periods=self._parse_int(row.get('restless_periods')),
                    sleep_algorithm_version=row.get('sleep_algorithm_version'),
                    sleep_score_delta=self._parse_int(row.get('sleep_score_delta')),
                    time_in_bed=self._parse_int(row.get('time_in_bed')),

                    hr_data=self._parse_sequence_to_timestamped_list(row.get('heart_rate'), bedtime_start, 300),
                    hrv_data=self._parse_sequence_to_timestamped_list(row.get('hrv'), bedtime_start, 300),
                    readiness=self._parse_json_col(row.get('readiness')),
                    readiness_score_delta=self._parse_float(row.get('readiness_score_delta')),
                )
                records.append(sleep)
            except Exception as e:
                logger.error(f"Error parsing sleep_session row: {e}")
                continue
        
        self._upsert(SleepSession, records, ['id'])
