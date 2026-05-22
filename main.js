import { readFileSync, writeFileSync } from 'node:fs';
const INPUT_FILE = 'input.txt';
const OUTPUT_FILE = 'output.txt';
const formatPeak = ([n, h]) => `${n}-${h}`;
const formatList = (x) => x.map(formatPeak).join(' ');
const parsePeak = (s) => {
  const [, n, h] = s.match(/^([A-Za-z])(\d{1,2})$/) ?? [];
  if (!n)
    throw new Error('Sai định dạng');
  return [n, +h];
};
function parseInput(content) {
  return content
    .split(/\r?\n/)
    .filter(Boolean)
    .reduce((acc, line) => {
      const [k, v = ''] = line.split(':').map(x => x.trim());
      if (k === 'TTĐ')
        acc.start = parsePeak(v);
      else if (k === 'TTKT')
        acc.goal = parsePeak(v);
      else
        acc.graph[k] = v.split(/\s+/).map(parsePeak);
      return acc;
    }, { start: ['', 0], goal: ['', 0], graph: {} });
}
function runHillClimbing(input) {
  const visited = new Set();
  const father = { [input.start[0]]: null };
  const heuristic = { [input.start[0]]: input.start[1] };
  const L = [{ peak: input.start, parent: null }];
  const logs = [];
  while (L.length) {
    const { peak, parent } = L.shift();
    const [node, h] = peak;
    if (visited.has(node))
      continue;
    visited.add(node);
    father[node] = parent;
    heuristic[node] = h;
    const neighbors = input.graph[node] ?? [];
    const L1 = neighbors
      .filter(([n]) => !visited.has(n))
      .sort((a, b) => a[1] - b[1]);
    for (const next of L1.reverse()) {
      const [n, nh] = next;
      heuristic[n] = nh;
      const idx = L.findIndex(x => x.peak[0] === n);
      if (idx === -1)
        L.unshift({ peak: next, parent: node });
      else
        L[idx] = { peak: next, parent: node };
    }
    logs.push({
      expanded: peak,
      neighbors,
      l1: [...L1].reverse(),
      l: L.map(x => x.peak)
    });
    if (node === input.goal[0]) {
      const path = [];
      for (let cur = node; cur; cur = father[cur]) {
        path.push([cur, heuristic[cur]]);
      }
      return { status: true, logs, path: path.reverse() };
    }
  }
  return { status: false, logs, path: [] };
}
const input = parseInput(readFileSync(INPUT_FILE, 'utf-8'));
const result = runHillClimbing(input);
const output = [
  `TTĐ: ${formatPeak(input.start)}`,
  `TTKT: ${formatPeak(input.goal)}`,
  '',
  'Phát triển TT'.padEnd(16) +
  '\t' +
  'Trạng thái kề'.padEnd(24) +
  '\t' +
  'Danh sách L1'.padEnd(24) +
  '\tDanh sách L',
  '-'.repeat(100),
  `${''.padEnd(16)}\t${''.padEnd(24)}\t${''.padEnd(24)}\t${formatPeak(input.start)}`,
  ...result.logs.map(s => `${formatPeak(s.expanded).padEnd(16)}\t${formatList(s.neighbors).padEnd(24)}\t${formatList(s.l1).padEnd(24)}\t${formatList(s.l)}`),
  '',
  `Status: ${result.status}`,
  `Path: ${result.path.length
    ? result.path.map(formatPeak).join(' -> ')
    : 'Không tìm thấy đường đi'}`
].join('\n');
writeFileSync(OUTPUT_FILE, output);
console.log(output);
