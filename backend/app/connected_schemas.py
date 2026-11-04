from datetime import datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, field_validator
from .schemas import Session


class Input(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class PulseInput(Input):
    response: Literal["confident", "practice", "support"]


class TopicInput(Input):
    topic_id: int = Field(gt=0, strict=True)


class EventInput(TopicInput):
    title: str = Field(min_length=5, max_length=120)
    description: str = Field(min_length=10, max_length=1500)
    starts_at: datetime
    duration_minutes: int = Field(ge=15, le=240, strict=True)
    capacity: int = Field(ge=2, le=50, strict=True)
    format: Literal["Online", "In person"]
    location: str = Field(default="", max_length=180)

    @field_validator("starts_at")
    @classmethod
    def timezone_required(cls, value):
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("Include the time zone for this event.")
        return value


class SessionInput(EventInput):
    goals: list[str] = Field(min_length=1, max_length=5)

    @field_validator("goals")
    @classmethod
    def goals_required(cls, values):
        if any(not v.strip() or len(v) > 240 for v in values):
            raise ValueError("Use one to five short, non-empty learning objectives.")
        return [v.strip() for v in values]


class ActionInput(TopicInput):
    action_type: Literal["practice", "ta_session", "review", "follow_up"]
    rationale: str = Field(min_length=10, max_length=1000)
    notes: str = Field(default="", max_length=1000)
    follow_up_date: str | None = None
    human_confirmed: Literal[True]

    @field_validator("follow_up_date")
    @classmethod
    def valid_date(cls, value):
        from datetime import date

        if value is not None:
            date.fromisoformat(value)
        return value


class ActionUpdate(Input):
    status: Literal["planned", "active", "completed", "cancelled"]
    notes: str = Field(default="", max_length=1000)
    follow_up_date: str | None = None

    @field_validator("follow_up_date")
    @classmethod
    def valid_date(cls, value):
        return ActionInput.valid_date(value)


class FacultySessionInput(SessionInput):
    host_id: int = Field(gt=0, strict=True)


class PulseRecord(BaseModel):
    topic_id: int
    response: str
    updated_at: str
    source: str


class SupportRequestRecord(BaseModel):
    id: int
    topic_id: int
    status: str
    created_at: str
    updated_at: str
    source: str


class GroupRecord(BaseModel):
    id: int
    creator_id: int
    topic_id: int
    title: str
    description: str
    starts_at: str
    duration_minutes: int
    capacity: int
    format: str
    location: str
    status: str
    source: str
    topic_name: str
    subject_id: int
    subject_name: str
    member_count: int
    available_places: int
    joined: bool


class ActionRecord(BaseModel):
    id: int
    professor_id: int
    topic_id: int
    action_type: str
    rationale: str
    status: str
    created_at: str
    follow_up_date: str | None
    notes: str
    evidence: dict
    session_id: int | None
    topic_name: str
    subject_name: str


class TopicRecord(BaseModel):
    id: int
    subject_id: int
    name: str


class SupportSignalRecord(BaseModel):
    topic: TopicRecord
    participants: int
    suppressed: bool
    distribution: dict[str, int] | None
    open_requests: int | None
    requests_suppressed: bool
    tutoring_places: int
    study_group_places: int
    recommendation: str
    rule: str
    missing_data: str
    human_review_required: bool
    synthetic: bool


class SupportSuggestions(BaseModel):
    sessions: list[Session]
    groups: list[GroupRecord]
    practice: list[dict]
    note: str


class NamedPerson(BaseModel):
    id: int
    name: str


class Attendee(NamedPerson):
    reservation_id: int
