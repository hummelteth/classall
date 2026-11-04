import { t as tr } from "../lib/i18n";
import { ErrorState, Loading } from "./ui";
import { Link } from "react-router-dom";
import { HeartHandshake, Users, ArrowUpRight } from "lucide-react";
import { useDemo } from "../lib/demo";
import { useRemote, dateLabel } from "../lib/api";
import type { StudyGroup, SupportRequest } from "../lib/types";
export function LearningConnections() {
  const { user, version } = useDemo();
  const groups = useRemote<StudyGroup[]>("/groups?mine=true", user.id, version);
  const requests = useRemote<SupportRequest[]>(
    "/support-requests",
    user.id,
    version,
  );
  const joined =
    groups.data?.filter(
      (g) => g.status === "active" && new Date(g.starts_at) > new Date(),
    ) ?? [];
  return (
    <section className="connections-strip">
      <div>
        <HeartHandshake size={25} />
        <h2>{tr("What are you working on?")}</h2>
        <p>
          {tr(
            "A quick, optional topic check-in can help you find your next step.",
          )}
        </p>
        <Link className="button secondary small" to="/app/pulse">
          {tr("Check in with Learning Pulse ")}
          <ArrowUpRight size={15} />
        </Link>
        {requests.error && (
          <ErrorState message={tr(requests.error)} retry={requests.retry} />
        )}
        {requests.data && (
          <small>
            {requests.data.filter((r) => r.status === "open").length}
            {tr(" open support requests")}
          </small>
        )}
      </div>
      <div>
        <Users size={25} />
        <h2>{tr("Your study circles")}</h2>
        {groups.loading ? (
          <Loading label={tr("Loading your study circles")} />
        ) : groups.error ? (
          <ErrorState message={groups.error} retry={groups.retry} />
        ) : (
          <p>
            {joined.length
              ? tr("{{0}} upcoming {{1}} in your learning space.", {
                  0: joined.length,
                  1: joined.length === 1 ? tr("group") : tr("groups"),
                })
              : tr("A shared question is a good place to start.")}
          </p>
        )}
        {joined.slice(0, 2).map((g) => (
          <small key={g.id}>
            {g.title} · {dateLabel(g.starts_at)}
          </small>
        ))}
        <Link className="button secondary small" to="/app/groups?mine=true">
          {tr("View my groups ")}
          <ArrowUpRight size={15} />
        </Link>
      </div>
    </section>
  );
}
