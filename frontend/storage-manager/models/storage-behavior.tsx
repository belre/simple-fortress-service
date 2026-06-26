import { AllowedResourceType, CreatingStorageIndex, StorageDirectoryIndexed } from "./storage";

export type CrudNotificationEventType =
  "success" | "warning" | "error"

export interface UploadResult {
  fileId: string; // バックエンド未確定でも、IDが返る前提は崩れないはず
  url?: string;
  fileName: string;
  size: number;
}

export type UploadStatus =
  | "idle"
  | "uploading"
  | "paused"
  | "completed"
  | "failed";


export interface UploadError {
  message: string;
  code?: string;
  cause?: unknown;
}

export type UploadEventType =
  | "progress"
  | "completed"
  | "failed"
  | "status_changed"
  | "started";

export interface UploadProgressPayload {
  type: "progress";
  loaded: number;
  total: number;
  percent: number;
}

export interface UploadCompletedPayload {
  type: "completed";
  result: UploadResult;
}

export interface UploadFailedPayload {
  type: "failed";
  error: UploadError;
}

export interface UploadStatusChangedPayload {
  type: "status_changed";
  status: UploadStatus; 
}

interface UploadStartedPayload {
  type: "started";
  fileName: string;
  totalSize: number;
}

export type UploadEvent =
  | UploadProgressPayload
  | UploadCompletedPayload
  | UploadFailedPayload
  | UploadStatusChangedPayload
  | UploadStartedPayload;

export type UploadEventHandler<T extends UploadEventType = UploadEventType> = (
  event: Extract<UploadEvent, { type: T }>
) => void;

export interface IndexCollectionCallbackPayload {
    type: IndexCollectionEventType
    result: IndexCollectionResolveResult
}


export type IndexCollectionEventType = 
  "validation_error"

export interface IndexCollectionResolveResult {
  result: "success" | "error"
  data: StorageDirectoryIndexed | null
  childCursor?: string
}

export interface IndexCollectionListResult {
  indexes: Array<StorageDirectoryIndexed>
  nextCursor?: string
  count: number
}

export interface IndexCollectionCrudResult {
  result: "success" | "error"
  data: any
  errorCode?: string
  detail?: string
}

export interface IFileUploader {
  upload(file: File): Promise<UploadResult>;
  cancel(): void;
  on<T extends UploadEventType>(event: T, handler: UploadEventHandler<T>): void;
  off<T extends UploadEventType>(event: T, handler: UploadEventHandler<T>): void;
}

export interface IIndexCollector {
  resolve(pathId: string, childLimit?: number) : Promise<IndexCollectionResolveResult>
  listIndexes( cursor: string,  limit?: number) : Promise<IndexCollectionListResult>
}

export interface IStorageApiFactory {
  createUploader(resourceType: AllowedResourceType) : IFileUploader;
  createIndexCollector(resourceType: AllowedResourceType) : IIndexCollector
}


