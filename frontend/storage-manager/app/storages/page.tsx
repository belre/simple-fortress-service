

import { fileItemColumns, FileItem } from "@/components/storages/fileitem-columns"
import { FileWorkspacePanel } from "@/components/file-workspace-panel"


const fileItems: FileItem[] = [
  {
    id: "728ed52f",
    status: "completed",
    fileName: "test1.log",
    updatedAt: "2024-12-02T14:30:00"
  },
  {
    id: "489e1d42",
    status: "syncing",
    fileName: "screenshot.png",
    updatedAt: "2025-05-03T12:12:12"
  },
]


export default function Page() {

  return (
    <div className="container mx-auto">
      <FileWorkspacePanel columns={fileItemColumns} data={fileItems} />
    </div>
  )
}
