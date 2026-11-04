import { Link, Route, Routes } from "react-router-dom";
import { DemoProvider } from "./lib/demo";
import Shell from "./components/Shell";
import Landing from "./Landing";
import { Catalog } from "./pages/Catalog";
import { Groups } from "./pages/Groups";
import { Impact } from "./pages/Impact";
import { MySessions } from "./pages/MySessions";
import { LearningCheck } from "./pages/LearningCheck";
import { Overview } from "./pages/Overview";

export default function App() {
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
      </Route>
      <Route
        path="*"
        element={
          <main className="connection-screen">
            <span className="eyebrow">A SMALL DETOUR</span>
            <h1>Let’s find your way back.</h1>
            <p>
              This page doesn’t exist. Your learning community is right here.
            </p>
            <Link to="/" className="button primary">
              Back to ClassAll
            </Link>
          </main>
        }
      />
    </Routes>
  );
}
