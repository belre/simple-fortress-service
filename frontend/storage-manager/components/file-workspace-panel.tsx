"use client"; // 👈 クライアントの動きはここに完全隔離！

import * as React from "react";
import { GeneralRow, DataTableSheet } from "@/components/standard-table"; // あなたの作ったDataTable
import { ColumnDef } from "@tanstack/react-table";

import { Separator } from "@/components/ui/separator"
import { PathResolverService } from "@/service/storage/pathResolver.service";

import { useSearchParams } from "next/navigation";

import { FileItem, fileItemColumns, RenamingStatus } from "@/components/storages/fileitem-columns"
import { Skeleton } from "@/components/ui/skeleton"

interface QueryParameter {
  resource_name?: string
  path_id?: string
}

interface FileWorkspacePanelProps<TData extends GeneralRow> {
  columns?: ColumnDef<TData, any>[];
  data: FileItem[];
  queryParameter?: QueryParameter
}

const fetchFilePath = async (pathId?: string) => {
  if(!pathId) {
    return null
  }

  const service = new PathResolverService()
  const result = await service.resolve({
    pathId: pathId
  })

  return result.directory ?? null
}


function FileWorkspacePanelContent<TData extends GeneralRow>({ columns, data, queryParameter} : FileWorkspacePanelProps<TData>) {
  const [targetDir, setTargetDir] = React.useState<any | null>(null)

  // 💡 テーブルのフォーカスや遅延制御の状態は、このパネルが王様として管理する
  const [focusedId, setFocusedId] = React.useState<string | null>(null)
  const renameStatusState = React.useState<RenamingStatus>({
    isRenaming: false,
  })
  const [renamingStatus, setRenamingStatus] = renameStatusState

  // 💡 データを王様のStateとして管理する（これでReactが変更を検知できる）
  const [tableData, setTableData] = React.useState<FileItem[]>(data)
  React.useEffect(() => { 
    setTableData(data)
  }, [data])
  
  React.useEffect(() => {
    const fetchResourceTarget = async() => {
      const fetched = await fetchFilePath(queryParameter?.path_id)
      setTargetDir( `s3://${fetched?.resourceName}${fetched?.name}`)      
    }
    fetchResourceTarget()
  }, [queryParameter?.path_id])

  return (
    // ただのdivではなく、役割を持った「ワークスペースの背景」として定義
    <div
      className="outline-none w-full min-h-screen"
      tabIndex={0}
      onDragOver={(evt) => {
        console.log(evt)
      }}
      onKeyDown={(evt) => {
        if (document.activeElement?.tagName === "INPUT") {
          return;
        }
        if(evt.key == "F2") {
          if(focusedId) {
            const targets = tableData
              .filter((item) => item.id === focusedId)

            if(targets.length !== 1) {
              console.warn("Target Renaming file not found")
              return
            }

            const target = targets[0]
            setRenamingStatus({
              isRenaming: true,
              previousValue: target.fileName
            })
          }
        }
      }}>
      <div className="h-[30px] flex items-center">
        {
          targetDir ? 
            <h2 className="ml-3 items-center">{targetDir}</h2> :
            <Skeleton className="ml-3 w-[200px] rounded-full h-4" />
        }
      </div>
      <Separator />
      <DataTableSheet 
        columns={fileItemColumns}
        data={tableData} 
        focusId={focusedId}
        onRowSelected={(newUuid) => {
          if(newUuid != focusedId){
            setRenamingStatus({
              isRenaming: false
            })
          }
          setFocusedId(newUuid)
        }}
        meta={{
          focusedId,
          renamingStatus,
          setRenamingStatus,
          tableData,
          updateRowName: (rowId: string, newName: string) => {
            setTableData((prev) => tableData.map((item) => item.id === rowId ? { ...item, fileName: newName } : item))
          }
        }}
      />
    </div>
 );
}


export function FileWorkspacePanel<TData extends GeneralRow>({ data }: FileWorkspacePanelProps<TData>) {
  const searchParams = useSearchParams()
  const queryParameter = Object.fromEntries(searchParams.entries()) as QueryParameter

  // 💡 テーブルのフォーカスや遅延制御の状態は、このパネルが王様として管理する
  return (<FileWorkspacePanelContent
    data={data}
    queryParameter={queryParameter}
  />);
}