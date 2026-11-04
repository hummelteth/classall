import { t as tr } from "../lib/i18n";
import { Link } from "react-router-dom";
import { PageTitle } from "../components/PageTitle";
import { LearningProgress } from "../components/LearningProgress";
import { ContributionPortfolio } from "../components/CoreExperience";
import { useDemo } from "../lib/demo";
import { ProfessorHome } from "./ProfessorHome";
export function Impact() {
  const { user } = useDemo();
  if (user.role === "professor") return <ProfessorHome />;
  return (
    <>
      <PageTitle
        eyebrow={tr("MY LEARNING & IMPACT")}
        title={tr("Your contribution has a story.")}
        description={tr(
          "Your private learning history and documented contributions, together.",
        )}
      />
      <ContributionPortfolio />
      <LearningProgress />
      <Link className="button secondary" to="/app/applications">
        {tr("Become a Tutor")}
      </Link>
    </>
  );
}
