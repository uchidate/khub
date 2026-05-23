'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { X, Upload, Trash2, Check, ImageIcon, Loader2 } from 'lucide-react'

interface MediaFile {
    filename: string
    url: string
    size: number
    createdAt: string
}

interface MediaPickerProps {
    value?: string | null
    onChange: (url: string) => void
    onClose: () => void
}

function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}

export function MediaPicker({ value, onChange, onClose }: MediaPickerProps) {
    const [files, setFiles] = useState<MediaFile[]>([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [deleting, setDeleting] = useState<string | null>(null)
    const [selected, setSelected] = useState<string | null>(value ?? null)
    const [dragOver, setDragOver] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const dragCounter = useRef(0)

    const loadFiles = useCallback(async () => {
        setLoading(true)
        const res = await fetch('/api/admin/media')
        if (res.ok) setFiles(await res.json())
        setLoading(false)
    }, [])

    useEffect(() => { loadFiles() }, [loadFiles])

    const upload = async (file: File) => {
        setUploading(true)
        setUploadError(null)
        try {
            const fd = new FormData()
            fd.append('file', file)
            const res = await fetch('/api/admin/media/upload', { method: 'POST', body: fd })
            if (res.ok) {
                const { url } = await res.json()
                await loadFiles()
                setSelected(url)
            } else {
                const data = await res.json().catch(() => ({}))
                setUploadError(data.error ?? `Erro ${res.status}`)
            }
        } catch {
            setUploadError('Erro de rede ao enviar imagem')
        }
        setUploading(false)
    }

    const handleFiles = (fileList: FileList | null) => {
        if (!fileList?.length) return
        upload(fileList[0])
    }

    const deleteFile = async (filename: string, url: string) => {
        if (!confirm(`Deletar "${filename}"?`)) return
        setDeleting(filename)
        await fetch('/api/admin/media', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filename }) })
        if (selected === url) setSelected(null)
        await loadFiles()
        setDeleting(null)
    }

    const confirm = (msg: string) => window.confirm(msg)

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
            <div className="bg-background border border-border rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                    <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-muted" />
                        <h2 className="text-sm font-bold text-foreground">Biblioteca de imagens</h2>
                    </div>
                    <button onClick={onClose} className="text-muted hover:text-foreground transition-colors"><X className="w-4 h-4" /></button>
                </div>

                {/* Upload zone */}
                <div
                    onDragEnter={e => { e.preventDefault(); dragCounter.current++; setDragOver(true) }}
                    onDragOver={e => e.preventDefault()}
                    onDragLeave={() => { dragCounter.current--; if (dragCounter.current === 0) setDragOver(false) }}
                    onDrop={e => { e.preventDefault(); dragCounter.current = 0; setDragOver(false); handleFiles(e.dataTransfer.files) }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`mx-5 mt-4 border-2 border-dashed rounded-xl px-4 py-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${dragOver ? 'border-[#ff2d78] bg-[#ff2d78]/5' : 'border-border hover:border-[#ff2d78]/50 hover:bg-surface'}`}
                >
                    {uploading
                        ? <><Loader2 className="w-4 h-4 animate-spin text-[#ff2d78]" /><span className="text-sm text-muted">Enviando...</span></>
                        : <><Upload className="w-4 h-4 text-muted" /><span className="text-sm text-muted">Arraste uma imagem ou <span className="text-[#ff2d78] font-semibold">clique para fazer upload</span></span></>
                    }
                    {uploadError && <span className="text-xs text-red-500 font-medium">{uploadError}</span>}
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFiles(e.target.files)} />
                </div>

                {/* Gallery */}
                <div className="flex-1 overflow-y-auto px-5 py-4">
                    {loading ? (
                        <div className="flex items-center justify-center h-32"><Loader2 className="w-5 h-5 animate-spin text-muted" /></div>
                    ) : files.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-muted gap-2">
                            <ImageIcon className="w-8 h-8 opacity-30" />
                            <p className="text-sm">Nenhuma imagem ainda</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                            {files.map(f => (
                                <div
                                    key={f.filename}
                                    onClick={() => setSelected(f.url)}
                                    className={`relative group rounded-xl overflow-hidden border-2 cursor-pointer transition-all aspect-square bg-surface ${selected === f.url ? 'border-[#ff2d78]' : 'border-transparent hover:border-border'}`}
                                >
                                    { }
                                    <img src={f.url} alt={f.filename} className="absolute inset-0 w-full h-full object-cover" />
                                    {selected === f.url && (
                                        <div className="absolute inset-0 bg-[#ff2d78]/20 flex items-center justify-center">
                                            <Check className="w-6 h-6 text-white drop-shadow-md" />
                                        </div>
                                    )}
                                    <button
                                        onClick={e => { e.stopPropagation(); deleteFile(f.filename, f.url) }}
                                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-black/60 hover:bg-red-500 text-white rounded-lg p-1 transition-all"
                                    >
                                        {deleting === f.filename
                                            ? <Loader2 className="w-3 h-3 animate-spin" />
                                            : <Trash2 className="w-3 h-3" />
                                        }
                                    </button>
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <p className="text-[9px] text-white truncate">{f.filename}</p>
                                        <p className="text-[9px] text-white/70">{formatSize(f.size)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-5 py-4 border-t border-border gap-3">
                    <p className="text-xs text-muted truncate flex-1">{selected ? selected : 'Nenhuma imagem selecionada'}</p>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="text-xs px-4 py-2 rounded-lg border border-border text-muted hover:text-foreground transition-colors">Cancelar</button>
                        <button
                            onClick={() => { if (selected) { onChange(selected); onClose() } }}
                            disabled={!selected}
                            className="text-xs px-4 py-2 rounded-lg bg-[#ff2d78] text-white font-semibold hover:bg-[#e0245e] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Usar imagem
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
