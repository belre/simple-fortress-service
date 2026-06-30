import { UploadStatus } from "./storage-behavior";

export interface UploadInteraction {
    isUploading: boolean
    uploadingCount?: number
}

export interface ManagedUploadStatus{
    status: UploadStatus;
    previousStatus : UploadStatus | null
}

export interface RenamingStatus {
    isRenaming: boolean
    targetPathId?: string
    previousValue?: string
    renamedId?: string | null
    renamedValue?: string | null
}

export interface DeleteStatus {
    isDeleting: boolean
    deletedId: string | null
}



