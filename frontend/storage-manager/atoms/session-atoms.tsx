import { UploadInteraction } from "@/models/interaction"
import { atom } from "jotai"


export const counterAtom = atom(0)


export const uploadingStatusAtom = atom<UploadInteraction>({
    isUploading: false
})




