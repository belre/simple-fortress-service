"use client"; // 👈 クライアントの動きはここに完全隔離！


import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AllowedResourceType, StorageDirectoryIndexed } from "@/models/storage";


interface FileOperationMenuProps {
  storageMetadata?: StorageDirectoryIndexed
  children: React.ReactNode
}

const validateResourceType = (storageMetadata?: StorageDirectoryIndexed) : AllowedResourceType | null => {
  const resourceType = storageMetadata?.resourceType
  
  if(!resourceType){
    return null
  }

  switch(resourceType) {
    case "aws-trashes":
    case "aws-favorites":
      return null
  }

  return resourceType
}


export function FileOperationMenu({
  storageMetadata,
  children
} : FileOperationMenuProps) {
  const validatedResourceType = validateResourceType(storageMetadata)

  return validatedResourceType ? 
    (<DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>Billing</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>Team</DropdownMenuItem>
          <DropdownMenuItem>Subscription</DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>) : (
      <div>{children}</div>
    )
}


