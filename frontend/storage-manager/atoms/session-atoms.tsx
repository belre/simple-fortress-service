import { UploadInteraction } from "@/models/interaction"
import { UploadStatus } from "@/models/storage-behavior";
import { atom } from "jotai"


export const counterAtom = atom(0)

export interface ManagedUploadStatus{
    status: UploadStatus;
    previousStatus : UploadStatus | null
}

export const uploadingStatusAtom = atom<UploadInteraction>({
    isUploading: false
})

export const errorMessageAtom = atom<string | null>(null)








