
import { AllowedResourceType } from "@/models/storage"
import { IndexCollectionCallbackPayload, IndexCollectionListResult, IndexCollectionResolveResult, IStorageApiFactory } from "@/models/storage-behavior"
import { useRouter } from "next/navigation"



export function useIndexing(
    storageApiFactory: IStorageApiFactory,
    resourceName: string, 
    resourceType: AllowedResourceType,
    errorCallback: React.Dispatch<IndexCollectionCallbackPayload>) {
    const router = useRouter()

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
        router.refresh()
    }

    const validateToAllowRedirect = async (targetFileId: string) => {
        const nextTargetFetched = await fetchFilePath(targetFileId)
        if((nextTargetFetched?.result ?? "error") == "error"){
            errorCallback( {
                type: "validation_error", 
                result: nextTargetFetched
            })
            return
        }
        syncWorkspaceAfterMutation(targetFileId)
    }


    return {
        fetchFilePath,
        paginateFilePath,
        syncWorkspaceAfterMutation,
        validateToAllowRedirect
    }
}
