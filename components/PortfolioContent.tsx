"use client";
import {
  profile,
  projects,
  skills,
  experience,
  buildings,
  BuildingId,
  Project,
} from "@/content/portfolio";
export function Tags({ items }: { items: string[] }) {
  return (
    <div className="tags">
      {items.map((t) => (
        <span key={t}>{t}</span>
      ))}
    </div>
  );
}
export function ProjectDetail({ project: p }: { project: Project }) {
  return (
    <article className="project-detail">
      <span className="status">{p.status}</span>
      <h2>{p.title}</h2>
      <p className="lead">{p.subtitle}</p>
      <p>{p.description}</p>
      {p.role && (
        <p className="role">
          <b>My focus</b> · {p.role}
        </p>
      )}
      <Tags items={p.stack} />
      <h3>Inside the project</h3>
      <ul>
        {p.highlights.map((h) => (
          <li key={h}>{h}</li>
        ))}
      </ul>
      {p.repo ? (
        <a
          className="button primary"
          href={p.repo}
          target="_blank"
          rel="noreferrer"
        >
          View repository <span>↗</span>
        </a>
      ) : (
        <p className="muted">
          {p.category === "Research"
            ? "Research in design. Architecture and scope are being developed."
            : "No public repository provided."}
        </p>
      )}
    </article>
  );
}
export function Education() {
  return (
    <div className="education">
      <article>
        <span className="eyebrow">2024 — 2027 · Expected</span>
        <h3>Engineering degree</h3>
        <p>AI & Digital Transformation</p>
        <p className="muted">ENSA Al Hoceima · Morocco</p>
      </article>
      <article>
        <span className="eyebrow">2022 — 2024</span>
        <h3>Preparatory cycle</h3>
        <p>Mathematics & Physics</p>
        <p className="muted">ENSA Al Hoceima · Morocco</p>
      </article>
    </div>
  );
}
export function SkillGrid() {
  return (
    <div className="skill-grid">
      {skills.map((s) => (
        <article key={s.title}>
          <h3>{s.title}</h3>
          <Tags items={s.items} />
        </article>
      ))}
    </div>
  );
}
export function Experience({ onProject }: { onProject: (p: Project) => void }) {
  return (
    <div className="experience-list">
      {experience.map((e) => (
        <article key={e.company}>
          <div className="experience-meta">
            <span>{e.period}</span>
            <span>{e.location}</span>
          </div>
          <h3>{e.company}</h3>
          <p className="role">{e.title}</p>
          <p>{e.text}</p>
          <button
            className="text-button"
            onClick={() => onProject(projects.find((p) => p.id === e.project)!)}
          >
            Explore the project ↗
          </button>
        </article>
      ))}
    </div>
  );
}
export function Contact() {
  return (
    <div className="contact-content">
      <h3>Good work starts with a conversation.</h3>
      <p>
        For engineering opportunities, research collaborations, or a thoughtful
        idea.
      </p>
      <a className="contact-email" href={`mailto:${profile.email}`}>
        {profile.email} <span>↗</span>
      </a>
      <div className="button-row">
        <a className="button primary" href="/files/Jalal-Grini-CV.pdf" download>
          Download CV ↓
        </a>
        <a
          className="button"
          href={profile.linkedin}
          target="_blank"
          rel="noreferrer"
        >
          LinkedIn ↗
        </a>
        <a
          className="button"
          href={profile.github}
          target="_blank"
          rel="noreferrer"
        >
          GitHub ↗
        </a>
      </div>
      <p className="muted">
        Based in {profile.location} · Arabic, French & English
      </p>
    </div>
  );
}
export function BuildingContent({
  id,
  onProject,
}: {
  id: BuildingId;
  onProject: (p: Project) => void;
}) {
  const b = buildings.find((b) => b.id === id)!;
  const ps =
    id === "lab"
      ? projects.filter(
          (p) =>
            p.category === "AI & Data" ||
            p.id === "sentinel" ||
            p.id === "orion",
        )
      : projects.filter(
          (p) => p.category === "Software" || p.id === "dl-report",
        );
  return (
    <div className="building-content">
      <span className="eyebrow">
        {b.number} / {b.topic}
      </span>
      <h2>{b.name}</h2>
      <p className="lead">{b.intro}</p>
      {id === "about" ? (
        <div className="about-panel">
          <img
            src="/assets/photos/jalal.jpg"
            alt="Jalal Grini at an ENSA Al Hoceima event"
          />
          <div>
            <h3>Jalal Grini</h3>
            <p>{profile.bio}</p>
            <p className="muted">
              {profile.location}
              <br />
              Arabic · Native / French · Fluent / English · Professional
            </p>
          </div>
        </div>
      ) : id === "academy" ? (
        <Education />
      ) : id === "library" ? (
        <SkillGrid />
      ) : id === "office" ? (
        <Experience onProject={onProject} />
      ) : id === "contact" ? (
        <Contact />
      ) : (
        <div className="room-projects">
          {ps.map((p) => (
            <button key={p.id} onClick={() => onProject(p)}>
              <span className="eyebrow">{p.status}</span>
              <h3>
                {p.title} <span>↗</span>
              </h3>
              <p>{p.subtitle}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
