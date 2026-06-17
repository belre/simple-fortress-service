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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

import { HugeiconsIcon } from '@hugeicons/react'
import { Plus, Star, Delete, Folder } from "@hugeicons/core-free-icons"
import { ChevronRight, ChevronDown } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { TooltipProvider } from "./ui/tooltip";

const awsStorageMetadata = [{
  url: "/storages?bucket=my-bucket",
  name: "My Bucket",
  icon: Plus,
  directory: {
    "root/" : {
      icon: Folder,
      url: "/storages?bucket=my-bucket&path_id=xxx1"
    },
    "path/to/directory/" : {
      icon: Folder,
      url: "/storages?bucket=my-bucket&path_id=xxx2"
    }
  }
}, {
  url: "/storages?bucket=guest-bucket",
  name: "Guest Bucket",
  icon: Plus,
},   
{ 
  url: "/storages?view=favorites", 
  name: "すべてのお気に入り", 
  icon: Star 
},
{ 
  url: "/storages?view=trash", 
  name: "ゴミ箱", 
  icon: Delete 
}]

const storageAlignments ={
  "AWS": awsStorageMetadata,
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
                                <span className="truncate">{project.name}</span>
                              </SidebarMenuButton>
                            </CollapsibleTrigger>

                            {/* 👇 矢印側：shrink-0 をつけて、ボタンの幅に潰されないようにガードします */}
                            <a 
                              href={project.url} 
                              className="p-2 text-sidebar-foreground/50 hover:text-sidebar-foreground flex items-center justify-center h-8 w-8 shrink-0"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </a>
                          </div>
                          <CollapsibleContent>
                          <SidebarGroupContent>
                            <SidebarMenu>
                              {Object.entries(project.directory || {}).map(([dir, dirMetadata]) => (
                                <SidebarMenuItem key={dir}>
                                  <SidebarMenuButton asChild>
                                    <div className="flex items-center gap-2">
                                      <span className="ml-4" />
                                      <HugeiconsIcon icon={dirMetadata.icon} />
                                      <a href={dirMetadata.url}>{dir}</a>
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