export const dynamic = 'force-static'
 
export async function GET() {
    return Response.json({
        result: "success",
        data: {
            progress: 10
        }
    })
}

// Define a sleep function
function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// app/api/upload/route.ts
export async function POST(request: Request) {
    const formData = await request.formData()
    //const file = formData.get('file') as File

    const progressValues = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
    const stream = new ReadableStream({
        async start(controller) {
            // 進捗を逐次送信
            controller.enqueue(`data: ${JSON.stringify({ progress: 0 })}\n\n`)

            for(const progress of progressValues) {
                await sleep(1000)
                controller.enqueue(`data: ${JSON.stringify({ progress: progress })}\n\n`)
            }
            
            controller.close()
        }
    })

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        }
    })
}


