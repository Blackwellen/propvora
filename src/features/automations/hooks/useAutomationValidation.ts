"use client"

import { useMemo } from "react"
import type { Node } from "@xyflow/react"
import type { CanvasFlowNodeData } from "../canvas/types"
import { nodeConfigSchema } from "@/lib/automation/node-registry"

export interface NodeValidationResult {
  nodeId: string
  nodeKey: string
  label: string
  valid: boolean
  errors: string[]
}

export interface ValidationSummary {
  allValid: boolean
  hasTrigger: boolean
  hasAction: boolean
  results: NodeValidationResult[]
  errorCount: number
}

export function useAutomationValidation(
  nodes: Node<CanvasFlowNodeData>[]
): ValidationSummary {
  return useMemo(() => {
    const results: NodeValidationResult[] = nodes.map((node) => {
      const data = node.data
      const schema = nodeConfigSchema(data.nodeType)
      const errors: string[] = []

      // Check required fields
      for (const field of schema) {
        if (field.required) {
          const val = data.config?.[field.key]
          if (val === undefined || val === null || val === "") {
            errors.push(`"${field.label}" is required`)
          }
        }
      }

      // Triggers and end nodes always valid structurally
      if (data.category === "trigger" && errors.length === 0) {
        // ensure trigger is configured
      }

      return {
        nodeId: node.id,
        nodeKey: data.nodeKey,
        label: data.label,
        valid: errors.length === 0,
        errors,
      }
    })

    const triggerNodes = nodes.filter((n) => n.data.category === "trigger")
    const hasTrigger = triggerNodes.length > 0
    const hasMultipleTriggers = triggerNodes.length > 1
    const hasAction = nodes.some((n) =>
      ["action", "communication", "approval"].includes(n.data.category)
    )

    // Mark extra trigger nodes as invalid
    if (hasMultipleTriggers) {
      const [, ...extraTriggers] = triggerNodes
      extraTriggers.forEach((t) => {
        const r = results.find((res) => res.nodeId === t.id)
        if (r) {
          r.errors.push("Only one trigger node is allowed per workflow")
          r.valid = false
        }
      })
    }

    const errorCount = results.filter((r) => !r.valid).length

    return {
      allValid: errorCount === 0 && hasTrigger && hasAction && !hasMultipleTriggers,
      hasTrigger,
      hasAction,
      results,
      errorCount,
    }
  }, [nodes])
}
