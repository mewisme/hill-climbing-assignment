import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
const INPUT_FILE = 'input.txt';
const OUTPUT_FILE = 'output.txt';
const formatPeak = ([n, h]) => `${n}-${h}`;
const formatList = (x) => x.map(formatPeak).join(' ');
const formatLogLine = (s) => `${formatPeak(s.expanded).padEnd(16)}\t${formatList(s.neighbors).padEnd(24)}\t${formatList(s.l1).padEnd(24)}\t${formatList(s.l)}`;
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
    writeFileSync(OUTPUT_FILE, '', 'utf-8');
    const append = (line) => appendFileSync(OUTPUT_FILE, line + '\n', 'utf-8');
    append(`TTĐ: ${formatPeak(input.start)}`);
    append(`TTKT: ${formatPeak(input.goal)}\n`);
    append(`Phát triển TT${' '.repeat(16)}\tTrạng thái kề${' '.repeat(24)}\tDanh sách L1${' '.repeat(24)}\tDanh sách L\n`);
    append('-'.repeat(100));
    append(`${' '.repeat(16)}\t${' '.repeat(24)}\t${' '.repeat(24)}\t${formatPeak(input.start)}\n`);
    const visited = new Set();
    const father = { [input.start[0]]: null };
    const heuristic = { [input.start[0]]: input.start[1] };
    const L = [{ peak: input.start, parent: null }];
    const finish = (status, path) => {
        append('');
        append(`Status: ${status}`);
        append(`Path: ${path.length
            ? path.map(formatPeak).join(' -> ')
            : 'Không tìm thấy đường đi'}`);
        return { status, path };
    };
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
        append(formatLogLine({
            expanded: peak,
            neighbors,
            l1: [...L1].reverse(),
            l: L.map(x => x.peak)
        }));
        if (node === input.goal[0]) {
            const path = [];
            for (let cur = node; cur; cur = father[cur]) {
                path.push([cur, heuristic[cur]]);
            }
            return finish(true, path.reverse());
        }
    }
    return finish(false, []);
}
const input = parseInput(readFileSync(INPUT_FILE, 'utf-8'));
runHillClimbing(input);
console.log(readFileSync(OUTPUT_FILE, 'utf-8'));
