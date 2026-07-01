
import { AllowedResourceType, StorageDirectoryIndexed } from "@/models/storage";

import { fromPublicId, generateMockData, serverMockData, toPublicId, traverse } from "@/mock/path-resolver.mock";
import { IIndexCollector, IndexCollectionResolveResult } from "@/models/storage-behavior";


export class SimplePathResolverService implements IIndexCollector {
    constructor(private resourceType: AllowedResourceType) {
    }
    
    traverse(
        children: StorageDirectoryIndexed[], 
        recursive=false) : StorageDirectoryIndexed[] {

        return children.map(child => {
            if(recursive) {
                child.directory = child.directory?.
                    map( c => this.traverse( [c])).
                    flat() ?? []
            }
            return child
        })
    }

    async resolve(pathId: string | null, cursor: string | null, childLimit?: number) : Promise<IndexCollectionResolveResult> {
        if(!pathId) {
            return {
                result: "error",
                data: null
            }
        }
        const baseData = generateMockData()

        /** mapによって、pathIdは自分自身以外に１個下の階層もエンコード対象とする */
        const mock = traverse(baseData, true, (metadata) => { 
            return {
                ...metadata, 
                pathId: toPublicId(metadata.pathId),
                directory: metadata.directory?.map(c => ({...c, pathId: toPublicId(c.pathId)})) ?? null
            }
        })

        const targets = mock
            .flat()
            .filter(metadata => metadata?.pathId === pathId)

        if(targets.length === 0) {
            return {
                result : "error",
                data: null
            }
        }
        
        const target = targets[0]
        if(!cursor && target.directory) {
            const actualLimit = childLimit ?? 10
            target.directory = target.directory?.
                filter((c, index) => index < actualLimit)
            
            if(target.directory?.length >= actualLimit) {
                cursor = target.directory[target.directory.length-1].pathId
            }
        } else {
            const findIndex = target.directory?.findIndex(c => c.pathId === cursor) ?? -1
            if(findIndex < 0) {
                return {
                    result: "error",
                    data: null
                }
            }

            const actualLimit = childLimit ?? 10
            target.directory = target.directory?.
                filter((c, index) => index > findIndex && index <= findIndex + actualLimit) ?? []
            
            if(target.directory?.length >= actualLimit) {
                cursor = target.directory[target.directory.length-1].pathId
            }
        }

        return {
            result: "success",
            data: target,
            childCursor: cursor
        }
    }
}

export class SimpleBackendPathResolverService implements IIndexCollector {
    constructor(private resourceType: AllowedResourceType) {
    }


    async resolve(pathId: string | null, cursor: string | null, childLimit?: number) : Promise<IndexCollectionResolveResult> {
        const baseData = generateMockData()

        if( pathId === ".root") {
            /** mapによって、pathIdは自分自身以外に１個下の階層もエンコード対象とする */
            return {
                result: "success",
                data: {
                    pathId: ".root",
                    name: "Root",
                    resourceType: this.resourceType,
                    status: "active",
                    directory: traverse(baseData, false, (metadata) => { 
                        return {
                            ...metadata, 
                            pathId: toPublicId(metadata.pathId),
                            directory: metadata.directory?.map(c => ({...c, pathId: toPublicId(c.pathId)})) ?? null
                        }
                    })
                }
            }
        }
        
        const mock = traverse(baseData, true, (metadata) => { 
            return {
                ...metadata, 
                pathId: toPublicId(metadata.pathId)
            }
        })

        const targets = mock
            .flat()
            .filter(metadata => metadata?.pathId === pathId )

        if(targets.length == 0) {
            return {
                result : "error",
                data: null
            }
        }
        
        const target = targets[0]
        if(!cursor && target.directory) {
            const actualLimit = childLimit ?? 10
            target.directory = target.directory?.
                filter((c, index) => index < actualLimit).
                map(metadata => ({...metadata, pathId: toPublicId(metadata.pathId)}))
            
            if(target.directory?.length >= actualLimit) {
                cursor = target.directory[target.directory.length-1].pathId
            }
        } else {
            const findIndex = target.directory?.findIndex(c => c.pathId === cursor) ?? -1
            if(findIndex < 0) {
                return {
                    result: "error",
                    data: null
                }
            }

            const actualLimit = childLimit ?? 10
            target.directory = (target.directory?.
                filter((c, index) => index > findIndex && index <= findIndex + actualLimit) ?? []).
                map(metadata => ({...metadata, pathId: toPublicId(metadata.pathId)}))
            
            if(target.directory?.length >= actualLimit) {
                cursor = target.directory[target.directory.length-1].pathId
            }
        }

        return {
            result: "success",
            data: target,
            childCursor: cursor
        }
    }

}

