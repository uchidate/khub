import { RootLayout } from '@payloadcms/next/layouts'
import { importMap } from '../importMap'
import { serverFunction } from '../actions'
import config from '@payload-config'
import '@payloadcms/next/css'

type Args = { children: React.ReactNode }

// O Payload RootLayout renderiza <html><body> internamente.
// Não adicionamos wrapper — o Next.js App Router aceita que um layout
// de segmento seja o root se não houver layout pai com html/body.
export default function Layout({ children }: Args) {
    return (
        <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
            {children}
        </RootLayout>
    )
}
