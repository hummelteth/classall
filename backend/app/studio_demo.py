"""Prepared examples, never presented as live inference."""

from .studio_schemas import Analysis, QuestionPair


def prepared_analysis(passages, language):
    es = language == "es"
    return Analysis.model_validate(
        {
            "topics": [
                {
                    "title": "Regla de la cadena" if es else "Chain rule",
                    "concepts": [
                        "Funciones compuestas",
                        "Derivada de la función interior",
                    ]
                    if es
                    else ["Composite functions", "Inner derivative"],
                    "objectives": [
                        {
                            "id": "inner",
                            "description": "Identificar las funciones interior y exterior."
                            if es
                            else "Identify inner and outer functions.",
                        },
                        {
                            "id": "differentiate",
                            "description": "Derivar una función compuesta mediante la regla de la cadena."
                            if es
                            else "Differentiate a composite function using the chain rule.",
                        },
                    ],
                    "summary": "La derivada de una función compuesta combina las derivadas exterior e interior."
                    if es
                    else "The derivative of a composite function combines the outer and inner derivatives.",
                    "passage_ids": [p["id"] for p in passages],
                }
            ]
        }
    )


def prepared_pair(passages, language):
    es = language == "es"
    data = [
        (
            "pre",
            "inner",
            "En (3x + 1)², ¿cuál es la función interior?"
            if es
            else "In (3x + 1)², which is the inner function?",
            ["3x + 1", "x²", "2x"],
            0,
            "La función exterior eleva al cuadrado la expresión interior 3x + 1."
            if es
            else "The outer function squares the inner expression 3x + 1.",
        ),
        (
            "pre",
            "differentiate",
            "Deriva (2x + 1)³." if es else "Differentiate (2x + 1)³.",
            ["3(2x + 1)²", "6(2x + 1)²", "6x²"],
            1,
            "Multiplica la derivada exterior 3(2x + 1)² por la derivada interior 2."
            if es
            else "Multiply the outer derivative 3(2x + 1)² by the inner derivative 2.",
        ),
        (
            "post",
            "inner",
            "En sen(4x), ¿cuál es la función interior?"
            if es
            else "In sin(4x), which is the inner function?",
            ["sen(x)" if es else "sin(x)", "cos(x)", "4x"],
            2,
            "El seno es la función exterior y 4x es su argumento."
            if es
            else "Sine is the outer function; 4x is its input.",
        ),
        (
            "post",
            "differentiate",
            "Deriva (5x − 2)²." if es else "Differentiate (5x − 2)².",
            ["10(5x − 2)", "2(5x − 2)", "25x²"],
            0,
            "Multiplica 2(5x − 2) por la derivada interior 5."
            if es
            else "Multiply 2(5x − 2) by the inner derivative 5.",
        ),
    ]
    return QuestionPair.model_validate(
        {
            "questions": [
                {
                    "stage": stage,
                    "objective_id": objective,
                    "prompt": prompt,
                    "options": options,
                    "correct_index": correct,
                    "explanation": explanation,
                    "passage_id": passages[0]["id"],
                    "language": language,
                    "difficulty": "introductory",
                }
                for stage, objective, prompt, options, correct, explanation in data
            ]
        }
    )
