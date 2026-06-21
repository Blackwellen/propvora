"use client"

import { useEffect, useRef } from "react"

/**
 * Scrolls the active tab element into view whenever `activeKey` changes.
 *
 * Usage:
 *   const { containerRef, itemRef } = useScrollActiveTabIntoView(activeKey)
 *   <div ref={containerRef} className="overflow-x-auto ...">
 *     {tabs.map(tab => (
 *       <a ref={itemRef(tab.key)} ...>{tab.label}</a>
 *     ))}
 *   </div>
 */
export function useScrollActiveTabIntoView(activeKey: string) {
  const containerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Record<string, HTMLElement | null>>({})

  useEffect(() => {
    const el = itemRefs.current[activeKey]
    if (!el) return
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    el.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      inline: "center",
      block: "nearest",
    })
  }, [activeKey])

  /** Call with a tab key, pass the returned function as `ref` on the tab element. */
  function itemRef(key: string) {
    return (el: HTMLAnchorElement | HTMLButtonElement | null) => {
      itemRefs.current[key] = el
    }
  }

  return { containerRef, itemRef }
}
