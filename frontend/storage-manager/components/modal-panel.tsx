
import * as React from "react"

interface ModalBlurPanelProps {
    isVisible: boolean
}
    

export function ModalBlurPanel ({children, props} : {children: React.ReactNode, props: ModalBlurPanelProps} ) {
    return props.isVisible ? (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        {children}
    </div>) : <span/>
}
