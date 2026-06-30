import { FileDeleteResult, FileMoveResult } from "@/models/storage-behavior"
import { NextResponse } from "next/server"

function putResponse(result: FileMoveResult) : NextResponse {
    return NextResponse.json(result)
}

function deleteResponse(result: FileDeleteResult) : NextResponse {
    return NextResponse.json(result)
}

// app/api/files/route.ts
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ pathId: string[] }> }
) : Promise<NextResponse> {
    const { pathId } = await params
    const decodedPathId = pathId.map(p => decodeURIComponent(p)).join('/')
    const { newName, resourceType } = await request.json()

    if (resourceType === 's3-prefix') {
        return putResponse({
            result: 'error',
            content: null,
            error: {
                message: 'S3 Prefix Not Allowed'
            }
        })
    }

    // move/rename処理
    // ...
    const newId = newName       // 確定したものとする
    
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
    { params }: { params: Promise<{ pathId: string[] }> }
) {
    const { pathId } = await params
    const decodedPathId = pathId.map(p => decodeURIComponent(p)).join('/')
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