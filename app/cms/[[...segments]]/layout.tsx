import { RootLayout } from '@payloadcms/next/layouts'
import { importMap } from '../importMap'
import { serverFunction } from '../actions'
import config from '@payload-config'
import React from 'react'

import '@payloadcms/next/css'

type Args = {
    children: React.ReactNode
}

export default function Layout({ children }: Args) {
    return (
        <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
            {children}
        </RootLayout>
    )
}
