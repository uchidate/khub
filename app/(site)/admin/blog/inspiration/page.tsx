"use client";
import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DataTable, Column } from "@/components/admin/DataTable";
import { AdminBadge } from "@/components/admin/AdminBadge";
import { ExternalLink, FileText, Sparkles } from "lucide-react";

interface News {
  id: string;
  title: string;
  imageUrl: string | null;
  source: string | null;
  publishedAt: string;
  translationStatus: string | null;
  editorialNoteGeneratedAt?: string | null;
  blogPostGeneratedAt?: string | null;
}

export default function BlogInspirationPage() {
  const [selected, setSelected] = useState<News | null>(null);

  const columns: Column<News>[] = useMemo(() => [
    {
      key: "imageUrl",
      label: "",
      render: (news) => news.imageUrl ? (
        <img src={news.imageUrl} alt={news.title} className="w-[52px] h-[34px] rounded-lg object-cover" />
      ) : (
        <div className="w-[52px] h-[34px] bg-surface rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-[8px] text-muted font-bold">IMG</span>
        </div>
      ),
    },
    {
      key: "title",
      label: "Título",
      className: "min-w-[320px]",
      render: (news) => (
        <div>
          <p className="font-medium text-foreground leading-snug line-clamp-2 text-sm">{news.title}</p>
          <div className="mt-1 flex items-center gap-1.5 flex-wrap">
            {news.editorialNoteGeneratedAt && <AdminBadge variant="accent" shape="pill"><FileText size={10} /> Nota</AdminBadge>}
            {news.blogPostGeneratedAt && <AdminBadge variant="success" shape="pill"><Sparkles size={10} /> Blog</AdminBadge>}
          </div>
        </div>
      ),
    },
    {
      key: "source",
      label: "Fonte",
      render: (news) => <span className="text-xs text-muted">{news.source || "—"}</span>,
    },
    {
      key: "publishedAt",
      label: "Publicado",
      render: (news) => (
        <span className="text-xs text-muted whitespace-nowrap">{new Date(news.publishedAt).toLocaleDateString("pt-BR")}</span>
      ),
    },
  ], []);

  return (
    <AdminLayout
      title="Inspirar artigo do blog por notícia"
      subtitle="Escolha uma notícia para inspirar a criação de um novo artigo. Depois, peça aqui no chat: 'Gere um artigo inspirado na notícia [id]'."
    >
      <div className="mb-6 text-gray-600">
        Selecione uma notícia abaixo. Copie o <b>ID</b> ou o <b>link</b> e peça aqui no chat para gerar o artigo adaptado.
      </div>
      <DataTable<News>
        columns={columns}
        apiUrl="/api/admin/news"
        extraParams={{ sort: 'publishedAt', order: 'desc' }}
        onEdit={setSelected}
        editHref={(news) => `/admin/news/${news.id}/preview`}
        actions={(news) => (
          <a
            href={`/admin/news/${news.id}/preview`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline flex items-center gap-1"
            title="Ver notícia"
          >
            <ExternalLink size={14} />
          </a>
        )}
        searchPlaceholder="Buscar por título ou conteúdo..."
      />
      {selected && (
        <div className="mt-8 p-4 border rounded bg-surface">
          <div className="font-bold mb-2">Notícia selecionada:</div>
          <div className="mb-2">ID: <span className="font-mono text-xs">{selected.id}</span></div>
          <div className="mb-2">Título: {selected.title}</div>
          <a
            href={`/admin/news/${selected.id}/preview`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline flex items-center gap-1"
          >
            <ExternalLink size={14} /> Ver notícia
          </a>
        </div>
      )}
    </AdminLayout>
  );
}
