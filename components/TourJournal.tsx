"use client";
import { places } from "@/game/catalog";
import { makePlan } from "@/game/tour";
import type { TourState } from "@/game/tour";
const plan = makePlan(places);
export default function TourJournal({
  tour,
  visited,
  inspected,
  checkpoint,
  onResume,
  onMap,
}: {
  tour: TourState | null;
  visited: string[];
  inspected: Record<string, string[]>;
  checkpoint: { index: number; beat: number } | null;
  onResume: () => void;
  onMap: (id: string) => void;
}) {
  const at = tour?.active ? tour.index : checkpoint?.index;
  const target = at !== undefined ? places[at] : undefined;
  const allObjects = places.reduce((n, p) => n + p.exhibits.length, 0);
  const seen = places.reduce(
    (n, p) =>
      n + p.exhibits.filter((e) => inspected[p.id]?.includes(e.id)).length,
    0,
  );
  const highlights = plan.reduce(
    (n, p) => n + p.beats.filter((id) => inspected[p.id]?.includes(id)).length,
    0,
  );
  const totalHighlights = plan.reduce((n, p) => n + p.beats.length, 0);
  return (
    <section className="tour-journal" aria-label="Tour journal">
      <header className="journal-heading">
        <div>
          <small>JALAL’S FIELD NOTES</small>
          <h2>One town. Twenty-one stories.</h2>
          <p>
            Your guided highlights and optional discoveries, kept separately.
          </p>
        </div>
        <div className="journal-checkpoint">
          <small>
            {tour?.active
              ? "CURRENT STOP"
              : checkpoint
                ? "SAVED CHECKPOINT"
                : "THE FULL TOUR"}
          </small>
          <strong>
            {target ? `${at! + 1}. ${target.short}` : "Start at Meet Jalal"}
          </strong>
          {checkpoint && !tour?.active && checkpoint.beat > 0 && (
            <span>Resume at highlight {checkpoint.beat + 1}</span>
          )}
          <button className="v-button" onClick={onResume}>
            {tour?.active
              ? "Return to Jalal →"
              : checkpoint
                ? "Resume saved tour →"
                : "Take the full tour →"}
          </button>
          <span>Walk with Jalal — no teleporting.</span>
        </div>
      </header>
      <dl className="journal-totals">
        <div>
          <dt>Places visited</dt>
          <dd>
            {places.filter((p) => visited.includes(p.id)).length}
            <span> / {places.length}</span>
          </dd>
        </div>
        <div>
          <dt>Highlights seen</dt>
          <dd>
            {highlights}
            <span> / {totalHighlights}</span>
          </dd>
        </div>
        <div>
          <dt>Objects inspected</dt>
          <dd>
            {seen}
            <span> / {allObjects}</span>
          </dd>
        </div>
      </dl>
      <p className="journal-note">
        Entering a building marks it visited. Reading a highlighted object
        counts as seen; other objects are optional. These counts do not skip
        stops or mark the tour complete.
      </p>
      <ol className="journal-stops">
        {places.map((p, i) => {
          const seenHere = p.exhibits.filter((e) =>
            inspected[p.id]?.includes(e.id),
          ).length;
          const beatsHere = plan[i].beats.filter((id) =>
            inspected[p.id]?.includes(id),
          ).length;
          const isVisited = visited.includes(p.id),
            isCurrent = i === at;
          return (
            <li
              key={p.id}
              className={`${isVisited ? "is-visited" : ""} ${isCurrent ? "is-current" : ""}`}
              data-place={p.id}
            >
              <span className="journal-number" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="journal-stop-text">
                <small>{p.district}</small>
                <h3>{p.short}</h3>
                <p>
                  {isVisited ? "Visited" : "Not visited"}
                  {isCurrent
                    ? tour?.active
                      ? " · Current stop"
                      : " · Saved checkpoint"
                    : ""}
                </p>
                <div className="journal-stop-counts">
                  <span>
                    Highlights seen{" "}
                    <b>
                      {beatsHere}/{plan[i].beats.length}
                    </b>
                  </span>
                  <span>
                    Objects inspected{" "}
                    <b>
                      {seenHere}/{p.exhibits.length}
                    </b>
                  </span>
                </div>
              </div>
              <button
                className="v-quiet"
                aria-label={`Locate ${p.short} on map`}
                onClick={() => onMap(p.id)}
              >
                Map ↗
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
