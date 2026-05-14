import { NextResponse } from "next/server"
import net from "net"

export const dynamic = "force-dynamic"

function checkPort(port: number): Promise<boolean> {
    return new Promise(resolve => {
        const socket = new net.Socket()
        socket.setTimeout(1500)
        socket.on("connect", () => { socket.destroy(); resolve(true) })
        socket.on("timeout", () => { socket.destroy(); resolve(false) })
        socket.on("error", () => resolve(false))
        socket.connect(port, "127.0.0.1")
    })
}

export async function GET() {
    const [staging, production] = await Promise.all([checkPort(5434), checkPort(5433)])
    return NextResponse.json({ staging, production })
}
