import { StorageDirectoryIndexed } from "@/models/storage";

export const generateMockData = () => {
  const now = (new Date()).getTime()

  const awsStorageMockMetadata : Array<StorageDirectoryIndexed> = [{
    name: ".",
    resourceType: "s3-prefix",
    resourceName: "my-bucket",
    prefix: null,
    routingTarget: "/storages",
    pathId: "bbb1",
    status: "completed",
    directory: [
    {
      name: "root",
      resourceType: "s3-folder",
      prefix: null,
      pathId: "xxx1",
      directory: [{
        pathId: now.toString(),
        prefix: "root/",
        status: "completed",
        name: now.toString(),
        updatedAt: "2024-12-02T14:30:00",
        directory: null
      },{
        pathId: "screenshot.png",
        prefix: "root/",
        status: "completed",
        name: "screenshot.png",
        updatedAt: "2025-05-03T12:12:12",
        directory: null
      },{
        pathId: "folder003/",
        prefix: "root/",
        status: "completed",
        name: "folder003",
        updatedAt: "2026-05-03T12:12:12",
        resourceType: "s3-folder",
        directory: [{
          pathId: "folder003/screenshot2.png",
          prefix: "root/",
          status: "completed",
          name: "screenshot2.png",
          updatedAt: "2025-05-03T12:12:12",
          directory: null
        }]
      },{
        pathId: "folder004/",
        prefix: "root/",
        status: "completed",
        name: "folder004",
        updatedAt: "2022-05-03T13:12:12",
        resourceType: "s3-folder",
        directory: []
      }],
      status: "completed",
    },
    {
      name: "path/to/directory",
      resourceType: "s3-folder",
      prefix: null,
      pathId: "xxx2",
      directory: [],
      status: "syncing",
    }],
  }, {
    name: ".",
    resourceType: "s3-prefix",
    resourceName: "guest-bucket",
    prefix: null,
    routingTarget: "/storages",
    pathId: "bbb2",
    status: "syncing",
    directory: []
  },   
  { 
    name: "Favorites", 
    resourceType: "aws-favorites",
    resourceName: "favorites",
    routingTarget: "/favorites",
    prefix: null,
    pathId: "favo",
    status: "completed",
    directory: []
  },
  { 
    name: "Trashes", 
    resourceType: "aws-trashes",
    resourceName: "trashes",
    routingTarget: "/trashes",
    prefix: null,
    pathId: "trash",
    status: "completed",
    directory: []
  }]

  return awsStorageMockMetadata
}


export function traverse(
  children: StorageDirectoryIndexed[], 
  recursive=false,
  remap: (metadata: StorageDirectoryIndexed) => StorageDirectoryIndexed = (metadata) => metadata,
) : StorageDirectoryIndexed[] {

  return children.map(child => {
      let directory : StorageDirectoryIndexed[] = []
      if(recursive) {
          directory = child.directory?.
              map( c => traverse([c], true, remap)).flat() ?? []
      }

      return [...directory, remap(child)]
  }).flat()
}


export const toPublicId = (pathId: string): string =>
    Buffer.from(pathId)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')

export const fromPublicId = (publicId: string): string =>
    Buffer.from(
        publicId.replace(/-/g, '+').replace(/_/g, '/'),
        'base64'
    ).toString()



