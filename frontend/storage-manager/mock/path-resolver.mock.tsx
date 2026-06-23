import { StorageDirectoryIndexed } from "@/models/storage";

const rootListingFiles : Array<StorageDirectoryIndexed> = [{
  pathId: "test1.log",
  status: "completed",
  name: "test1.log",
  updatedAt: "2024-12-02T14:30:00",
  directory: null
},{
  pathId: "screenshot.png",
  status: "completed",
  name: "screenshot.png",
  updatedAt: "2025-05-03T12:12:12",
  directory: null
},{
  pathId: "folder003/",
  status: "completed",
  name: "folder003",
  updatedAt: "2026-05-03T12:12:12",
  resourceType: "s3-folder",
  directory: [{
    pathId: "screenshot2.png",
    status: "completed",
    name: "screenshot2.png",
    updatedAt: "2025-05-03T12:12:12",
    directory: null
  }]
},{
  pathId: "folder004/",
  status: "completed",
  name: "folder004",
  updatedAt: "2022-05-03T13:12:12",
  resourceType: "s3-folder",
  directory: null
}]

export const awsStorageMockMetadata : Array<StorageDirectoryIndexed> = [{
  name: "/",
  resourceType: "s3-prefix",
  resourceName: "my-bucket",
  routingTarget: "/storages",
  pathId: "bbb1",
  status: "completed",
  directory: [
  {
    name: "/root/",
    resourceType: "s3-folder",
    pathId: "xxx1",
    directory: rootListingFiles,
    status: "completed",
  },
  {
    name: "/path/to/directory/",
    resourceType: "s3-folder",
    pathId: "xxx2",
    directory: null,
    status: "syncing",
  }],
}, {
  name: "/",
  resourceType: "s3-prefix",
  resourceName: "guest-bucket",
  routingTarget: "/storages",
  pathId: "bbb2",
  status: "syncing",
  directory: []
},   
{ 
  name: "すべてのお気に入り", 
  resourceType: "aws-favorites",
  resourceName: "favorites",
  routingTarget: "/favorites",
  pathId: "favo",
  status: "completed",
  directory: []
},
{ 
  name: "ゴミ箱", 
  resourceType: "aws-trashes",
  resourceName: "trashes",
  routingTarget: "/trashes",
  pathId: "trash",
  status: "completed",
  directory: []
}]




