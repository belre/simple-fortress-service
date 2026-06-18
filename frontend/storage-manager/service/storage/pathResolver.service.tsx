import { StorageDirectoryIndexed } from "@/models/storage";
import { PathResolveDto, PathResolveRequest } from "./pathResolver.dto";

import { awsStorageMockMetadata } from "@/mock/pathResolver.mock";



export class PathResolverService {
    traverse(children: StorageDirectoryIndexed[], parent: StorageDirectoryIndexed) : StorageDirectoryIndexed[] {
        return children.map(child => {
            child.resourceName = parent.resourceName
            child.resourceType = parent.resourceType
            return child
        })
    }

    async resolve(request: PathResolveRequest) : Promise<PathResolveDto> {
        const mock = awsStorageMockMetadata
        
        const targets = mock
            .map(metadata => [...
                this.traverse(metadata.directory ?? [], metadata), 
                metadata])
            .flat()
            .filter(metadata => metadata?.pathId === request.pathId)

        if(targets.length != 1) {
            return {
                result: 'error',
                reason: `Not found pathId=${request.pathId}`
            }
        }

        const target = targets[0]
        return {
            result: 'success',
            directory: target
        }
    }
}

