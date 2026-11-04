import { t as tr } from "./lib/i18n";
import { useLanguage, useLocalizedValidation } from "./lib/i18n";
import { lazy, Suspense } from "react";
import { Loading } from "./components/ui";
import { Link, Route, Routes } from "react-router-dom";
import { DemoProvider, useDemo } from "./lib/demo";
import Shell from "./components/Shell";
import Landing from "./Landing";
import { Catalog } from "./pages/Catalog";
import { Groups } from "./pages/Groups";
import { Impact } from "./pages/Impact";
import { MySessions } from "./pages/MySessions";
import { LearningCheck } from "./pages/LearningCheck";
import { Pulse } from "./pages/Pulse";
import { Teaching } from "./pages/Teaching";
import { ProfessorHome } from "./pages/ProfessorHome";
import { SupportActions } from "./pages/SupportActions";
import { Overview } from "./pages/Overview";

const Studio = lazy(() =>
  import("./pages/Studio").then((module) => ({ default: module.Studio })),
);
const Applications = lazy(() =>
  import("./pages/Applications").then((module) => ({
    default: module.Applications,
  })),
);

export default function App() {
  useLanguage();
  useLocalizedValidation();
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route
        path="/app"
        element={
          <DemoProvider>
            <Shell />
          </DemoProvider>
        }
      >
        <Route index element={<Overview />} />
        <Route path="explore" element={<Catalog />} />
        <Route path="sessions" element={<MySessions />} />
        <Route path="impact" element={<Impact />} />
        <Route path="checks/:bookingId/:stage" element={<LearningCheck />} />
        <Route path="groups" element={<Groups />} />
        <Route path="pulse" element={<Pulse />} />
        <Route path="teaching" element={<Teaching />} />
        <Route path="publish" element={<Teaching initialCreate />} />
        <Route
          path="applications"
          element={
            <Suspense fallback={<Loading label={tr("Loading…")} />}>
              <Applications />
            </Suspense>
          }
        />
        <Route
          path="studio"
          element={
            <Suspense
              fallback={<Loading label={tr("Opening AI Learning Studio")} />}
            >
              <Studio />
            </Suspense>
          }
        />
        <Route path="courses" element={<FacultyPage mode="courses" />} />
        <Route path="insights" element={<FacultyPage mode="insights" />} />
        <Route path="actions" element={<SupportActions />} />
      </Route>
      <Route
        path="*"
        element={
          <main className="connection-screen">
            <span className="eyebrow">{tr("A SMALL DETOUR")}</span>
            <h1>{tr("Let’s find your way back.")}</h1>
            <p>
              {tr(
                "This page doesn’t exist. Your learning community is right here.",
              )}
            </p>
            <Link to="/" className="button primary">
              {tr("Back to ClassAll")}
            </Link>
          </main>
        }
      />
    </Routes>
  );
}

function FacultyPage({ mode }: { mode: "courses" | "insights" }) {
  const { user } = useDemo();
  return user.role === "professor" ? (
    <ProfessorHome mode={mode} />
  ) : (
    <Overview />
  );
}
