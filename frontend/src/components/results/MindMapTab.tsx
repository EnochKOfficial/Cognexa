import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Download, ImageIcon, Loader2, Move } from 'lucide-react'
import type { MindMapEdge, MindMapNode, NodeType, StudyMaterial } from '../../types/api'
import { downloadMindMapPng, slugify } from '../../lib/export'

/* ------------------------------------------------------------------ */
/* Node data types                                                     */
/* ------------------------------------------------------------------ */
export type MnNodeData = { label: string; nodeType: NodeType }
type MnNode = Node<MnNodeData>

const NODE_COLORS: Record<NodeType, string> = {
  topic: '#8b5cf6',
  subtopic: '#6366f1',
  concept: '#334155',
}

/* ------------------------------------------------------------------ */
/* Custom node renderers (restrained, distinct styling)                */
/* ------------------------------------------------------------------ */
function TopicNode({ data, selected }: NodeProps<MnNode>) {
  return (
    <div
      className={`rounded-2xl bg-gradient-to-br from-accent via-indigo-500 to-blue px-6 py-4 shadow-[0_10px_30px_rgba(99,102,241,0.35)] transition-shadow ${
        selected ? 'ring-2 ring-white/80' : ''
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-widest text-white/70">
        Central topic
      </p>
      <p className="mt-0.5 text-base font-bold leading-tight text-white">{data.label}</p>
      <NodeHandles />
    </div>
  )
}

function SubtopicNode({ data, selected }: NodeProps<MnNode>) {
  return (
    <div
      className={`rounded-xl border border-accent/45 bg-panel px-4 py-3 shadow-[0_8px_22px_rgba(2,6,23,0.5)] transition-shadow ${
        selected ? 'border-accent-strong ring-2 ring-accent/50' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 shrink-0 rounded-full bg-accent-strong" aria-hidden="true" />
        <p className="text-sm font-semibold leading-tight text-slate-100">{data.label}</p>
      </div>
      <NodeHandles />
    </div>
  )
}

function ConceptNode({ data, selected }: NodeProps<MnNode>) {
  return (
    <div
      className={`rounded-lg border border-line bg-navy-800/95 px-3 py-2 shadow-[0_6px_16px_rgba(2,6,23,0.45)] transition-shadow ${
        selected ? 'border-slate-400 ring-2 ring-slate-400/40' : ''
      }`}
    >
      <p className="whitespace-nowrap text-xs font-medium text-slate-300">{data.label}</p>
      <NodeHandles />
    </div>
  )
}

/** Invisible connection points on the left/right edges of every node. */
function NodeHandles() {
  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        className="!h-1.5 !w-1.5 !border-0 !bg-slate-500"
        aria-hidden="true"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!h-1.5 !w-1.5 !border-0 !bg-slate-500"
        aria-hidden="true"
      />
    </>
  )
}

const nodeTypes = { topic: TopicNode, subtopic: SubtopicNode, concept: ConceptNode }

/* ------------------------------------------------------------------ */
/* Mapping from the API contract to React Flow structures              */
/* ------------------------------------------------------------------ */
function toFlowNodes(nodes: MindMapNode[]): MnNode[] {
  return nodes.map((node) => ({
    id: node.id,
    type: node.node_type,
    position: { x: node.position.x, y: node.position.y },
    data: { label: node.label, nodeType: node.node_type },
  }))
}

function toFlowEdges(edges: MindMapEdge[]): Edge[] {
  return edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: 'smoothstep',
    label: edge.label ?? undefined,
    labelStyle: { fill: '#94a3b8', fontSize: 11, fontWeight: 500 },
    labelBgStyle: { fill: '#0a0f1f', fillOpacity: 0.9 },
    labelBgPadding: [6, 3] as [number, number],
  }))
}

/* ------------------------------------------------------------------ */
/* Inner map (must live inside ReactFlowProvider)                      */
/* ------------------------------------------------------------------ */
function MindMapPane({ result, isActive }: { result: StudyMaterial; isActive: boolean }) {
  const [nodes, , onNodesChange] = useNodesState<MnNode>(toFlowNodes(result.nodes))
  const [edges, , onEdgesChange] = useEdgesState<Edge>(toFlowEdges(result.edges))
  const { setViewport, getViewport } = useReactFlow<MnNode, Edge>()
  const captureRef = useRef<HTMLDivElement>(null)
  const savedViewportRef = useRef<ReturnType<typeof getViewport> | null>(null)
  const wasActiveRef = useRef(isActive)
  const [exporting, setExporting] = useState(false)
  const [exportDone, setExportDone] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  // Preserve pan/zoom across tab switches: remember the viewport while hidden
  // and restore it when the map becomes visible again.
  useEffect(() => {
    const wasActive = wasActiveRef.current
    wasActiveRef.current = isActive
    if (!isActive && wasActive) {
      savedViewportRef.current = getViewport()
    } else if (isActive && !wasActive && savedViewportRef.current) {
      const viewport = savedViewportRef.current
      requestAnimationFrame(() => setViewport(viewport, { duration: 0 }))
    }
  }, [isActive, getViewport, setViewport])

  const handleExport = useCallback(async () => {
    if (!captureRef.current || exporting) return
    setExporting(true)
    setExportError(null)
    try {
      await downloadMindMapPng(captureRef.current, `${slugify(result.main_topic.label)}-mindmap.png`)
      setExportDone(true)
      setTimeout(() => setExportDone(false), 2500)
    } catch {
      setExportError('PNG export failed. Try a screenshot of the browser instead.')
    } finally {
      setExporting(false)
    }
  }, [exporting, result.main_topic.label])

  const minimapColor = useCallback(
    (node: MnNode) => NODE_COLORS[(node.data.nodeType as NodeType) ?? 'concept'],
    [],
  )

  return (
    <div>
      {/* Map toolbar */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-xs text-muted">
          <Move className="h-3.5 w-3.5" aria-hidden="true" />
          Drag nodes to rearrange · scroll to zoom · drag the canvas to pan
        </p>
        <div className="flex items-center gap-3">
          {exportError && <span className="text-xs text-danger">{exportError}</span>}
          {exportDone && <span className="text-xs text-success">Saved PNG ✓</span>}
          <button
            type="button"
            onClick={() => void handleExport()}
            disabled={exporting}
            className="btn-secondary px-3 py-2 text-xs"
          >
            {exporting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            Download PNG
          </button>
        </div>
      </div>

      <div
        ref={captureRef}
        className="relative h-[64vh] min-h-[440px] overflow-hidden rounded-2xl border border-line bg-navy-950/70"
      >
        <ReactFlow<MnNode, Edge>
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          fitViewOptions={{ padding: 0.22, maxZoom: 1.1 }}
          minZoom={0.2}
          maxZoom={2.2}
          nodesConnectable={false}
          deleteKeyCode={null}
          proOptions={{ hideAttribution: false }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1.4} color="rgba(148,163,184,0.18)" />
          <Controls showInteractive={false} className="no-export" position="bottom-left" />
          <MiniMap
            pannable
            zoomable
            nodeColor={minimapColor}
            maskColor="rgba(4, 6, 13, 0.72)"
            className="no-export"
            position="bottom-right"
          />
        </ReactFlow>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
        {(
          [
            ['topic', 'Central topic'],
            ['subtopic', 'Subtopic'],
            ['concept', 'Concept'],
          ] as const
        ).map(([type, label]) => (
          <span key={type} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: NODE_COLORS[type] }}
              aria-hidden="true"
            />
            {label}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
          Export removes controls &amp; mini-map from the PNG
        </span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Public component                                                    */
/* ------------------------------------------------------------------ */
export default function MindMapTab({
  result,
  isActive,
}: {
  result: StudyMaterial
  isActive: boolean
}) {
  return (
    <ReactFlowProvider>
      <MindMapPane result={result} isActive={isActive} />
    </ReactFlowProvider>
  )
}
