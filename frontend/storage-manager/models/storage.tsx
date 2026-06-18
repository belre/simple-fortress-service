

export interface StorageDirectory {
    directory: Array<StorageDirectory> | null
}


export interface StorageDirectoryIndexed extends StorageDirectory {
    name: string
    resourceType?: string
    resourceName?: string
    routingTarget?: string
    pathId: string
    directory: Array<StorageDirectoryIndexed> | null
}


