import pandas as pd
import uuid
import logging
from backend.src.models import HeartRate, Temperature, RingConfiguration, Tag, CardiovascularAge, RingBattery
from backend.src.ingestion.base import IngestionBase

logger = logging.getLogger("CommonProcessor")

class CommonProcessor(IngestionBase):
    def process_heart_rate(self, file_path: str):
        df = self._read_csv_robust(file_path)
        if df is None or df.empty:
            return

        records = []
        for _, row in df.iterrows():
            try:
                hr = HeartRate(
                    timestamp=self._parse_datetime(row.get('timestamp')),
                    bpm=self._parse_int(row.get('bpm')),
                    source=row.get('source')
                )
                records.append(hr)
            except Exception as e:
                continue
        
        self._batch_upsert(HeartRate, records, ['timestamp'])

    def process_temperature(self, file_path: str):
        df = self._read_csv_robust(file_path)
        if df is None or df.empty:
            return

        records = []
        for _, row in df.iterrows():
            try:
                skin_temp = self._parse_float(row.get('skin_temp'))
                if skin_temp is None:
                    continue

                temp = Temperature(
                    timestamp=self._parse_datetime(row.get('timestamp')),
                    skin_temp=skin_temp
                )
                records.append(temp)
            except Exception:
                continue
        
        self._batch_upsert(Temperature, records, ['timestamp'])

    def process_ring_battery(self, df: pd.DataFrame):
        records = []
        for _, row in df.iterrows():
            try:
                batt = RingBattery(
                    timestamp=self._parse_datetime(row.get('timestamp')),
                    level=self._parse_int(row.get('level')),
                    charging=bool(self._parse_int(row.get('charging'))),
                    in_charger=bool(self._parse_int(row.get('in_charger')))
                )
                records.append(batt)
            except Exception:
                pass
        
        self._batch_upsert(RingBattery, records, ['timestamp'])

    def process_ring_configuration(self, df: pd.DataFrame):
        records = []
        for _, row in df.iterrows():
            try:
                conf = RingConfiguration(
                    id=str(row.get('id', uuid.uuid4())),
                    firmware_version=row.get('firmware_version'),
                    size=self._parse_int(row.get('size')),
                    color=row.get('color'),
                    hardware_type=row.get('hardware_type')
                )
                records.append(conf)
            except:
                pass
        self._upsert(RingConfiguration, records, ['id'])

    def process_tag(self, df: pd.DataFrame):
        records = []
        for _, row in df.iterrows():
            try:
                tag = Tag(
                    id=str(row.get('id', uuid.uuid4())),
                    start_time=self._parse_datetime(row.get('start_time')),
                    end_time=self._parse_datetime(row.get('end_time')),
                    tag_type_code=row.get('tag_type_code'),
                    comment=row.get('comment')
                )
                records.append(tag)
            except:
                pass
        self._upsert(Tag, records, ['id'])

    def process_cardiovascular_age(self, df: pd.DataFrame):
        records = []
        for _, row in df.iterrows():
            try:
                rec = CardiovascularAge(
                    id=str(row.get('id', uuid.uuid4())),
                    day=self._parse_date(row.get('day')),
                    vascular_age=self._parse_int(row.get('vascular_age'))
                )
                records.append(rec)
            except:
                pass
        self._upsert(CardiovascularAge, records, ['day'])
