
import * as React from 'react'

import { AllowedResourceType } from "@/models/storage"
import { IndexCollectionListResult, IndexCollectionResolveResult, IStorageApiFactory } from "@/models/storage-behavior"
import { useRouter } from "next/navigation"



export function useIndexing(
    storageApiFactory: IStorageApiFactory,
    resourceName: string, 
    resourceType: AllowedResourceType) {
    const router = useRouter()

    const [accessError, setAccessError] = React.useState<string | null>(null)
    const releaseError = () => {
        setAccessError(null)
    }

    const collectorService = storageApiFactory.createIndexCollector(resourceType)
    const fetchFilePath = async ( pathId?: string | null ) 
        : Promise<IndexCollectionResolveResult> => {
        if(!pathId) {
            return {
                result: "error",
                data : null
            }
        }
        const result = await collectorService.resolve(pathId, 2)
        return result
    }

    const paginateFilePath = async (cursor?: string | null) : Promise<IndexCollectionListResult> => {
        if(!cursor) {
            return {
                indexes: [],
                count: 0
            }
        }

        const result = await collectorService.listIndexes(cursor, 1)
        return result
    }

    const syncWorkspaceAfterMutation = (targetFileId: string) => {
        router.push(`/storages?resource_name=${resourceName}&path_id=${encodeURIComponent(targetFileId)}`);
    }

    const validateToAllowRedirect = async (targetFileId: string) => {
        const nextTargetFetched = await fetchFilePath(targetFileId)
        if((nextTargetFetched?.result ?? "error") == "error"){
            setAccessError("File Access Failed")
            return
        }
        syncWorkspaceAfterMutation(targetFileId)
    }


    return {
        accessError,
        releaseError,
        fetchFilePath,
        paginateFilePath,
        syncWorkspaceAfterMutation,
        validateToAllowRedirect
    }
}
