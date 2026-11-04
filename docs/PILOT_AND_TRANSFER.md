# A realistic institutional pilot

ClassAll is a local synthetic prototype for universities, community colleges and vocational institutions that want students to find peer support and educators to respond to shared learning needs. Learners, approved peer tutors, responsible faculty and a small coordinating team are the initial user groups. No customers, partnerships or validated outcomes are claimed.

## Value and challenge fit

The proposed value is a shorter path from “I need help” to an available peer/group opportunity, with private reflection and limited checks informing human-led teaching support. Challenge 05 is addressed through early recognition of **support needs**, understandable aggregate evidence and a recorded support action. This is not an individual academic-risk detector. Voluntary participation is selective; demand is not proof of difficulty and descriptive score changes are not validated gains. The implementation has deterministic rules, not an AI component.

## Proposed pilot

Start with one institution, two volunteer courses, a faculty coordinator and a small set of trained tutors for one teaching block (approximately six to eight weeks). These are proposed design choices, not existing deployments. Establish baseline support access and participant needs before rollout. Co-design terminology and accessibility with learners, including students using mobile devices and assistive technology. Participation and checks should stay optional, with equivalent non-digital support routes.

An initial supervised synthetic rehearsal should validate operations. A real-data pilot requires institutional approval, verified identities, security and data-protection review, agreed retention/deletion and a support/moderation process. Assign a named owner for content, tutor approval, incident handling and technical operations. Faculty should review aggregate suggestions at an agreed cadence; there is no automatic individual intervention.

## Adoption barriers and mitigations

| Likely barrier | Pilot response |
| --- | --- |
| Low participation / biased self-selection | Explain the benefit, preserve choice, collect qualitative feedback and report participation denominators |
| Tutor supply and reliability | Faculty-reviewed subject approvals, training, clear cancellation rules and a staffed support route |
| Privacy or surveillance concerns | Minimal data, student access to their own records, restricted aggregate access, no rankings; consult learners and the data protection officer |
| Digital access or disability | Lightweight system fonts/local assets, mobile/keyboard review, translated language, low-bandwidth testing and offline alternatives |
| Faculty workload | Focused course summaries, small number of reviewed indicators and explicit follow-up ownership |
| Existing LMS and identity systems | Define a later integration boundary; do not duplicate student records or infer production identity from this demo |

## Technical and privacy requirements

The prototype runs on Python 3.12+, Node 22.12+, SQLite and modest local hardware with a browser. There are no runtime AI, paid API, cloud storage or external font requirements. SQLite is appropriate for the local demo. A networked pilot needs HTTPS hosting, backup/restore validation, monitoring, patching, secrets management, restricted administration and a proper same-origin reverse proxy. Choose a supported database and concurrency strategy based on actual load tests, not a hypothetical scale claim.

Replace `X-Demo-User-Id` with institution-approved authentication and server-side authorization, verified enrollment/course assignments and governed tutor approvals. Add organization boundaries, session/CSRF protections as appropriate, abuse controls/rate limits, audit trails and secure recovery. Demo-only completion simulation must be disabled or isolated from genuine records.

Before collecting educational data, document purpose, lawful basis, access, retention, withdrawal/deletion behavior, processor responsibilities and incident response. Assess the applicable student-data law and, where relevant, GDPR with institutional counsel. Design aggregates against small-cell disclosure and differencing attacks: the demo minimum of three is **not adequate production anonymization**. Snapshots also require retention and disclosure controls. Never publish real learner names in a public catalog or expose private checks to faculty. Consent alone should not substitute for an institutional legal/data-protection assessment.

## Proposed evaluation

Report adoption and equity by appropriately protected cohorts, without public rankings. Useful process metrics include voluntary participation, request-to-opportunity time, open demand, available/used places, booking and cancellation rates, tutor reliability, action follow-up completion, usability/accessibility findings, learner perceptions of safety and faculty workload. Report missingness and self-selection explicitly. Evaluate perceived usefulness and learning with reviewed instruments; a two-question before/after check cannot establish intervention effectiveness. Any causal evaluation requires an appropriate design and ethical review. No results are asserted here.

## Operating in low-resource settings

A supervised local installation can support demonstrations without Docker, cloud accounts or paid integrations. For shared use, institutional hosting and reliable backups are still necessary. Keep dependencies maintained, use bundled assets, compress requests, and validate on lower-powered devices and poor connections. Offline operation, conflict-aware synchronization, localization and SMS are not implemented; offer staffed alternatives rather than claiming these capabilities.

## Maintenance and scope

Budget staff time for tutor/content review, moderation, accessibility testing, secure updates, backups and support. Test migration against a restored copy before upgrading real data and rehearse rollback at the application level while preserving database compatibility. Agree ownership of incident response and sustainability before expanding courses.

Future work includes real identity/approval applications, institution boundaries, reviewed assessment banks, privacy-preserving aggregation, moderation, attendance verification and carefully authorized LMS/calendar integrations. Grade-based early-warning or AI claims would require new evidence, validation, governance and a separate product decision. There is no current accreditation, customer validation, financial projection or university endorsement.
