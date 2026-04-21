import { readFileSync, writeFileSync } from 'node:fs'

const INPUT_FILE = 'input.txt'
const OUTPUT_FILE = 'output.txt'

interface Input {
  start: Peak
  goal: Peak
  graph: Record<string, Peak[]>
}

type Peak = [string, number]
type StackItem = {
  peak: Peak
  parent: string | null
}
type StepLog = {
  expanded: Peak
  neighbors: Peak[]
  l1: Peak[]
  l: Peak[]
}
type Father = Record<string, string | null>
type HeuristicByNode = Record<string, number>
type Stack = StackItem[]
type HillClimbingState = {
  logs: StepLog[]
  visited: Set<string>
  father: Father
  heuristicByNode: HeuristicByNode
  L: Stack
}

// type: utils
function formatPeak([name, h]: Peak): string {
  return `${name}-${h}`
}

function formatList(peaks: Peak[]): string {
  return peaks.map(formatPeak).join(' ')
}

// ______________________________

// type: parser
function parsePeak(peak: string): Peak {
  const match = peak.match(/^([A-Za-z])(\d{1,2})$/)
  if (!match) {
    throw new Error('Chuỗi không đúng định dạng')
  }
  return [match[1], Number(match[2])]
}

function parseInput(content: string): Input {
  return content
    .split(/\r?\n/)
    .filter(Boolean)
    .reduce((acc, line) => {
      const [key, value = ''] = line.split(':').map(x => x.trim())
      if (key === 'TTĐ') acc.start = parsePeak(value)
      else if (key === 'TTKT') acc.goal = parsePeak(value)
      else acc.graph[key] = value.split(/\s+/).map(parsePeak)
      return acc
    }, { start: ['', 0], goal: ['', 0], graph: {} } as Input)
}
// ______________________________

// type: helper
function initState(input: Input): HillClimbingState {
  return {
    logs: [],
    visited: new Set<string>(),
    father: { [input.start[0]]: null },
    heuristicByNode: { [input.start[0]]: input.start[1] },
    L: [{ peak: input.start, parent: null }]
  }
}

function getSortedNeighbors(input: Input, currentNode: string, visited: Set<string>): Peak[] {
  return [...(input.graph[currentNode] ?? [])]
    .filter(([node]) => !visited.has(node))
    .sort((a, b) => a[1] - b[1])
}

function mergeL1IntoL(L: Stack, L1: Peak[], parentNode: string, heuristicByNode: HeuristicByNode): void {
  const toFront: StackItem[] = []

  for (const nextPeak of L1) {
    const [nextNode, nextHeuristic] = nextPeak
    heuristicByNode[nextNode] = nextHeuristic

    const stackIndex = L.findIndex(item => item.peak[0] === nextNode)
    if (stackIndex === -1) toFront.push({ peak: nextPeak, parent: parentNode })
    else {
      L[stackIndex].parent = parentNode
      L[stackIndex].peak = nextPeak
    }
  }

  L.unshift(...toFront)
}

function buildPath(goalNode: string, father: Father, heuristicByNode: HeuristicByNode): Peak[] {
  const pathNodes: string[] = []
  for (let node: string | null = goalNode; node !== null; node = father[node]) pathNodes.push(node)
  return pathNodes.reverse().map(node => [node, heuristicByNode[node]] as Peak)
}
// ______________________________

// type: run
function runHillClimbing(input: Input) {
  const state = initState(input)
  const { logs, visited, father, heuristicByNode, L } = state

  while (L.length > 0) {
    const current: StackItem = L.shift()!
    const [currentNode] = current.peak

    if (visited.has(currentNode)) {
      continue
    }

    visited.add(currentNode)
    father[currentNode] = current.parent
    heuristicByNode[currentNode] = current.peak[1]

    const neighbors = input.graph[currentNode] ?? []
    const L1 = getSortedNeighbors(input, currentNode, visited)
    mergeL1IntoL(L, L1, currentNode, heuristicByNode)

    logs.push({
      expanded: current.peak,
      neighbors,
      l1: L1,
      l: L.map(item => item.peak)
    })

    if (currentNode === input.goal[0]) {
      return { path: buildPath(currentNode, father, heuristicByNode), logs, status: true }
    }
  }

  return { path: [] as Peak[], logs, status: false }
}
// ______________________________

// type: main
let content = readFileSync(INPUT_FILE, 'utf-8')
const input = parseInput(content)
const result = runHillClimbing(input)

const output = [
  `TTĐ: ${formatPeak(input.start)}`,
  `TTKT: ${formatPeak(input.goal)}`,
  '',
  'Phát triển TT'.padEnd(16) + '\t' + 'Trạng thái kề'.padEnd(24) + '\t' + 'Danh sách L1'.padEnd(24) + '\t' + 'Danh sách L',
  '-'.repeat(100),
  `${''.padEnd(16)}\t${''.padEnd(24)}\t${''.padEnd(24)}\t${formatPeak(input.start)}`,
  ...result.logs.map(step =>
    `${formatPeak(step.expanded).padEnd(16)}\t${formatList(step.neighbors).padEnd(24)}\t${formatList(step.l1).padEnd(24)}\t${formatList(step.l)}`
  ),
  '',
  `Status: ${result.status}`,
  `Path: ${result.path.length > 0 ? result.path.map(formatPeak).join(' -> ') : 'Không tìm thấy đường đi'}`
].join('\n')

writeFileSync(OUTPUT_FILE, output, 'utf-8')
console.log(output)

// ______________________________