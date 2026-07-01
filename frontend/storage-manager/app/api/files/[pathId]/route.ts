import { serverMockData, traverse, fromPublicId, toPublicId, generateMockData } from "@/mock/path-resolver.mock"
import { FileDeleteResult, FileMoveResult, IndexCollectionResolveResult } from "@/models/storage-behavior"
import { NextResponse } from "next/server"


function getResponse(result: IndexCollectionResolveResult) : NextResponse {
    return NextResponse.json(result)
}

function putResponse(result: FileMoveResult) : NextResponse {
    return NextResponse.json(result)
}

function deleteResponse(result: FileDeleteResult) : NextResponse {
    return NextResponse.json(result)
}



export async function GET(
    request: Request,
     { params }: { params: Promise<{ pathId: string }>  }
) : Promise<NextResponse> {
    const { pathId } = await params
    const decodedPathId = fromPublicId(pathId)
    const mock = generateMockData()

    if(decodedPathId === ".root") {
        return getResponse({
            result: "success",
            data: {
                pathId: ".root",
                name: "Root",
                resourceType: "s3-prefix",
                updatedAt: new Date().toISOString(),
                status: "active",
                directory: mock.map(metadata => ({ ...metadata, directory: null })) ?? [],
            },
            childCursor: null
        })
    }

    const { searchParams } = new URL(request.url)
    const cursor = decodeURIComponent(searchParams.get('cursor') ?? '')
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit') ?? "10") : undefined

    const targets = mock
        .map(metadata => [...
            traverse(metadata.directory ?? [], true), metadata
        ])
        .flat()
        .filter(metadata => metadata?.pathId === decodedPathId)

    if(targets.length != 1) {
        return getResponse({
            result : "error",
            data: null
        })
    }
    
    const target = {...targets[0]}
    let nextCursor : string | null = null
    if(!cursor && target.directory) {
        const actualLimit = limit ?? 10
        target.directory = target.directory?.
            filter((c, index) => index < actualLimit)
        
        if(target.directory?.length >= actualLimit) {
            nextCursor = target.directory[target.directory.length-1].pathId
        }
    } else {
        const findIndex = target.directory?.findIndex(c => c.pathId === cursor) ?? -1
        if(findIndex < 0) {
            return getResponse({
                result: "error",
                data: null
            })
        }

        const actualLimit = limit ?? 10
        target.directory = target.directory?.
            filter((c, index) => index > findIndex && index <= findIndex + actualLimit) ?? []
        
        if(target.directory?.length >= actualLimit) {
            nextCursor = target.directory[target.directory.length-1].pathId
        }
    }

    return getResponse({
        result: "success",
        data: target,
        childCursor: nextCursor ? encodeURIComponent(nextCursor) : null
    })
}

// app/api/files/route.ts
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ pathId: string }> }
) : Promise<NextResponse> {
    const { pathId } = await params
    const decodedPathId = fromPublicId(pathId)
    const { newName, resourceType } = await request.json()
    const mock = generateMockData()

    if (resourceType === 's3-prefix') {
        return putResponse({
            result: 'error',
            content: null,
            error: {
                message: 'S3 Prefix Not Allowed'
            }
        })
    }

    const allData = mock.map(
        m => traverse(m.directory ?? [], true)).flat()

    const target = allData.find(c => c.pathId === decodedPathId)
    console.log(target, allData, decodedPathId)
    if(!target) {
        return putResponse({
            result: 'error',
            content: null,
            error: {
                message: 'Target Not Found'
            }
        })
    }

    const newId = toPublicId(newName)       // 確定したものとする
    target.name = newName
    target.pathId = newId // 確定したものとする

    return putResponse({
        result: 'success',
        content: {
            moveTo: newId,
            updatedId: newId
        }
    })
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ pathId: string }> }
) {
    const { pathId } = await params
    const decodedPathId = fromPublicId(pathId)
    const { resourceType } = await request.json()

    if (resourceType === 's3-prefix') {
        return deleteResponse({
            result: 'error',
            isNoContent: false,
            error: {
                message: 'S3 Prefix Not Allowed'
            }
        })
    }

    // delete処理
    return deleteResponse({
        result: 'success',
        isNoContent: true
    })
}