"use client"

import { motion, AnimatePresence, useAnimationControls } from "framer-motion"
import { useEffect } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface ChatBubbleProps {
  unreadCount?: number
  onClick: () => void
  isOpen: boolean
  bubbleState?: "closed" | "thinking" | "new_message"
}

function PropvoraLogoMark() {
  return (
    <Image
      src="/propvora-favicon.png"
      alt="Propvora"
      width={32}
      height={32}
      className="w-8 h-8 object-contain"
      priority
    />
  )
}

export default function ChatBubble({
  unreadCount = 0,
  onClick,
  isOpen,
  bubbleState = "closed",
}: ChatBubbleProps) {
  const bounceControls = useAnimationControls()

  // Trigger bounce when a new message arrives
  useEffect(() => {
    if (bubbleState === "new_message") {
      bounceControls.start({
        y: [0, -10, 4, -6, 0],
        transition: { duration: 0.55, ease: "easeInOut" },
      })
    }
  }, [bubbleState, bounceControls])

  // Ring pulse speed based on state
  const ringPulseDuration = bubbleState === "thinking" ? 0.9 : 3

  return (
    <AnimatePresence>
      {!isOpen && (
        <motion.div
          key="chat-bubble-wrapper"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 420, damping: 30 }}
          /* Lift clear of the fixed MobileBottomNav below lg; desktop unchanged. */
          className="group pwa-safe-bottom fixed bottom-[calc(env(safe-area-inset-bottom,0px)+76px)] right-5 lg:bottom-7 lg:right-7 z-50"
        >
          {/* Tooltip */}
          <div
            role="tooltip"
            id="chat-bubble-tooltip"
            className={cn(
              "absolute bottom-full right-0 mb-3",
              "px-3 py-1.5 rounded-lg",
              "bg-gray-900 text-white text-xs font-medium whitespace-nowrap",
              "shadow-lg pointer-events-none",
              "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200",
            )}
          >
            Propvora Copilot &amp; Inbox
            {/* Arrow */}
            <span className="absolute top-full right-4 -mt-px border-4 border-transparent border-t-gray-900" />
          </div>

          {/* Breathing outer glow ring */}
          <motion.div
            className="absolute -inset-2 rounded-full motion-reduce:!opacity-50 motion-reduce:![transform:none]"
            aria-hidden
            style={{
              background:
                "radial-gradient(circle, rgba(37,99,235,0.22) 0%, rgba(37,99,235,0) 70%)",
            }}
            animate={{
              scale: [1, 1.12, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: ringPulseDuration,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Animated ring — outer */}
          <motion.div
            className="absolute inset-0 rounded-full ring-4 ring-[#2563EB]/40 motion-reduce:!opacity-60 motion-reduce:![transform:none]"
            aria-hidden
            animate={{
              opacity: [0.4, 0.85, 0.4],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: ringPulseDuration,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Extra soft glow ring */}
          <div className="absolute -inset-1 rounded-full ring-2 ring-[#2563EB]/20 pointer-events-none" />

          {/* Thinking shimmer overlay */}
          {bubbleState === "thinking" && (
            <motion.div
              className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"
              aria-hidden
            >
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    "linear-gradient(120deg, transparent 30%, rgba(37,99,235,0.25) 50%, transparent 70%)",
                }}
                animate={{ x: ["-100%", "200%"] }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  ease: "linear",
                  repeatDelay: 0.2,
                }}
              />
            </motion.div>
          )}

          {/* Main button */}
          <motion.button
            animate={bounceControls}
            whileHover={{ scale: 1.07, y: -2 }}
            whileTap={{ scale: 0.93 }}
            onClick={onClick}
            aria-label="Open Propvora Copilot & Inbox"
            aria-describedby="chat-bubble-tooltip"
            className={cn(
              "group relative",
              "w-14 h-14 rounded-full",
              "flex items-center justify-center",
              // White face
              "bg-white",
              // Premium blue shadow
              "shadow-[0_8px_32px_rgba(37,99,235,0.30),0_2px_8px_rgba(37,99,235,0.15)]",
              "hover:shadow-[0_12px_40px_rgba(37,99,235,0.45),0_4px_12px_rgba(37,99,235,0.25)]",
              // Focus ring
              "focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2563EB]/50 focus-visible:ring-offset-2",
              "transition-shadow duration-300",
              "cursor-pointer"
            )}
          >
            {/* Inner top-gloss sheen */}
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background:
                  "linear-gradient(160deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 55%)",
              }}
            />

            {/* Logo mark */}
            <PropvoraLogoMark />

            {/* Unread badge */}
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ delay: 0.12, type: "spring", stiffness: 500, damping: 24 }}
                className={cn(
                  "absolute -top-1 -right-1",
                  "min-w-[20px] h-5 px-1 rounded-full",
                  "bg-red-500 text-white text-[10px] font-bold",
                  "flex items-center justify-center",
                  "border-2 border-white shadow-sm",
                  "pointer-events-none select-none"
                )}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </motion.span>
            )}
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
