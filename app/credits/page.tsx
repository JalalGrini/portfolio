import Link from "next/link";
export default function Credits() {
  return (
    <div className="studio-root">
      <header className="studio-nav">
        <Link href="/" className="studio-brand">
          JG
        </Link>
        <nav aria-label="Main navigation">
          <Link href="/portfolio/">PORTFOLIO</Link>
          <Link href="/play/">CAREER TOWN</Link>
        </nav>
      </header>
      <main className="credits-page">
        <span className="eyebrow">MADE POSSIBLE BY OPEN ART</span>
        <h1>
          A little world.
          <br />
          <em>A shared craft.</em>
        </h1>
        <p className="lead">
          This town is assembled with artwork from the Liberated Pixel Cup
          community. The artists behind it deserve to be visible.
        </p>
        <div className="credits-list">
          <article>
            <h2>Characters & customization</h2>
            <p>
              Universal LPC Spritesheet Character Generator. Contributors
              include bluecarrot16, Benjamin K. Smith (BenCreating), Eliza Wyatt
              (ElizaWy), JaidynReiman, TheraHedwig, Johannes Sjölund (wulax),
              Stephen Challener (Redshrike) and many others. Exact author lists
              and license alternatives are retained per asset in the credits
              CSV.
            </p>
            <p>
              Palette swaps and layer composition preserve original shading.
              Applicable CC-BY-SA, OGA-BY, CC-BY and CC0 license choices remain
              attached to the artwork.
            </p>
            <a href="/licenses/lpc-characters.csv" download>
              Full file-level credits ↓
            </a>{" "}
            ·{" "}
            <a
              href="https://github.com/Universal-LPC-Spritesheet-Character-Generator/Universal-LPC-Spritesheet-Character-Generator"
              target="_blank"
              rel="noreferrer"
            >
              Source project ↗
            </a>
          </article>
          <article>
            <h2>The town & its interiors</h2>
            <p>
              LPC terrain, architecture and furniture by Lanea Zimmerman
              (Sharm), bluecarrot16, Tuomo Untinen, Casper Nilsson, Michele
              Bucelli (Buch), Xenodora, Hyptosis, Guido Bos, keith karnage and
              the contributors named in the complete upstream files below.
            </p>
            <p>
              The map includes cropped, assembled and color-graded adaptations.
              Terrain and building adaptations retain their applicable CC-BY-SA
              terms. Office props by Eliza Wyatt and Lanea Zimmerman are OGA-BY
              3.0. Component-level alternatives and exceptions are retained in
              the source credits.
            </p>
            <div className="credit-links">
              {[
                "atlas",
                "roofs",
                "colonial",
                "city",
                "interior",
                "furniture",
                "office",
              ].map((c) => (
                <a
                  key={c}
                  href={`/licenses/${c}.txt`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {c} credits ↗
                </a>
              ))}
            </div>
            <a
              href="https://creativecommons.org/licenses/by-sa/3.0/"
              target="_blank"
              rel="noreferrer"
            >
              CC-BY-SA 3.0 ↗
            </a>
          </article>
          <article>
            <h2>The cinematic portfolio</h2>
            <p>
              Original AI-generated conceptual artwork is used for the
              atmospheric hero and project visual studies. These are not product
              screenshots or photographs of deployed project infrastructure. No
              imagery, source code, or shader from the inspiration portfolio is
              included.
            </p>
            <p>
              Technology logos are local SVG assets from Simple Icons,
              distributed under CC0. Brand names and marks remain their
              respective owners’ trademarks.
            </p>
            <a
              href="https://github.com/simple-icons/simple-icons"
              target="_blank"
              rel="noreferrer"
            >
              Simple Icons source ↗
            </a>
            {" · "}
            <a href="/licenses/simple-icons.md">CC0 license ↗</a>
          </article>
          <article>
            <h2>Type, code & personal content</h2>
            <p>
              Pixelify Sans by Stefie Justprince, under the SIL Open Font
              License. Application code uses Next.js, React, Phaser and
              TypeScript. Original application code is MIT; third-party art is
              not relicensed by that grant.
            </p>
            <a href="/licenses/pixelify-sans.txt">Font license ↗</a>
            <p>
              Photograph and CV supplied by Jalal Grini for this portfolio.
              These personal materials are not offered as reusable stock. No
              Stardew Valley code, assets or branding are used.
            </p>
          </article>
        </div>
        <div className="button-row">
          <Link className="button primary" href="/play/">
            Back to the town ↗
          </Link>
          <Link className="button" href="/portfolio/">
            Classic portfolio →
          </Link>
        </div>
      </main>
    </div>
  );
}
