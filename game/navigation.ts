export type Point = { x: number; y: number };
export type Rect = Point & { w: number; h: number };
export const distance = (a: Point, b: Point) =>
  Math.hypot(a.x - b.x, a.y - b.y);
export function isFree(
  p: Point,
  width: number,
  height: number,
  solids: Rect[],
) {
  if (p.x < 16 || p.y < 24 || p.x > width - 16 || p.y > height - 12)
    return false;
  return !solids.some(
    (b) =>
      p.x - 9 < b.x + b.w &&
      p.x + 9 > b.x &&
      p.y - 10 < b.y + b.h &&
      p.y + 2 > b.y,
  );
}
export function route(
  from: Point,
  to: Point,
  width: number,
  height: number,
  solids: Rect[],
  travelCost?: (point: Point) => number,
): Point[] {
  const cell = 16,
    cols = Math.floor(width / cell),
    rows = Math.floor(height / cell),
    cellFree = new Map<number, boolean>();
  const free = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= cols || y >= rows) return false;
    const k = y * cols + x;
    if (!cellFree.has(k))
      cellFree.set(
        k,
        isFree({ x: x * cell + 8, y: y * cell + 8 }, width, height, solids),
      );
    return cellFree.get(k)!;
  };
  let start = { x: Math.floor(from.x / cell), y: Math.floor(from.y / cell) },
    goal = { x: Math.floor(to.x / cell), y: Math.floor(to.y / cell) };
  function nearest(p: Point) {
    if (free(p.x, p.y)) return p;
    for (let r = 1; r < 12; r++)
      for (let y = -r; y <= r; y++)
        for (let x = -r; x <= r; x++)
          if (free(p.x + x, p.y + y)) return { x: p.x + x, y: p.y + y };
    return p;
  }
  // A free click can lie in a grid cell whose center is inside furniture.
  // Resolve both departure and arrival with a clear connecting segment, not the
  // first free cell in a top-left-biased scan (which can stop short forever).
  const clearSegment = (a: Point, b: Point) => {
    const steps = Math.max(1, Math.ceil(distance(a, b) / 4));
    for (let i = 1; i <= steps; i++)
      if (
        !isFree(
          {
            x: a.x + ((b.x - a.x) * i) / steps,
            y: a.y + ((b.y - a.y) * i) / steps,
          },
          width,
          height,
          solids,
        )
      )
        return false;
    return true;
  };
  const resolveCell = (point: Point, grid: Point): Point => {
    if (!isFree(point, width, height, solids)) return nearest(grid);
    const candidates: { x: number; y: number }[] = [];
    for (let dy = -2; dy <= 2; dy++)
      for (let dx = -2; dx <= 2; dx++) {
        const q = { x: grid.x + dx, y: grid.y + dy };
        const center = { x: q.x * cell + 8, y: q.y * cell + 8 };
        if (
          free(q.x, q.y) &&
          distance(center, point) < 22 &&
          clearSegment(center, point)
        )
          candidates.push(q);
      }
    candidates.sort(
      (a, b) =>
        distance({ x: a.x * cell + 8, y: a.y * cell + 8 }, point) -
        distance({ x: b.x * cell + 8, y: b.y * cell + 8 }, point),
    );
    return candidates[0] ?? nearest(grid);
  };
  start = resolveCell(from, start);
  goal = resolveCell(to, goal);
  const key = (p: Point) => p.y * cols + p.x;
  const costs = new Map<number, number>([[key(start), 0]]),
    came = new Map<number, Point>();
  // Binary heap avoids repeated full-array sorting on the larger town.
  const heap: { p: Point; f: number }[] = [];
  const score = (p: Point, c: number) =>
    c + Math.abs(p.x - goal.x) + Math.abs(p.y - goal.y);
  const push = (p: Point, f: number) => {
    heap.push({ p, f });
    let i = heap.length - 1;
    while (i) {
      let parent = (i - 1) >> 1;
      if (heap[parent].f <= f) break;
      [heap[parent], heap[i]] = [heap[i], heap[parent]];
      i = parent;
    }
  };
  const pop = () => {
    const r = heap[0],
      last = heap.pop()!;
    if (heap.length) {
      heap[0] = last;
      let i = 0;
      while (true) {
        let c = i * 2 + 1;
        if (c >= heap.length) break;
        if (c + 1 < heap.length && heap[c + 1].f < heap[c].f) c++;
        if (heap[i].f <= heap[c].f) break;
        [heap[c], heap[i]] = [heap[i], heap[c]];
        i = c;
      }
    }
    return r.p;
  };
  push(start, score(start, 0));
  const closed = new Set<number>();
  let found = false;
  for (let loops = 0; heap.length && loops < 50000; loops++) {
    const p = pop(),
      pk = key(p);
    if (closed.has(pk)) continue;
    closed.add(pk);
    if (pk === key(goal)) {
      found = true;
      break;
    }
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const n = { x: p.x + dx, y: p.y + dy };
      if (n.x < 0 || n.y < 0 || n.x >= cols || n.y >= rows || !free(n.x, n.y))
        continue;
      if (
        !isFree(
          { x: p.x * cell + 8 + dx * 8, y: p.y * cell + 8 + dy * 8 },
          width,
          height,
          solids,
        )
      )
        continue;
      // All terrain costs are >= 1, so the Manhattan heuristic stays admissible.
      const stepCost = Math.max(
        1,
        travelCost?.({ x: n.x * cell + 8, y: n.y * cell + 8 }) ?? 1,
      );
      const cost = costs.get(pk)! + stepCost;
      if (cost < (costs.get(key(n)) ?? Infinity)) {
        costs.set(key(n), cost);
        came.set(key(n), p);
        push(n, score(n, cost));
      }
    }
  }
  if (!found) return [];
  const points: Point[] = [];
  let at = goal;
  while (key(at) !== key(start)) {
    points.unshift({ x: at.x * cell + 8, y: at.y * cell + 8 });
    const previous = came.get(key(at));
    if (!previous) break;
    at = previous;
  }
  const center = { x: start.x * cell + 8, y: start.y * cell + 8 };
  const first = points[0] ?? center;
  let directClear = true;
  const steps = Math.max(1, Math.ceil(distance(from, first) / 4));
  for (let i = 1; i <= steps; i++)
    if (
      !isFree(
        {
          x: from.x + ((first.x - from.x) * i) / steps,
          y: from.y + ((first.y - from.y) * i) / steps,
        },
        width,
        height,
        solids,
      )
    ) {
      directClear = false;
      break;
    }
  if (!directClear && distance(from, center) > 1) points.unshift(center);
  if (
    isFree(to, width, height, solids) &&
    distance(points.at(-1) ?? center, to) < 22 &&
    clearSegment(points.at(-1) ?? center, to)
  )
    points.push(to);
  return points;
}
