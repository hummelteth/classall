import { Link } from "react-router-dom";
import { useDemo } from "../lib/demo";
import { useRemote } from "../lib/api";
import { RemoteContent } from "./ConnectedUI";
import type { SupportSignal } from "../lib/types";
export function PulseInsights({ subjectId }: { subjectId: number }) {
  const { user, version } = useDemo();
  const remote = useRemote<SupportSignal[]>(
    "/professor/signals",
    user.id,
    version,
  );
  return (
    <RemoteContent remote={remote}>
      {(data) => (
        <div className="pulse-insights">
          {data
            .filter((s) => s.topic.subject_id === subjectId)
            .map((s) => (
              <section key={s.topic.id}>
                <h4>{s.topic.name} · voluntary check-ins</h4>
                <p>
                  {s.participants} participating learners ·{" "}
                  {s.open_requests ?? "Suppressed (<3)"} open support requests
                </p>
                {s.suppressed ? (
                  <p className="fine-print">
                    Response distribution suppressed: fewer than 3 participants.
                  </p>
                ) : (
                  <div className="pulse-distribution">
                    {Object.entries(s.distribution ?? {}).map(([key, n]) => (
                      <span key={key}>
                        <strong>{n}</strong>
                        {
                          {
                            confident: "Feel confident",
                            practice: "Want more practice",
                            support: "Would like support",
                          }[key]
                        }
                      </span>
                    ))}
                  </div>
                )}
                <p>
                  {s.tutoring_places} tutoring places · {s.study_group_places}{" "}
                  study group places available
                </p>
                <div className="teaching-advice">
                  <span className="pill neutral">
                    Advisory · Human review required
                  </span>
                  <h4>{s.recommendation}</h4>
                  <details>
                    <summary>Why this suggestion?</summary>
                    <p>{s.rule}</p>
                    <p>{s.missing_data}</p>
                    <p>
                      Three-person suppression is illustrative, not
                      production-ready privacy protection. Pulse, explicit
                      demand and Learning Checks are different forms of
                      evidence. Repeated check-ins count once per learner and
                      topic.
                    </p>
                  </details>
                  <Link
                    className="text-link"
                    to={`/app/actions?topic=${s.topic.id}`}
                  >
                    Plan a support action
                  </Link>
                </div>
              </section>
            ))}
        </div>
      )}
    </RemoteContent>
  );
}
