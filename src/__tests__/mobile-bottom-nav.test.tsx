// @vitest-environment jsdom
/**
 * Mobile bottom nav — centre Copilot button + unread badge logic (A8.4).
 *
 * Asserts:
 *   - the centre button OPENS the chat (calls onOpenChat) and does NOT navigate
 *     (it is a <button>, carries no href, and is labelled for the Copilot/Inbox)
 *   - the unread badge renders the count, caps at "99+", and is hidden at 0
 *   - the primary route tabs are real navigation links (href present)
 *   - aria-current marks the active route tab
 *
 * `next/navigation`, `next/link` and `next/image` are mocked so the component
 * renders in jsdom without the framework runtime.
 */
import "./__stubs__/jsdom-setup"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

let mockPathname = "/property-manager/portfolio"
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}))
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}))
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  default: (props: Record<string, unknown>) => <img {...(props as object)} />,
}))

// Imported AFTER the mocks are registered.
import MobileBottomNav from "@/components/mobile/MobileBottomNav"

beforeEach(() => {
  mockPathname = "/property-manager/portfolio"
})

describe("MobileBottomNav centre Copilot button", () => {
  it("opens the Copilot panel instead of navigating", () => {
    const onOpenChat = vi.fn()
    render(<MobileBottomNav onOpenChat={onOpenChat} />)
    const centre = screen.getByRole("button", { name: /open propvora copilot and inbox/i })
    // It is a button, not a link — it must not carry an href.
    expect(centre.tagName).toBe("BUTTON")
    expect(centre.getAttribute("href")).toBeNull()
    fireEvent.click(centre)
    expect(onOpenChat).toHaveBeenCalledTimes(1)
  })

  it("exposes dialog semantics and reflects the open state", () => {
    const { rerender } = render(<MobileBottomNav chatOpen={false} onOpenChat={vi.fn()} />)
    const centre = screen.getByRole("button", { name: /open propvora copilot and inbox/i })
    expect(centre.getAttribute("aria-haspopup")).toBe("dialog")
    expect(centre.getAttribute("aria-expanded")).toBe("false")
    rerender(<MobileBottomNav chatOpen onOpenChat={vi.fn()} />)
    expect(
      screen.getByRole("button", { name: /open propvora copilot and inbox/i }).getAttribute("aria-expanded")
    ).toBe("true")
  })
})

describe("MobileBottomNav unread badge", () => {
  it("hides the badge when there are no unread items", () => {
    render(<MobileBottomNav onOpenChat={vi.fn()} unreadCount={0} />)
    expect(screen.queryByText("0")).toBeNull()
  })

  it("renders the exact unread count", () => {
    render(<MobileBottomNav onOpenChat={vi.fn()} unreadCount={7} />)
    expect(screen.getByText("7")).toBeDefined()
  })

  it("caps the badge at 99+", () => {
    render(<MobileBottomNav onOpenChat={vi.fn()} unreadCount={250} />)
    expect(screen.getByText("99+")).toBeDefined()
  })
})

describe("MobileBottomNav route tabs", () => {
  it("renders Home / Portfolio / Work as real navigation links", () => {
    render(<MobileBottomNav onOpenChat={vi.fn()} />)
    const home = screen.getByRole("link", { name: /home/i })
    const portfolio = screen.getByRole("link", { name: /portfolio/i })
    const work = screen.getByRole("link", { name: /work/i })
    expect(home.getAttribute("href")).toBe("/property-manager")
    expect(portfolio.getAttribute("href")).toBe("/property-manager/portfolio")
    expect(work.getAttribute("href")).toBe("/property-manager/work")
  })

  it("marks the active route tab with aria-current=page", () => {
    mockPathname = "/property-manager/portfolio"
    render(<MobileBottomNav onOpenChat={vi.fn()} />)
    const portfolio = screen.getByRole("link", { name: /portfolio/i })
    expect(portfolio.getAttribute("aria-current")).toBe("page")
    const home = screen.getByRole("link", { name: /home/i })
    expect(home.getAttribute("aria-current")).toBeNull()
  })

  it("opens the More sheet as a dialog (not a navigation)", () => {
    render(<MobileBottomNav onOpenChat={vi.fn()} />)
    const more = screen.getByRole("button", { name: /^more$/i })
    expect(more.getAttribute("aria-haspopup")).toBe("dialog")
  })
})
