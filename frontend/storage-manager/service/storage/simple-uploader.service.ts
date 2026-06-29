
import { 
  IFileUploader, 
  UploadEvent, 
  UploadEventType, 
  UploadResult,
  UploadEventHandler,
} from "@/models/storage-behavior";


async function* readChunks(reader: ReadableStreamDefaultReader, signal: AbortSignal) {
    try {
        while (true) {
            // 1. キャンセル検知
            if (signal.aborted) break
            
            const { done, value } = await reader.read()

            // 2. 正常終了
            if (done) break
            
            yield value
        }
    } catch (e) {
        // 3. エラー時も必ず抜ける
        console.error(e)
    } finally {
        // 4. 必ずreleaseLock
        reader.releaseLock()
    }
}

export class SimpleUploader implements IFileUploader {
  private _listeners = new Map<UploadEventType, Set<Function>>

  private _emit(payload: UploadEvent) : void{
    this._listeners.get(payload.type)?.forEach(
      handler => handler(payload))
  }

  async upload(file: File) : Promise<UploadResult> {
    this._emit({
      type: "started",
      fileName: file.name,
      totalSize: file.size
    })

    const formData = new FormData()
    formData.append('file', file)

    const decoder = new TextDecoder()
    
    const controller = new AbortController()
    const fetched = await fetch('api/storages/upload', {
      method: 'POST',
      body: formData
    })

    const reader = fetched.body?.getReader()
    for await ( const chunk of readChunks(reader!, controller.signal)) {
      const text = decoder.decode(chunk)
      const { progress } = JSON.parse(text.replace('data: ', ''))
      this._emit({
        type: "progress",
        loaded: Math.floor(file.size * (progress / 100)),
        total: file.size,
        percent : progress,
      })
      this._emit({
        type: "status_changed",
        status: "uploading"
      })
    }

    const result : UploadResult = {
      fileId: crypto.randomUUID(),
      fileName: file.name,
      size: file.size
    }
    this._emit({type: "completed", result})
    this._emit({
      type: "status_changed",
      status: "completed"
    })

    return result
  }

  cancel() : void {
    throw new Error("not implemented")
  }

  on<T extends UploadEventType>(event: T, handler: UploadEventHandler<T>) {
    if( !this._listeners.has(event))  this._listeners.set(event, new Set())
    this._listeners.get(event)!.add(handler)
  }
  
  off<T extends UploadEventType>(event: T, handler: UploadEventHandler<T>) {
    this._listeners.get(event)?.delete(handler)
  }
}

