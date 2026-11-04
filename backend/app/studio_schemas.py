from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

Text = Annotated[str, Field(min_length=1, max_length=1200)]
Identifier = Annotated[str, Field(min_length=1, max_length=80, pattern=r"^[\w-]+$")]
Language = Literal["en", "es"]


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class Objective(StrictModel):
    id: Identifier
    description: Text


class TopicDraft(StrictModel):
    title: Text
    concepts: list[Text] = Field(min_length=1, max_length=6)
    objectives: list[Objective] = Field(min_length=1, max_length=3)
    summary: Text
    passage_ids: list[Identifier] = Field(min_length=1, max_length=3)


class Analysis(StrictModel):
    topics: list[TopicDraft] = Field(min_length=1, max_length=3)

    @model_validator(mode="after")
    def unique_objectives(self):
        ids = [o.id for t in self.topics for o in t.objectives]
        if len(ids) != len(set(ids)):
            raise ValueError("Objective identifiers must be unique.")
        return self


class AnalysisRequest(StrictModel):
    passage_ids: list[Identifier] = Field(min_length=1, max_length=3)
    language: Language = "en"


class AnalysisReview(StrictModel):
    content: Analysis
    reviewed: bool = False


class Question(StrictModel):
    stage: Literal["pre", "post"]
    prompt: Text
    options: list[Text] = Field(min_length=3, max_length=4)
    correct_index: int = Field(ge=0, le=3, strict=True)
    explanation: Text
    objective_id: Identifier
    difficulty: Literal["introductory", "intermediate", "advanced"]
    passage_id: Identifier
    language: Language

    @model_validator(mode="after")
    def valid_answer(self):
        if self.correct_index >= len(self.options):
            raise ValueError("Correct answer must be one of the options.")
        if len({o.casefold() for o in self.options}) != len(self.options):
            raise ValueError("Answer options must be distinct.")
        return self


class QuestionPair(StrictModel):
    questions: list[Question] = Field(min_length=2, max_length=6)

    @model_validator(mode="after")
    def paired(self):
        prompts = [" ".join(q.prompt.casefold().split()) for q in self.questions]
        if len(prompts) != len(set(prompts)):
            raise ValueError("Pre and post questions must be distinct.")
        pre = [q for q in self.questions if q.stage == "pre"]
        post = [q for q in self.questions if q.stage == "post"]
        if (
            not pre
            or len(pre) != len(post)
            or {q.objective_id for q in pre} != {q.objective_id for q in post}
        ):
            raise ValueError(
                "Both stages must cover the same objectives in equal-sized sets."
            )
        for objective in {q.objective_id for q in pre}:
            if sorted(
                q.difficulty for q in pre if q.objective_id == objective
            ) != sorted(q.difficulty for q in post if q.objective_id == objective):
                raise ValueError(
                    "Stages must use comparable difficulty for each objective."
                )
        return self


class GenerateRequest(StrictModel):
    analysis_id: int = Field(gt=0)
    topic_id: int = Field(gt=0)
    objective_ids: list[Identifier] = Field(min_length=1, max_length=3)
    passage_ids: list[Identifier] = Field(min_length=1, max_length=3)
    language: Language = "en"
    difficulty: Literal["introductory", "intermediate", "advanced"] = "introductory"
    count: int = Field(ge=1, le=3, strict=True)


class QuestionEdit(StrictModel):
    content: Question
    revision: int = Field(ge=1)


class ReviewQuestion(StrictModel):
    status: Literal["reviewed", "rejected", "draft"]
    revision: int = Field(ge=1)


class Assignment(StrictModel):
    session_id: int = Field(gt=0)
