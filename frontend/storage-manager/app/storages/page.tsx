
import { FileWorkspacePanel } from "@/components/file-workspace-panel"
import { redirect } from "next/navigation";

import { ClientPart } from "@/components/debugger";
import { StorageApiFactory } from "@/service/storage/api-factory.service";
import { AllowedResourceType } from "@/models/storage";
import { SessionProvider } from "@/components/session-provider";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

interface QueryParameter {
  resource_type?: string
  resource_name?: string
  path_id?: string
}


export default async function Page({ searchParams }: PageProps) {
  const resolvedParams = (await searchParams) as QueryParameter

  if(!resolvedParams?.path_id || !resolvedParams?.resource_name) {
    redirect(`/`)
  }

  const apiFactory = StorageApiFactory.createStorageApiFactoryFromEnv()
  const collector = apiFactory.createIndexCollector("seed-indexer")

  // 💡 depth: 2 を指定して、タイプと初期データを「1回のフェッチ」で同時に持ってくる！
  const seedResolution = await collector.resolve(resolvedParams.path_id, 2)
  
  // もしデータが取れなければ即セーフティリダイレクト
  if (!seedResolution || seedResolution.result === "error") {
    redirect(`/`)
  }

  // レスポンスの中に真のタイプ（メタデータ）と、ディレクトリ一覧（実データ）が両方入っている状態
  const resourceType = seedResolution.data?.resourceType as AllowedResourceType
  if (!resourceType) {
    redirect(`/`)
  }
  



  return (
    <div className="container mx-auto w-full h-screen">
      <SessionProvider
          resourceType={resourceType}
          resourceName={resolvedParams.resource_name}
          workDirectoryPathId={resolvedParams.path_id ?? null}
          current={seedResolution}>
        <FileWorkspacePanel 
          queryParameter={resolvedParams}
          resourceType={resourceType}
          resourceName={resolvedParams.resource_name}
          workDirectoryPathId={resolvedParams.path_id ?? null}
          current={seedResolution}
        />
        <ClientPart/>
      </SessionProvider>
    </div>
  )
}