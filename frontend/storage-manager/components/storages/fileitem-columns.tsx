"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { MoreHorizontal } from "lucide-react"
import { ArrowUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { Input } from "@/components/ui/input"

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData, TValue> {
    isGrow?: boolean
  }
}

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type FileItem = {
  id: string
	fileName: string
  updatedAt: string,
  status: "syncing" | "completed"
  isRenamingFileName?: boolean
}


export const fileItemColumns: ColumnDef<FileItem>[] = [
{
  id: "select",
  header: ({ table }) => (
    <Checkbox
      checked={
        table.getIsAllPageRowsSelected() ||
        (table.getIsSomePageRowsSelected() && "indeterminate")
      }
      onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      aria-label="Select all"
    />
  ),
  cell: ({ row }) => (
    <Checkbox
      checked={row.getIsSelected()}
      onCheckedChange={(value) => row.toggleSelected(!!value)}
      aria-label="Select row"
    />
  ),
  size: 20,
  enableSorting: false,
  enableHiding: false,
},
{
  accessorKey: "fileName",
  header: () =>{
    return (
      <span className="ml-3 mr-3">FileName</span>
    )
  },
  cell: ({ row, table }) => {
    const fileItem = row.original
    
    // 💡 王様が meta に仕込んでくれた状態と関数をここで召喚する！
    const meta = table.options.meta as any
    const isCurrentRowRenaming = meta?.isRenamingFile && meta?.focusedId === fileItem.id

    return (
      isCurrentRowRenaming ? (
        <Input 
          id="renamingFileName" 
          autoComplete="off" 
          // 💡 解決策Aの「王様の最新データを直接見に行く」技をここでも使用
          value={meta?.tableData?.find((item: any) => item.id === fileItem.id)?.fileName ?? ""}
          onClick={(e) => e.stopPropagation()} 
          onChange={(evt) => {
            // 💡 王様に直接データを書き換えてもらう
            meta.updateRowName(fileItem.id, evt.target.value)
          }}  
        />
      ) : (
        <span className="ml-3 mr-3">{fileItem.fileName}</span>
      )
    )
  },
  minSize: 100,
  meta: {
    isGrow: true
  }
},
{
  accessorKey: "updatedAt",
  header: ({ column }) => {
    return (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        UpdatedAt
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    )
  },
},
{
  accessorKey: "status",
  header: "Status",
},
{
  id: "actions",
  cell: ({ row, table }) => {
    const fileItem = row.original
 
    return (
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => navigator.clipboard.writeText(fileItem.id)}
          >
            Copy fileItem ID
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              const meta = table.options.meta as any
              meta.setRenamingFile(true)
            }}>Rename</DropdownMenuItem>
          <DropdownMenuItem>View fileItem details</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  },
}]



