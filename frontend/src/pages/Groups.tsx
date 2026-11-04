import { Link } from "react-router-dom";
import { ArrowRight, HeartHandshake, ShieldCheck, Users } from "lucide-react";
import { PageTitle } from "../components/PageTitle";

export function Groups() {
  return (
    <>
      <PageTitle
        eyebrow="MORE WAYS TO LEARN TOGETHER"
        title="Good company. Shared curiosity."
        description="A future home for informal revision circles and collaborative study."
      />
      <section className="groups-preview">
        <span className="pill neutral">PLANNED FEATURE · NOT ACTIVE</span>
        <div className="group-circles" aria-hidden="true">
          <span className="tone-peach">A</span>
          <span className="tone-violet">B</span>
          <span className="tone-sage">C</span>
          <span className="group-spark">✳</span>
        </div>
        <h2>Find your study people.</h2>
        <p>
          Study groups will offer student-led spaces to practise, revise and
          learn at your own pace. Group creation, membership and messaging are
          not available yet.
        </p>
        <Link className="button primary" to="/app/explore">
          Explore working tutoring sessions
          <ArrowRight size={17} />
        </Link>
      </section>
      <div className="group-principles">
        <div>
          <Users size={23} />
          <h3>Student led</h3>
          <p>Informal groups, shaped by shared goals.</p>
        </div>
        <div>
          <HeartHandshake size={23} />
          <h3>Everyone belongs</h3>
          <p>Collaborate without tutor qualifications.</p>
        </div>
        <div>
          <ShieldCheck size={23} />
          <h3>Thoughtfully designed</h3>
          <p>Privacy and moderation before campus rollout.</p>
        </div>
      </div>
    </>
  );
}
