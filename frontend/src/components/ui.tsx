import { t as tr } from "../lib/i18n";
import {
  ArrowRight,
  AlertCircle,
  RefreshCw,
  SearchX,
  BookOpen,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import type { DemoUser } from "../lib/types";

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link
      to="/"
      className={`brand ${light ? "brand-light" : ""}`}
      aria-label={tr("ClassAll home")}
    >
      <span className="brand-icon">
        <BookOpen size={23} strokeWidth={2.3} />
      </span>
      {tr("ClassAll")}
      <span className="brand-dot">.</span>
    </Link>
  );
}
export function Avatar({
  user,
  small = false,
}: {
  user: Pick<DemoUser, "name" | "initials" | "color">;
  small?: boolean;
}) {
  return (
    <span
      aria-label={user.name}
      className={`avatar tone-${user.color} ${small ? "avatar-small" : ""}`}
    >
      {user.initials}
    </span>
  );
}
export function ErrorState({
  message,
  retry,
}: {
  message: string;
  retry: () => void;
}) {
  return (
    <div className="error-state" role="alert">
      <AlertCircle size={24} />
      <div>
        <strong>{tr("We couldn’t load this just yet.")}</strong>
        <p>{tr(message)}</p>
      </div>
      <button className="button secondary small" onClick={retry}>
        <RefreshCw size={14} />
        {tr("Try again")}
      </button>
    </div>
  );
}
export function Loading({
  label = tr("Loading sessions"),
}: {
  label?: string;
}) {
  return (
    <div className="loading" role="status">
      <span className="spinner" />
      {tr(label)}…
    </div>
  );
}
export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <SearchX size={30} />
      </span>
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );
}
export function SectionHeading({
  eyebrow,
  title,
  children,
  link,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
  link?: { to: string; label: string };
}) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
        {children && <p>{children}</p>}
      </div>
      {link && (
        <Link className="text-link" to={link.to}>
          {link.label}
          <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}
export function ComingSoon({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="future-note">
      <span className="pill neutral">{tr("On the roadmap")}</span>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
