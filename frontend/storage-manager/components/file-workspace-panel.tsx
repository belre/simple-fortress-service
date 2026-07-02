"use client"; // 👈 クライアントの動きはここに完全隔離！

import * as React from "react";
import { DataTableSheet } from "@/components/standard-table"; // あなたの作ったDataTable
import { Separator } from "@/components/ui/separator"
import { describeLargeIcon, FileItem, fileItemColumns } from "@/components/storages/fileitem-columns"
import { Skeleton } from "@/components/ui/skeleton"
import type { AllowedResourceType, StorageDirectoryIndexed } from "@/models/storage";
import { useFileOperationEvent } from "@/hooks/use-file-operation";
import { Progress } from "@/components/ui/progress"
import { Toaster } from "@/components/ui/sonner"
import { ModalBlurPanel } from "./modal-panel";
import { FileDeleteResult, FileMoveResult, IndexCollectionResolveResult, UploadResult } from "@/models/storage-behavior";
import { useIndexing } from "@/hooks/use-file-access";
import { StorageApiFactory } from "@/service/storage/api-factory.service";
import { UseMutateFunction } from "@tanstack/react-query";
import { DeleteStatus, RenamingStatus } from "@/models/storage-interaction";


interface FileWorkspacePanelProps {
  current: IndexCollectionResolveResult
  workDirectoryPathId?: string | null
  resourceName: string
  resourceType: AllowedResourceType
}

interface FileWorkspacePanelContentProps {
  current: IndexCollectionResolveResult
  resourceName: string
  resourceType: AllowedResourceType
  renameStatus: RenamingStatus
  deleteStatus: DeleteStatus
  onRenameStart: ( {pathId, currentFileName} : { pathId: string, currentFileName: string}) => void
  onRenameAbort: ( fileItem: FileItem ) => void
  mutateRename: UseMutateFunction<FileMoveResult | null, Error, { pathId: string, newName: string }, unknown>
  mutateDelete: UseMutateFunction<FileDeleteResult | null, Error, string, unknown>,
}



const convertToFileItem = (resourceName?: string | null, dirs?: StorageDirectoryIndexed[] | null) : FileItem[] => {
  if(!resourceName)
    return []

  const getLink = (d: StorageDirectoryIndexed) => {
    switch(d.resourceType) {
      case "s3-folder":
      case "s3-prefix":
        return `/storages?resource_name=${resourceName}&path_id=${encodeURIComponent( d.pathId )}`
      default:
        return null
    }
  }

  return ( dirs ?? [] ).map( d => {
    return {
      id: d.pathId,
      fileName: d.name,
      updatedAt: d.updatedAt ?? "",
      status: d.status,
      icon: describeLargeIcon(d.resourceType),
      link: getLink(d)
    }
  })
}

const storageApiFactory = StorageApiFactory.createStorageApiFactoryFromEnv()


function InlineHeader({
  current, 
  resourceName
}: {
  current: IndexCollectionResolveResult,
  resourceName: string
}) {
  const targetPathName = `s3://${resourceName}/${current?.data?.prefix ?? ''}${current?.data?.name}`
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
  const [ dropStatus, setDropStatus] = React.useState<{
    isDropping: boolean,
    uploadingCount?: number
  }>({
    isDropping: false
  })

  return (
    <div className="outline-none w-full min-h-screen"
      onDrop={async (evt) => {
        evt.preventDefault();

        if(!resourceType) {
          console.warn("Failure to upload")
          setDropStatus({
            isDropping: false,
          })
          return
        }
        
        const files = [...evt.dataTransfer.files]
        mutateUpload(files[0])
        
        setDropStatus({
          isDropping: false,
        })
      }}
      onDragOver={(evt) => {
        evt.preventDefault();
        if (dropStatus.isDropping) return;

        const files = [...evt.dataTransfer.items].filter((item) => item.kind === "file")
        if (files.length !== 0) {
          setDropStatus({
            isDropping: true,
            uploadingCount: files.length
          })
        }
      }}>
    <ModalBlurPanel props={{isVisible: dropStatus.isDropping}}>
      <span>Uploading: {dropStatus.uploadingCount ?? 0} files</span> <br/>
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
  resourceName, 
  resourceType,
  renameStatus,
  deleteStatus,
  onRenameStart,
  onRenameAbort,
  mutateRename,
  mutateDelete
} : FileWorkspacePanelContentProps) {

  const [ isPending, startTransition] = React.useTransition()

  // 📍 Status管理を集約して表現する
  const {
    paginateFilePath,
    validateToAllowRedirect,
    accessError,
    releaseError
  } = useIndexing(storageApiFactory, resourceType)

  // 💡 テーブルのフォーカスや遅延制御の状態は、このパネルが王様として管理する
  const [ focusedId, setFocusedId] = React.useState<string | null>(null)

  const [ addedTableData, setAddedTableData] = React.useState<FileItem[]>(
    convertToFileItem(resourceName, current?.data?.directory ?? [])
  )
  const [ lastCursor, setLastCursor] = React.useState<string | null>(current?.childCursor ?? null)

  React.useEffect(() => {
    startTransition(() => {
      if(!renameStatus.targetPathId) {
        return
      }

      setAddedTableData(prev => 
        prev.map(item => 
          item.id === renameStatus.targetPathId 
            ? { ...item, 
              id: renameStatus.renamedId ?? item.id,
              fileName: renameStatus.renamedValue ? renameStatus.renamedValue : item.fileName,
              status: renameStatus.isSyncing ? 'syncing' : 'completed'
            } : item
          )
      )
    })
  }, [renameStatus])
 
  React.useEffect(() => {
    startTransition(() => {
      if(!deleteStatus.deletedId) {
        return
      }
      setAddedTableData(prev => 
          prev.map(item => 
              item.id === deleteStatus.deletedId 
                  ? { ...item, status: 'deleted' } 
                  : item
          )
      )
    })
  }, [deleteStatus.deletedId])

  return (
    // ただのdivではなく、役割を持った「ワークスペースの背景」として定義
    <div
      className="outline-none w-full min-h-screen"
      tabIndex={0}
      onKeyDown={(evt) => {
        if( resourceType !== 's3-folder') {
          return
        }
        
        if (document.activeElement?.tagName === "INPUT") {
          return;
        }

        if(!focusedId) {
          return
        }

        const targets = addedTableData
          .filter((item) => item.id === focusedId)

        if(targets.length !== 1) {
          console.warn("Target Renaming file not found")
          return
        }
        const target = targets[0]

        if(evt.key == "F2") {
          if(focusedId) {
            onRenameStart({
              pathId: target.id,
              currentFileName: target.fileName,
            })
          }
          return
        }

        if(evt.key === "Delete" && focusedId) {
          mutateDelete(focusedId)
          return
        }
      }}>

      <Separator />
      <DataTableSheet 
        columns={fileItemColumns}
        data={[...addedTableData]
          .filter(d => d.status !== 'deleted')
        } 
        focusId={focusedId}
        onRowSelected={setFocusedId}
        onPaginationTriggered={async () => {
          const pathId = current?.data?.pathId
          if(!pathId) {
            return
          }
          const result = await paginateFilePath( pathId, lastCursor)
          const newAddedTableData = convertToFileItem(resourceName, result?.data?.directory ?? null) ?? []
          setAddedTableData( [ ...addedTableData, ...newAddedTableData])
          setLastCursor(result.childCursor ?? null)
        }}
        paginationCursor={lastCursor ?? null}
        meta={{
          focusedId,
          resourceType: resourceType,
          renameStatus: renameStatus,
          onRenameStart: onRenameStart,
          onRenameAbort: onRenameAbort,
          mutateRename: mutateRename,
          mutateDelete: mutateDelete,
          tableData: addedTableData,
          updateRowName: (rowId: string, newName: string) => {
            const updatedRows = (addedTableData ?? []).map((item) => item.id === rowId ? { ...item, fileName: newName } : item)
            setAddedTableData(updatedRows)
          },
          validateToAllowRedirect: (id: string)=>{
            startTransition(async () => {
              await validateToAllowRedirect(id, resourceName)
            })
          }
        }}
      />
      <ModalBlurPanel props={{isVisible: accessError != null}}>
        <div className="flex size-full justify-center items-center" onClick={() => {
          releaseError()
        }}>
          <span>{accessError}</span> <br/>
        </div>
      </ModalBlurPanel>
    </div>
 );
}


export function FileWorkspacePanel({ workDirectoryPathId, resourceName, resourceType, current }: FileWorkspacePanelProps) {
  const { 
    mutateRename,
    mutateUpload, 
    mutateDelete,
    progress, 
    renameStatus, 
    deleteStatus,
    onRenameStart,
    onRenameAbort,
  } = useFileOperationEvent(storageApiFactory, resourceType)

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
          resourceName={resourceName}
          resourceType={resourceType}
          renameStatus={renameStatus}
          deleteStatus={deleteStatus}
          mutateRename={mutateRename}
          mutateDelete={mutateDelete}
          onRenameStart={onRenameStart}
          onRenameAbort={onRenameAbort}
          current={current}
        />    
      </DropdownBox>
    </div>
  );
}