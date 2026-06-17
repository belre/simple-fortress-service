"use client"; // 👈 クライアントの動きはここに完全隔離！

import * as React from "react";
import { GeneralRow, DataTable } from "@/components/standard-table"; // あなたの作ったDataTable
import { ColumnDef } from "@tanstack/react-table";

interface FileWorkspacePanelProps<TData extends GeneralRow> {
  columns: ColumnDef<TData, any>[];
  data: TData[];
}

export function FileWorkspacePanel<TData extends GeneralRow>({ columns, data }: FileWorkspacePanelProps<TData>) {
  // 💡 テーブルのフォーカスや遅延制御の状態は、このパネルが王様として管理する
  const [focusedId, setFocusedId] = React.useState<string | null>(null)

  return (
    // ただのdivではなく、役割を持った「ワークスペースの背景」として定義
    <div 
      className="w-full min-h-[calc(100vh-4rem)] bg-background p-6 cursor-default select-none"
      onClick={() => {
        setFocusedId(null)
      }}
    >
      {/* テーブルを包むカード。ここでクリックの突き抜け（バブリング）をせき止める */}
      <div className="rounded-md border bg-card" onClick={(e) => e.stopPropagation()}>
        <DataTable 
          columns={columns} 
          data={data} 
          focusId={focusedId}
          onRowSelected={(uuid) => {
            setFocusedId(uuid)
          }}
        />
      </div>
    </div>
  );
}