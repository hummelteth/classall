import { t as tr } from "../lib/i18n";
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
                <h4>
                  {tr(s.topic.name)}
                  {tr(" · voluntary check-ins")}
                </h4>
                <p>
                  {s.participants}
                  {tr(" participating learners ·")}{" "}
                  {s.open_requests ?? tr("Suppressed (<3)")}
                  {tr(" open support requests")}
                </p>
                {s.suppressed ? (
                  <p className="fine-print">
                    {tr(
                      "Response distribution suppressed: fewer than 3 participants.",
                    )}
                  </p>
                ) : (
                  <div className="pulse-distribution">
                    {Object.entries(s.distribution ?? {}).map(([key, n]) => (
                      <span key={key}>
                        <strong>{n}</strong>
                        {
                          {
                            confident: tr("Feel confident"),
                            practice: tr("Want more practice"),
                            support: tr("Would like support"),
                          }[key]
                        }
                      </span>
                    ))}
                  </div>
                )}
                <p>
                  {s.tutoring_places}
                  {tr(" tutoring places · ")}
                  {s.study_group_places} {tr("study group places available")}
                </p>
                <div className="teaching-advice">
                  <span className="pill neutral">
                    {tr("Advisory · Human review required")}
                  </span>
                  <h4>{tr(s.recommendation)}</h4>
                  <details>
                    <summary>{tr("Why this suggestion?")}</summary>
                    <p>{tr(s.rule)}</p>
                    <p>{tr(s.missing_data)}</p>
                    <p>
                      {tr(
                        "Three-person suppression is illustrative, not production-ready privacy protection. Pulse, explicit demand and Learning Checks are different forms of evidence. Repeated check-ins count once per learner and topic.",
                      )}
                    </p>
                  </details>
                  <Link
                    className="button primary"
                    to={`/app/actions?topic=${s.topic.id}`}
                  >
                    {tr("Plan a support action")}
                  </Link>
                </div>
              </section>
            ))}
        </div>
      )}
    </RemoteContent>
  );
}
