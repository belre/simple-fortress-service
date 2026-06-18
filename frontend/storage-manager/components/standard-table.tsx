"use client"

import * as React from "react"

import {
  ColumnDef,
  flexRender,
  SortingState,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"



export type GeneralRow = {
  id?: string | null
}

interface DataTableProps<TData extends GeneralRow, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  focusId?: string | null
  onRowSelected?: React.Dispatch<React.SetStateAction<string | null>>
  meta?: any;
}


export function DataTableSheet<TData extends GeneralRow, TValue>({
  columns,
  data,
  focusId,
  onRowSelected,
  meta
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({})
  const [sorting, setSorting] = React.useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
      rowSelection
    }
  })

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-background p-6 cursor-default select-none">
      {/* テーブルを包むカード。ここでクリックの突き抜け（バブリング）をせき止める */ }
      <div className="rounded-md border bg-card" onClick={(e) => e.stopPropagation()}>
        <div className="overflow-hidden rounded-md border">
          <Table className="table-fixed" style={{minWidth : table.getTotalSize()}}>
            <colgroup>
              {table.getAllLeafColumns().map((column) => {
                const isGrow = column.columnDef.meta?.isGrow
                return (
                  <col
                    key={column.id}
                    style={isGrow ? undefined : { width: column.getSize() }}
                  />
                )
              })}
            </colgroup>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => {
                  return (
                    <TableRow
                      key={row.id}
                      data-uuid={row.original.id}
                      data-state={row.getIsSelected() && "selected"}
                      className={focusId === row.original.id ? 
                        "bg-muted font-medium" : "hover:bg-muted/50 cursor-pointer"}
                      onClick={(row) => {
                        const trElement = row.currentTarget;
                        if(!onRowSelected) {
                          return
                        }
                        onRowSelected(trElement.dataset.uuid ?? null)
                      }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                  </TableRow>
                )})
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}