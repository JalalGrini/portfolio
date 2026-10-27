/** Short, lossless factual pages. Never cut a word or change project claims. */
export function dialoguePages(text: string, limit = 260): string[] {
  const pages: string[] = [];
  let rest = text.trim();
  while (rest.length > limit) {
    const sample = rest.slice(0, limit + 1);
    const sentence = Math.max(
      sample.lastIndexOf(". "),
      sample.lastIndexOf("! "),
      sample.lastIndexOf("? "),
      sample.lastIndexOf("\n"),
    );
    let cut = sentence >= limit * 0.35 ? sentence + 1 : sample.lastIndexOf(" ");
    if (cut <= 0) cut = rest.indexOf(" ", limit); // Keep an unusually long token intact.
    if (cut <= 0) break;
    pages.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trimStart();
  }
  if (rest || !pages.length) pages.push(rest);
  return pages;
}
/** Only an explicit, current choice completes a tour message — never Escape. */
export function dialogueAck(
  id: string,
  state: { active: boolean; stage: string; index: number; beat: number },
): "intro" | "beat" | null {
  const m = /^tour-ack-(intro|beat)-(\d+):(\d+)$/.exec(id);
  if (!m || !state.active || +m[2] !== state.index || +m[3] !== state.beat)
    return null;
  const kind = m[1] as "intro" | "beat";
  return state.stage === (kind === "intro" ? "room-intro" : "beat")
    ? kind
    : null;
}
