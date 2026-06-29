
import { 
  IFileUploader, 
  UploadEvent, 
  UploadEventType, 
  UploadResult,
  UploadEventHandler,
} from "@/models/storage-behavior";

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

    for( const percent of [10, 35, 60, 85, 100]) {
      await new Promise(resolve => setTimeout(resolve, 1000))

      this._emit({
        type: "progress",
        loaded: Math.floor(file.size * (percent / 100)),
        total: file.size,
        percent,
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

