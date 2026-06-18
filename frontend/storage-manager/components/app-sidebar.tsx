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
import { Plus, Star, Delete, Folder, BucketIcon } from "@hugeicons/core-free-icons"
import { ChevronRight, ChevronDown } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { StorageDirectoryIndexed } from "@/models/storage";
import { awsStorageMockMetadata } from "@/mock/pathResolver.mock";


export const APP_ICONS = {
  Plus, Star, Delete, Folder
} as const


export type IconObject = (typeof APP_ICONS)[keyof typeof APP_ICONS];
const selectIcon = (resourceType?: string) => {
  switch(resourceType) {
    case "favorites":
      return Star
    case "trashes":
      return Delete
    case "s3":
      return BucketIcon
    default:
      return Plus
  }
}
interface TmpStorageDirectoryIndexed extends StorageDirectoryIndexed {
  icon: IconObject
  directory: Array<TmpStorageDirectoryIndexed> | null
}


const storageAlignments : Record<string, Array<TmpStorageDirectoryIndexed>> = {
  "AWS": awsStorageMockMetadata.map(metadata => {
    return {
      ...metadata,
      icon: selectIcon(metadata.resourceType),
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

const generateStorageLink = (renderElement: React.ReactElement, storageWorkspace: StorageDirectoryIndexed, storageTarget: StorageDirectoryIndexed) : React.ReactElement => {
  /* 👇 矢印側：shrink-0 をつけて、ボタンの幅に潰されないようにガードします */
  return (
    <div className="inline-flex items-center justify-center ">
      {
        storageWorkspace.routingTarget ? 
        <a 
          href={`${storageWorkspace.routingTarget}?resource_name=${storageWorkspace.resourceName}&path_id=${storageTarget.pathId}`} 
          className="flex p-2 text-sidebar-foreground/50 hover:text-sidebar-foreground"
        >
          {renderElement}
        </a> : <span className="p-2"/>
      }
    </div> )
}

export function AppSidebar() {
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
                    {projects.map((project) => (
                      <SidebarMenuItem key={project.name}>
                      <Collapsible defaultOpen className="group/collapsible/child w-full">
                          <div className="flex items-center justify-between w-full rounded-md hover:bg-sidebar-accent flex-nowrap">
                            <CollapsibleTrigger asChild>
                              {/* 👇 ボタン側：min-w-0 と truncate（または w-full）で、右側の要素を押し出さないようにします */}
                              <SidebarMenuButton className="min-w-0 flex-1 justify-start">
                                <HugeiconsIcon icon={project.icon} className="shrink-0" />
                                <span className="truncate">{project.resourceName}</span>
                              </SidebarMenuButton>
                            </CollapsibleTrigger>
                            {
                              generateStorageLink(
                                (<ChevronRight className="h-4 w-4" />),
                                project, project
                              )
                            }
                          </div>
                          <CollapsibleContent>
                          <SidebarGroupContent>
                            <SidebarMenu>
                              {(project.directory ?? []).map((child) => (
                                <SidebarMenuItem key={child.name}>
                                  <SidebarMenuButton asChild>
                                    <div className="flex items-center gap-2">
                                      <span className="ml-4" />
                                      <HugeiconsIcon icon={child.icon} className="shrink-0" />
                                      {
                                        generateStorageLink(
                                          (<span>{child.name}</span>),
                                          project, child
                                        )
                                      }
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