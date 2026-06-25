
import { FileWorkspacePanel } from "@/components/file-workspace-panel"
import { fetchFilePath } from "./actions";
import { routerServerGlobal } from "next/dist/server/lib/router-utils/router-server-context";
import { redirect, RedirectType } from "next/navigation";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

interface QueryParameter {
  resource_name?: string
  path_id?: string
}

export default async function Page({ searchParams }: PageProps) {
  const resolvedParams = await searchParams as QueryParameter

  const initialValue = await fetchFilePath(resolvedParams?.path_id)
  if(!initialValue){
    redirect(`/storages`)
  }

  return (
    <div className="container mx-auto">
      <FileWorkspacePanel 
        queryParameter={resolvedParams}
        resourceName={resolvedParams.resource_name ?? null}
        workDirectoryPathId={resolvedParams.path_id ?? null}
        current={initialValue}
      />
    </div>
  )
}
