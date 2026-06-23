
import { SimpleUploader } from "@/service/storage/simple-uploader.service";
import { AllowedResourceType, FactoryUseCase } from "@/models/storage";
import { IFileUploader, IIndexCollector, IStorageApiFactory } from "@/models/storage-behavior";

export class MockStorageApiFactory implements IStorageApiFactory {
  createUploader(resourceType: AllowedResourceType) : IFileUploader {
    switch(resourceType) {
      case "s3-prefix":
        return new SimpleUploader()
      default:
        throw new Error("not implemented")
    }
  }

  createIndexCollector(resourceType: AllowedResourceType): IIndexCollector {
    throw new Error("not implemented")
  }
}

export function useStorageApiFactory(useCase: FactoryUseCase) {
  switch(useCase) {
    case "Mock":
      return new MockStorageApiFactory()
    default:
      throw new Error("not implemented")
  }
}

export function useStorageApiFactoryFromEnv() {
  const fromEnv = process.env.storageApiFactoryType as FactoryUseCase
  return useStorageApiFactory(fromEnv || "Mock")
}


