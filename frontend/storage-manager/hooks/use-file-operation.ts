import { IStorageApiFactory, FileEventHandler, FileMoveResult } from "@/models/storage-behavior";
import { DeleteStatus, ManagedUploadStatus, RenamingStatus } from "@/models/storage-interaction";
import { useMutation } from "@tanstack/react-query";

import * as React from "react"
import { AllowedResourceType } from "@/models/storage";
import { toast } from "sonner";
import { FileItem } from "@/components/storages/fileitem-columns";


export function useFileUpload( 
	storageApiFactory: IStorageApiFactory, 
	resourceType: AllowedResourceType | null
){
	const [ progress, setProgress] = React.useState<number>(0)
	const [ uploadStatusTracker, setUploadStatusTracker] = React.useState<ManagedUploadStatus>({
    	status: "idle",
    	previousStatus: null
	})
	
	const mutation = useMutation({
		mutationFn: async( file: File) => {
			if(!resourceType) {
				return null
			}

			const uploader = storageApiFactory.createUploader(resourceType)

			const handleProgress : FileEventHandler<"progress"> = 
				(event) => {
					setProgress(event.percent)
				}
			const handleStatusChanged : FileEventHandler<"status_changed"> =
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

    React.useEffect(() => {
        if (uploadStatusTracker.status === 'completed') toast.success('アップロードが完了しました')
    }, [uploadStatusTracker.status])

	return {...mutation, progress, uploadStatusTracker}
}

export function useFileRename(
	storageApiFactory: IStorageApiFactory, 
	resourceType: AllowedResourceType | null
) {
	const [ renameStatus, setRenameStatus] = React.useState<RenamingStatus>({
		isRenaming: false
	})

    const onRenameStart = ( {pathId, currentFileName} : { pathId: string, currentFileName: string}) => {
        setRenameStatus({ 
			isRenaming: true, 
			targetPathId: pathId,
			previousValue: currentFileName
		})
    }

	const onRenameAbort = () => {
		setRenameStatus({
			isRenaming: false,
			renamedValue: renameStatus.previousValue
		})
	}

	const onSubmitError = (msg: string) => {
		onRenameAbort()
		toast.error(msg)
	}

    const onRenameSubmit = async ( {newName} : {newName: string}) : Promise<FileMoveResult> => {
		if(!resourceType) {
	        setRenameStatus({ 
				isRenaming: false 
			})
			return {
				result: "error",
				content: null,
				error: {
					message: "Resource Type is not allowed"
				}
			}
		}

		if(!renameStatus.targetPathId) {
			return {
				result: "error",
				content: null,
				error: {
					message: "Not found path id"
				}
			}
		}

		if(newName == renameStatus.previousValue) {
			onRenameAbort()
			return {
				result: "warning",
				content: {
					isIgnore: true,
					updatedId: null
				}
			}
		}

		try {
			const operation = storageApiFactory.createFileOperator(resourceType)
	        const result = await operation.move( renameStatus.targetPathId, newName)

			if ( result.result != "success" ){
				onSubmitError(result.error?.message ?? "unknown error")
				return result
			}

			setRenameStatus({
				isRenaming: false,
				targetPathId: renameStatus.targetPathId,
				renamedValue: newName,
				renamedId: result.content?.updatedId ?? null
			})

			toast.success(`Rename Succeed: ${newName}`)
			return result
		} catch(e) {
			const error = e as Error
			onSubmitError(error?.message)
			return {
				result: "error",
				content: null,
				error: {
					message: error!.message
				}
			}
		}
    }

	return { renameStatus, onRenameStart, onRenameAbort, onRenameSubmit}
}

export function useFileDelete(
	storageApiFactory: IStorageApiFactory, 
	resourceType: AllowedResourceType | null
)
{
	const [deleteStatus, setDeleteStatus] = React.useState<DeleteStatus>({
        isDeleting: false,
		deletedId: null
    })

    const mutate = async (pathId: string) => {
		if(!resourceType) {
	        setDeleteStatus({ 
				isDeleting: false,
				deletedId: null
			})
			return {
				result: "error",
				content: null,
				error: {
					message: "Resource Type is not allowed"
				}
			}
		}

        setDeleteStatus({ 
			isDeleting: true,
			deletedId: null
		 })

		const operation = storageApiFactory.createFileOperator(resourceType)
        const result = await operation.delete(pathId)
        setDeleteStatus({ 
			isDeleting: false,
			deletedId: pathId
		})
        return result
    }

    return { deleteStatus, mutate }
}



export function useFileOperationEvent(
	storageApiFactory: IStorageApiFactory, 
	resourceType: AllowedResourceType | null
) {
    const { renameStatus, onRenameStart, onRenameAbort, onRenameSubmit } = useFileRename(storageApiFactory, resourceType)
    const { mutate: mutateUpload, progress, uploadStatusTracker } = useFileUpload(storageApiFactory, resourceType)
	const { mutate: mutateDelete, deleteStatus } = useFileDelete(storageApiFactory, resourceType)
    return {
		onRenameStart, 
		onRenameAbort,
		onRenameSubmit,
		mutateUpload,
		mutateDelete,
		progress,
        renameStatus,
		deleteStatus,
        uploadStatusTracker,
    }
}


