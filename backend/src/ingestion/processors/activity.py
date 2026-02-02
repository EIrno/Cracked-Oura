import pandas as pd
import uuid
import logging
from datetime import datetime
from backend.src.models import Activity, Workout, Meditation
from backend.src.ingestion.base import IngestionBase

logger = logging.getLogger("ActivityProcessor")

class ActivityProcessor(IngestionBase):
    def process_activity(self, df: pd.DataFrame):
        # Deduplicate by day
        if 'day' in df.columns:
            df = df.drop_duplicates(subset=['day'], keep='last')
        
        records = []
        for index, row in df.iterrows():
            day_val = self._parse_date(row.get('day'))
            
            # Fallback for when day might be missing but timestamp exists
            if not day_val and row.get('timestamp'):
                 ts = self._parse_datetime(row.get('timestamp'))
                 if ts:
                     day_val = ts.date()

            if not day_val:
                continue

            try:
                contributors = self._parse_json_col(row.get('contributors')) or {}
                
                # Start time for daily sequences is midnight
                day_start = datetime.combine(day_val, datetime.min.time())

                rec = Activity(
                    id=str(row.get('id')) if row.get('id') else str(uuid.uuid4()),
                    day=day_val,
                    score=self._parse_int(row.get('score')),
                    steps=self._parse_int(row.get('steps')),
                    total_calories=self._parse_int(row.get('total_calories')),
                    active_calories=self._parse_int(row.get('active_calories')),
                    average_met=self._parse_float(row.get('average_met_minutes')), 
                    equivalent_walking_distance=self._parse_int(row.get('equivalent_walking_distance')),
                    contributors=contributors,
                    
                    # Converted sequences
                    class_5_min=self._parse_sequence_to_timestamped_list(row.get('class_5_min'), day_start, 300),
                    met=self._parse_sequence_to_timestamped_list(row.get('met'), day_start, 60),
                    
                    # Detailed Stats
                    high_activity_met_minutes=self._parse_int(row.get('high_activity_met_minutes')),
                    high_activity_time=self._parse_int(row.get('high_activity_time')),
                    inactivity_alerts=self._parse_int(row.get('inactivity_alerts')),
                    low_activity_met_minutes=self._parse_int(row.get('low_activity_met_minutes')),
                    low_activity_time=self._parse_int(row.get('low_activity_time')),
                    medium_activity_met_minutes=self._parse_int(row.get('medium_activity_met_minutes')),
                    medium_activity_time=self._parse_int(row.get('medium_activity_time')),
                    meters_to_target=self._parse_int(row.get('meters_to_target')),
                    non_wear_time=self._parse_int(row.get('non_wear_time')),
                    resting_time=self._parse_int(row.get('resting_time')),
                    sedentary_met_minutes=self._parse_int(row.get('sedentary_met_minutes')),
                    sedentary_time=self._parse_int(row.get('sedentary_time')),
                    target_calories=self._parse_int(row.get('target_calories')),
                    target_meters=self._parse_int(row.get('target_meters'))
                )
                records.append(rec)
            except Exception as e:
                logger.error(f"Error processing activity row {index}: {e}")
                continue
        
        self._upsert(Activity, records, ['day'])

    def process_workout(self, file_path: str):
        df = self._read_csv_robust(file_path)
        if df is None or df.empty:
            return

        records = []
        for _, row in df.iterrows():
            try:
                workout = Workout(
                    id=str(row.get('id', uuid.uuid4())),
                    day=self._parse_date(row.get('day')),
                    start_time=self._parse_datetime(row.get('start_datetime')),
                    end_time=self._parse_datetime(row.get('end_datetime')),
                    activity=row.get('activity'),
                    calories=self._parse_float(row.get('calories')),
                    distance=self._parse_float(row.get('distance')),
                    intensity=row.get('intensity'),
                    label=row.get('label'),
                    source=row.get('source')
                )
                records.append(workout)
            except Exception as e:
                logger.error(f"Error parsing workout row: {e}")
                continue
        
        self._upsert(Workout, records, ['id'])

    def process_meditation(self, file_path: str):
        df = self._read_csv_robust(file_path)
        if df is None or df.empty:
            return

        records = []
        for _, row in df.iterrows():
            try:
                session = Meditation(
                    id=str(row.get('id', uuid.uuid4())),
                    day=self._parse_date(row.get('day')),
                    start_time=self._parse_datetime(row.get('start_datetime')),
                    end_time=self._parse_datetime(row.get('end_datetime')),
                    type=row.get('type'),
                    mood=row.get('mood')
                )
                records.append(session)
            except Exception as e:
                logger.error(f"Error parsing session row: {e}")
                continue
        
        self._upsert(Meditation, records, ['id'])

    def process_stress(self, df: pd.DataFrame):
        """Merges daytime stress data into the Activity table."""
        logger.info(f"Merging {len(df)} stress records into Activity...")
        
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df['day'] = df['timestamp'].dt.date
        
        grouped = df.groupby('day')
        
        for day, group in grouped:
            # Convert group to list of dicts for the JSON column
            stress_list = []
            for _, row in group.iterrows():
                stress_list.append({
                    "timestamp": row['timestamp'].isoformat(),
                    "stress": self._parse_int(row.get('stress_value')),
                    "recovery": self._parse_int(row.get('recovery_value'))
                })
            
            # Upsert specifically into Activity
            # Note: We query directly to update just this column to avoid wiping others
            # This logic mimics the previous one but we should ideally support partial updates in _upsert
            # For now, we fetch-and-update
            existing = self.session.query(Activity).filter(Activity.day == day).first()
            if existing:
                existing.stress = stress_list
            else:
                # Create placeholder if missing
                rec = Activity(day=day, stress=stress_list, id=str(uuid.uuid4()))
                self.session.add(rec)
        
        try:
            self.session.commit()
        except Exception as e:
            self.session.rollback()
            logger.error(f"Error merging stress data: {e}")
