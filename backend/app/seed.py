"""Fictional personas and course data. Dates are relative to first initialization."""

import json
from datetime import datetime, timedelta, timezone


def seed(db):
    if db.execute("SELECT COUNT(*) FROM users").fetchone()[0]:
        return
    users = [
        (1, "Laura Martín", "learner", "Computer Science", "LM", "peach", "Year 2"),
        (2, "David Chen", "tutor", "Applied Mathematics", "DC", "violet", "Year 4"),
        (
            3,
            "Professor Elena García",
            "professor",
            "Mathematics Department",
            "EG",
            "sage",
            "Faculty",
        ),
        (4, "Amira Hassan", "tutor", "Computer Science", "AH", "peach", "Year 3"),
        (5, "Leo Fischer", "tutor", "Physics", "LF", "sage", "Year 4"),
        (6, "Sofia Costa", "tutor", "Business & Economics", "SC", "rose", "Year 3"),
        (7, "Noah Williams", "learner", "Computer Science", "NW", "sage", "Year 2"),
        (8, "Maya Patel", "learner", "Engineering", "MP", "violet", "Year 1"),
    ]
    db.executemany("INSERT INTO users VALUES (?,?,?,?,?,?,?)", users)
    subjects = [
        (1, "Mathematics", "MATH 201", "Sciences", "violet", "∑"),
        (2, "Computer Science", "CS 102", "Technology", "peach", "</>"),
        (3, "Physics", "PHYS 101", "Sciences", "sage", "↗"),
        (4, "Economics", "ECON 201", "Social Sciences", "rose", "↔"),
        (5, "Statistics", "STAT 101", "Sciences", "sand", "μ"),
    ]
    db.executemany("INSERT INTO subjects VALUES (?,?,?,?,?,?)", subjects)
    db.executemany(
        "INSERT INTO tutor_approvals VALUES (?,?)",
        [(2, 1), (2, 5), (4, 2), (5, 3), (6, 4)],
    )
    day = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

    def at(offset, hour):
        return (day + timedelta(days=offset, hours=hour)).isoformat()

    sessions = [
        (
            1,
            2,
            1,
            "Make sense of the chain rule",
            "Derivatives don’t have to be a mystery. Let’s break the chain rule into small, intuitive steps and practise together.",
            [
                "Recognise composite functions",
                "Apply the chain rule step by step",
                "Work through three practice problems",
            ],
            at(1, 14),
            60,
            6,
            "In person",
            "Library · Room 2.04",
            "Beginner",
            "upcoming",
        ),
        (
            2,
            4,
            2,
            "Python: from loops to “I get it”",
            "Build your confidence with loops, functions and a few practical problems. Bring your curiosity; no perfect code required.",
            [
                "Trace a for loop",
                "Write a reusable function",
                "Debug a small Python program",
            ],
            at(1, 16),
            60,
            5,
            "Online",
            "Online · demo only; no meeting link",
            "Beginner",
            "upcoming",
        ),
        (
            3,
            5,
            3,
            "A fresh look at Newton’s laws",
            "Turn forces and motion into something you can picture. We’ll draw, discuss and solve problems at your pace.",
            [
                "Draw a free-body diagram",
                "Apply Newton’s second law",
                "Connect forces to everyday motion",
            ],
            at(2, 10),
            90,
            8,
            "In person",
            "Science Building · Room 1.12",
            "Beginner",
            "upcoming",
        ),
        (
            4,
            6,
            4,
            "Supply, demand & the bigger picture",
            "Explore how markets find their balance, with real-world examples and space for all your questions.",
            [
                "Sketch supply and demand curves",
                "Explain equilibrium shifts",
                "Solve a market scenario",
            ],
            at(2, 15),
            60,
            6,
            "Online",
            "Online · demo only; no meeting link",
            "Intermediate",
            "upcoming",
        ),
        (
            5,
            2,
            5,
            "Statistics without the stress",
            "A friendly introduction to distributions and confidence intervals. Make the numbers tell a story.",
            [
                "Interpret a normal distribution",
                "Explain a confidence interval",
                "Choose an appropriate summary statistic",
            ],
            at(3, 11),
            60,
            5,
            "In person",
            "Library · Room 2.06",
            "Beginner",
            "upcoming",
        ),
        (
            6,
            4,
            2,
            "Untangle your data structures",
            "Lists, stacks and queues, made visual. Work through the patterns that make your code click.",
            [
                "Compare stacks and queues",
                "Choose a data structure",
                "Reason about basic time complexity",
            ],
            at(4, 14),
            90,
            4,
            "In person",
            "Innovation Hub · Lab 3",
            "Intermediate",
            "upcoming",
        ),
        (
            7,
            2,
            1,
            "Calculus foundations: a recap",
            "Completed synthetic session on limits and derivatives.",
            ["Interpret a limit", "Differentiate a polynomial"],
            at(-5, 14),
            60,
            6,
            "In person",
            "Library · Room 2.04",
            "Beginner",
            "completed",
        ),
        (
            8,
            2,
            1,
            "Derivatives in everyday life",
            "Completed synthetic session on rates of change.",
            ["Describe a rate of change", "Interpret a derivative"],
            at(-2, 14),
            60,
            6,
            "In person",
            "Library · Room 2.04",
            "Beginner",
            "completed",
        ),
    ]
    db.executemany(
        "INSERT INTO sessions VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
        [(*s[:5], json.dumps(s[5]), *s[6:]) for s in sessions],
    )
    now = datetime.now(timezone.utc).isoformat()
    db.executemany(
        "INSERT INTO bookings(session_id,learner_id,status,created_at) VALUES (?,?,?,?)",
        [
            (1, 7, "confirmed", now),
            (1, 8, "confirmed", now),
            (2, 7, "confirmed", now),
            (3, 8, "confirmed", now),
            (4, 7, "confirmed", now),
            (5, 8, "confirmed", now),
            (6, 7, "confirmed", now),
            (7, 1, "confirmed", now),
            (8, 1, "confirmed", now),
        ],
    )
