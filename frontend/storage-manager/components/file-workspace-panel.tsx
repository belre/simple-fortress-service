"use client"; // 👈 クライアントの動きはここに完全隔離！

import * as React from "react";
import { DataTableSheet } from "@/components/standard-table"; // あなたの作ったDataTable
import { Separator } from "@/components/ui/separator"
import { describeLargeIcon, FileItem, fileItemColumns, RenamingStatus } from "@/components/storages/fileitem-columns"
import { Skeleton } from "@/components/ui/skeleton"
import type { AllowedResourceType, StorageDirectoryIndexed } from "@/models/storage";
import { useFileUpload } from "@/hooks/use-file-upload";
import { Progress } from "@/components/ui/progress"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import { ModalBlurPanel } from "./modal-panel";
import { IndexCollectionResolveResult, UploadResult } from "@/models/storage-behavior";
import { useIndexing } from "@/hooks/use-file-access";
import { StorageApiFactory } from "@/service/storage/api-factory.service";
import { useAtom } from "jotai";
import { errorMessageAtom, uploadingStatusAtom } from "@/atoms/session-atoms";
import { UseMutateFunction } from "@tanstack/react-query";


interface FileWorkspacePanelProps {
  current: IndexCollectionResolveResult
  workDirectoryPathId: string | null
  resourceName: string
  resourceType: AllowedResourceType
}

interface FetchStatus {
  resourceType: AllowedResourceType | null
  prevWorkDirectoryPathId: string | null
  targetPathName?: string
  tableData?: FileItem[]
  lastCursor?: string | null
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

function InlineHeader({
  current, 
  resourceName
}: {
  current: IndexCollectionResolveResult,
  resourceName: string
}) {
  const targetPathName = `s3://${resourceName}${current?.data?.name}`

  return (<div className="h-[30px] flex items-center">
  {
    targetPathName ? 
      <h2 className="ml-3 items-center">{targetPathName}</h2> :
      <Skeleton className="ml-3 w-[200px] rounded-full h-4" />
    }
  </div>)
}

function DropdownBox({
  resourceType,
  mutateUpload,
  children
}: {
  resourceType: AllowedResourceType,
  mutateUpload: UseMutateFunction<UploadResult | null, Error, File, unknown>,
  children: React.ReactNode
}) {
  const [ uploadingStatus, setUploadingStatus] = useAtom(uploadingStatusAtom)
  const [ errorMessage, setErrorMessage] = useAtom(errorMessageAtom)

  return (
    <div className="outline-none w-full min-h-screen"
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
      }}>
    <ModalBlurPanel props={{isVisible: uploadingStatus.isUploading}}>
      <span>Uploading: {uploadingStatus.uploadingCount ?? 0} files</span> <br/>
    </ModalBlurPanel>

    <ModalBlurPanel props={{isVisible: errorMessage != null}}>
      <div className="flex size-full justify-center items-center" onClick={(evt) => {
        setErrorMessage(null)
      }}>
        <span>{errorMessage}</span> <br/>
      </div>
    </ModalBlurPanel>

    {children}
    <Toaster />
  </div>)
}

function UploadProgressContent({
  progress,
}: {
  progress: number,
})
{ 
  return (
    <Progress value={progress} />
  )
}

function FileWorkspacePanelContent({ 
  current,
  workDirectoryPathId, 
  resourceName, 
  resourceType,
} : FileWorkspacePanelProps) {
  const storageApiFactory = StorageApiFactory.createStorageApiFactoryFromEnv()
  const [isPending, startTransition] = React.useTransition()

  // 💡 テーブルのフォーカスや遅延制御の状態は、このパネルが王様として管理する
  const [focusedId, setFocusedId] = React.useState<string | null>(null)

  // 📍 Status管理を集約して表現する
  const renameStatusState = React.useState<RenamingStatus>({
    isRenaming: false,
  })
  const [ renamingStatus, setRenamingStatus] = renameStatusState
  const [ errorMessage, setErrorMessage] = useAtom(errorMessageAtom)
  const {
    paginateFilePath,
    validateToAllowRedirect 
  } = useIndexing(storageApiFactory, resourceName, resourceType, () => {
    setErrorMessage("File Access Error")
  })

  const [fetchStatus, setFetchStatus] = React.useState<FetchStatus>({
    resourceType: resourceType,
    prevWorkDirectoryPathId: workDirectoryPathId,
    targetPathName: `s3://${resourceName}${current?.data?.name}`,
    tableData: convertToFileItem(resourceName, current?.data?.directory ?? []),
  })

  const [ addedTableData, setAddedTableData] = React.useState<FileItem[]>([])
  const [ lastCursor, setLastCursor] = React.useState<string | null>(current?.childCursor ?? null)

  return (
    // ただのdivではなく、役割を持った「ワークスペースの背景」として定義
    <div
      className="outline-none w-full min-h-screen"
      tabIndex={0}
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

      <Separator />
      <DataTableSheet 
        columns={fileItemColumns}
        data={[...(fetchStatus.tableData ?? []), ...addedTableData]} 
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
          const result = await paginateFilePath(lastCursor)
          const newAddedTableData = convertToFileItem(resourceName, result?.indexes) ?? []
          setAddedTableData( [ ...addedTableData, ...newAddedTableData])
          setLastCursor(result.nextCursor ?? null)
        }}
        paginationCursor={lastCursor ?? null}
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
          validateToAllowRedirect: (id: string)=>{
            startTransition(async () => {
              await validateToAllowRedirect(id)
            })
          }
        }}
      />
    </div>
 );
}


export function FileWorkspacePanel({ workDirectoryPathId, resourceName, resourceType, current }: FileWorkspacePanelProps) {
  const storageApiFactory = StorageApiFactory.createStorageApiFactoryFromEnv()
  const { 
    mutate: mutateUpload, 
    progress, 
    uploadStatusTracker,
  } = useFileUpload(storageApiFactory, resourceType)
  React.useEffect(() => {
    if(uploadStatusTracker.status != "completed" || !workDirectoryPathId) {
      return
    }
    toast.success("アップロードが完了しました")
  }, [uploadStatusTracker.status, workDirectoryPathId])

  return (
    <div className="container">
      <InlineHeader 
        current={current}
        resourceName={resourceName}
      />
      <UploadProgressContent
        progress={progress}
      />
      <Separator />
      <DropdownBox
        resourceType={resourceType}
        mutateUpload={mutateUpload}>
        <FileWorkspacePanelContent
          key={workDirectoryPathId}
          workDirectoryPathId={workDirectoryPathId}
          resourceName={resourceName}
          resourceType={resourceType}
          current={current}
        />    
      </DropdownBox>
    </div>
  );
}