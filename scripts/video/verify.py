"""Read-only persisted-story checks against the isolated take database."""
import json
import sqlite3
import sys
from pathlib import Path

def verify(database, output):
    db = sqlite3.connect(Path(database).resolve().as_uri() + '?mode=ro', uri=True)
    db.row_factory = sqlite3.Row
    def rows(sql):
        return [dict(row) for row in db.execute(sql)]
    def require(sql, message):
        result = rows(sql)
        if not result:
            raise RuntimeError(message)
        return result
    require("SELECT * FROM presentation_scenario", 'Not a presentation database')
    report = {}
    report['pulse'] = require("SELECT * FROM learning_pulses WHERE learner_id=1 AND topic_id=1 AND response='support'", 'Laura pulse missing')
    report['request'] = require("SELECT * FROM support_requests WHERE learner_id=1 AND topic_id=1", 'Help request missing')
    report['application'] = require("SELECT id,status,reviewer_id,comments FROM tutor_applications WHERE applicant_id=2 AND subject_id=1 AND status='approved' AND reviewer_id=3", 'Human approval missing')
    require('SELECT * FROM tutor_approvals WHERE tutor_id=2 AND subject_id=1', 'Subject authorization missing')
    session = require("SELECT * FROM sessions WHERE title='Regla de la cadena: aprender juntos' AND tutor_id=2", 'New session missing')
    if len(session) != 1:
        raise RuntimeError('Expected exactly one new session')
    sid = session[0]['id']
    report['session'] = session
    report['booking'] = require(f"SELECT * FROM bookings WHERE session_id={sid} AND learner_id=1 AND status='confirmed'", 'Booking missing')
    report['precheck'] = require(f"SELECT a.* FROM assessment_submissions a JOIN bookings b ON b.id=a.booking_id JOIN learning_checks c ON c.id=a.check_id WHERE b.session_id={sid} AND b.learner_id=1 AND c.stage='pre'", 'Saved precheck missing')
    report['attendance'] = require(f"SELECT * FROM session_attendance WHERE session_id={sid} AND learner_id=1 AND confirmed_at IS NOT NULL AND provenance='synthetic-two-party'", 'Two-party confirmation missing')
    report['feedback'] = require(f'SELECT * FROM session_feedback WHERE session_id={sid} AND learner_id=1', 'Feedback missing')
    ledger = rows('SELECT * FROM contribution_ledger WHERE tutor_id=2 ORDER BY id')
    historical = sum(r['points'] for r in ledger if r['provenance']=='legacy-synthetic-history')
    new = [r for r in ledger if r['session_id']==sid]
    assert historical == 40, ledger
    assert len(new)==1 and new[0]['points']==20, ledger
    assert sum(r['points'] for r in ledger)==60, ledger
    report['ledger'] = ledger
    report['total_points'] = sum(r['points'] for r in ledger)
    report['support_action'] = require("SELECT * FROM support_actions WHERE professor_id=3 AND rationale LIKE 'La demanda agregada%'", 'Faculty action missing')
    assert json.loads(report['support_action'][0]['evidence']), 'Aggregate evidence missing'
    report['foreign_key_errors'] = rows('PRAGMA foreign_key_check')
    assert not report['foreign_key_errors']
    records = json.loads((Path(output)/'recording.json').read_text())
    expected = 9 if records[0].get('version') == 2 else 8
    assert [r['number'] for r in records] == list(range(1,expected+1))
    if expected == 9:
        assert all(r.get('version') == 2 for r in records)
        assert all(any(e['type']=='click' and e['trusted'] for e in r['events']) for r in records[1:8])
        action = report['support_action'][0]
        evidence = json.loads(action['evidence'])
        assert action['topic_id'] == 1 and action['action_type'] == 'practice'
        assert evidence['topic']['id'] == 1 and evidence['human_review_required'] and evidence['synthetic']
        assert evidence['participants'] == db.execute('SELECT COUNT(*) FROM learning_pulses WHERE topic_id=1 AND active=1').fetchone()[0]
        requests = db.execute("SELECT COUNT(DISTINCT learner_id) FROM support_requests WHERE topic_id=1 AND status='open'").fetchone()[0]
        assert evidence['open_requests'] == (requests if requests >= 3 else None)
        assert evidence['learning_checks']['topic']['id'] == 1
        assert evidence['captured_at']
        # Recompute the complete available evidence on this same read-only
        # connection; importing service helpers does not start the application.
        sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'backend'))
        from app.connected import topic_signal
        from app.learning import topic_insights
        from datetime import datetime
        from unittest.mock import patch
        captured = datetime.fromisoformat(evidence['captured_at'])
        assert captured.tzinfo is not None
        class SnapshotClock(datetime):
            @classmethod
            def now(cls, tz=None):
                return captured.astimezone(tz) if tz else captured.replace(tzinfo=None)
        # Availability is evaluated at the saved decision time, so checking an
        # archived take weeks later does not make historical evidence invalid.
        with patch('app.repository.datetime', SnapshotClock), patch('app.learning.datetime', SnapshotClock):
            expected_evidence = topic_signal(db, 1)
            expected_evidence['learning_checks'] = next(t for t in topic_insights(db, 3, 1) if t['topic']['id'] == 1)
        assert {k: v for k, v in evidence.items() if k != 'captured_at'} == expected_evidence, 'Saved evidence disagrees with the available aggregate state'
        report['v2_evidence_verified'] = True
    for record in records:
        assert (Path(output)/'raw'/f"scene-{record['number']:02}.webm").stat().st_size > 1000
    (Path(output)/'state-qa.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f'PASS: {expected} scenes and persisted pulse, request, approval, booking, precheck, two-party attendance, feedback, 40 + 20 = 60 points, faculty evidence.')

if __name__=='__main__':
    verify(*sys.argv[1:])
