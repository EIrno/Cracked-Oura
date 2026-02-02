from typing import Optional
from datetime import date, datetime
from sqlalchemy import String, Float, Date, DateTime, JSON, Text, Integer, Boolean
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

class Base(DeclarativeBase):
    pass

# --- Daily Summaries ---

class Sleep(Base):
    __tablename__ = "sleep"
    
    id: Mapped[str] = mapped_column(String, primary_key=True)
    day: Mapped[date] = mapped_column(Date, unique=True, index=True)
    score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    contributors: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Additional Metrics
    optimal_bedtime: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    recommendation: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    status: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    average_spo2: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    breathing_disturbance_index: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

class Activity(Base):
    __tablename__ = "activity"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    day: Mapped[date] = mapped_column(Date, unique=True, index=True)
    score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    steps: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    total_calories: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    active_calories: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    average_met: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    equivalent_walking_distance: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    contributors: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    # Detailed Data Sequences
    class_5_min: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    met: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    stress: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    # Activity Stats
    high_activity_met_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    high_activity_time: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    inactivity_alerts: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    low_activity_met_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    low_activity_time: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    medium_activity_met_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    medium_activity_time: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    meters_to_target: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    non_wear_time: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    resting_time: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    sedentary_met_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    sedentary_time: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    target_calories: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    target_meters: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

class Readiness(Base):
    __tablename__ = "readiness"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    day: Mapped[date] = mapped_column(Date, unique=True, index=True)
    score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    temperature_deviation: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    temperature_trend_deviation: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    contributors: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Additional Metrics
    stress_high: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    recovery_high: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    day_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

class Resilience(Base):
    __tablename__ = "resilience"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    day: Mapped[date] = mapped_column(Date, unique=True, index=True)
    level: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    # Flattened contributors
    sleep_recovery: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    daytime_recovery: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    stress: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

# --- Sessions & Detailed Data ---

class SleepSession(Base):
    __tablename__ = "sleep_session"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    day: Mapped[date] = mapped_column(Date, index=True)
    start_time: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    end_time: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    type: Mapped[Optional[str]] = mapped_column(String, nullable=True) # e.g., 'sleep', 'nap'
    efficiency: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    latency: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    total_sleep_duration: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    deep_sleep_duration: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    rem_sleep_duration: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    light_sleep_duration: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    awake_time: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    average_heart_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    average_hrv: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Sequence fields (JSON)
    sleep_phase_5_min: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    sleep_phase_30_sec: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    movement_30_sec: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    hr_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    hrv_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    readiness: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Detailed Metrics
    average_breath: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    bedtime_end: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    bedtime_start: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    lowest_heart_rate: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    low_battery_alert: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True) 
    period: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    restless_periods: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    sleep_algorithm_version: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    sleep_score_delta: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    readiness_score_delta: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    time_in_bed: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

class Workout(Base):
    __tablename__ = "workout"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    day: Mapped[date] = mapped_column(Date, index=True)
    start_time: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    end_time: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    activity: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    calories: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    distance: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    intensity: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    label: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    source: Mapped[Optional[str]] = mapped_column(String, nullable=True)

class Meditation(Base):
    __tablename__ = "meditation"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    day: Mapped[date] = mapped_column(Date, index=True)
    start_time: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    end_time: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    type: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    mood: Mapped[Optional[str]] = mapped_column(String, nullable=True)

# --- High Frequency Data ---

class HeartRate(Base):
    __tablename__ = "heart_rate"

    timestamp: Mapped[datetime] = mapped_column(DateTime, primary_key=True)
    bpm: Mapped[int] = mapped_column(Integer)
    source: Mapped[str] = mapped_column(String)

class Temperature(Base):
    __tablename__ = "temperature"

    timestamp: Mapped[datetime] = mapped_column(DateTime, primary_key=True)
    skin_temp: Mapped[float] = mapped_column(Float)

class RingBattery(Base):
    __tablename__ = "ring_battery"

    timestamp: Mapped[datetime] = mapped_column(DateTime, primary_key=True)
    level: Mapped[int] = mapped_column(Integer)
    charging: Mapped[bool] = mapped_column(Boolean)
    in_charger: Mapped[bool] = mapped_column(Boolean)

# --- Metadata ---

class RingConfiguration(Base):
    __tablename__ = "ring_configuration"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    firmware_version: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    size: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    color: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    hardware_type: Mapped[Optional[str]] = mapped_column(String, nullable=True)

class Tag(Base):
    __tablename__ = "tag"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    start_time: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    end_time: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    tag_type_code: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    comment: Mapped[Optional[str]] = mapped_column(String, nullable=True)

class CardiovascularAge(Base):
    __tablename__ = "cardiovascular_age"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    day: Mapped[date] = mapped_column(Date, unique=True, index=True)
    vascular_age: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
