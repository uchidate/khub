import { ShopeeCard, ShopeeSectionHeader } from '@/components/ui/ShopeeCard'
import { ShoppingBag, Sparkles } from 'lucide-react'

// Produtos mock — em produção, seriam links reais de afiliado Shopee
const MOCK_URL = 'https://shopee.com.br'

const albumsKpop = [
    {
        name: 'BTS - Anthology Album [Proof] - Versão Compact',
        price: 'R$ 89,90',
        originalPrice: 'R$ 129,90',
        rating: 4.9,
        sold: '2.3k',
        imageUrl: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&h=400&fit=crop',
        badge: '-30%',
    },
    {
        name: 'BLACKPINK - Born Pink Album Box Set + Photobook',
        price: 'R$ 149,00',
        rating: 4.8,
        sold: '1.1k',
        imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
    },
    {
        name: 'IVE - After Like EP Album + Photocard',
        price: 'R$ 74,90',
        originalPrice: 'R$ 99,00',
        rating: 4.7,
        sold: '890',
        imageUrl: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&h=400&fit=crop',
        badge: 'Mais vendido',
    },
    {
        name: 'SEVENTEEN - Spill The Feels Album + Pôster',
        price: 'R$ 94,90',
        rating: 4.8,
        sold: '670',
        imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop',
    },
]

const lightsticks = [
    {
        name: 'Army Bomb BTS Lightstick Versão 4 - Oficial',
        price: 'R$ 189,00',
        originalPrice: 'R$ 249,00',
        rating: 4.9,
        sold: '3.2k',
        imageUrl: 'https://images.unsplash.com/photo-1598387993281-cecf8b71a8f8?w=400&h=400&fit=crop',
        badge: 'Top vendas',
    },
    {
        name: 'Lightstick BLACKPINK - Bong Bong Ver. 2',
        price: 'R$ 159,00',
        rating: 4.8,
        sold: '1.8k',
        imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=400&fit=crop',
    },
    {
        name: 'Carat Bong SEVENTEEN Lightstick - Ver. 3',
        price: 'R$ 179,00',
        rating: 4.7,
        sold: '940',
        imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop',
    },
]

const kbeauty = [
    {
        name: 'COSRX Advanced Snail 96 Mucin Power Essence 100ml',
        price: 'R$ 84,90',
        originalPrice: 'R$ 109,90',
        rating: 4.9,
        sold: '15k',
        imageUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop',
        badge: '-22%',
    },
    {
        name: 'Some By Mi AHA BHA PHA 30 Days Miracle Toner',
        price: 'R$ 67,90',
        rating: 4.8,
        sold: '8.4k',
        imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop',
    },
    {
        name: 'Klairs Supple Preparation Facial Toner 180ml',
        price: 'R$ 79,00',
        rating: 4.7,
        sold: '5.2k',
        imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop',
    },
]

const sidebarItems = [
    {
        name: 'BTS Proof Compact Edition Album',
        price: 'R$ 89,90',
        sold: '2.3k',
        imageUrl: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=200&h=200&fit=crop',
    },
    {
        name: 'Army Bomb Ver.4 Lightstick Oficial',
        price: 'R$ 189,00',
        sold: '3.2k',
        imageUrl: 'https://images.unsplash.com/photo-1598387993281-cecf8b71a8f8?w=200&h=200&fit=crop',
    },
    {
        name: 'COSRX Snail Mucin Essence 100ml',
        price: 'R$ 84,90',
        sold: '15k',
        imageUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200&h=200&fit=crop',
    },
]

export default function LojaPage() {
    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <div className="bg-gradient-to-br from-orange-500/10 via-background to-background border-b border-border/40">
                <div className="max-w-6xl mx-auto px-4 py-10">
                    <div className="flex items-center gap-3 mb-3">
                        <ShoppingBag className="w-7 h-7 text-orange-500" />
                        <h1 className="text-2xl font-black text-foreground">Vitrine HallyuHub</h1>
                        <span className="text-xs font-bold bg-orange-500 text-white px-2.5 py-1 rounded-full">Shopee Afiliado</span>
                    </div>
                    <p className="text-sm text-muted max-w-xl">
                        Selecionamos os melhores produtos de K-Pop, K-Drama e K-Beauty disponíveis na Shopee. Comprando pelos nossos links você apoia o HallyuHub sem pagar nada a mais.
                    </p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">

                {/* ── MOCKUP A: Grid de produtos — Albums ────────────────── */}
                <section>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-orange-500">Mockup A</span>
                        <span className="text-xs text-muted">— Grid de produtos (para homepage ou página /loja)</span>
                    </div>
                    <div className="p-6 rounded-2xl border border-dashed border-border/60 bg-surface/30">
                        <ShopeeSectionHeader title="Álbuns K-Pop em Destaque" seeAllUrl={MOCK_URL} />
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {albumsKpop.map((p) => (
                                <ShopeeCard key={p.name} {...p} affiliateUrl={MOCK_URL} />
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── MOCKUP B: Sidebar compacta — como aparece em páginas de artista ── */}
                <section>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-orange-500">Mockup B</span>
                        <span className="text-xs text-muted">— Sidebar compacta (páginas de artista / drama)</span>
                    </div>
                    <div className="p-6 rounded-2xl border border-dashed border-border/60 bg-surface/30">
                        <div className="max-w-xs">
                            <ShopeeSectionHeader title="Compre na Shopee" />
                            <div className="flex flex-col gap-2">
                                {sidebarItems.map((p) => (
                                    <ShopeeCard key={p.name} {...p} affiliateUrl={MOCK_URL} compact />
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── MOCKUP C: Carrossel horizontal — homepage trending ── */}
                <section>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-orange-500">Mockup C</span>
                        <span className="text-xs text-muted">— Carrossel horizontal (homepage, abaixo do trending)</span>
                    </div>
                    <div className="p-6 rounded-2xl border border-dashed border-border/60 bg-surface/30">
                        <ShopeeSectionHeader title="Lightsticks Mais Vendidos" seeAllUrl={MOCK_URL} />
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                            {[...lightsticks, ...albumsKpop.slice(0, 2)].map((p) => (
                                <div key={p.name} className="flex-shrink-0 w-44">
                                    <ShopeeCard {...p} affiliateUrl={MOCK_URL} />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── MOCKUP D: K-Beauty — nicho específico ── */}
                <section>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-orange-500">Mockup D</span>
                        <span className="text-xs text-muted">— Seção K-Beauty (página /k-beauty ou artigos)</span>
                    </div>
                    <div className="p-6 rounded-2xl border border-dashed border-border/60 bg-surface/30">
                        <ShopeeSectionHeader title="K-Beauty — Mais Vendidos no Brasil" seeAllUrl={MOCK_URL} />
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {kbeauty.map((p) => (
                                <ShopeeCard key={p.name} {...p} affiliateUrl={MOCK_URL} />
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Nota técnica ── */}
                <div className="rounded-2xl border border-border/40 bg-surface/50 p-6 space-y-3">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-accent" />
                        Como implementar de verdade
                    </h3>
                    <div className="grid sm:grid-cols-3 gap-4 text-xs text-muted">
                        <div>
                            <p className="font-semibold text-foreground mb-1">1. Cadastro</p>
                            <p>Criar conta no Shopee Affiliate Program em affiliate.shopee.com.br — aprovação em até 3 dias.</p>
                        </div>
                        <div>
                            <p className="font-semibold text-foreground mb-1">2. Links</p>
                            <p>Gerar link de afiliado por produto no painel. Cada clique que converte em compra = comissão (5–12% dependendo da categoria).</p>
                        </div>
                        <div>
                            <p className="font-semibold text-foreground mb-1">3. Integração</p>
                            <p>Substituir MOCK_URL pelos links reais. Opcionalmente usar Shopee Open Platform API para buscar produtos dinamicamente.</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
