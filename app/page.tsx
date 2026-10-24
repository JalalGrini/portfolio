import Link from "next/link";
import Nav from "@/components/Nav";
export default function Home() {
  return (
    <>
      <Nav />
      <main id="main" className="landing">
        <div className="landing-copy">
          <p className="eyebrow">
            <span className="live-dot" /> JALAL GRINI · AI & SOFTWARE
            ENGINEERING
          </p>
          <h1>
            A little world.
            <br />A bigger <em>picture.</em>
          </h1>
          <p className="landing-description">
            Intelligent systems, useful software, and the person behind them.
            Take a walk through my work—or get straight to it.
          </p>
          <div className="button-row">
            <Link className="button primary large" href="/play/">
              Enter my world <span>↗</span>
            </Link>
            <Link className="button subtle large" href="/portfolio/">
              View portfolio <span>→</span>
            </Link>
          </div>
          <div className="landing-meta">
            <span>ENSA AL HOCEIMA</span>
            <span>AI · DATA · FULL-STACK</span>
            <span>MOROCCO</span>
          </div>
        </div>
        <Link
          href="/play/"
          className="world-teaser"
          aria-label="Explore Jalal’s pixel-art career town"
        >
          <img
            src="/assets/game/town-preview.png"
            alt="A handcrafted pixel town with forest paths, an AI observatory, a fountain and seven buildings to explore"
          />
          <div className="teaser-vignette" />
          <div className="teaser-label">
            <span className="live-dot" /> CAREER TOWN{" "}
            <span>01 / 07 PLACES TO DISCOVER</span>
          </div>
          <span className="teaser-pin pin-lab">The AI Observatory</span>
          <span className="teaser-pin pin-home">A place for curious minds</span>
          <div className="teaser-bottom">
            <span>YOUR VISIT, YOUR CHARACTER.</span>
            <span className="round-arrow">↗</span>
          </div>
        </Link>
        <div className="landing-footer">
          <p>An engineer’s portfolio. An explorer’s point of view.</p>
          <Link href="/credits/">Built with care & credited art ↗</Link>
        </div>
      </main>
    </>
  );
}
