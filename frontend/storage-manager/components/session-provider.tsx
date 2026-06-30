'use client'

import { getOrCreateFileSession } from "@/app/actions-session"
import { Spinner } from "@/components/ui/spinner"
import { AllowedResourceType } from '@/models/storage'
import { IndexCollectionResolveResult } from '@/models/storage-behavior'
import * as React from 'react'


interface FileWorkspacePanelProps {
    children: React.ReactNode
    session: string | null
    current: IndexCollectionResolveResult
    workDirectoryPathId: string | null
    resourceName: string
    resourceType: AllowedResourceType
}



export function SessionProvider(props : FileWorkspacePanelProps) { 
    console.log('[親] SessionProviderレンダリング発火')

    const [isPending, startTransition] = React.useTransition()

    const [sessionData, setSessionData] = React.useState<string | null>(props.session)
    
    React.useEffect(() => {
        startTransition(async () => {
            const session = await getOrCreateFileSession()
            setSessionData(session)
            console.log(session)
        })
    }, [sessionData])


    return (sessionData ? 
        <div key={sessionData}>{props.children}</div> : 
        <div className="flex items-center">
            <div className="ml-8 justify-center">
                <Spinner className='size-8'/> 
                <h2>Now loading...</h2>
            </div>
        </div>
    )
}


