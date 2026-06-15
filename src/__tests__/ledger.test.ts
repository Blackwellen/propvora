import { describe, it, expect } from "vitest"
import { checkBalance, toCsv, isMissingTable } from "@/lib/accounting/ledger"
import type { DraftLine } from "@/lib/accounting/types"

const line = (over: Partial<DraftLine>): DraftLine => ({
  account_id: "acc",
  debit_pence: 0,
  credit_pence: 0,
  ...over,
})

describe("ledger — pure helpers", () => {
  describe("checkBalance", () => {
    it("balances equal debits and credits", () => {
      const r = checkBalance([
        line({ account_id: "a", debit_pence: 10000 }),
        line({ account_id: "b", credit_pence: 10000 }),
      ])
      expect(r.totalDebit).toBe(10000)
      expect(r.totalCredit).toBe(10000)
      expect(r.difference).toBe(0)
      expect(r.balanced).toBe(true)
      expect(r.lineCount).toBe(2)
    })

    it("is unbalanced when debits != credits", () => {
      const r = checkBalance([
        line({ account_id: "a", debit_pence: 10000 }),
        line({ account_id: "b", credit_pence: 9000 }),
      ])
      expect(r.difference).toBe(1000)
      expect(r.balanced).toBe(false)
    })

    it("is not balanced when totals are zero (empty entry)", () => {
      const r = checkBalance([])
      expect(r.balanced).toBe(false)
      expect(r.lineCount).toBe(0)
    })

    it("ignores lines with no account or no amount", () => {
      const r = checkBalance([
        line({ account_id: "a", debit_pence: 5000 }),
        line({ account_id: "", debit_pence: 9999 }), // no account -> ignored
        line({ account_id: "c", debit_pence: 0, credit_pence: 0 }), // no amount -> ignored
        line({ account_id: "b", credit_pence: 5000 }),
      ])
      expect(r.lineCount).toBe(2)
      expect(r.totalDebit).toBe(5000)
      expect(r.totalCredit).toBe(5000)
      expect(r.balanced).toBe(true)
    })

    it("sums multiple debit and credit lines", () => {
      const r = checkBalance([
        line({ account_id: "a", debit_pence: 3000 }),
        line({ account_id: "b", debit_pence: 7000 }),
        line({ account_id: "c", credit_pence: 4000 }),
        line({ account_id: "d", credit_pence: 6000 }),
      ])
      expect(r.totalDebit).toBe(10000)
      expect(r.totalCredit).toBe(10000)
      expect(r.balanced).toBe(true)
    })
  })

  describe("isMissingTable", () => {
    it("detects postgres 42P01", () => {
      expect(isMissingTable({ code: "42P01" })).toBe(true)
    })
    it("detects 'does not exist' message", () => {
      expect(isMissingTable({ message: 'relation "foo" does not exist' })).toBe(true)
    })
    it("is false for unrelated errors and null", () => {
      expect(isMissingTable({ code: "23505", message: "duplicate key" })).toBe(false)
      expect(isMissingTable(null)).toBe(false)
    })
  })

  describe("toCsv", () => {
    it("renders headers and rows", () => {
      const csv = toCsv(["Code", "Name"], [["1000", "Cash"], ["2000", "Bank"]])
      expect(csv).toBe("Code,Name\n1000,Cash\n2000,Bank")
    })
    it("quotes and escapes values containing commas, quotes and newlines", () => {
      const csv = toCsv(["A"], [['has, comma'], ['has "quote"'], ["has\nnewline"]])
      expect(csv).toBe('A\n"has, comma"\n"has ""quote"""\n"has\nnewline"')
    })
    it("renders null as empty string", () => {
      expect(toCsv(["A", "B"], [[null, 5]])).toBe("A,B\n,5")
    })
  })
})
