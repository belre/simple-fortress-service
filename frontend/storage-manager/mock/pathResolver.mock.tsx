import { StorageDirectoryIndexed } from "@/models/storage";

export const awsStorageMockMetadata : Array<StorageDirectoryIndexed> = [{
  name: "/",
  resourceType: "s3",
  resourceName: "my-bucket",
  routingTarget: "/storages",
  pathId: "bbb1",
  directory: [
  {
    name: "/root/",
    pathId: "xxx1",
    directory: null
  },
  {
    name: "/path/to/directory/",
    pathId: "xxx2",
    directory: null
  }],
}, {
  name: "/",
  resourceType: "s3",
  resourceName: "guest-bucket",
  routingTarget: "/storages",
  pathId: "bbb2",
  directory: []
},   
{ 
  name: "すべてのお気に入り", 
  resourceType: "favorites",
  resourceName: "favorites",
  routingTarget: "/favorites",
  pathId: "favo",
  directory: []
},
{ 
  name: "ゴミ箱", 
  resourceType: "trashes",
  resourceName: "trashes",
  routingTarget: "/trashes",
  pathId: "trash",
  directory: []
}]

