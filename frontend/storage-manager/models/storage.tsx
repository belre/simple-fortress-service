
export type Caller = "frontend" | "backend"


export type AllowedResourceType = 
    "s3-prefix" | "s3-folder" | "aws-favorites" | "aws-trashes"


export interface StorageDirectory {
    directory: Array<StorageDirectory> | null
}

export interface StorageDirectoryIndexed extends StorageDirectory {
    pathId: string
    name: string
    prefix: string | null
    resourceType?: AllowedResourceType
    resourceName?: string
    routingTarget?: string
    updatedAt?: string,
    status: "syncing" | "completed" | "active"
    directory: Array<StorageDirectoryIndexed> | null            // -- サブディレクトリの定義として使用する
}

export interface CreatingStorageIndex extends StorageDirectory {
    name: string
    resourceType?: AllowedResourceType
    resourceName?: string
    pathId: string
    parentPathId?: string
}


