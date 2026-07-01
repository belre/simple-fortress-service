import { AllowedResourceType, Caller } from "@/models/storage"
import { IFileOperation, IFileUploader, IIndexCollector, IStorageApiFactory } from "@/models/storage-behavior"
import { SimpleUploader } from "./simple-uploader.service"
import { SimpleBackendPathResolverService, SimplePathResolverService } from "./simple-path-resolver.service"
import { FactoryUseCase } from "./api-factory.dto"


class MockStorageApiFactory implements IStorageApiFactory {
  constructor(private caller: Caller = "frontend") {
  }

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
    return this.caller === "backend" ? 
      this._selectBackendIndexCollector(resourceType) : 
      this._selectIndexCollector(resourceType)
  }

  _selectIndexCollector(resourceType: Exclude<AllowedResourceType, "seed-indexer">): IIndexCollector {
    switch(resourceType) {
      case "s3-prefix":
      case "s3-folder":
        return new SimplePathResolverService(resourceType)
      default:
        throw new Error("not implemented")
    }
  }

  _selectBackendIndexCollector(resourceType: Exclude<AllowedResourceType, "seed-indexer">): IIndexCollector {
    switch(resourceType) {
      case "s3-prefix":
      case "s3-folder":
        return new SimpleBackendPathResolverService(resourceType)
      default:
        throw new Error("not implemented")
    }
  }
}

export class StorageApiFactory {
  static createStorageApiFactory(useCase: FactoryUseCase, caller: Caller = "frontend") : IStorageApiFactory {
    switch(useCase) {
      case "Mock":
        return new MockStorageApiFactory(caller)
      default:
        throw new Error("not implemented")
    }
  }
  
  static createStorageApiFactoryFromEnv(caller: Caller = "frontend") : IStorageApiFactory {
    const fromEnv = process.env.storageApiFactoryType as FactoryUseCase
    return StorageApiFactory.createStorageApiFactory(fromEnv || "Mock", caller)
  }
}

