// @vitest-environment jsdom
/**
 * Global inline-editing system — component-level behaviour tests (A8.4).
 *
 * Asserts the load-bearing contracts of `InlineEditField` /
 * `InlineEditRelationshipSelect`:
 *   - the edit pen is ALWAYS visible (not hover-gated)
 *   - clicking the pen OR the value enters edit mode
 *   - saving calls `onSave` with the new value
 *   - Esc cancels without calling `onSave`
 *   - a failed save rolls back the optimistic value and surfaces the error
 *   - the readOnly / permission-denied path shows a lock and no pen
 *   - the relationship select never renders a raw UUID (resolves to a label)
 *
 * Pure component tests — no network, no real Supabase. `onSave` is a mock.
 */
import "./__stubs__/jsdom-setup"
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react"
import { InlineEditField } from "@/components/editing/InlineEditField"
import { InlineEditRelationshipSelect } from "@/components/editing/InlineEditRelationshipSelect"

function deferred<T = void>() {
  let resolve!: (v: T) => void
  let reject!: (e: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe("InlineEditField", () => {
  it("always renders an edit pen in display mode (never hover-gated)", () => {
    render(<InlineEditField value="Acme Ltd" label="Company" onSave={vi.fn()} />)
    // Two affordances carry the Edit label: the value button + the pen button.
    const editButtons = screen.getAllByRole("button", { name: /edit company/i })
    expect(editButtons.length).toBeGreaterThanOrEqual(2)
  })

  it("enters edit mode when the pen is clicked and shows an input", () => {
    render(<InlineEditField value="Acme Ltd" label="Company" onSave={vi.fn()} />)
    fireEvent.click(screen.getAllByRole("button", { name: /edit company/i })[1])
    expect(screen.getByRole("textbox", { name: /edit company/i })).toBeDefined()
  })

  it("enters edit mode when the value text is clicked", () => {
    render(<InlineEditField value="Acme Ltd" label="Company" onSave={vi.fn()} />)
    fireEvent.click(screen.getAllByRole("button", { name: /edit company/i })[0])
    expect(screen.getByRole("textbox", { name: /edit company/i })).toBeDefined()
  })

  it("calls onSave with the edited value when Save is pressed", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    render(<InlineEditField value="Acme Ltd" label="Company" onSave={onSave} />)
    fireEvent.click(screen.getAllByRole("button", { name: /edit company/i })[1])
    const input = screen.getByRole("textbox", { name: /edit company/i })
    fireEvent.change(input, { target: { value: "Acme Group" } })
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }))
    await waitFor(() => expect(onSave).toHaveBeenCalledWith("Acme Group"))
  })

  it("saves on Enter key", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    render(<InlineEditField value="1" label="Count" type="number" onSave={onSave} />)
    fireEvent.click(screen.getAllByRole("button", { name: /edit count/i })[1])
    const input = screen.getByRole("spinbutton", { name: /edit count/i })
    fireEvent.change(input, { target: { value: "5" } })
    fireEvent.keyDown(input, { key: "Enter" })
    await waitFor(() => expect(onSave).toHaveBeenCalledWith("5"))
  })

  it("Esc cancels editing and does NOT call onSave", () => {
    const onSave = vi.fn()
    render(<InlineEditField value="Acme Ltd" label="Company" onSave={onSave} />)
    fireEvent.click(screen.getAllByRole("button", { name: /edit company/i })[1])
    const input = screen.getByRole("textbox", { name: /edit company/i })
    fireEvent.change(input, { target: { value: "Changed" } })
    fireEvent.keyDown(input, { key: "Escape" })
    expect(onSave).not.toHaveBeenCalled()
    // Back to display mode showing the original value.
    expect(screen.getAllByRole("button", { name: /edit company/i }).length).toBeGreaterThanOrEqual(2)
  })

  it("does not call onSave when the value is unchanged", () => {
    const onSave = vi.fn()
    render(<InlineEditField value="Acme Ltd" label="Company" onSave={onSave} />)
    fireEvent.click(screen.getAllByRole("button", { name: /edit company/i })[1])
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }))
    expect(onSave).not.toHaveBeenCalled()
  })

  it("rolls back and shows the error when the save fails", async () => {
    const onSave = vi.fn().mockRejectedValue(new Error("Network down"))
    render(
      <InlineEditField value="Acme Ltd" label="Company" onSave={onSave} silentToast />
    )
    fireEvent.click(screen.getAllByRole("button", { name: /edit company/i })[1])
    const input = screen.getByRole("textbox", { name: /edit company/i })
    fireEvent.change(input, { target: { value: "Broken" } })
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }))
    // Error surfaced inline (role=alert) and editor reopened with the draft.
    const alert = await screen.findByRole("alert")
    expect(alert.textContent).toMatch(/network down/i)
    const reopened = screen.getByRole("textbox", { name: /edit company/i }) as HTMLInputElement
    expect(reopened.value).toBe("Acme Ltd")
  })

  it("blocks the save and shows a validation error", () => {
    const onSave = vi.fn()
    render(
      <InlineEditField
        value="5"
        label="Count"
        type="number"
        onSave={onSave}
        validate={(v) => (Number(v) > 10 ? "Too big" : null)}
      />
    )
    fireEvent.click(screen.getAllByRole("button", { name: /edit count/i })[1])
    const input = screen.getByRole("spinbutton", { name: /edit count/i })
    fireEvent.change(input, { target: { value: "99" } })
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }))
    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByRole("alert").textContent).toMatch(/too big/i)
  })

  it("readOnly path shows a lock reason and renders no edit pen", () => {
    render(
      <InlineEditField
        value="Acme Ltd"
        label="Company"
        onSave={vi.fn()}
        readOnly
        readOnlyReason="You do not have permission"
      />
    )
    expect(screen.queryByRole("button", { name: /edit company/i })).toBeNull()
    expect(screen.getByText(/you do not have permission/i)).toBeDefined()
  })

  it("permission=false locks the field (no pen)", () => {
    render(
      <InlineEditField
        value="Acme Ltd"
        label="Company"
        onSave={vi.fn()}
        permission={false}
        readOnlyReason="Read only"
      />
    )
    expect(screen.queryByRole("button", { name: /edit company/i })).toBeNull()
  })

  it("keeps the optimistic value visible while the save is in flight", async () => {
    const d = deferred()
    const onSave = vi.fn().mockReturnValue(d.promise)
    render(<InlineEditField value="Old" label="Name" onSave={onSave} silentToast />)
    fireEvent.click(screen.getAllByRole("button", { name: /edit name/i })[1])
    const input = screen.getByRole("textbox", { name: /edit name/i })
    fireEvent.change(input, { target: { value: "New" } })
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }))
    // Optimistic flip: display shows the new value before the promise resolves.
    await waitFor(() =>
      expect(screen.getAllByRole("button", { name: /edit name/i })[0].textContent).toMatch(/new/i)
    )
    d.resolve()
  })
})

describe("InlineEditRelationshipSelect", () => {
  const options = [
    { value: "8b1f6d2e-0000-4000-8000-000000000001", label: "12 Oak Street", sublabel: "London" },
    { value: "8b1f6d2e-0000-4000-8000-000000000002", label: "5 Elm Road", sublabel: "Leeds" },
  ]

  it("never renders the raw UUID — resolves to the option label", () => {
    const { container } = render(
      <InlineEditRelationshipSelect
        value="8b1f6d2e-0000-4000-8000-000000000001"
        options={options}
        label="Property"
        onSave={vi.fn()}
      />
    )
    expect(screen.getByText("12 Oak Street")).toBeDefined()
    expect(container.textContent).not.toContain("8b1f6d2e-0000-4000-8000-000000000001")
  })

  it("shows a placeholder (not a UUID) when the value has no matching option", () => {
    const { container } = render(
      <InlineEditRelationshipSelect
        value="unknown-uuid-with-no-option"
        options={options}
        label="Property"
        placeholder="Select a property"
        onSave={vi.fn()}
      />
    )
    expect(container.textContent).not.toContain("unknown-uuid-with-no-option")
    expect(screen.getByText("Select a property")).toBeDefined()
  })

  it("opens a searchable listbox and saves the chosen option's value", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    render(
      <InlineEditRelationshipSelect
        value="8b1f6d2e-0000-4000-8000-000000000001"
        options={options}
        label="Property"
        onSave={onSave}
      />
    )
    fireEvent.click(screen.getAllByRole("button", { name: /edit property/i })[0])
    const dialog = await screen.findByRole("dialog", { name: /edit property/i })
    const option = within(dialog).getByText("5 Elm Road")
    fireEvent.click(option)
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith("8b1f6d2e-0000-4000-8000-000000000002")
    )
  })

  it("locked relationship shows no pen and resolves to the label", () => {
    render(
      <InlineEditRelationshipSelect
        value="8b1f6d2e-0000-4000-8000-000000000002"
        options={options}
        label="Property"
        onSave={vi.fn()}
        permission={false}
        readOnlyReason="Locked"
      />
    )
    expect(screen.queryByRole("button", { name: /edit property/i })).toBeNull()
    expect(screen.getByText("5 Elm Road")).toBeDefined()
  })
})
