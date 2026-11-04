import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  FileText,
  Sparkles,
  Upload,
} from "lucide-react";
import { PageTitle } from "../components/PageTitle";
import { ErrorState, Loading } from "../components/ui";
import { request, useRemote } from "../lib/api";
import { useDemo } from "../lib/demo";
import type { Subject, Topic } from "../lib/types";
import { t as tr, useLanguage } from "../lib/i18n";

type Passage = { id: string; page: number; text: string };
type Document = {
  id: string;
  subject_id: number;
  filename: string;
  pages: number;
  passages: Passage[];
};
type Objective = { id: string; description: string };
type AnalysisContent = {
  topics: {
    title: string;
    concepts: string[];
    summary: string;
    objectives: Objective[];
    passage_ids: string[];
  }[];
};
type AnalysisDraft = {
  id: number;
  document_id: string;
  status: string;
  content: AnalysisContent;
  mode: string;
};
type Question = {
  stage: "pre" | "post";
  prompt: string;
  options: string[];
  correct_index: number;
  explanation: string;
  objective_id: string;
  passage_id: string;
  difficulty: string;
  language: string;
};
type Item = {
  id: number;
  content: Question;
  status: string;
  revision: number;
  source: Passage;
};
type Assessment = {
  id: number;
  document_id: string;
  topic_id: number;
  status: string;
  mode: string;
  language: string;
  questions: Item[];
  objectives: Objective[];
};
type Workspace = {
  courses: Subject[];
  documents: Document[];
  analyses: AnalysisDraft[];
  assessments: Assessment[];
  publications: { id: number; assessment_id: number }[];
  sessions: {
    id: number;
    title: string;
    topic_id: number;
    has_submissions: boolean;
    assigned: boolean;
  }[];
};

export function Studio() {
  const { user } = useDemo();
  if (user.role !== "professor")
    return (
      <p className="info-box">
        {tr("Choose the Professor demo role to open AI Learning Studio.")}
      </p>
    );
  return <StudioWorkspace key={user.id} />;
}

function StudioWorkspace() {
  const { user } = useDemo();
  const language = useLanguage();
  const [version, setVersion] = useState(0);
  const remote = useRemote<Workspace>("/studio/workspace", user.id);
  const connection = useRemote<{
    available: boolean;
    model: string;
    demo_enabled: boolean;
    reason?: string;
  }>("/studio/status", user.id, version);
  const topics = useRemote<Topic[]>("/learning/topics");
  const [course, setCourse] = useState(1);
  const [did, setDid] = useState("");
  const document = useRemote<Document>(
    `/studio/documents/${did}`,
    user.id,
    0,
    !!did,
  );
  const [passages, setPassages] = useState<string[]>([]);
  const [contentLanguage, setContentLanguage] = useState("en");
  const [analysisId, setAnalysisId] = useState<number | null>(null);
  const [assessmentId, setAssessmentId] = useState<number | null>(null);
  const [topic, setTopic] = useState(1);
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState("introductory");
  const [count, setCount] = useState(2);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [session, setSession] = useState("");
  const uploadRef = useRef<HTMLInputElement>(null);
  const [filename, setFilename] = useState("");
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const [savedWorkspace, setSavedWorkspace] = useState<Workspace | null>(null);
  useEffect(() => {
    if (remote.data) setSavedWorkspace(remote.data);
  }, [remote.data]);
  const data = savedWorkspace ?? remote.data;
  const analysis = data?.analyses.find((a) => a.id === analysisId);
  const assessment = data?.assessments.find((a) => a.id === assessmentId);
  const publication = data?.publications.find(
    (p) => p.assessment_id === assessmentId,
  );
  useEffect(() => {
    if (document.data)
      setPassages([document.data.passages[0]?.id].filter(Boolean));
  }, [document.data?.id]);
  const run = async <T,>(
    label: string,
    action: (signal: AbortSignal) => Promise<T>,
    done?: (result: T) => void,
  ) => {
    if (busy) return;
    const abort = new AbortController();
    controller.current = abort;
    setBusy(label);
    setError("");
    setNotice("");
    try {
      const result = await action(abort.signal);
      const updated = await request<Workspace>("/studio/workspace", user.id, {
        signal: abort.signal,
      });
      if (!abort.signal.aborted) {
        setSavedWorkspace(updated);
        done?.(result);
        setVersion((v) => v + 1);
      }
    } catch (e) {
      if (!abort.signal.aborted)
        setError(
          e instanceof Error
            ? e.message
            : tr("Something went wrong. Please try again."),
        );
    } finally {
      if (!abort.signal.aborted) setBusy("");
    }
  };
  const send = <T,>(
    path: string,
    body: unknown,
    signal: AbortSignal,
    method = "POST",
  ) =>
    request<T>(`/studio${path}`, user.id, {
      method,
      body: JSON.stringify(body),
      signal,
    });
  const openDemo = () =>
    run(
      tr("Opening prepared example…"),
      (signal) =>
        send<{
          document: Document;
          analysis: AnalysisDraft;
          assessment: Assessment;
        }>(`/demo?language=${contentLanguage}`, {}, signal),
      (result) => {
        setCourse(1);
        setTopic(1);
        setDid(result.document.id);
        setAnalysisId(result.analysis.id);
        setAssessmentId(result.assessment.id);
        setConfirmed(false);
        setNotice(
          tr(
            "Prepared example loaded. No live AI generation was performed. Review every question before publishing.",
          ),
        );
      },
    );
  const chooseDocument = (id: string) => {
    setDid(id);
    setAnalysisId(null);
    setAssessmentId(null);
    setConfirmed(false);
    const doc = data?.documents.find((d) => d.id === id);
    if (doc) {
      setCourse(doc.subject_id);
      setTopic(
        topics.data?.find((topic) => topic.subject_id === doc.subject_id)?.id ??
          0,
      );
    }
  };
  if (remote.loading && !data)
    return <Loading label={tr("Opening AI Learning Studio")} />;
  if (remote.error)
    return <ErrorState message={tr(remote.error)} retry={remote.retry} />;
  return (
    <>
      <PageTitle
        eyebrow={tr("PROFESSOR WORKSPACE · LOCAL AI")}
        title={tr("AI Learning Studio")}
        description={tr(
          "Turn course materials into learning practice, with your expertise at every step.",
        )}
      />
      <div className="studio-status learning-card">
        <span
          className={`studio-light ${connection.data?.available && !connection.data?.demo_enabled ? "online" : ""}`}
        />
        <div>
          <strong>
            {tr(
              connection.data?.demo_enabled
                ? "Prepared demo mode"
                : connection.data?.available
                  ? "Local AI connected"
                  : connection.loading
                    ? "Checking local AI…"
                    : "Local AI unavailable",
            )}
          </strong>
          {connection.data && (
            <small className="studio-model">{connection.data.model}</small>
          )}
          {connection.data &&
            !connection.data.available &&
            !connection.data.demo_enabled && (
              <p>
                {tr(
                  connection.data.reason === "model_missing"
                    ? "The configured model is not installed. Check it in Ollama and retry."
                    : "Cannot reach local Ollama. Start Ollama on this computer, or open the prepared example.",
                )}
              </p>
            )}
          <p>
            {tr(
              "Documents stay on this computer. Questions reach learners only after your review.",
            )}
          </p>
        </div>
        <button
          className="button secondary small"
          onClick={connection.retry}
          disabled={!!busy}
        >
          {tr("Check connection")}
        </button>
      </div>
      <ol className="studio-steps" aria-label={tr("Studio workflow")}>
        {[
          tr("Upload"),
          tr("Analyze"),
          tr("Generate"),
          tr("Review"),
          tr("Publish"),
        ].map((step, i) => (
          <li key={step}>
            <span>{i + 1}</span>
            {tr(step)}
          </li>
        ))}
      </ol>
      <div className="studio-demo info-box">
        <BookOpen size={22} />
        <div>
          <strong>{tr("Ready for a presentation?")}</strong>
          <p>
            {tr(
              "Explore a prepared bilingual example without waiting for the local model. It still requires your approval.",
            )}
          </p>
        </div>
        <button
          className="button secondary"
          disabled={!!busy}
          onClick={openDemo}
        >
          {tr("Open prepared example")}
        </button>
      </div>
      <label className="studio-language">
        {tr("Educational content language")}
        <select
          aria-label={tr("Educational content language")}
          value={contentLanguage}
          onChange={(e) => setContentLanguage(e.target.value)}
        >
          <option value="en">{tr("English")}</option>
          <option value="es">{tr("Español")}</option>
        </select>
        <small>{tr("Independent of your interface language.")}</small>
      </label>
      {busy && (
        <div role="status" className="info-box studio-progress">
          <span className="spinner" />
          {tr(busy)}{" "}
          {tr(
            "Local inference may take a few minutes. You can continue reading this page.",
          )}
        </div>
      )}
      {error && (
        <p className="form-error" role="alert">
          {tr(error)}
        </p>
      )}
      {notice && (
        <p className="info-box" role="status">
          {tr(notice)}
        </p>
      )}
      <div className="studio-layout">
        <section className="learning-card studio-panel">
          <h2>
            <Upload size={20} />
            {tr("1. Course materials")}
          </h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const file = uploadRef.current?.files?.[0];
              if (!file) return;
              const form = new FormData();
              form.append("subject_id", String(course));
              form.append("file", file);
              run(
                tr("Extracting PDF text…"),
                (signal) =>
                  request<Document>("/studio/documents", user.id, {
                    method: "POST",
                    body: form,
                    signal,
                  }),
                (result) => {
                  setDid(result.id);
                  setAnalysisId(null);
                  setAssessmentId(null);
                  setNotice(
                    tr("PDF extracted. Select source passages to analyze."),
                  );
                },
              );
            }}
          >
            <label>
              {tr("Assigned course")}
              <select
                value={course}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  setCourse(id);
                  setDid("");
                  setAnalysisId(null);
                  setAssessmentId(null);
                  const first = topics.data?.find((t) => t.subject_id === id);
                  if (first) setTopic(first.id);
                }}
              >
                {data?.courses.map((c) => (
                  <option value={c.id} key={c.id}>
                    {tr(c.name)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {tr("Text-based PDF")}
              <input
                ref={uploadRef}
                aria-label={tr("Text-based PDF")}
                className="studio-native-file"
                onChange={(e) => setFilename(e.target.files?.[0]?.name ?? "")}
                type="file"
                accept="application/pdf,.pdf"
                required
                disabled={!!busy}
              />
              <span className="studio-file-picker">
                <span>{tr("Choose PDF file")}</span>
                <span>{filename || tr("No file selected")}</span>
              </span>
            </label>
            <p className="fine-print">
              {tr(
                "Up to 8 MB and 40 pages. Scanned documents require OCR and cannot be read here.",
              )}
            </p>
            <button className="button primary" disabled={!!busy}>
              <Upload size={16} />
              {tr("Upload PDF")}
            </button>
          </form>
          <label>
            {tr("Saved documents")}
            <select
              value={did}
              onChange={(e) => chooseDocument(e.target.value)}
            >
              <option value="">{tr("Select a document")}</option>
              {data?.documents.map((d) => (
                <option value={d.id} key={d.id}>
                  {d.filename}
                </option>
              ))}
            </select>
          </label>
          {document.error && (
            <ErrorState message={document.error} retry={document.retry} />
          )}
          {document.data && (
            <>
              <h3>
                <FileText size={17} />
                {document.data.filename}
              </h3>
              <p className="fine-print">
                {tr(
                  "Select up to three passages. Short sections work best with local AI.",
                )}
              </p>
              <div className="studio-passages">
                {document.data.passages.map((p) => (
                  <label className="studio-passage" key={p.id}>
                    <input
                      type="checkbox"
                      checked={passages.includes(p.id)}
                      onChange={(e) =>
                        setPassages((ids) =>
                          e.target.checked
                            ? [...ids, p.id].slice(-3)
                            : ids.filter((id) => id !== p.id),
                        )
                      }
                    />
                    <span>
                      <strong>
                        {tr("Page")} {p.page}
                      </strong>
                      <span>{p.text}</span>
                    </span>
                  </label>
                ))}
              </div>
              <button
                className="button primary"
                disabled={
                  !!busy ||
                  !passages.length ||
                  !connection.data?.available ||
                  connection.data?.demo_enabled
                }
                onClick={() =>
                  run(
                    tr("Analyzing selected passages…"),
                    (signal) =>
                      send<AnalysisDraft>(
                        `/documents/${did}/analyze`,
                        { passage_ids: passages, language: contentLanguage },
                        signal,
                      ),
                    (result) => {
                      setAnalysisId(result.id);
                      setAssessmentId(null);
                    },
                  )
                }
              >
                <Sparkles size={16} />
                {tr("Analyze selected passages")}
              </button>
            </>
          )}
        </section>
        <div className="studio-main-column">
          <section className="learning-card studio-panel">
            <h2>
              <BookOpen size={20} />
              {tr("2. Topics & objectives")}
            </h2>
            <label>
              {tr("Saved analyses")}
              <select
                value={analysisId ?? ""}
                onChange={(e) => {
                  setAnalysisId(Number(e.target.value) || null);
                  setSelectedObjectives([]);
                  setAssessmentId(null);
                }}
              >
                <option value="">{tr("Select an analysis")}</option>
                {data?.analyses
                  .filter((a) => a.document_id === did)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      #{a.id} · {tr(a.status)} · {tr(a.mode)}
                    </option>
                  ))}
              </select>
            </label>
            {analysis ? (
              <AnalysisEditor
                key={`${analysis.id}-${version}`}
                analysis={analysis}
                busy={!!busy}
                save={(content, reviewed) =>
                  run(tr("Saving reviewed objectives…"), (signal) =>
                    send(
                      `/analyses/${analysis.id}`,
                      { content, reviewed },
                      signal,
                      "PUT",
                    ),
                  )
                }
              />
            ) : (
              <p>
                {tr(
                  "Upload a document and analyze a short section, or open the prepared example.",
                )}
              </p>
            )}
          </section>
          {analysis && (
            <section className="learning-card studio-panel">
              <h2>
                <Sparkles size={20} />
                {tr("3. Generate a pre/post pair")}
              </h2>
              <p className="fine-print">
                {tr(
                  "Two distinct sets cover the same objectives. Small batches keep local generation practical.",
                )}
              </p>
              <label>
                {tr("Course topic")}
                <select
                  value={topic}
                  onChange={(e) => setTopic(Number(e.target.value))}
                >
                  {topics.data
                    ?.filter((t) => t.subject_id === course)
                    .map((topic) => (
                      <option value={topic.id} key={topic.id}>
                        {tr(topic.name)}
                      </option>
                    ))}
                </select>
              </label>
              <fieldset>
                <legend>{tr("Approved learning objectives")}</legend>
                {analysis.content.topics
                  .flatMap((t) => t.objectives)
                  .map((o) => (
                    <label className="studio-checkbox" key={o.id}>
                      <input
                        type="checkbox"
                        checked={selectedObjectives.includes(o.id)}
                        onChange={(e) =>
                          setSelectedObjectives((ids) =>
                            e.target.checked
                              ? [...ids, o.id]
                              : ids.filter((id) => id !== o.id),
                          )
                        }
                      />
                      {o.description}
                    </label>
                  ))}
              </fieldset>
              <div className="studio-form-row">
                <label>
                  {tr("Difficulty")}
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                  >
                    {["introductory", "intermediate", "advanced"].map((d) => (
                      <option key={d} value={d}>
                        {tr(d)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {tr("Questions per stage")}
                  <input
                    type="number"
                    min="1"
                    max="3"
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                  />
                </label>
              </div>
              <p>
                {tr(
                  "Purpose: pre-session and post-session. Both sets require review before publication.",
                )}
              </p>
              <button
                className="button primary"
                disabled={
                  !!busy ||
                  analysis.status !== "reviewed" ||
                  !selectedObjectives.length ||
                  selectedObjectives.length > count ||
                  !passages.length ||
                  !connection.data?.available ||
                  connection.data?.demo_enabled
                }
                onClick={() =>
                  run(
                    tr("Generating pre/post questions…"),
                    (signal) =>
                      send<Assessment>(
                        "/assessments",
                        {
                          analysis_id: analysis.id,
                          topic_id: topic,
                          objective_ids: selectedObjectives,
                          passage_ids: passages,
                          language: contentLanguage,
                          difficulty,
                          count,
                        },
                        signal,
                      ),
                    (result) => {
                      setAssessmentId(result.id);
                      setConfirmed(false);
                    },
                  )
                }
              >
                {tr("Generate draft pair")}
              </button>
            </section>
          )}
        </div>
      </div>
      <section className="learning-card studio-panel">
        <h2>
          <CheckCircle2 size={21} />
          {tr("4. Review every question")}
        </h2>
        <label>
          {tr("Saved assessments")}
          <select
            value={assessmentId ?? ""}
            onChange={(e) => {
              setAssessmentId(Number(e.target.value) || null);
              setConfirmed(false);
              setSession("");
            }}
          >
            <option value="">{tr("Select an assessment")}</option>
            {data?.assessments.map((a) => (
              <option key={a.id} value={a.id}>
                #{a.id} · {a.language.toUpperCase()} · {tr(a.status)} ·{" "}
                {tr(a.mode)}
              </option>
            ))}
          </select>
        </label>
        {assessment && (
          <>
            <div className="studio-assessment-title">
              <span className="pill">{tr(assessment.mode)}</span>
              <span className="pill">{tr(assessment.status)}</span>
              <span>{assessment.language.toUpperCase()}</span>
            </div>
            <p>
              {tr(
                "Check the academic accuracy, answer and explanation against the source. A valid citation alone does not prove correctness.",
              )}
            </p>
            <div className="studio-question-grid">
              {assessment.questions.map((q, i) => (
                <QuestionEditor
                  key={`${q.id}-${q.revision}`}
                  item={q}
                  index={i}
                  objectives={assessment.objectives}
                  readOnly={assessment.status === "published"}
                  busy={!!busy}
                  save={(content) =>
                    run(tr("Saving draft question…"), (signal) =>
                      send(
                        `/assessments/${assessment.id}/questions/${q.id}`,
                        { content, revision: q.revision },
                        signal,
                        "PUT",
                      ),
                    )
                  }
                  review={(status) =>
                    run(tr("Saving question review…"), (signal) =>
                      send(
                        `/assessments/${assessment.id}/questions/${q.id}/review`,
                        { status, revision: q.revision },
                        signal,
                      ),
                    )
                  }
                />
              ))}
            </div>
            {assessment.status !== "published" ? (
              <div className="studio-publish">
                <h2>{tr("5. Publish reviewed assessment")}</h2>
                <label className="studio-checkbox">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                  />
                  {tr(
                    "I have verified the academic content and approve both assessment sets for learners.",
                  )}
                </label>
                <button
                  className="button primary"
                  disabled={
                    !!busy || !confirmed || assessment.status !== "reviewed"
                  }
                  onClick={() =>
                    run(
                      tr("Publishing reviewed assessment…"),
                      (signal) =>
                        send(
                          `/assessments/${assessment.id}/publish`,
                          {},
                          signal,
                        ),
                      () =>
                        setNotice(
                          tr(
                            "Published as an immutable snapshot. Assign it to a compatible tutoring session.",
                          ),
                        ),
                    )
                  }
                >
                  {tr("Approve & publish complete pair")}
                </button>
              </div>
            ) : (
              <div className="studio-publish">
                <h2>{tr("Assign to tutoring")}</h2>
                <p>
                  {tr(
                    "Published snapshots stay unchanged. Sessions with submitted checks keep their existing assessment.",
                  )}
                </p>
                <label>
                  {tr("Compatible tutoring session")}
                  <select
                    value={session}
                    onChange={(e) => setSession(e.target.value)}
                  >
                    <option value="">{tr("Select a session")}</option>
                    {data?.sessions
                      .filter(
                        (s) =>
                          s.topic_id === assessment.topic_id &&
                          !s.has_submissions &&
                          !s.assigned,
                      )
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.title}
                        </option>
                      ))}
                  </select>
                </label>
                <button
                  className="button primary"
                  disabled={!!busy || !session || !publication}
                  onClick={() =>
                    run(
                      tr("Assigning published assessment…"),
                      (signal) =>
                        send(
                          `/publications/${publication?.id}/assign`,
                          { session_id: Number(session) },
                          signal,
                        ),
                      () => {
                        setSession("");
                        setNotice(
                          tr(
                            "Assessment assigned. Learners can open it from their booked session.",
                          ),
                        );
                      },
                    )
                  }
                >
                  {tr("Assign published pair")}
                </button>
                <button
                  className="button secondary"
                  disabled={!!busy}
                  onClick={() =>
                    run(
                      tr("Creating new draft revision…"),
                      (signal) =>
                        send<Assessment>(
                          `/assessments/${assessment.id}/revise`,
                          {},
                          signal,
                        ),
                      (result) => {
                        setAssessmentId(result.id);
                        setConfirmed(false);
                      },
                    )
                  }
                >
                  {tr("Create new draft revision")}
                </button>
              </div>
            )}
          </>
        )}
      </section>
      <p className="fine-print">
        {tr(
          "Fictional demo roles. Local processing. Professor review required. These short checks are not psychometrically validated.",
        )}
      </p>
      <span className="sr-only">{language}</span>
    </>
  );
}

function AnalysisEditor({
  analysis,
  busy,
  save,
}: {
  analysis: AnalysisDraft;
  busy: boolean;
  save: (content: AnalysisContent, reviewed: boolean) => void;
}) {
  const [content, setContent] = useState(analysis.content);
  const [reviewed, setReviewed] = useState(false);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save(content, reviewed);
      }}
    >
      <span className="pill">{tr(analysis.status)}</span>
      <p>{tr("Editable draft. Verify each objective before approving it.")}</p>
      {content.topics.map((topic, index) => (
        <div key={index} className="studio-analysis">
          <label>
            {tr("Proposed topic")}
            <input
              required
              maxLength={1200}
              value={topic.title}
              onChange={(e) =>
                setContent((c) => ({
                  topics: c.topics.map((x, i) =>
                    i === index ? { ...x, title: e.target.value } : x,
                  ),
                }))
              }
            />
          </label>
          <label>
            {tr("Key concepts")}
            <input
              required
              value={topic.concepts.join("; ")}
              onChange={(e) =>
                setContent((c) => ({
                  topics: c.topics.map((x, i) =>
                    i === index
                      ? {
                          ...x,
                          concepts: e.target.value
                            .split(";")
                            .map((s) => s.trim())
                            .filter(Boolean),
                        }
                      : x,
                  ),
                }))
              }
            />
          </label>
          <label>
            {tr("Source summary")}
            <textarea
              required
              maxLength={1200}
              value={topic.summary}
              onChange={(e) =>
                setContent((c) => ({
                  topics: c.topics.map((x, i) =>
                    i === index ? { ...x, summary: e.target.value } : x,
                  ),
                }))
              }
            />
          </label>
          {topic.objectives.map((o, j) => (
            <label key={o.id}>
              {tr("Learning objective")} · {o.id}
              <textarea
                required
                maxLength={1200}
                value={o.description}
                onChange={(e) =>
                  setContent((c) => ({
                    topics: c.topics.map((x, i) =>
                      i === index
                        ? {
                            ...x,
                            objectives: x.objectives.map((o, k) =>
                              k === j
                                ? { ...o, description: e.target.value }
                                : o,
                            ),
                          }
                        : x,
                    ),
                  }))
                }
              />
            </label>
          ))}
        </div>
      ))}
      <label className="studio-checkbox">
        <input
          type="checkbox"
          checked={reviewed}
          onChange={(e) => setReviewed(e.target.checked)}
        />
        {tr("I reviewed these topics and learning objectives.")}
      </label>
      <button className="button secondary" disabled={busy}>
        {tr("Save objectives & review")}
      </button>
    </form>
  );
}

function QuestionEditor({
  item,
  index,
  objectives,
  busy,
  readOnly,
  save,
  review,
}: {
  item: Item;
  index: number;
  objectives: Objective[];
  busy: boolean;
  readOnly: boolean;
  save: (q: Question) => void;
  review: (status: string) => void;
}) {
  const [content, setContent] = useState(item.content);
  const [changed, setChanged] = useState(false);
  const change = (next: Question) => {
    setContent(next);
    setChanged(true);
  };
  return (
    <article className="studio-question">
      <div className="studio-question-header">
        <strong>
          {index + 1}.{" "}
          {tr(content.stage === "pre" ? "Pre-session" : "Post-session")}
        </strong>
        <span className="pill">{tr(item.status)}</span>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save(content);
        }}
      >
        <fieldset disabled={busy || readOnly}>
          <label>
            {tr("Question")}
            <textarea
              required
              maxLength={1200}
              value={content.prompt}
              onChange={(e) => change({ ...content, prompt: e.target.value })}
            />
          </label>
          {content.options.map((option, i) => (
            <label key={i}>
              {tr("Option")} {i + 1}
              <input
                required
                maxLength={1200}
                value={option}
                onChange={(e) =>
                  change({
                    ...content,
                    options: content.options.map((o, j) =>
                      j === i ? e.target.value : o,
                    ),
                  })
                }
              />
            </label>
          ))}
          <label>
            {tr("Correct answer")}
            <select
              value={content.correct_index}
              onChange={(e) =>
                change({ ...content, correct_index: Number(e.target.value) })
              }
            >
              {content.options.map((_, i) => (
                <option key={i} value={i}>
                  {tr("Option")} {i + 1}
                </option>
              ))}
            </select>
          </label>
          <label>
            {tr("Explanation")}
            <textarea
              required
              maxLength={1200}
              value={content.explanation}
              onChange={(e) =>
                change({ ...content, explanation: e.target.value })
              }
            />
          </label>
          <label>
            {tr("Learning objective")}
            <select
              value={content.objective_id}
              onChange={(e) =>
                change({ ...content, objective_id: e.target.value })
              }
            >
              {objectives.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.description}
                </option>
              ))}
            </select>
          </label>
          <label>
            {tr("Difficulty")}
            <select
              value={content.difficulty}
              onChange={(e) =>
                change({ ...content, difficulty: e.target.value })
              }
            >
              {["introductory", "intermediate", "advanced"].map((d) => (
                <option key={d} value={d}>
                  {tr(d)}
                </option>
              ))}
            </select>
          </label>
          <p className="fine-print">
            {tr("Content language")}: {content.language.toUpperCase()}
          </p>
          {!readOnly && (
            <button className="button secondary small" disabled={!changed}>
              {tr("Save changes as draft")}
            </button>
          )}
        </fieldset>
      </form>
      <details className="studio-source">
        <summary>
          {tr("Inspect source passage")} · {tr("Page")} {item.source.page}
        </summary>
        <blockquote>{item.source.text}</blockquote>
      </details>
      {!readOnly && (
        <div className="studio-review-actions">
          <button
            className="button primary small"
            disabled={busy || changed || item.status === "reviewed"}
            onClick={() => review("reviewed")}
          >
            {tr("Approve question")}
          </button>
          <button
            className="button secondary small"
            disabled={busy || changed}
            onClick={() => review("rejected")}
          >
            {tr("Reject question")}
          </button>
        </div>
      )}
      {changed && (
        <p className="fine-print">
          {tr("Save your changes before approving this question.")}
        </p>
      )}
    </article>
  );
}
