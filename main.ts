import { appendFileSync, readFileSync, writeFileSync } from 'node:fs'

const INPUT_FILE = 'input.txt'
const OUTPUT_FILE = 'output.txt'

type Peak = [string, number]

interface Input {
  start: Peak
  goal: Peak
  graph: Record<string, Peak[]>
}

const formatPeak = ([n, h]: Peak) => `${n}-${h}`
const formatList = (x: Peak[]) => x.map(formatPeak).join(' ')

const formatNeighbors = (n: Peak[] | string) => (typeof n === 'string' ? n : formatList(n))

const formatLogLine = (s: {
  expanded: Peak
  neighbors: Peak[] | string
  l1: Peak[]
  l: Peak[]
}) =>
  `${formatPeak(s.expanded).padEnd(16)}\t${formatNeighbors(s.neighbors).padEnd(24)}\t${formatList(s.l1).padEnd(24)}\t${formatList(s.l)}`

const finish = (append: (line: string) => void, status: boolean, path: Peak[]) => {
  append('')
  append(`Status: ${status}`)
  append(`Path: ${path.length ? path.map(formatPeak).join(' -> ') : 'Không tìm thấy đường đi'}`)
  return { status, path }
}

const parsePeak = (s: string): Peak => {
  const [, n, h] = s.match(/^([A-Za-z])(\d{1,2})$/) ?? []
  if (!n) throw new Error('Sai định dạng')
  return [n, +h]
}

const parseInput = (content: string): Input => {
  const acc: Input = { start: ['', 0], goal: ['', 0], graph: {} }
  for (const line of content.split(/\r?\n/).filter(Boolean)) {
    const [k, v = ''] = line.split(':').map(x => x.trim())
    if (k === 'TTĐ') acc.start = parsePeak(v)
    else if (k === 'TTKT') acc.goal = parsePeak(v)
    else acc.graph[k] = v.split(/\s+/).map(parsePeak)
  }
  return acc
}

function runHillClimbing(input: Input) {
  writeFileSync(OUTPUT_FILE, '', 'utf-8')
  const append = (line: string) => appendFileSync(OUTPUT_FILE, line + '\n', 'utf-8')

  append(`TTĐ: ${formatPeak(input.start)}`)
  append(`TTKT: ${formatPeak(input.goal)}\n`)
  append('Phát triển TT'.padEnd(16) + '\t' + 'Trạng thái kề'.padEnd(24) + '\t' + 'Danh sách L1'.padEnd(24) + '\tDanh sách L')
  append('-'.repeat(100))
  append(`${''.padEnd(16)}\t${''.padEnd(24)}\t${''.padEnd(24)}\t${formatPeak(input.start)}`)

  const visited = new Set<string>()
  const father: Record<string, string | null> = { [input.start[0]]: null }
  const heuristic: Record<string, number> = { [input.start[0]]: input.start[1] }

  const L = [{ peak: input.start, parent: null as string | null }]

  while (L.length) {
    const { peak, parent } = L.shift()!
    const [node, h] = peak

    if (visited.has(node)) continue

    visited.add(node)
    father[node] = parent
    heuristic[node] = h

    const neighbors = input.graph[node] ?? []

    const L1 = neighbors
      .filter(([n]) => !visited.has(n))
      .sort((a, b) => a[1] - b[1]) // Sắp xếp theo độ cao tăng dần

    for (const next of L1.reverse()) {
      const [n, nh] = next
      heuristic[n] = nh

      const idx = L.findIndex(x => x.peak[0] === n)

      if (idx === -1) L.unshift({ peak: next, parent: node })
      else L[idx] = { peak: next, parent: node }
    }

    if (node === input.goal[0]) {
      L.length = 0
      append(formatLogLine({ expanded: peak, neighbors: 'TTKT/Dừng', l1: [...L1].reverse(), l: [] }))
      const path: Peak[] = []

      for (let cur: string | null = node; cur; cur = father[cur]) {
        path.push([cur, heuristic[cur]])
      }

      return finish(append, true, path.reverse())
    }

    append(formatLogLine({ expanded: peak, neighbors, l1: [...L1].reverse(), l: L.map(x => x.peak) }))
  }

  return finish(append, false, [])
}

runHillClimbing(parseInput(readFileSync(INPUT_FILE, 'utf-8')))
console.log(readFileSync(OUTPUT_FILE, 'utf-8'))
