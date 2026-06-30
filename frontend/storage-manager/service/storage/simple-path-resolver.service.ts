
import { StorageDirectoryIndexed } from "@/models/storage";

import { generateMockData } from "@/mock/path-resolver.mock";
import { IIndexCollector, IndexCollectionListResult, IndexCollectionResolveResult } from "@/models/storage-behavior";


export class SimplePathResolverService implements IIndexCollector {
    traverse(
        children: StorageDirectoryIndexed[], 
        parent: StorageDirectoryIndexed,
        recursive=false) : StorageDirectoryIndexed[] {

        return children.map(child => {
            //child.resourceName = parent.resourceName
            //child.resourceType = parent.resourceType

            if(recursive) {
                child.directory = child.directory?.
                    map( c => this.traverse( [c], child)).
                    flat() ?? []
            }

            return child
        })
    }

    async resolve(pathId: string, childLimit?: number) : Promise<IndexCollectionResolveResult> {
        const mock = generateMockData()

        const targets = mock
            .map(metadata => [...
                this.traverse(
                    metadata.directory ?? [], metadata), 
                    metadata
                ])
            .flat()
            .filter(metadata => metadata?.pathId === pathId)

        if(targets.length != 1) {
            return {
                result : "error",
                data: null
            }
        }
        
        const target = targets[0]
        let cursor = undefined
        if(target.directory) {
            const actualLimit = childLimit ?? 10
            target.directory = target.directory?.
                filter((c, index) => index < actualLimit)
            
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

    async listIndexes(cursor: string, limit?: number) : Promise<IndexCollectionListResult> {
        const mock = generateMockData()
        const limitSize = limit ?? 10;

        // 1. ツリーの全ノードを平坦化
        const allFlattenNodes = mock
            .map(metadata => [...this.traverse(metadata.directory ?? [], metadata), metadata])
            .flat();

        let targetList: StorageDirectoryIndexed[] = [];
        let targetIndex = 0;
        let isRoot = false;

        // 2. ターゲットとなる階層（配列）と、cursorのインデックスを特定
        if (cursor === "root" || cursor === "") {
            targetList = mock;
            targetIndex = 0;
            isRoot = true; // ルートの場合は先頭から取りたいのでフラグで制御
        } else {
            const parentNode = allFlattenNodes.find(node => 
                (node.directory ?? []).some(child => child.pathId === cursor)
            );

            if (parentNode && parentNode.directory) {
                targetList = parentNode.directory;
                targetIndex = targetList.findIndex(child => child.pathId === cursor);
            } else {
                const isRootChild = mock.some(child => child.pathId === cursor);
                if (isRootChild) {
                    targetList = mock;
                    targetIndex = mock.findIndex(child => child.pathId === cursor);
                } else {
                    targetList = [];
                    targetIndex = -1;
                }
            }
        }

        // 💡 3. 【修正の核心】cursorが指定されているなら、その「次の要素」を開始位置にする
        // targetIndex が見つからなかった場合（-1）や、ルート（先頭）からの場合は 0 からスタート。
        let startIndex = 0;
        if (!isRoot && targetIndex !== -1) {
            startIndex = targetIndex + 1; // 👈 完璧に「次のデータ」を指す！
        }

        // 4. 正しい位置から指定分だけ切り出す
        const slicedNodes = targetList.slice(startIndex, startIndex + limitSize);

        // 次のページがまだ後ろに控えているか
        const hasNext = startIndex + slicedNodes.length < targetList.length;
        
        // これ以上次がなければ undefined
        const nextCursor = hasNext ? slicedNodes.at(-1)?.pathId : undefined;

        return {
            indexes: slicedNodes,
            nextCursor: nextCursor,
            count: targetList.length
        };
    }

}

