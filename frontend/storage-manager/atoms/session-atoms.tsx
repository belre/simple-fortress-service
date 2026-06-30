import { UploadInteraction } from "@/models/storage-interaction"
import { UploadStatus } from "@/models/storage-behavior";
import { atom } from "jotai"


export const counterAtom = atom(0)


export const uploadingStatusAtom = atom<UploadInteraction>({
    isUploading: false
})

export const errorMessageAtom = atom<string | null>(null)








