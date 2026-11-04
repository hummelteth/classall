"""V5 bounded inputs; demo headers are intentionally not authentication."""

from typing import Literal

from pydantic import Field, StrictInt

from .connected_schemas import Input


class ApplicationInput(Input):
    topic_id: int = Field(gt=0, strict=True)
    language: Literal["en", "es"] = "en"
    motivation: str = Field(min_length=10, max_length=1000)
    experience: str = Field(min_length=10, max_length=1000)
    proposed_topic: str = Field(min_length=5, max_length=200)
    objectives: str = Field(min_length=10, max_length=1000)
    teaching_plan: str = Field(min_length=10, max_length=1500)
    approach: str = Field(min_length=10, max_length=1000)
    explanation: str = Field(min_length=20, max_length=2000)
    answers: list[StrictInt] = Field(min_length=2, max_length=2)


class Decision(Input):
    status: Literal["changes_requested", "approved", "rejected"]
    comments: str = Field(min_length=5, max_length=1500)
    human_confirmed: Literal[True]


class AttendanceInput(Input):
    booking_ids: list[StrictInt] = Field(min_length=1, max_length=50)
    synthetic_confirmed: Literal[True]


class SyntheticConsent(Input):
    synthetic_confirmed: Literal[True]


class FeedbackInput(Input):
    clarity: int = Field(ge=1, le=3, strict=True)
    preparation: int = Field(ge=1, le=3, strict=True)
    atmosphere: int = Field(ge=1, le=3, strict=True)
    comment: str = Field(default="", max_length=1000)


class AdvisoryFeedback(Input):
    accuracy: str = Field(min_length=5, max_length=500)
    clarity: str = Field(min_length=5, max_length=500)
    reasoning: str = Field(min_length=5, max_length=500)
    learner_fit: str = Field(min_length=5, max_length=500)
    cautions: str = Field(min_length=5, max_length=500)
