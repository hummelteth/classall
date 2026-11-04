"""Equivalent Spanish versions of the original synthetic question bank.
Indices and question identity remain unchanged; no translation changes a score.
"""

ES_BANK = {
    1: [
        (
            "En (3x + 1)², ¿cuál es la función interior?",
            ["3x + 1", "x²", "2x"],
            "La función exterior eleva al cuadrado la expresión interior 3x + 1.",
        ),
        (
            "Deriva (2x + 1)³.",
            ["3(2x + 1)²", "6(2x + 1)²", "6x²"],
            "Multiplica la derivada exterior 3(2x + 1)² por la derivada interior 2.",
        ),
        (
            "En sen(4x), ¿cuál es la función interior?",
            ["sen(x)", "cos(x)", "4x"],
            "El seno es la función exterior y 4x es su argumento.",
        ),
        (
            "Deriva (5x − 2)².",
            ["10(5x − 2)", "2(5x − 2)", "25x²"],
            "Multiplica 2(5x − 2) por la derivada interior 5.",
        ),
    ],
    2: [
        (
            "¿Cuántas iteraciones produce range(3)?",
            ["2", "3", "4"],
            "range(3) produce los valores 0, 1 y 2.",
        ),
        (
            "¿Qué palabra clave devuelve el resultado de una función?",
            ["print", "for", "return"],
            "return devuelve un valor al código que llamó a la función.",
        ),
        (
            "¿Cuántas iteraciones produce range(2, 6)?",
            ["4", "5", "6"],
            "Los valores son 2, 3, 4 y 5; el límite superior no se incluye.",
        ),
        (
            "¿Qué devuelve def twice(x): return x * 2 al llamar a twice(4)?",
            ["4", "8", "None"],
            "La expresión devuelta es 4 por 2, que equivale a 8.",
        ),
    ],
    3: [
        (
            "¿Qué se representa en un diagrama de cuerpo libre?",
            [
                "Las fuerzas que actúan sobre el cuerpo elegido",
                "Solo su rapidez",
                "Solo su trayectoria",
            ],
            "Se dibujan las fuerzas que actúan sobre el cuerpo seleccionado.",
        ),
        (
            "Una fuerza neta de 6 N actúa sobre 2 kg. ¿Cuál es la aceleración?",
            ["12 m/s²", "3 m/s²", "0 m/s²"],
            "La segunda ley de Newton establece a = F/m = 6/2.",
        ),
        (
            "¿Qué flecha representa el peso cerca de la Tierra?",
            [
                "En la dirección de la velocidad",
                "Siempre hacia arriba",
                "Hacia el centro de la Tierra",
            ],
            "La gravedad actúa hacia el centro de la Tierra, con independencia del movimiento.",
        ),
        (
            "Una fuerza neta de 12 N actúa sobre 3 kg. ¿Cuál es la aceleración?",
            ["4 m/s²", "36 m/s²", "9 m/s²"],
            "Se aplica a = F/m = 12/3 = 4 m/s².",
        ),
    ],
    4: [
        (
            "En el gráfico habitual de precio y cantidad, la demanda tiene pendiente…",
            ["Positiva", "Negativa", "Solo vertical"],
            "Manteniendo los demás factores constantes, la cantidad demandada disminuye al subir el precio.",
        ),
        (
            "La demanda aumenta y la oferta no cambia. El precio de equilibrio normalmente…",
            ["Baja", "No cambia", "Sube"],
            "Un desplazamiento de la demanda hacia la derecha aumenta el precio y la cantidad de equilibrio.",
        ),
        (
            "En el gráfico habitual de precio y cantidad, la oferta tiene pendiente…",
            ["Positiva", "Negativa", "Solo horizontal"],
            "Los precios más altos suelen incentivar una mayor cantidad ofrecida.",
        ),
        (
            "La oferta aumenta y la demanda no cambia. El precio de equilibrio normalmente…",
            ["Sube", "Baja", "No cambia"],
            "Un desplazamiento de la oferta hacia la derecha reduce el precio y aumenta la cantidad de equilibrio.",
        ),
    ],
    5: [
        (
            "Una distribución normal es…",
            [
                "Simétrica respecto a su media",
                "Siempre asimétrica a la derecha",
                "Uniforme",
            ],
            "La curva normal es simétrica y está centrada en la media.",
        ),
        (
            "Un procedimiento de confianza del 95 % significa que…",
            [
                "El 95 % de las observaciones está en cada intervalo",
                "El 95 % de los intervalos de muestras repetidas contiene el parámetro fijo",
                "El parámetro cambia cada vez",
            ],
            "La cobertura se refiere a los intervalos construidos con muestras repetidas, bajo los supuestos del modelo.",
        ),
        (
            "En una distribución normal, la media y la mediana son…",
            ["Siempre cero", "Independientes", "Iguales"],
            "La simetría hace que la media y la mediana coincidan.",
        ),
        (
            "Con el mismo modelo, una muestra mayor suele producir un intervalo de confianza…",
            ["Más estrecho", "Más amplio", "Exactamente igual"],
            "Más datos suelen reducir el error estándar; los supuestos de cobertura siguen siendo necesarios.",
        ),
    ],
    6: [
        (
            "¿En qué orden se extraen los elementos de una pila?",
            [
                "Primero en entrar, primero en salir",
                "Último en entrar, primero en salir",
                "Aleatorio",
            ],
            "Una pila extrae el elemento que se añadió más recientemente.",
        ),
        (
            "¿Qué estructura corresponde a una fila de atención por orden de llegada?",
            ["Pila", "Conjunto", "Cola"],
            "Una cola atiende primero al elemento que llegó antes.",
        ),
        (
            "Se añade A y después B a una pila. ¿Qué se extrae primero?",
            ["B", "A", "Ambos"],
            "B se añadió al final, por lo que se extrae primero.",
        ),
        (
            "Se añade A y después B a una cola. ¿Qué se extrae primero?",
            ["B", "A", "Ninguno"],
            "A llegó primero y se extrae primero.",
        ),
    ],
}


def translation_for(prompt):
    from .learning import BANK

    for sid, (_, questions) in BANK.items():
        for index, question in enumerate(questions):
            if question[0] == prompt:
                return ES_BANK[sid][index]
    return None


def localize_check(db, payload, language):
    from .learning import get_check

    booking = db.execute(
        "SELECT session_id FROM bookings WHERE id=?", (payload["booking_id"],)
    ).fetchone()
    check = get_check(db, booking[0], payload["stage"])
    publication = db.execute(
        """SELECT p.language,p.mode,p.id FROM studio_check_sources s JOIN studio_publications p ON p.id=s.publication_id
                               WHERE s.check_id=?""",
        (check["id"],),
    ).fetchone()
    subject = db.execute(
        "SELECT s.name FROM subjects s JOIN sessions x ON x.subject_id=s.id WHERE x.id=?",
        (booking[0],),
    ).fetchone()
    payload["course"] = subject[0]
    payload["topics"] = [
        r[0]
        for r in db.execute(
            "SELECT t.name FROM topics t JOIN session_topics st ON st.topic_id=t.id WHERE st.session_id=?",
            (booking[0],),
        )
    ]
    if publication:
        payload.update(
            content_language=publication["language"],
            provenance=publication["mode"],
            professor_reviewed=True,
            publication_id=publication["id"],
        )
        # Published content retains its professor-approved language, independent of interface language.
        return payload
    payload.update(
        content_language=language,
        provenance="curated-synthetic",
        professor_reviewed=False,
    )
    if language == "es":
        for question in payload["questions"]:
            translated = translation_for(question["prompt"])
            if translated:
                prompt, options, explanation = translated
                question["prompt"] = prompt
                for option, label in zip(question["options"], options):
                    option["label"] = label
                if "explanation" in question:
                    question["explanation"] = explanation
    return payload
