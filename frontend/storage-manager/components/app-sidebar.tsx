"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

import { HugeiconsIcon } from '@hugeicons/react'
import { Folder, Question } from "@hugeicons/core-free-icons"
import { ChevronRight, ChevronDown } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { StorageDirectoryIndexed } from "@/models/storage";
import { generateMockData, toPublicId } from "@/mock/path-resolver.mock";
import React from "react";
import { FileOperationMenu } from "./file-operation-menu";
import { describeLargeIcon, StorageServiceIconObject } from "./storages/fileitem-columns";
import { useRouter } from "next/navigation";
import { useIndexing } from "@/hooks/use-file-access";
import { StorageApiFactory } from "@/service/storage/api-factory.service";

interface TmpStorageDirectoryIndexed extends StorageDirectoryIndexed {
  icon: StorageServiceIconObject | null
  directory: Array<TmpStorageDirectoryIndexed> | null
}


const storageAlignments : Record<string, Array<TmpStorageDirectoryIndexed>> = {
  "AWS": generateMockData().map(metadata => {
    return {
      ...metadata,
      icon: describeLargeIcon(metadata.resourceType),
      directory: (metadata.directory ?? []).map(child => { 
        return {
          ...child,
          icon: Folder,
          directory: null
        }
      })
    }
  }),
}

interface StorageLinkProps {
  children : React.ReactElement, 
  storageWorkspace: StorageDirectoryIndexed, 
  storageTarget: StorageDirectoryIndexed
}

const StorageLink = ( props : StorageLinkProps) : React.ReactElement => {
  /* 👇 矢印側：shrink-0 をつけて、ボタンの幅に潰されないようにガードします */
  const router = useRouter()
  return (
    <div className="inline-flex items-center justify-center ">
      {
        props.storageWorkspace.routingTarget ? 
        <div 
          onClick={(evt) => {
            evt.preventDefault()
            router.push(`${props.storageWorkspace.routingTarget}?resource_name=${props.storageWorkspace.resourceName}&path_id=${props.storageTarget.pathId}`)
          }}
          className="flex p-2 text-sidebar-foreground/50 hover:text-sidebar-foreground"
        >
          {props.children}
        </div> : <span className="p-2"/>
      }
    </div> )
}

const storageApiFactory = StorageApiFactory.createStorageApiFactoryFromEnv("backend")

export function AppSidebar() {
  const {
    fetchFilePath,
  } = useIndexing(storageApiFactory, "s3-prefix")

  const [ isRefreshState, setRefreshState] = React.useState(true)
  const [ isPending, startTransition] = React.useTransition()

  const [ currentDirs, setCurrentDirs] = React.useState<StorageDirectoryIndexed[]>([])

  const onFetch = React.useEffectEvent(() => {
    if(!isRefreshState) {
      return
    }

    startTransition(async () => {
      setRefreshState(false)
      const result = await fetchFilePath(".root")

      // 👇 ディレクトリ一覧を、アイコン付きで再構築して state にセットする
      const dirs = result.data?.directory?.map(dir => {
        return { 
          ...dir, 
          icon: describeLargeIcon(dir.resourceType),
          directory: (dir.directory ?? []).map(child => {
            return {
              ...child,
              icon: describeLargeIcon(child.resourceType),
              directory: null
            }
          })
        }
      }) ?? []
      setCurrentDirs(dirs)
    })
  })

  React.useEffect(() => {
      onFetch()
  }, [isRefreshState]) 

  return (
    <Sidebar>
      <SidebarHeader />
        <SidebarContent>
          <Collapsible defaultOpen className="group/collapsible">
            {Object.entries(storageAlignments).map(([alignment, projects]) => (
            <SidebarGroup key={alignment} className="group/collapsible/parent">
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger>
                <SidebarGroupLabel>{alignment}</SidebarGroupLabel>
                  <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {currentDirs.map((project) => (
                      <SidebarMenuItem key={project.pathId}>
                      <Collapsible defaultOpen className="group/collapsible/child w-full">
                        <div className="flex items-center justify-between w-full rounded-md hover:bg-sidebar-accent flex-nowrap" 
                          onContextMenu={(evt) => {
                            evt.preventDefault()
                          }}>
                          <SidebarMenuButton className="min-w-0 flex-1 justify-start">
                            <FileOperationMenu storageMetadata={project}>
                              <HugeiconsIcon icon={project.icon ?? Question} className="shrink-0" />
                            </FileOperationMenu>
                            <CollapsibleTrigger asChild>
                              <span className="truncate">{project.resourceName}</span>
                            </CollapsibleTrigger>
                          </SidebarMenuButton>
                          <StorageLink
                            storageWorkspace={project}
                            storageTarget={project}>
                            <ChevronRight className="h-4 w-4" />
                          </StorageLink>
                        </div>
                        <CollapsibleContent>
                          <SidebarGroupContent>
                            <SidebarMenu>
                              {(project.directory ?? []).map((child) => (
                                <SidebarMenuItem key={child.name}>
                                  <SidebarMenuButton asChild>
                                    <div className="flex items-center gap-2 ml-4" onContextMenu={(evt) => {
                                      evt.preventDefault()
                                    }}>
                                      <FileOperationMenu storageMetadata={child}>
                                        <HugeiconsIcon icon={child.icon ?? Question} className="shrink-0" />
                                      </FileOperationMenu>
                                      <StorageLink
                                        storageWorkspace={project}
                                        storageTarget={child}>
                                        <span>{child.name}</span>
                                      </StorageLink>
                                    </div>
                                  </SidebarMenuButton>
                                </SidebarMenuItem>
                              ))}
                            </SidebarMenu>
                          </SidebarGroupContent>
                        </CollapsibleContent>
                      </Collapsible>
                    </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          ))}
          </Collapsible>
        </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  )
}