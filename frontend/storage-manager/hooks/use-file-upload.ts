import { IStorageApiFactory, UploadEventHandler } from "@/models/storage-behavior";
import { useMutation } from "@tanstack/react-query";

import * as React from "react"
import { AllowedResourceType } from "@/models/storage";
import { ManagedUploadStatus, uploadingStatusAtom } from "@/atoms/session-atoms";
import { useAtom } from "jotai";


export function useFileUpload( 
	storageApiFactory: IStorageApiFactory, 
	resourceType: AllowedResourceType | null
){
	const [progress, setProgress] = React.useState<number>(0)

	const [ uploadStatusTracker, setUploadStatusTracker] = React.useState<ManagedUploadStatus>({
    	status: "idle",
    	previousStatus: null
	})
	console.log('[useFileUpload] uploadStatus:', uploadStatusTracker)
	
	const mutation = useMutation({
		mutationFn: async( file: File) => {
			if(!resourceType) {
				return null
			}

			const uploader = storageApiFactory.createUploader(resourceType)

			const handleProgress : UploadEventHandler<"progress"> = 
				(event) => {
					setProgress(event.percent)
				}
			const handleStatusChanged : UploadEventHandler<"status_changed"> =
				(event) => {
					setUploadStatusTracker({
  						status: event.status,
  						previousStatus: uploadStatusTracker.status
					})
				}

			uploader.on("progress", handleProgress)
			uploader.on("status_changed", handleStatusChanged)

			try{
				return await uploader.upload(file)
			}
			finally {
				uploader.off("progress", handleProgress)
				uploader.off("status_changed", handleStatusChanged)
			}
		}
	})
	return {...mutation, progress, uploadStatusTracker} //, uploadingStatus, setUploadingStatus}
}


