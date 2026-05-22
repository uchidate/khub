// Three directions for /productions.

const PR = window.PRODUCTIONS;
const PS = window.PROD_STATS;

function ProdNav() {
  return (
    <div style={{ padding: '14px 40px', borderBottom: '1px solid #e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <div style={{ fontWeight: 800, letterSpacing: -0.6, fontSize: 22 }}>HallyuHub<span style={{ color: 'var(--ha-accent, #ee2244)' }}>.</span></div>
        <nav style={{ display: 'flex', gap: 22, color: '#444', fontWeight: 500 }}>
          <span>Início</span><span>Artistas</span>
          <span style={{ color: '#0a0a0a', fontWeight: 700, borderBottom: '2px solid var(--ha-accent, #ee2244)', paddingBottom: 4 }}>Produções</span>
          <span>K-Drama</span><span>K-Pop</span><span>Cinema</span><span>Cultura</span>
        </nav>
      </div>
      <span style={{ padding: '7px 14px', border: '1px solid #e0e0e0', borderRadius: 999, fontSize: 12, color: '#444', fontFamily: 'JetBrains Mono, monospace' }}>⌘K buscar</span>
    </div>
  );
}

// Poster tile — gradient + hangul
function Poster({ p, size = 'md' }) {
  const seed = (p.title.charCodeAt(0) + (p.cover || 0) * 13) % 360;
  const h1 = seed, h2 = (seed + 60) % 360;
  return (
    <div style={{
      aspectRatio: '2/3',
      background: `linear-gradient(${size === 'lg' ? 145 : 135}deg, hsl(${h1} 55% ${size === 'sm' ? 28 : 22}%), hsl(${h2} 60% ${size === 'sm' ? 18 : 14}%))`,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: '"Noto Sans KR", sans-serif', fontWeight: 800,
        fontSize: size === 'lg' ? 110 : size === 'md' ? 64 : 36,
        color: 'rgba(255,255,255,0.13)', letterSpacing: -2, lineHeight: 0.85, textAlign: 'center',
      }}>{p.hangul.slice(0, 2)}</div>
      <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 4, flexDirection: 'column', alignItems: 'flex-start' }}>
        {p.top && <span style={{ padding: '2px 6px', background: 'var(--ha-accent, #ee2244)', color: '#fff', fontFamily: 'JetBrains Mono, monospace', fontSize: 9, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase' }}>● top</span>}
        <span style={{ padding: '2px 6px', background: 'rgba(0,0,0,0.6)', color: '#fff', fontFamily: 'JetBrains Mono, monospace', fontSize: 9, fontWeight: 700, letterSpacing: 0.4 }}>{p.year}</span>
      </div>
      <div style={{ position: 'absolute', bottom: 8, right: 8, padding: '2px 7px', background: 'rgba(0,0,0,0.65)', color: '#fff', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700 }}>
        ★ {p.rating.toFixed(1)}
      </div>
    </div>
  );
}

// Card body — title + meta
function CardMeta({ p, dense }) {
  return (
    <div style={{ padding: '10px 0' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: dense ? 13 : 15, fontWeight: 600, lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{p.title}</span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#999', flexShrink: 0 }}>{p.age}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 3, gap: 8 }}>
        <span style={{ fontFamily: '"Noto Sans KR", sans-serif', fontSize: 10, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{p.hangul}</span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#bbb', textTransform: 'uppercase', letterSpacing: 0.4, flexShrink: 0 }}>{p.type}</span>
      </div>
      {!dense && (
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#999', marginTop: 6 }}>
          {p.episodes ? `${p.episodes} ep · ${p.dur}` : p.dur} · {p.network}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// DIRECTION A — Wall + sticky toolbar (estilo Letterboxd / MUBI)
// ─────────────────────────────────────────────────────────────────
window.ProductionsA = function ProductionsA() {
  return (
    <div style={{ background: '#fff', minHeight: '100%', fontFamily: '"Schibsted Grotesk", system-ui, sans-serif' }}>
      <ProdNav />

      <section style={{ padding: '36px 40px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: 0.6 }}>Produções · banco completo</div>
            <h1 style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: 72, fontWeight: 500, letterSpacing: -2.6, lineHeight: 1, margin: '6px 0 0', textWrap: 'balance' }}>
              {PS.total.toLocaleString('pt-BR')} <span style={{ fontStyle: 'italic', color: 'var(--ha-accent, #ee2244)' }}>obras</span> para descobrir.
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ padding: '10px 14px', border: '1px solid #e0e0e0', borderRadius: 4, fontSize: 13, color: '#888', minWidth: 280, fontFamily: 'JetBrains Mono, monospace' }}>⌕ título, hangul, elenco, ano…</span>
          </div>
        </div>
      </section>

      {/* Sticky toolbar */}
      <section style={{ padding: '14px 40px', background: '#fafafa', borderTop: '1px solid #e8e8e8', borderBottom: '1px solid #e8e8e8', position: 'sticky', top: 0, zIndex: 5, display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
        {[
          ['Tipo', ['Tudo', 'K-Drama', 'Filme', 'Variety', 'Reality', 'Concert', 'Animação']],
          ['Plataforma', ['Tudo', 'Netflix', 'tvN', 'JTBC', 'Disney+', 'Coupang']],
          ['Década', ['2020+', '2010s', '2000s', '1990s']],
          ['Idade', ['L', '12+', '14+', '16+', '18+']],
        ].map(([k, opts], i) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#888', letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: 700 }}>{k}</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {opts.map((o, j) => (
                <span key={o} style={{
                  padding: '5px 10px', borderRadius: 999, fontSize: 12,
                  background: (i === 0 && j === 0) ? '#0a0a0a' : '#fff',
                  color: (i === 0 && j === 0) ? '#fff' : '#444',
                  border: '1px solid #e0e0e0', fontWeight: 500,
                }}>{o}</span>
              ))}
            </div>
          </div>
        ))}
        <span style={{ marginLeft: 'auto', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#666' }}>↕ Melhor avaliação ▾</span>
      </section>

      {/* Hero — featured 3 */}
      <section style={{ padding: '32px 40px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.4, margin: 0 }}>Capa do mês <span style={{ fontFamily: '"Noto Sans KR", sans-serif', color: '#bbb', marginLeft: 6 }}>이달의 작품</span></h2>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#888' }}>curado pela redação · maio 2026</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 14 }}>
          {PR.filter(p => p.top).slice(0, 3).map((p, i) => (
            <article key={p.title} style={{ position: 'relative' }}>
              <div style={{ aspectRatio: i === 0 ? '3/2' : '3/4' }}>
                <Poster p={p} size={i === 0 ? 'lg' : 'md'} />
              </div>
              <div style={{ padding: '12px 0' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--ha-accent, #ee2244)', fontWeight: 700, letterSpacing: 0.6 }}>● #{i + 1} EM ALTA</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#888' }}>{p.network}</span>
                </div>
                <h3 style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: i === 0 ? 32 : 22, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1.05, margin: '6px 0 4px' }}>{p.title}</h3>
                <div style={{ fontFamily: '"Noto Sans KR", sans-serif', fontSize: 12, color: '#999' }}>{p.hangul}</div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Mega wall */}
      <section style={{ padding: '24px 40px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18, paddingBottom: 10, borderBottom: '1px solid #0a0a0a' }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.4, margin: 0 }}>Todas as produções</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#888' }}>
            <span>vendo 1 — 48 de {PS.total.toLocaleString('pt-BR')}</span>
            <span style={{ marginLeft: 10, padding: '4px 10px', border: '1px solid #e0e0e0', borderRadius: 999 }}>⊞ grid</span>
            <span style={{ padding: '4px 10px', border: '1px solid #e0e0e0', borderRadius: 999 }}>☰ lista</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 12 }}>
          {PR.slice(0, 24).map(p => (
            <article key={p.title}>
              <Poster p={p} size="sm" />
              <CardMeta p={p} dense />
            </article>
          ))}
        </div>
        <div style={{ marginTop: 28, padding: '14px 0', borderTop: '1px solid #e5e5e5', display: 'flex', justifyContent: 'center', gap: 4, alignItems: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
          {['‹', '1', '2', '3', '4', '...', '45', '›'].map((n, i) => (
            <span key={i} style={{
              padding: '7px 11px', borderRadius: 4,
              background: n === '1' ? 'var(--ha-accent, #ee2244)' : '#fff',
              color: n === '1' ? '#fff' : '#444',
              border: n === '1' ? 'none' : '1px solid #e0e0e0',
              fontWeight: 600,
            }}>{n}</span>
          ))}
        </div>
      </section>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// DIRECTION B — Editorial: por época, por plataforma, por gênero
// ─────────────────────────────────────────────────────────────────
window.ProductionsB = function ProductionsB() {
  const kdramas = PR.filter(p => p.type === 'K-Drama');
  const films = PR.filter(p => p.type === 'Filme' || p.type === 'Animação');
  const variety = PR.filter(p => p.type === 'Variety' || p.type === 'Reality' || p.type === 'Concert');

  return (
    <div style={{ background: '#fff', minHeight: '100%', fontFamily: '"Schibsted Grotesk", system-ui, sans-serif' }}>
      <ProdNav />

      {/* Header */}
      <section style={{ padding: '44px 40px 36px' }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--ha-accent, #ee2244)', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 700 }}>● Edição · maio 2026</div>
        <h1 style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: 84, fontWeight: 400, letterSpacing: -3, lineHeight: 0.95, margin: '12px 0 0', textWrap: 'balance' }}>
          O catálogo <span style={{ fontStyle: 'italic', color: 'var(--ha-accent, #ee2244)' }}>vivo</span> da onda coreana.
        </h1>
        <p style={{ fontSize: 17, color: '#444', lineHeight: 1.55, margin: '20px 0 0', maxWidth: 640, textWrap: 'pretty' }}>
          {PS.total.toLocaleString('pt-BR')} dramas, filmes, variety, reality e concert films — todos com sinopse em pt-BR, hangul, elenco e onde assistir.
        </p>
      </section>

      {/* Stats strip */}
      <section style={{ padding: '0 40px 36px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 0, border: '1px solid #0a0a0a' }}>
          {Object.entries(PS.byType).map(([k, v], i) => (
            <div key={k} style={{ padding: '18px 18px', borderRight: i < 5 ? '1px solid #e5e5e5' : 'none' }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 0.6 }}>{k}</div>
              <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: -1, lineHeight: 1, marginTop: 4 }}>{v.toLocaleString('pt-BR')}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Section: K-Dramas */}
      <section style={{ padding: '32px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 10, borderBottom: '1px solid #0a0a0a' }}>
          <div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#999', letterSpacing: 0.6, textTransform: 'uppercase' }}>01 · K-Drama</div>
            <h2 style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: 38, fontWeight: 500, letterSpacing: -1.2, margin: '4px 0 0' }}>1.245 dramas para maratonar</h2>
          </div>
          <span style={{ padding: '8px 18px', border: '1px solid #0a0a0a', borderRadius: 999, fontWeight: 600, fontSize: 13 }}>Ver tudo →</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14 }}>
          {kdramas.slice(0, 6).map(p => (
            <article key={p.title}>
              <Poster p={p} />
              <CardMeta p={p} />
            </article>
          ))}
        </div>
      </section>

      {/* Section: Films */}
      <section style={{ padding: '32px 40px', background: '#fafafa', borderTop: '1px solid #e8e8e8', borderBottom: '1px solid #e8e8e8' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 10, borderBottom: '1px solid #0a0a0a' }}>
          <div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#999', letterSpacing: 0.6, textTransform: 'uppercase' }}>02 · Cinema coreano</div>
            <h2 style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: 38, fontWeight: 500, letterSpacing: -1.2, margin: '4px 0 0' }}>436 filmes — do Bong ao mainstream</h2>
          </div>
          <span style={{ padding: '8px 18px', border: '1px solid #0a0a0a', borderRadius: 999, fontWeight: 600, fontSize: 13 }}>Ver tudo →</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14 }}>
          {films.map(p => (
            <article key={p.title}>
              <Poster p={p} />
              <CardMeta p={p} />
            </article>
          ))}
        </div>
      </section>

      {/* Section: Variety / Reality / Concert */}
      <section style={{ padding: '32px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 10, borderBottom: '1px solid #0a0a0a' }}>
          <div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#999', letterSpacing: 0.6, textTransform: 'uppercase' }}>03 · Variety, Reality & Concert</div>
            <h2 style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: 38, fontWeight: 500, letterSpacing: -1.2, margin: '4px 0 0' }}>467 produções de entretenimento</h2>
          </div>
          <span style={{ padding: '8px 18px', border: '1px solid #0a0a0a', borderRadius: 999, fontWeight: 600, fontSize: 13 }}>Ver tudo →</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14 }}>
          {variety.slice(0, 6).map(p => (
            <article key={p.title}>
              <Poster p={p} />
              <CardMeta p={p} />
            </article>
          ))}
        </div>
      </section>

      {/* By network */}
      <section style={{ padding: '40px 40px', background: '#0a0a0a', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: 32, fontWeight: 500, letterSpacing: -1, margin: 0 }}>
            Por <span style={{ fontStyle: 'italic', color: 'var(--ha-accent, #ee2244)' }}>plataforma</span>
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {PS.byNetwork.map(n => (
            <div key={n.name} style={{ padding: '18px 22px', border: '1px solid #1c1c1c', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: 22, fontWeight: 500, fontStyle: 'italic' }}>{n.name}</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#888', marginTop: 4 }}>{n.count} obras</div>
              </div>
              <span style={{ fontSize: 18, color: 'var(--ha-accent, #ee2244)' }}>→</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// DIRECTION C — Database / table view (IMDB-like)
// ─────────────────────────────────────────────────────────────────
window.ProductionsC = function ProductionsC() {
  return (
    <div style={{ background: '#fff', minHeight: '100%', fontFamily: '"Schibsted Grotesk", system-ui, sans-serif' }}>
      <ProdNav />

      <section style={{ padding: '36px 40px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: 0.6 }}>Base de dados · {PS.total.toLocaleString('pt-BR')} registros</div>
            <h1 style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: 60, fontWeight: 500, letterSpacing: -2, lineHeight: 1, margin: '6px 0 0' }}>
              Filtre. <span style={{ fontStyle: 'italic', color: 'var(--ha-accent, #ee2244)' }}>Ordene.</span> Encontre.
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ padding: '10px 14px', border: '1px solid #e0e0e0', borderRadius: 4, fontSize: 13, color: '#888', minWidth: 280, fontFamily: 'JetBrains Mono, monospace' }}>⌕ filtro avançado…</span>
            <span style={{ padding: '10px 14px', background: '#0a0a0a', color: '#fff', borderRadius: 4, fontSize: 13, fontWeight: 600 }}>↧ Exportar CSV</span>
          </div>
        </div>
      </section>

      {/* Faceted filter rail + table */}
      <section style={{ padding: '0 40px 40px', display: 'grid', gridTemplateColumns: '240px 1fr', gap: 28 }}>
        <aside style={{ borderRight: '1px solid #e8e8e8', paddingRight: 28 }}>
          {[
            { label: 'Tipo', items: [['K-Drama', 1245], ['Filme', 412], ['Variety', 287], ['Reality', 124], ['Concert', 56], ['Animação', 24]] },
            { label: 'Ano', items: [['2026', 89], ['2025', 142], ['2024', 167], ['2023', 198], ['2022', 184], ['2021', 175]] },
            { label: 'Avaliação', items: [['★ 9+', 142], ['★ 8+', 487], ['★ 7+', 1024], ['★ 6+', 1832], ['★ 5+', 2089]] },
            { label: 'Plataforma', items: PS.byNetwork.slice(0, 6).map(n => [n.name, n.count]) },
          ].map(group => (
            <div key={group.label} style={{ marginBottom: 22 }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #e8e8e8' }}>{group.label}</div>
              {group.items.map(([k, c], i) => (
                <label key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, color: '#333', cursor: 'pointer' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 14, height: 14, border: '1.5px solid #d0d0d0', borderRadius: 3, background: i === 0 ? '#0a0a0a' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10 }}>{i === 0 ? '✓' : ''}</span>
                    {k}
                  </span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#999' }}>{c.toLocaleString('pt-BR')}</span>
                </label>
              ))}
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--ha-accent, #ee2244)', marginTop: 4, fontWeight: 600 }}>+ mostrar mais</div>
            </div>
          ))}
        </aside>

        {/* Table */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 6, fontSize: 11 }}>
              {['Tipo: K-Drama ×', 'Em atividade ×', '★ 7+ ×', '× limpar tudo'].map((t, i) => (
                <span key={t} style={{ padding: '4px 10px', borderRadius: 999, background: i === 3 ? 'transparent' : '#fff8e8', color: i === 3 ? '#999' : '#5a4a2a', border: i === 3 ? 'none' : '1px solid #e8d59a', fontFamily: 'JetBrains Mono, monospace' }}>{t}</span>
              ))}
            </div>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#888' }}>1.024 resultados</span>
          </div>

          <div style={{ borderTop: '1px solid #0a0a0a' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '54px 2.4fr 0.7fr 0.7fr 1.2fr 1fr 0.7fr',
              padding: '10px 0', borderBottom: '1px solid #0a0a0a',
              fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#999',
              textTransform: 'uppercase', letterSpacing: 0.7, fontWeight: 700, gap: 12,
            }}>
              <span></span><span>Título ↕</span><span>Ano ↑</span><span>Tipo</span><span>Plataforma</span><span>Avaliação ↓</span><span style={{ textAlign: 'right' }}>Ações</span>
            </div>
            {PR.slice(0, 16).map(p => (
              <div key={p.title} style={{
                display: 'grid', gridTemplateColumns: '54px 2.4fr 0.7fr 0.7fr 1.2fr 1fr 0.7fr',
                padding: '10px 0', borderBottom: '1px solid #f0f0f0',
                alignItems: 'center', gap: 12, fontSize: 13,
              }}>
                <div style={{ width: 38, height: 54 }}>
                  <Poster p={p} size="sm" />
                </div>
                <div>
                  <div style={{ fontWeight: 600, lineHeight: 1.25 }}>
                    {p.title}
                    {p.top && <span style={{ marginLeft: 8, padding: '1px 5px', background: 'var(--ha-accent, #ee2244)', color: '#fff', fontFamily: 'JetBrains Mono, monospace', fontSize: 9, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', verticalAlign: 'middle' }}>top</span>}
                  </div>
                  <div style={{ fontFamily: '"Noto Sans KR", sans-serif', fontSize: 11, color: '#888', marginTop: 2 }}>{p.hangul} · {p.episodes ? `${p.episodes} ep` : p.dur}</div>
                </div>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>{p.year}</span>
                <span style={{ fontSize: 12, color: '#444' }}>{p.type}</span>
                <span style={{ fontSize: 12, color: '#444' }}>{p.network}</span>
                <span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 80, height: 5, background: '#f0f0f0', borderRadius: 3, position: 'relative', overflow: 'hidden' }}>
                      <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(p.rating / 10) * 100}%`, background: p.rating >= 8.5 ? 'var(--ha-accent, #ee2244)' : '#0a0a0a' }} />
                    </span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700 }}>{p.rating.toFixed(1)}</span>
                  </span>
                </span>
                <div style={{ textAlign: 'right', display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                  <span style={{ padding: '4px 8px', border: '1px solid #e0e0e0', borderRadius: 4, fontSize: 11 }}>+ lista</span>
                  <span style={{ padding: '4px 8px', border: '1px solid #e0e0e0', borderRadius: 4, fontSize: 11 }}>→</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20, padding: '14px 0', borderTop: '1px solid #e5e5e5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#666' }}>
            <span>1 — 16 de 1.024 · mostrar por página: <b>16</b> 32 64</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {['‹', '1', '2', '3', '...', '64', '›'].map(n => (
                <span key={n} style={{ padding: '6px 10px', borderRadius: 4, background: n === '1' ? 'var(--ha-accent, #ee2244)' : '#fff', color: n === '1' ? '#fff' : '#444', border: n === '1' ? 'none' : '1px solid #e0e0e0', fontWeight: 600 }}>{n}</span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
