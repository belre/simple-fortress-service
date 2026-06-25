"use client"; // 👈 クライアントの動きはここに完全隔離！

import * as React from "react";
import { GeneralRow, DataTableSheet } from "@/components/standard-table"; // あなたの作ったDataTable

import { Separator } from "@/components/ui/separator"
import { SimplePathResolverService } from "@/service/storage/simple-path-resolver.service";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { describeLargeIcon, FileItem, fileItemColumns, RenamingStatus } from "@/components/storages/fileitem-columns"
import { Skeleton } from "@/components/ui/skeleton"
import { UploadInteraction } from "@/models/interaction";
import type { AllowedResourceType, StorageDirectoryIndexed } from "@/models/storage";
import { useFileUpload } from "@/hooks/use-file-upload";
import { Progress } from "@/components/ui/progress"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import { useStorageApiFactoryFromEnv } from "@/hooks/use-storage-api-factory";
import { ModalBlurPanel } from "./modal-panel";
import { IndexCollectionResolveResult } from "@/models/storage-behavior";

interface QueryParameter {
  resource_name?: string
  path_id?: string
}

interface FileWorkspacePanelProps {
  queryParameter?: QueryParameter
  current: IndexCollectionResolveResult
  workDirectoryPathId: string | null
  resourceName: string | null
}

interface FetchStatus {
  resourceType: AllowedResourceType | null
  prevWorkDirectoryPathId: string | null
  targetPathName?: string
  tableData?: FileItem[]
  lastCursor?: string | null
}


function ClientPart() {
  // useEffect ではなくレンダリング中に実行
  console.log('[PageA] レンダリングされた');

  React.useEffect(() => {
    console.log('[PageA] useEffect 発火');
  }, []);

  return <div>...</div>;
}

const fetchFilePath = async (pathId?: string | null) => {
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

const convertToFileItem = (resourceName?: string | null, dirs?: StorageDirectoryIndexed[]) : FileItem[] => {
  if(!resourceName)
    return []

  return ( dirs ?? [] ).map( d => {
    return {
      id: d.pathId,
      fileName: d.name,
      updatedAt: d.updatedAt ?? "",
      status: d.status,
      icon: describeLargeIcon(d.resourceType),
      link: d.resourceType == "s3-folder" ? `/storages?resource_name=${resourceName}&path_id=${encodeURIComponent( d.pathId )}` : null
    }
  })
}


function FileWorkspacePanelContent<TData extends GeneralRow>({ 
  queryParameter,
  current,
  workDirectoryPathId, 
  resourceName, 
} : FileWorkspacePanelProps) {
  const storageApiFactory = useStorageApiFactoryFromEnv()
  const router = useRouter()

  // 💡 テーブルのフォーカスや遅延制御の状態は、このパネルが王様として管理する
  const [focusedId, setFocusedId] = React.useState<string | null>(null)
  
  // 📍 Status管理を集約して表現する
  const renameStatusState = React.useState<RenamingStatus>({
    isRenaming: false,
  })
  const [renamingStatus, setRenamingStatus] = renameStatusState
  const [uploadingStatus, setUploadingStatus] = React.useState<UploadInteraction>({
    isUploading: false
  })

  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const allowedResourceType = current?.data?.resourceType as AllowedResourceType
  const [fetchStatus, setFetchStatus] = React.useState<FetchStatus>({
    resourceType: allowedResourceType,
    prevWorkDirectoryPathId: workDirectoryPathId,
    targetPathName: `s3://${resourceName}${current?.data?.name}`,
    tableData: convertToFileItem(resourceName, current?.data?.directory ?? []),
    lastCursor: current?.childCursor ?? null
  })

  const [isPending, startTransition] = React.useTransition()


  const { mutate: mutateUpload, progress, status} = useFileUpload(storageApiFactory, fetchStatus.resourceType)
  React.useEffect(() => {
    if(status.status == "completed"){
      toast.success("アップロードが完了しました")
    }
  }, [status.status])

  return (
    // ただのdivではなく、役割を持った「ワークスペースの背景」として定義
    <div
      className="outline-none w-full min-h-screen"
      tabIndex={0}
      onDrop={async (evt) => {
        evt.preventDefault();

        if(!fetchStatus.resourceType) {
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
            const targets = (fetchStatus?.tableData ?? [])
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
      <ModalBlurPanel props={{isVisible: errorMessage != null}}>
        <div className="flex size-full justify-center items-center" onClick={(evt) => {
          setErrorMessage(null)
        }}>
          <span>{errorMessage}</span> <br/>
        </div>
      </ModalBlurPanel>
      <ModalBlurPanel props={{isVisible: uploadingStatus.isUploading}}>
        <span>Uploading: {uploadingStatus.uploadingCount ?? 0} files</span> <br/>
      </ModalBlurPanel>
      <Toaster />
      <Progress value={progress} />
      <div className="h-[30px] flex items-center">
        {
          fetchStatus.targetPathName ? 
            <h2 className="ml-3 items-center">{fetchStatus.targetPathName}</h2> :
            <Skeleton className="ml-3 w-[200px] rounded-full h-4" />
        }
      </div>
      <Separator />
      <DataTableSheet 
        columns={fileItemColumns}
        data={fetchStatus.tableData ?? []} 
        focusId={focusedId}
        onRowSelected={(newUuid) => {
          if(newUuid != focusedId){
            setRenamingStatus({
              isRenaming: false
            })
          }
          setFocusedId(newUuid)
        }}
        onPaginationTriggered={async () => {
          const result = await paginateFilePath(fetchStatus.lastCursor)
          const allocated = [...(fetchStatus.tableData ?? [])]
            .concat(convertToFileItem(queryParameter?.resource_name, result?.indexes ?? []))
          setFetchStatus({
            ...fetchStatus,
            tableData : allocated,
            lastCursor: result?.nextCursor ?? null
          })
        }}
        paginationCursor={fetchStatus?.lastCursor ?? null}
        meta={{
          focusedId,
          renamingStatus,
          setRenamingStatus,
          tableData: fetchStatus.tableData,
          updateRowName: (rowId: string, newName: string) => {
            const updatedRows = (fetchStatus.tableData ?? []).map((item) => item.id === rowId ? { ...item, fileName: newName } : item)
            setFetchStatus({
              ...fetchStatus,
              "tableData" : updatedRows
            })
          },
          validateToAllowRedirect: (fileId: string) => {
            startTransition(async () => {
              const nextTargetFetched = await fetchFilePath(fileId)
              if((nextTargetFetched?.result ?? "error") == "error"){
                setErrorMessage("Data Fetch Error")
                return
              }
              router.push(`/storages?resource_name=${resourceName}&path_id=${encodeURIComponent(fileId)}`)
            })
          }
        }}
      />
      <ClientPart/>
    </div>
 );
}


export function FileWorkspacePanel<TData extends GeneralRow>({ workDirectoryPathId, resourceName, current }: FileWorkspacePanelProps) {
  const searchParams = useSearchParams()
  const queryParameter = Object.fromEntries(searchParams.entries()) as QueryParameter

  // 💡 テーブルのフォーカスや遅延制御の状態は、このパネルが王様として管理する
  return (<FileWorkspacePanelContent
    queryParameter={queryParameter}
    workDirectoryPathId={workDirectoryPathId}
    resourceName={resourceName}
    current={current}
  />);
}