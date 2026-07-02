
import { AllowedResourceType } from "@/models/storage";
import { 
  IFileUploader, 
  UploadEvent, 
  UploadResult,
  IFileOperation,
  AllAllowedFileEventType,
  FileEventHandler,
  FileMoveResult,
  FileCopyResult,
  FileDeleteResult,
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

export class SimpleUploader implements IFileUploader, IFileOperation {
  private _listeners = new Map<AllAllowedFileEventType, Set<Function>>
  private _resourceType : AllowedResourceType

  /**
   *
   */
  constructor(resourceType: AllowedResourceType) {
    this._resourceType = resourceType
  }

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
    const fetched = await fetch('api/mock/upload', {
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

  cancelUpload() : void {
    throw new Error("not implemented")
  }
  
  async move(pathId: string, newName: string) : Promise<FileMoveResult> {
    try{
      const fetched = await fetch(`api/mock/${pathId}`, {
        method: 'PUT',
        body: JSON.stringify({
          resourceType: this._resourceType,
          newName: newName
        })
      })

      if(!fetched.ok) {
        return {
          result: 'error',
          content: null,
          error: {
            message: fetched.statusText
          }
        }
      }

      const result = await fetched.json() as FileMoveResult
      return result
    } catch (e) {
      const error = e as Error
      return {
        result: 'error',
        content: null,
        error: {
          message: error?.message
        }
      }
    }
  }
  async copy(pathId: string, newName: string) : Promise<FileCopyResult> {
    throw new Error("not implemented")
  }
  async delete(pathId: string) : Promise<FileDeleteResult> {
    try{
      const fetched = await fetch(`api/mock/${pathId}`, {
        method: 'DELETE',
        body: JSON.stringify({
          resourceType: this._resourceType
        })
      })

      if(!fetched.ok) {
        return {
          result: 'error',
          isNoContent: false,
          error: {
            message: fetched.statusText
          }
        }
      }

      const result = await fetched.json() as FileDeleteResult
      return result
    } catch (e) {
      const error = e as Error
      return {
        result: 'error',
          isNoContent: false,
        error: {
          message: error?.message
        }
      }
    }
  }

  on<T extends AllAllowedFileEventType>(event: T, handler: FileEventHandler<T>) {
    if( !this._listeners.has(event))  this._listeners.set(event, new Set())
    this._listeners.get(event)!.add(handler)
  }


  off<T extends AllAllowedFileEventType>(event: T, handler: FileEventHandler<T>) {
    this._listeners.get(event)?.delete(handler)
  }
}

