"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type ColumnDef,
  type SortingState,
  flexRender,
} from "@tanstack/react-table"
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  MessageSquare,
  Edit,
  Trash2,
  Building2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { cn, formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { type Contact, type ContactType } from "./ContactCard"

const TYPE_COLOURS: Record<ContactType, string> = {
  tenant:    "bg-emerald-100 text-emerald-700",
  landlord:  "bg-blue-100 text-blue-700",
  supplier:  "bg-amber-100 text-amber-700",
  agent:     "bg-violet-100 text-violet-700",
  applicant: "bg-sky-100 text-sky-700",
  other:     "bg-slate-100 text-slate-600",
}

const AVATAR_COLOURS = [
  "bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-amber-500",
  "bg-rose-500", "bg-cyan-500", "bg-fuchsia-500", "bg-teal-500",
]

function getAvatarColour(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLOURS[Math.abs(hash) % AVATAR_COLOURS.length]
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

interface ContactTableProps {
  contacts: Contact[]
  onEdit?: (id: string) => void
  onMessage?: (id: string) => void
  onDelete?: (id: string) => void
}

export function ContactTable({ contacts, onEdit, onMessage, onDelete }: ContactTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  const columns = useMemo<ColumnDef<Contact>[]>(
    () => [
      {
        id: "name",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900 text-xs uppercase tracking-wide"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Contact
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="w-3.5 h-3.5" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="w-3.5 h-3.5" />
            ) : (
              <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />
            )}
          </button>
        ),
        accessorFn: (row) => row.full_name,
        cell: ({ row }) => {
          const c = row.original
          const colour = getAvatarColour(c.full_name)
          const initials = getInitials(c.full_name)
          return (
            <Link href={`/app/contacts/${c.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0", colour)}>
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{c.full_name}</p>
                <p className="text-xs text-slate-400 truncate">{c.email}</p>
              </div>
            </Link>
          )
        },
      },
      {
        id: "type",
        header: "Type",
        accessorFn: (row) => row.contact_type,
        cell: ({ getValue }) => {
          const t = getValue() as ContactType
          return (
            <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize", TYPE_COLOURS[t])}>
              {t}
            </span>
          )
        },
      },
      {
        id: "phone",
        header: "Phone",
        accessorFn: (row) => row.phone ?? "—",
        cell: ({ getValue }) => <span className="text-sm text-slate-600">{getValue() as string}</span>,
      },
      {
        id: "company",
        header: "Company",
        accessorFn: (row) => row.company ?? "—",
        cell: ({ getValue }) => <span className="text-sm text-slate-600">{getValue() as string}</span>,
      },
      {
        id: "linked_properties",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900 text-xs uppercase tracking-wide"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <Building2 className="w-3.5 h-3.5" />
            Props
            {column.getIsSorted() === "asc" ? <ArrowUp className="w-3 h-3" /> : column.getIsSorted() === "desc" ? <ArrowDown className="w-3 h-3" /> : <ArrowUpDown className="w-3 h-3 opacity-40" />}
          </button>
        ),
        accessorFn: (row) => row.linked_properties,
        cell: ({ getValue }) => <span className="text-sm text-slate-700 font-medium">{getValue() as number}</span>,
      },
      {
        id: "status",
        header: "Status",
        accessorFn: (row) => row.status,
        cell: ({ getValue }) => {
          const s = getValue() as string
          return (
            <Badge
              variant={s === "active" ? "success" : s === "lead" ? "warning" : "default"}
              size="sm"
              dot
            >
              {s}
            </Badge>
          )
        },
      },
      {
        id: "last_activity",
        header: "Last Activity",
        accessorFn: (row) => row.last_activity ?? "",
        cell: ({ getValue }) => {
          const v = getValue() as string
          return <span className="text-xs text-slate-400">{v ? formatDate(v) : "—"}</span>
        },
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const id = row.original.id
          const isOpen = openDropdown === id
          return (
            <div className="relative flex justify-end">
              <button
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  setOpenDropdown(isOpen ? null : id)
                }}
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {isOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setOpenDropdown(null)} />
                  <div className="absolute right-0 top-8 z-20 w-40 bg-white rounded-xl shadow-xl border border-slate-200 py-1 max-h-[min(60vh,360px)] overflow-y-auto overscroll-contain">
                    <button
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      onClick={() => { onMessage?.(id); setOpenDropdown(null) }}
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Message
                    </button>
                    <button
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      onClick={() => { onEdit?.(id); setOpenDropdown(null) }}
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit
                    </button>
                    <div className="border-t border-slate-100 my-1" />
                    <button
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      onClick={() => { onDelete?.(id); setOpenDropdown(null) }}
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          )
        },
      },
    ],
    [openDropdown, onEdit, onMessage, onDelete]
  )

  const table = useReactTable({
    data: contacts,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  })

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-slate-200 bg-slate-50">
                {hg.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-400 text-sm">
                  No contacts found
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors cursor-pointer"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-slate-500">
          {table.getFilteredRowModel().rows.length} contacts
          {globalFilter && ` matching "${globalFilter}"`}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Prev
          </Button>
          <span className="text-xs text-slate-500">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="sm"
            rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
