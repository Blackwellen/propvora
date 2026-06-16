// Premium per-category node SHAPES + visuals for the React Flow canvas.
// Mirrors CATEGORY_VISUALS in node-registry but adds the concrete CSS that
// gives each category a distinct silhouette (diamond, hexagon, rounded-left
// start, terminal pill, gated lock accent, clock, etc.).

import type { NodeShape } from "@/lib/automation/node-registry"

export interface ShapeStyle {
  /** Outer wrapper extra classes (clip-path / radius). */
  wrap: string
  /** Inline style for non-Tailwind clip paths. */
  style?: React.CSSProperties
  /** Min width in px for the node body. */
  minWidth: number
}

const HEX = "polygon(8% 0, 92% 0, 100% 50%, 92% 100%, 8% 100%, 0 50%)"
const DIAMOND = "polygon(50% 0, 100% 50%, 50% 100%, 0 50%)"

export const SHAPE_STYLES: Record<NodeShape, ShapeStyle> = {
  start: { wrap: "rounded-l-2xl rounded-r-md", minWidth: 184 },
  diamond: { wrap: "", style: { clipPath: DIAMOND }, minWidth: 168 },
  hexagon: { wrap: "", style: { clipPath: HEX }, minWidth: 184 },
  rect: { wrap: "rounded-xl", minWidth: 184 },
  ai: { wrap: "rounded-2xl", minWidth: 184 },
  gated: { wrap: "rounded-xl", minWidth: 184 },
  approval: { wrap: "rounded-xl", minWidth: 184 },
  clock: { wrap: "rounded-full", minWidth: 168 },
  lookup: { wrap: "rounded-xl", minWidth: 184 },
  comm: { wrap: "rounded-xl", minWidth: 184 },
  integration: { wrap: "rounded-xl", minWidth: 184 },
  webhook: { wrap: "rounded-xl", minWidth: 184 },
  utility: { wrap: "rounded-md", minWidth: 168 },
  error: { wrap: "rounded-xl", minWidth: 184 },
  terminal: { wrap: "rounded-full", minWidth: 156 },
}

/** Shapes that need extra inner padding because their clip cuts the corners. */
export const CLIPPED_SHAPES: NodeShape[] = ["diamond", "hexagon"]
