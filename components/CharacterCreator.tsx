"use client";
import { useEffect, useState } from "react";
import {
  Character,
  clothColors,
  defaultCharacter,
  feetStyles,
  hairColors,
  hairStyles,
  legStyles,
  randomCharacter,
  skinColors,
  swatches,
  tops,
  validCharacter,
} from "@/game/character";
import AvatarPreview from "./AvatarPreview";
const nice = (s: string) =>
  s.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
function VisualChoices({
  label,
  value,
  options,
  onChange,
  character,
  property,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  character: Character;
  property: keyof Character;
}) {
  const focus = ["hair", "beard", "glasses"].includes(property)
    ? "head"
    : property === "top"
      ? "torso"
      : property === "legs"
        ? "legs"
        : property === "feet"
          ? "feet"
          : "full";
  return (
    <fieldset className={`visual-field visual-${property}`}>
      <legend>
        {label}
        <span>{nice(value)}</span>
      </legend>
      <div className="visual-options">
        {options.map((o) => (
          <button
            type="button"
            key={o}
            aria-label={`${label}: ${nice(o)}`}
            aria-pressed={o === value}
            className={`visual-choice ${o === value ? "selected" : ""}`}
            onClick={() => onChange(o)}
          >
            <AvatarPreview
              character={{ ...character, [property]: o }}
              animated={false}
              focus={focus}
            />
            <span>{nice(o)}</span>
            {o === value && (
              <b className="choice-check" aria-hidden="true">
                ✓
              </b>
            )}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
function Colors({
  label,
  value,
  colors,
  onChange,
}: {
  label: string;
  value: string;
  colors: string[];
  onChange: (v: string) => void;
}) {
  return (
    <fieldset className="color-field">
      <legend>
        {label} <span>{nice(value)}</span>
      </legend>
      <div className="swatches">
        {colors.map((c) => (
          <button
            key={c}
            aria-label={`${label}: ${nice(c)}`}
            aria-pressed={c === value}
            style={
              { "--swatch": swatches[c] || "#7b8c89" } as React.CSSProperties
            }
            className={c === value ? "selected" : ""}
            onClick={() => onChange(c)}
          >
            {c === value ? "✓" : ""}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
export default function CharacterCreator({
  onStart,
}: {
  onStart: (c: Character) => void;
}) {
  const [c, setC] = useState<Character>(defaultCharacter);
  const [tab, setTab] = useState("Character");
  const [dir, setDir] = useState(2);
  const [motion, setMotion] = useState(true);
  useEffect(() => {
    try {
      const v = JSON.parse(
        localStorage.getItem("career-town-character") || "null",
      );
      if (validCharacter(v)) setC(v);
    } catch {}
    setMotion(!matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);
  function change<K extends keyof Character>(key: K, value: Character[K]) {
    setC((v) => ({ ...v, [key]: value }));
  }
  return (
    <main className="creator-page">
      <div className="creator-heading">
        <span className="eyebrow">BEFORE WE BEGIN / MAKE YOURSELF AT HOME</span>
        <h1>
          Your visit.
          <br />
          <em>Your character.</em>
        </h1>
        <p>
          A small world, built around a real journey. Choose your look and come
          on in.
        </p>
      </div>
      <div className="creator-shell">
        <div className="character-stage">
          <div className="stage-caption">
            <span className="live-dot" /> YOUR VISITOR PASS
          </div>
          <span className="stage-edition">CAREER TOWN · EST. 2026</span>
          <div className="avatar-pedestal">
            <AvatarPreview character={c} animated={motion} direction={dir} />
          </div>
          <div className="rotate-controls">
            <button
              className="icon-button"
              onClick={() => setDir((v) => (v + 1) % 4)}
              aria-label="Rotate character left"
            >
              ‹
            </button>
            <span>YOUR TOWN SELF</span>
            <button
              className="icon-button"
              onClick={() => setDir((v) => (v + 3) % 4)}
              aria-label="Rotate character right"
            >
              ›
            </button>
          </div>
          <button
            className="button random-button"
            onClick={() => setC(randomCharacter())}
          >
            Shuffle a look
          </button>
          <p className="stage-note">No account. No sound. Just curiosity.</p>
        </div>
        <div className="creator-options">
          <div
            className="creator-tabs"
            role="tablist"
            aria-label="Character customization"
          >
            {["Character", "Hair", "Outfit", "Details"].map((t) => (
              <button
                role="tab"
                id={`tab-${t}`}
                aria-controls={`panel-${t}`}
                aria-selected={tab === t}
                tabIndex={tab === t ? 0 : -1}
                onKeyDown={(e) => {
                  const ts = ["Character", "Hair", "Outfit", "Details"];
                  if (
                    ["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)
                  ) {
                    e.preventDefault();
                    const i = ts.indexOf(t);
                    const next =
                      ts[
                        e.key === "Home"
                          ? 0
                          : e.key === "End"
                            ? 3
                            : (i + (e.key === "ArrowRight" ? 1 : 3)) % 4
                      ];
                    setTab(next);
                    setTimeout(
                      () => document.getElementById(`tab-${next}`)?.focus(),
                      0,
                    );
                  }
                }}
                key={t}
                className={tab === t ? "active" : ""}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
          <div
            key={tab}
            className="creator-controls"
            role="tabpanel"
            id={`panel-${tab}`}
            aria-labelledby={`tab-${tab}`}
          >
            {tab === "Character" ? (
              <>
                <VisualChoices
                  character={c}
                  property="body"
                  label="Body"
                  value={c.body}
                  options={["male", "female"]}
                  onChange={(v) => change("body", v as Character["body"])}
                />
                <Colors
                  label="Skin tone"
                  value={c.skin}
                  colors={skinColors}
                  onChange={(v) => change("skin", v)}
                />
                <Colors
                  label="Eyes"
                  value={c.eye}
                  colors={["brown", "blue", "green", "gray", "purple"]}
                  onChange={(v) => change("eye", v)}
                />
              </>
            ) : tab === "Hair" ? (
              <>
                <VisualChoices
                  character={c}
                  property="hair"
                  label="Hairstyle"
                  value={c.hair}
                  options={["none", ...hairStyles]}
                  onChange={(v) => change("hair", v)}
                />
                <Colors
                  label="Hair color"
                  value={c.hairColor}
                  colors={hairColors}
                  onChange={(v) => change("hairColor", v)}
                />
                <VisualChoices
                  character={c}
                  property="beard"
                  label="Facial hair"
                  value={c.beard}
                  options={[
                    "none",
                    "mustache",
                    "trimmed",
                    "basic",
                    "5oclock_shadow",
                  ]}
                  onChange={(v) => change("beard", v)}
                />
              </>
            ) : tab === "Outfit" ? (
              <>
                <div className="outfit-fields">
                  <VisualChoices
                    character={c}
                    property="top"
                    label="Top"
                    value={c.top}
                    options={Object.keys(tops)}
                    onChange={(v) => change("top", v)}
                  />
                  <VisualChoices
                    character={c}
                    property="legs"
                    label="Bottom"
                    value={c.legs}
                    options={Object.keys(legStyles)}
                    onChange={(v) => change("legs", v)}
                  />
                </div>
                <Colors
                  label="Top color"
                  value={c.topColor}
                  colors={clothColors}
                  onChange={(v) => change("topColor", v)}
                />
                <Colors
                  label="Bottom color"
                  value={c.legsColor}
                  colors={clothColors}
                  onChange={(v) => change("legsColor", v)}
                />
              </>
            ) : (
              <>
                <VisualChoices
                  character={c}
                  property="feet"
                  label="Footwear"
                  value={c.feet}
                  options={Object.keys(feetStyles)}
                  onChange={(v) => change("feet", v)}
                />
                <Colors
                  label="Shoe color"
                  value={c.feetColor}
                  colors={clothColors}
                  onChange={(v) => change("feetColor", v)}
                />
                <VisualChoices
                  character={c}
                  property="glasses"
                  label="Glasses"
                  value={c.glasses}
                  options={["none", "glasses", "round", "nerd", "shades"]}
                  onChange={(v) => change("glasses", v)}
                />
              </>
            )}
          </div>
          <div className="creator-actions">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={motion}
                onChange={(e) => setMotion(e.target.checked)}
              />{" "}
              Animated preview
            </label>
            <button
              className="button primary large"
              onClick={() => {
                try {
                  localStorage.setItem(
                    "career-town-character",
                    JSON.stringify(c),
                  );
                } catch {}
                onStart(c);
              }}
            >
              Let’s explore <span>↗</span>
            </button>
            <p>
              Keyboard, click-to-walk, and touch controls. Your look stays in
              this browser.
            </p>
          </div>
        </div>
      </div>
      <a href="/portfolio/" className="creator-skip">
        Prefer the direct route? <u>Open the classic portfolio →</u>
      </a>
    </main>
  );
}
