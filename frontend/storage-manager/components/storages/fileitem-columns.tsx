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

import { Plus, Star, Delete, Folder, BucketIcon, File02Icon } from "@hugeicons/core-free-icons"

export const APP_ICONS = {
  Plus, Star, Delete, Folder, BucketIcon
} as const

export type StorageServiceIconObject = (typeof APP_ICONS)[keyof typeof APP_ICONS];

export const describeLargeIcon = (resourceType: AllowedResourceType | string | undefined) => {
  if(!resourceType) {
    return null
  }

  switch(resourceType) {
    case "aws-favorites":
      return Star
    case "aws-trashes":
      return Delete
    case "s3-prefix":
      return BucketIcon
    case "s3-folder":
      return Folder
    default:
      return Plus
  }
}


import { Input } from "@/components/ui/input"
import { AllowedResourceType } from "@/models/storage"
import { HugeiconsIcon } from "@hugeicons/react"


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
  status: 'syncing' | 'completed' | 'deleted'
  icon?: StorageServiceIconObject | null
  link?: string | null
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
      <span className="ml-6 mr-3">FileName</span>
    )
  },
  cell: ({ row, table }) => {
    const fileItem = row.original

    // 💡 王様が meta に仕込んでくれた状態と関数をここで召喚する！
    const meta = table.options.meta as any
    const isCurrentRowRenaming = meta?.renameStatus.isRenaming && meta?.focusedId === fileItem.id
    
    const displayIcon = fileItem.icon ?? File02Icon

    return (<div className="flex w-full rounded-md hover:bg-sidebar-accent ml-3">
      <HugeiconsIcon icon={displayIcon} className="shrink-0"/>
      { isCurrentRowRenaming ? (
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
            onBlur={() => {
              meta.onRenameAbort(fileItem)
            }}
            onKeyDown={async (evt) => {
              if (evt.key === "Enter") {
                evt.preventDefault();
                await meta.onRenameSubmit({
                  pathId: fileItem.id, 
                  newName: fileItem.fileName,
                  fileItem: fileItem
                })
                return
              }

              if (evt.key === "Escape") {
                evt.preventDefault();
                // 2. Escが押されたら、編集モードを終了する（キャンセル）
                // 本来は変更前の値に戻す処理を入れますが、まずはモード解除だけでOK
                if(meta?.renameStatus.previousValue) {
                  meta.updateRowName(fileItem.id, meta?.renameStatus.previousValue)
                }
                meta.onRenameAbort(fileItem)
                fileItem.fileName = meta.renameStatus.previousFileName
              }
            }}
            />
        ) : (
          fileItem.link ?
            <div className="ml-3 mr-3"
              onClick={async (evt) => {
                evt.preventDefault()
                meta?.validateToAllowRedirect(fileItem.id)
              }}>{fileItem.fileName}</div> :
            <span className="ml-3 mr-3 ">{fileItem.fileName}</span>
        )}
      </div>
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
              evt.stopPropagation()
              const meta = table.options.meta as any
              meta.onRenameStart({
                fileItem: fileItem,
                pathId: fileItem.id,
                currentFileName: fileItem.fileName
              })
            }}>Rename</DropdownMenuItem>
          <DropdownMenuItem>View fileItem details</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  },
}]



