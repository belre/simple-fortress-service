"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { MoreHorizontal } from "lucide-react"
import { ArrowUpDown } from "lucide-react"

import * as React from "react"

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
    isGrow?: boolean,
  }
}

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type FileItem = {
  id: string
	fileName: string
  updatedAt: string,
  status: "syncing" | "completed"
}

export interface RenamingStatus {
  isRenaming: boolean
  previousValue?: string
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
    const isCurrentRowRenaming = meta?.renamingStatus.isRenaming && meta?.focusedId === fileItem.id
    return (
      isCurrentRowRenaming ? (
        <Input 
          id="renamingFileName" 
          autoComplete="off" 
          ref={(el) => {
            // autoFocusの代替動作
            if (el) {
              setTimeout(() => el.focus(), 0);
            }
          }}
          value={meta?.tableData?.find((item: any) => item.id === fileItem.id)?.fileName ?? ""}
          onClick={(evt) => evt.stopPropagation()} 
          onChange={(evt) => {
            // 💡 王様に直接データを書き換えてもらう
            meta.updateRowName(fileItem.id, evt.target.value)
          }}
          onBlur={(evt) => {
            meta.setRenamingStatus({
              isRenaming: false
            });
          }}
          onKeyDown={(evt) => {
            if (evt.key === "Enter") {
              evt.preventDefault();
              meta.setRenamingStatus({
                isRenaming: false
              });
            }

            if (evt.key === "Escape") {
              evt.preventDefault();
              // 2. Escが押されたら、編集モードを終了する（キャンセル）
              // 本来は変更前の値に戻す処理を入れますが、まずはモード解除だけでOK
              if(meta?.renamingStatus.previousValue) {
                meta.updateRowName(fileItem.id, meta?.renamingStatus.previousValue)
              }
              meta.setRenamingStatus({
                isRenaming: false
              });
            }
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
            onSelect={(evt) => {
              const meta = table.options.meta as any
              meta.setRenamingStatus({
                isRenaming: true,
                previousValue: fileItem.fileName
              })
            }}>Rename</DropdownMenuItem>
          <DropdownMenuItem>View fileItem details</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  },
}]



