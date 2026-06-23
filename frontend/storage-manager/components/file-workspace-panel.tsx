"use client"; // 👈 クライアントの動きはここに完全隔離！

import * as React from "react";
import { GeneralRow, DataTableSheet } from "@/components/standard-table"; // あなたの作ったDataTable

import { Separator } from "@/components/ui/separator"
import { SimplePathResolverService } from "@/service/storage/simple-path-resolver.service";

import { useSearchParams } from "next/navigation";

import { describeLargeIcon, FileItem, fileItemColumns, RenamingStatus } from "@/components/storages/fileitem-columns"
import { Skeleton } from "@/components/ui/skeleton"
import { UploadInteraction } from "@/models/interaction";
import type { AllowedResourceType, StorageDirectoryIndexed } from "@/models/storage";
import { useFileUpload } from "@/hooks/use-file-upload";
import { Progress } from "@/components/ui/progress"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import { useStorageApiFactoryFromEnv } from "@/hooks/use-storage-api-factory";

import { MoreVertical } from "lucide-react";

interface QueryParameter {
  resource_name?: string
  path_id?: string
}

interface FileWorkspacePanelProps {
  queryParameter?: QueryParameter
}



const fetchFilePath = async (pathId?: string) => {
  if(!pathId) {
    return null
  }

  const service = new SimplePathResolverService()
  const result = await service.resolve(pathId, 2)
  return result ?? null
}

const paginateFilePath = async (cursor?: string | null) => {
  if(!cursor) {
    return null
  }

  const service = new SimplePathResolverService()
  const result = await service.listIndexes(cursor, 1)
  return result ?? null
}


const convertToFileItem = (resourceName?: string, dirs: StorageDirectoryIndexed[] | null) : FileItem[] => {
  return ( dirs ?? [] ).map( d => {
    return {
      id: d.pathId,
      fileName: d.name,
      updatedAt: d.updatedAt ?? "",
      status: d.status,
      icon: describeLargeIcon(d.resourceType),
      link: d.resourceType == "s3-folder" ? `/storages?resource_name=${resourceName}&pathId=${d.pathId}` : null
    }
  })
}


function FileWorkspacePanelContent<TData extends GeneralRow>({ queryParameter} : FileWorkspacePanelProps) {
  const [targetDir, setTargetDir] = React.useState<any | null>(null)
  const [lastCursor, setLastCursor] = React.useState<string | null>(null)
  const [resourceType, setResourceType] = React.useState<AllowedResourceType | null>(null)

  const storageApiFactory = useStorageApiFactoryFromEnv()

  // 💡 テーブルのフォーカスや遅延制御の状態は、このパネルが王様として管理する
  const [focusedId, setFocusedId] = React.useState<string | null>(null)
  const renameStatusState = React.useState<RenamingStatus>({
    isRenaming: false,
  })
  const [renamingStatus, setRenamingStatus] = renameStatusState
  const [uploadingStatus, setUploadingStatus] = React.useState<UploadInteraction>({
    isUploading: false
  })

  const { mutate: mutateUpload, progress, status} = useFileUpload(storageApiFactory, resourceType)
  React.useEffect(() => {
    if(status.status == "completed"){
      toast.success("アップロードが完了しました")
    }
  }, [status.status])

  // 💡 データを王様のStateとして管理する（これでReactが変更を検知できる）
  const [tableData, setTableData] = React.useState<FileItem[]>([])

  React.useEffect(() => {
    const fetchResourceTarget = async() => {
      const fetched = await fetchFilePath(queryParameter?.path_id)
      const fetchData = fetched?.data

      setLastCursor(fetched?.childCursor ?? null)
      setTargetDir( `s3://${fetched?.resourceName}${fetched?.name}`)      
      setTableData( convertToFileItem( queryParameter?.resource_name, fetchData?.directory ?? [] ))

      if(!fetched) {
        return
      }
      
      const matchedResourceType = ["s3"]
      setResourceType( matchedResourceType.includes(fetchData?.resourceType ?? "") ?
        (fetchData?.resourceType ?? null) as AllowedResourceType : null )
    }
    fetchResourceTarget()
  }, [queryParameter?.path_id])


  return (
    // ただのdivではなく、役割を持った「ワークスペースの背景」として定義
    <div
      className="outline-none w-full min-h-screen"
      tabIndex={0}
      onDrop={async (evt) => {
        evt.preventDefault();

        if(!resourceType) {
          console.warn("Failure to upload")
          setUploadingStatus({
            isUploading: false,
          })
          return
        }
        
        const files = [...evt.dataTransfer.files]
        mutateUpload(files[0])
        
        setUploadingStatus({
          isUploading: false,
        })
      }}
      onDragOver={(evt) => {
        evt.preventDefault();
        if (uploadingStatus.isUploading) return;
        const files = [...evt.dataTransfer.items].filter((item) => item.kind === "file")
        if (files.length !== 0) {
          setUploadingStatus({
            isUploading: true,
            uploadingCount: files.length
          })
        }
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
      {(
        uploadingStatus.isUploading ? 
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <span>Uploading: {uploadingStatus.uploadingCount ?? 0} files</span> <br/>
        </div> : <span />
      )}
      <Toaster />
      <Progress value={progress} />
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
        onPaginationTriggered={async (tmp) => {
          const result = await paginateFilePath(lastCursor)
          const allocated = [...tableData]
            .concat(convertToFileItem(queryParameter?.resource_name, result?.indexes ?? []))
          setLastCursor(result?.nextCursor ?? null)
          setTableData(allocated)
        }}
        paginationCursor={lastCursor}
        meta={{
          focusedId,
          renamingStatus,
          setRenamingStatus,
          tableData,
          updateRowName: (rowId: string, newName: string) => {
            setTableData(() => tableData.map((item) => item.id === rowId ? { ...item, fileName: newName } : item))
          }
        }}
      />
    </div>
 );
}


export function FileWorkspacePanel<TData extends GeneralRow>({ }: FileWorkspacePanelProps) {
  const searchParams = useSearchParams()
  const queryParameter = Object.fromEntries(searchParams.entries()) as QueryParameter

  // 💡 テーブルのフォーカスや遅延制御の状態は、このパネルが王様として管理する
  return (<FileWorkspacePanelContent
    queryParameter={queryParameter}
  />);
}