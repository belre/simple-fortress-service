"use server"

import { IndexCollectionResolveResult } from "@/models/storage-behavior"
import { SimplePathResolverService } from "@/service/storage/simple-path-resolver.service"

export const fetchFilePath = async (pathId?: string) : Promise<IndexCollectionResolveResult | null> => {
  if(!pathId) {
    return null
  }

  const service = new SimplePathResolverService()
  const result = await service.resolve(pathId)
  return result ?? null
}

