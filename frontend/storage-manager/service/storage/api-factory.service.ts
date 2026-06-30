import { AllowedResourceType } from "@/models/storage"
import { IFileOperation, IFileUploader, IIndexCollector, IStorageApiFactory } from "@/models/storage-behavior"
import { SimpleUploader } from "./simple-uploader.service"
import { SimplePathResolverService } from "./simple-path-resolver.service"
import { FactoryUseCase } from "./api-factory.dto"


class MockStorageApiFactory implements IStorageApiFactory {
  createUploader(resourceType: AllowedResourceType) : IFileUploader {
    switch(resourceType) {
      case "s3-prefix":
      case "s3-folder":
        return new SimpleUploader(resourceType)
      default:
        throw new Error("not implemented")
    }
  }

  createFileOperator(resourceType: AllowedResourceType): IFileOperation {
    switch(resourceType) {
      case "s3-prefix":
      case "s3-folder":
        return new SimpleUploader(resourceType)
      default:
        throw new Error("not implemented")
    }
  }

  createIndexCollector(resourceType: AllowedResourceType): IIndexCollector {
    if(resourceType != "seed-indexer") {
      return this._selectIndexCollector(resourceType)
    } 

    // 本来はここに"seed-indexerのキャッシュやテーブルから、
    // 実際のresource_typeを取り出すコードが追加される。
    return this._selectIndexCollector("s3-prefix")
  }

  _selectIndexCollector(resourceType: Exclude<AllowedResourceType, "seed-indexer">): IIndexCollector {
    switch(resourceType) {
      case "s3-prefix":
      case "s3-folder":
        return new SimplePathResolverService()
      default:
        throw new Error("not implemented")
    }
  }
}

export class StorageApiFactory {
  static createStorageApiFactory(useCase: FactoryUseCase) {
    switch(useCase) {
      case "Mock":
        return new MockStorageApiFactory()
      default:
        throw new Error("not implemented")
    }
  }
  
  static createStorageApiFactoryFromEnv() {
    const fromEnv = process.env.storageApiFactoryType as FactoryUseCase
    return StorageApiFactory.createStorageApiFactory(fromEnv || "Mock")
  }
}

