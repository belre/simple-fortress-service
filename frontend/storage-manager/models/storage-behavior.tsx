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


export interface OperationError {
  message: string;
  code?: string;
  cause?: unknown;
}


export interface OperationFailedPayload {
  type: "failed";
  error: OperationError;
}

export interface UploadCompletedPayload {
  type: "completed";
  result: UploadResult;
}

export interface UploadProgressPayload {
  type: "progress";
  loaded: number;
  total: number;
  percent: number;
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

/**
 * IFileEventEmittable
 * ファイルイベントを管理させるためのベースインターフェース
 */

export type AllAllowedFileEvent = UploadEvent

export type AllAllowedFileEventType = FileOperationEventType | UploadEventType

export type FileEventHandler<T extends AllAllowedFileEventType> = (
  event: Extract<AllAllowedFileEvent, { type: T }>
) => void;

export interface IFileEventEmittable {
  on<T extends AllAllowedFileEventType>(event: T, handler: FileEventHandler<T>): void;
  off<T extends AllAllowedFileEventType>(event: T, handler: FileEventHandler<T>) : void;
}

/**
 * IFileUploader
 * アップロード機能を持つサービス層を表現したインターフェース
 */

export interface IFileUploader extends IFileEventEmittable {
  upload(file: File): Promise<UploadResult>;
  cancelUpload(): void;
}

interface FileMoveResultContent { 
  moveTo?: string
  isIgnore?: boolean
  updatedId: string | null
}

export interface FileMoveResult {
  result: "success" | "warning" | "error"
  content: FileMoveResultContent | null
  error?: OperationError
}

export interface FileCopyResult {
  result: "success" | "error"
  copyTo: string
}

export interface FileDeleteResult {
  result: "success" | "error"
  isNoContent: boolean
  error?: OperationError
}

/**
 * IFileOperation
 * 基本的なファイル操作が可能なことを表すインターフェース
 */

export interface IFileOperation extends IFileEventEmittable {
  move(pathId: string, newName: string) : Promise<FileMoveResult>
  copy(pathId: string, newName: string) : Promise<FileCopyResult>
  delete(pathId: string) : Promise<FileDeleteResult>
}

export type UploadEvent =
  | OperationFailedPayload
  | UploadProgressPayload
  | UploadCompletedPayload
  | UploadStatusChangedPayload
  | UploadStartedPayload;

export type FileOperationEventErrorType = 
  "move_error" | "copy_error" | "delete_error"

export type FileOperationEventType =
  "moved" | "copied" | "deleted" | FileOperationEventErrorType

export type UploadEventType =
  | "progress"
  | "completed"
  | "failed"
  | "status_changed"
  | "started";


export interface IIndexCollector {
  resolve(pathId: string, childLimit?: number) : Promise<IndexCollectionResolveResult>
  listIndexes( cursor: string,  limit?: number) : Promise<IndexCollectionListResult>
}

export interface IStorageApiFactory {
  createUploader(resourceType: AllowedResourceType) : IFileUploader;
  createFileOperator(resourceType: AllowedResourceType) : IFileOperation
  createIndexCollector(resourceType: AllowedResourceType) : IIndexCollector
}


