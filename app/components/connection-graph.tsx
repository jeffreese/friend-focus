import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

interface GraphNode {
  id: string
  name: string
  color: string
  val: number
}

interface GraphLink {
  source: string
  target: string
  strength: number
}

interface ConnectionGraphProps {
  nodes: GraphNode[]
  links: GraphLink[]
  onNodeClick?: (nodeId: string) => void
  selectedNodeId?: string | null
}

export function ConnectionGraph({
  nodes,
  links,
  onNodeClick,
  selectedNodeId,
}: ConnectionGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 })
  // biome-ignore lint/suspicious/noExplicitAny: ForceGraph2D types not available
  const [ForceGraph, setForceGraph] = useState<any>(null)

  useEffect(() => {
    import('react-force-graph-2d').then(mod => {
      setForceGraph(() => mod.default)
    })
  }, [])

  useEffect(() => {
    if (!containerRef.current) return
    const obs = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width } = entry.contentRect
        setDimensions({ width, height: Math.max(380, width * 0.6) })
      }
    })
    obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [])

  const connectedNodeIds = useMemo(() => {
    if (!selectedNodeId) return new Set<string>()
    const ids = new Set<string>()
    for (const link of links) {
      if (link.source === selectedNodeId || link.target === selectedNodeId) {
        ids.add(
          link.source === selectedNodeId
            ? (link.target as string)
            : (link.source as string),
        )
      }
    }
    return ids
  }, [selectedNodeId, links])

  const nodeCanvasObject = useCallback(
    // biome-ignore lint/suspicious/noExplicitAny: graph library types
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const size = Math.sqrt(node.val || 1) * 4 + 4
      const isSelected = node.id === selectedNodeId
      const isConnected = connectedNodeIds.has(node.id)
      const isDimmed = selectedNodeId && !isSelected && !isConnected

      ctx.beginPath()
      ctx.arc(node.x, node.y, size, 0, 2 * Math.PI)
      ctx.fillStyle = isDimmed ? `${node.color}40` : node.color || '#6b7280'
      ctx.fill()

      if (isSelected) {
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2 / globalScale
        ctx.stroke()
      }

      const fontSize = Math.max(10 / globalScale, 3)
      ctx.font = `${fontSize}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillStyle = isDimmed ? '#9ca3af80' : '#9ca3af'
      ctx.fillText(node.name || '', node.x, node.y + size + 2)
    },
    [selectedNodeId, connectedNodeIds],
  )

  const linkColor = useCallback(
    // biome-ignore lint/suspicious/noExplicitAny: graph library types
    (link: any) => {
      if (!selectedNodeId) return 'rgba(156, 163, 175, 0.3)'
      const src = typeof link.source === 'object' ? link.source.id : link.source
      const tgt = typeof link.target === 'object' ? link.target.id : link.target
      if (src === selectedNodeId || tgt === selectedNodeId) {
        return 'rgba(156, 163, 175, 0.6)'
      }
      return 'rgba(156, 163, 175, 0.08)'
    },
    [selectedNodeId],
  )

  if (!ForceGraph) {
    return (
      <div
        ref={containerRef}
        className="flex items-center justify-center rounded-lg border bg-card"
        style={{ minHeight: 380 }}
      >
        <span className="text-sm text-muted-foreground">Loading graph...</span>
      </div>
    )
  }

  const graphData = { nodes: [...nodes], links: [...links] }

  return (
    <div ref={containerRef} className="w-full" style={{ height: 380 }}>
      <ForceGraph
        graphData={graphData}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="transparent"
        nodeCanvasObject={nodeCanvasObject}
        nodePointerAreaPaint={(
          // biome-ignore lint/suspicious/noExplicitAny: graph library types
          node: any,
          color: string,
          ctx: CanvasRenderingContext2D,
        ) => {
          const size = Math.sqrt(node.val || 1) * 4 + 6
          ctx.beginPath()
          ctx.arc(node.x, node.y, size, 0, 2 * Math.PI)
          ctx.fillStyle = color
          ctx.fill()
        }}
        // biome-ignore lint/suspicious/noExplicitAny: graph library types
        linkWidth={(link: any) => (link.strength || 3) * 0.8}
        linkColor={linkColor}
        // biome-ignore lint/suspicious/noExplicitAny: graph library types
        onNodeClick={(node: any) => onNodeClick?.(node.id)}
        onBackgroundClick={() => onNodeClick?.('')}
        cooldownTicks={100}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
      />
    </div>
  )
}
