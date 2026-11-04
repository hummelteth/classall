from typing import Literal
from pydantic import BaseModel, Field, StrictInt, ConfigDict


class DemoUser(BaseModel):
    id: int
    name: str
    role: Literal["learner", "tutor", "professor"]
    programme: str
    initials: str
    color: str
    year: str


class Subject(BaseModel):
    id: int
    name: str
    code: str
    category: str
    color: str
    symbol: str


class Session(BaseModel):
    id: int
    title: str
    description: str
    goals: list[str]
    starts_at: str
    duration_minutes: int
    capacity: int
    format: str
    location: str
    level: str
    status: str
    tutor: DemoUser
    subject: Subject
    booked_seats: int
    available_seats: int
    approved: bool
    learning_check_available: bool = False


class BookingCreate(BaseModel):
    session_id: int = Field(gt=0, strict=True)


class Booking(BaseModel):
    id: int
    status: str
    created_at: str
    session: Session


class LearningSubmission(BaseModel):
    model_config = ConfigDict(extra="forbid")
    answers: dict[str, StrictInt] = Field(min_length=2, max_length=3)
