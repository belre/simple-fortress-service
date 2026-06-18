
import type { StorageDirectoryIndexed } from "@/models/storage"

export interface PathResolveRequest {
    pathId: string
}

export interface PathResolveDto {
    result: "success" | "warning" | "error"
    reason?: string
    directory?: StorageDirectoryIndexed
}




