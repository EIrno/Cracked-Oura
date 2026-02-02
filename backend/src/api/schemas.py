
from typing import List, Optional, Dict, Any
from datetime import date, datetime
from pydantic import BaseModel, Field

# --- Daily Summaries ---

class SleepResponse(BaseModel):
    day: date
    score: Optional[int] = None
    timestamp: Optional[datetime] = None
    contributors: Optional[Dict[str, Any]] = None
    
    # Merged fields
    optimal_bedtime: Optional[Dict[str, Any]] = None
    recommendation: Optional[str] = None
    status: Optional[str] = None

    # Merged fields from SpO2Response
    average_spo2: Optional[float] = None
    breathing_disturbance_index: Optional[float] = None

    class Config:
        from_attributes = True

class ActivityResponse(BaseModel):
    day: date
    score: Optional[int] = None
    steps: Optional[int] = None
    total_calories: Optional[int] = None
    active_calories: Optional[int] = None
    average_met: Optional[float] = None
    equivalent_walking_distance: Optional[int] = None
    contributors: Optional[Dict[str, Any]] = None
    class_5_min: Optional[List[Dict[str, Any]]] = None
    met: Optional[List[Dict[str, Any]]] = None
    stress: Optional[List[Dict[str, Any]]] = None
    
    high_activity_met_minutes: Optional[int] = None
    high_activity_time: Optional[int] = None
    inactivity_alerts: Optional[int] = None
    low_activity_met_minutes: Optional[int] = None
    low_activity_time: Optional[int] = None
    medium_activity_met_minutes: Optional[int] = None
    medium_activity_time: Optional[int] = None
    meters_to_target: Optional[int] = None
    non_wear_time: Optional[int] = None
    resting_time: Optional[int] = None
    sedentary_met_minutes: Optional[int] = None
    sedentary_time: Optional[int] = None
    target_calories: Optional[int] = None
    target_meters: Optional[int] = None

    class Config:
        from_attributes = True

class ReadinessResponse(BaseModel):
    day: date
    score: Optional[int] = None
    temperature_deviation: Optional[float] = None
    temperature_trend_deviation: Optional[float] = None
    contributors: Optional[Dict[str, Any]] = None

    # Merged fields from DailyStress
    stress_high: Optional[int] = None
    recovery_high: Optional[int] = None
    day_summary: Optional[str] = None

    class Config:
        from_attributes = True

class ResilienceResponse(BaseModel):
    day: date
    level: Optional[str] = None
    sleep_recovery: Optional[float] = None
    daytime_recovery: Optional[float] = None
    stress: Optional[float] = None

    class Config:
        from_attributes = True

class CardiovascularAgeResponse(BaseModel):
    day: date
    vascular_age: Optional[int] = None

    class Config:
        from_attributes = True

# --- Sessions ---

class SleepSessionResponse(BaseModel):
    id: str
    day: date
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    type: Optional[str] = None
    efficiency: Optional[int] = None
    latency: Optional[int] = None
    total_sleep_duration: Optional[int] = None
    deep_sleep_duration: Optional[int] = None
    rem_sleep_duration: Optional[int] = None
    light_sleep_duration: Optional[int] = None
    awake_time: Optional[int] = None
    average_heart_rate: Optional[float] = None
    average_hrv: Optional[int] = None
    
    # Sequences converted to JSON
    # Sequences converted to JSON
    sleep_phase_5_min: Optional[List[Dict[str, Any]]] = None
    sleep_phase_30_sec: Optional[List[Dict[str, Any]]] = None
    movement_30_sec: Optional[List[Dict[str, Any]]] = None
    
    # New detailed fields
    hr_data: Optional[List[Dict[str, Any]]] = None
    hrv_data: Optional[List[Dict[str, Any]]] = None
    readiness: Optional[Dict[str, Any]] = None
    readiness_score_delta: Optional[float] = None
    
    average_breath: Optional[float] = None
    bedtime_end: Optional[datetime] = None
    bedtime_start: Optional[datetime] = None
    lowest_heart_rate: Optional[int] = None
    low_battery_alert: Optional[bool] = None
    period: Optional[int] = None
    restless_periods: Optional[int] = None
    sleep_algorithm_version: Optional[str] = None
    sleep_score_delta: Optional[int] = None
    time_in_bed: Optional[int] = None

    class Config:
        from_attributes = True

class WorkoutResponse(BaseModel):
    id: str
    day: date
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    activity: Optional[str] = None
    calories: Optional[float] = None
    distance: Optional[float] = None
    intensity: Optional[str] = None
    label: Optional[str] = None
    source: Optional[str] = None

    class Config:
        from_attributes = True

class MeditationResponse(BaseModel):
    id: str
    day: date
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    type: Optional[str] = None
    mood: Optional[str] = None

    class Config:
        from_attributes = True

# --- Time Series ---

class HeartRateResponse(BaseModel):
    timestamp: datetime
    bpm: int
    source: str

    class Config:
        from_attributes = True

class TemperatureResponse(BaseModel):
    timestamp: datetime
    skin_temp: Optional[float] = None

    class Config:
        from_attributes = True

class RingBatteryResponse(BaseModel):
    timestamp: datetime
    level: int
    charging: bool
    in_charger: bool

    class Config:
        from_attributes = True

# --- Metadata ---

class RingConfigurationResponse(BaseModel):
    id: str
    firmware_version: Optional[str] = None
    size: Optional[int] = None
    color: Optional[str] = None
    hardware_type: Optional[str] = None

    class Config:
        from_attributes = True

class TagResponse(BaseModel):
    id: str
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    tag_type_code: Optional[str] = None
    comment: Optional[str] = None

    class Config:
        from_attributes = True

# --- Comprehensive Day Data ---

class DayDataResponse(BaseModel):
    date: date
    sleep: Optional[SleepResponse] = None
    activity: Optional[ActivityResponse] = None
    readiness: Optional[ReadinessResponse] = None
    resilience: Optional[ResilienceResponse] = None
    cardiovascular_age: Optional[CardiovascularAgeResponse] = None
    
    # Collections
    sleep_sessions: List[SleepSessionResponse] = []
    workouts: List[WorkoutResponse] = []
    meditation: List[MeditationResponse] = []
    ring_battery: List[RingBatteryResponse] = []
    
    # Time Series (Optional)
    heart_rate: Optional[List[HeartRateResponse]] = None
    temperature: Optional[List[TemperatureResponse]] = None
