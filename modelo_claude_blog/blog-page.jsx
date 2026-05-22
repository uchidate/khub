// Three directions for /blog.

const BP = window.POSTS;
const BS = window.BLOG_STATS;

function BlogNav() {
  return (
    <div style={{ padding: '14px 40px', borderBottom: '1px solid #e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <div style={{ fontWeight: 800, letterSpacing: -0.6, fontSize: 22 }}>HallyuHub<span style={{ color: 'var(--ha-accent, #ee2244)' }}>.</span></div>
        <nav style={{ display: 'flex', gap: 22, color: '#444', fontWeight: 500 }}>
          <span>Início</span><span>Artistas</span><span>Produções</span>
          <span style={{ color: '#0a0a0a', fontWeight: 700, borderBottom: '2px solid var(--ha-accent, #ee2244)', paddingBottom: 4 }}>Blog</span>
          <span>Cultura</span>
        </nav>
      </div>
      <span style={{ padding: '7px 14px', border: '1px solid #e0e0e0', borderRadius: 999, fontSize: 12, color: '#444', fontFamily: 'JetBrains Mono, monospace' }}>⌘K buscar</span>
    </div>
  );
}

function CoverThumb({ p, ratio = '4/3' }) {
  const seed = p.title.charCodeAt(0) + (p.title.length * 7);
  const h1 = (seed * 7) % 360, h2 = (seed * 17 + 60) % 360;
  return (
    <div style={{
      aspectRatio: ratio,
      background: `linear-gradient(135deg, hsl(${h1} 45% 30%), hsl(${h2} 50% 18%))`,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 10, left: 10, padding: '3px 8px', background: 'rgba(0,0,0,0.7)', color: '#fff', fontFamily: 'JetBrains Mono, monospace', fontSize: 9, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>{p.cat}</div>
      {p.hot && (
        <div style={{ position: 'absolute', top: 10, right: 10, padding: '3px 8px', background: 'var(--ha-accent, #ee2244)', color: '#fff', fontFamily: 'JetBrains Mono, monospace', fontSize: 9, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>● hot</div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// DIRECTION A — Por tema (sections by category)
// ─────────────────────────────────────────────────────────────────
window.BlogA = function BlogA() {
  return (
    <div style={{ background: '#fff', minHeight: '100%', fontFamily: '"Schibsted Grotesk", system-ui, sans-serif' }}>
      <BlogNav />

      <section style={{ padding: '40px 40px 32px' }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: 0.6 }}>O blog · {BS.total.toLocaleString('pt-BR')} matérias</div>
        <h1 style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: 80, fontWeight: 400, letterSpacing: -3, lineHeight: 0.95, margin: '8px 0 0', textWrap: 'balance' }}>
          A onda coreana, <span style={{ fontStyle: 'italic', color: 'var(--ha-accent, #ee2244)' }}>tema por tema.</span>
        </h1>
      </section>

      {/* Category nav strip */}
      <section style={{ padding: '0 40px 32px' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {BS.categories.map((c, i) => (
            <span key={c.name} style={{
              padding: '8px 16px', borderRadius: 999,
              border: '1px solid #0a0a0a',
              background: i === 0 ? '#0a0a0a' : '#fff',
              color: i === 0 ? '#fff' : '#0a0a0a',
              fontSize: 13, fontWeight: 600,
              display: 'flex', gap: 8, alignItems: 'center',
            }}>
              {c.name}
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, opacity: 0.6 }}>{c.count}</span>
            </span>
          ))}
        </div>
      </section>

      {/* Category sections */}
      {BS.categories.slice(0, 4).map((cat, ci) => {
        const posts = BP.filter(p => p.cat === cat.name);
        if (!posts.length) return null;
        return (
          <section key={cat.name} style={{
            padding: '40px 40px',
            background: ci % 2 === 1 ? '#fafafa' : '#fff',
            borderTop: '1px solid #e8e8e8',
            borderBottom: ci === 3 ? '1px solid #e8e8e8' : 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 22, paddingBottom: 10, borderBottom: '1px solid #0a0a0a' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
                <span style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: 60, fontWeight: 400, lineHeight: 0.85, color: 'var(--ha-accent, #ee2244)', fontStyle: 'italic', letterSpacing: -2 }}>{String(ci + 1).padStart(2, '0')}</span>
                <div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#999', letterSpacing: 0.6, textTransform: 'uppercase' }}>{cat.count} matérias publicadas</div>
                  <h2 style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: 42, fontWeight: 500, letterSpacing: -1.4, margin: '4px 0 0' }}>{cat.name}</h2>
                </div>
              </div>
              <span style={{ padding: '8px 18px', border: '1px solid #0a0a0a', borderRadius: 999, fontWeight: 600, fontSize: 13 }}>Ver tudo →</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: posts.length >= 4 ? '2fr 1fr 1fr 1fr' : '1fr 1fr 1fr', gap: 18 }}>
              {posts.slice(0, 4).map((p, i) => (
                <article key={p.title} style={{ display: 'flex', flexDirection: 'column' }}>
                  <CoverThumb p={p} ratio={i === 0 ? '4/3' : '4/3'} />
                  <div style={{ padding: '12px 0' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--ha-accent, #ee2244)', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 700 }}>{p.format}</span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#bbb' }}>·</span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#888' }}>{p.read}</span>
                    </div>
                    <h3 style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: i === 0 ? 24 : 18, fontWeight: 500, letterSpacing: -0.5, lineHeight: 1.15, margin: '0 0 6px', textWrap: 'balance' }}>{p.title}</h3>
                    {i === 0 && <p style={{ fontSize: 13, color: '#555', lineHeight: 1.5, margin: '0 0 8px', textWrap: 'pretty' }}>{p.dek}</p>}
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#999' }}>{p.author} · {p.date}</div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// DIRECTION B — Tudo junto (feed cronológico unificado)
// ─────────────────────────────────────────────────────────────────
window.BlogB = function BlogB() {
  const sorted = [...BP]; // assume already in feel-good order
  return (
    <div style={{ background: '#fff', minHeight: '100%', fontFamily: '"Schibsted Grotesk", system-ui, sans-serif' }}>
      <BlogNav />

      <section style={{ padding: '40px 40px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: 0.6 }}>Blog · feed unificado</div>
            <h1 style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: 80, fontWeight: 400, letterSpacing: -3, lineHeight: 0.95, margin: '8px 0 0', textWrap: 'balance' }}>
              Tudo, em <span style={{ fontStyle: 'italic', color: 'var(--ha-accent, #ee2244)' }}>ordem.</span>
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ padding: '10px 14px', border: '1px solid #e0e0e0', borderRadius: 4, fontSize: 13, color: '#888', minWidth: 260, fontFamily: 'JetBrains Mono, monospace' }}>⌕ buscar matérias…</span>
          </div>
        </div>
      </section>

      {/* Filter chips — secondary */}
      <section style={{ padding: '0 40px 24px', display: 'flex', gap: 24, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <span style={{ padding: '6px 12px', borderRadius: 999, background: '#0a0a0a', color: '#fff', fontSize: 12, fontWeight: 600 }}>Tudo</span>
          {BS.categories.slice(0, 6).map(c => (
            <span key={c.name} style={{ padding: '6px 12px', borderRadius: 999, border: '1px solid #e0e0e0', fontSize: 12, color: '#444' }}>{c.name}</span>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {BS.formats.map(f => (
            <span key={f.name} style={{ padding: '6px 10px', borderRadius: 999, border: '1px solid #e8d59a', background: '#fff8e8', color: '#5a4a2a', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
              {f.name} <span style={{ opacity: 0.5 }}>{f.count}</span>
            </span>
          ))}
        </div>
      </section>

      {/* Hero featured row */}
      <section style={{ padding: '24px 40px 0', display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: 18, borderBottom: '1px solid #e8e8e8', paddingBottom: 36 }}>
        {BP.filter(p => p.featured).slice(0, 3).map((p, i) => (
          <article key={p.title}>
            <CoverThumb p={p} ratio={i === 0 ? '16/9' : '4/3'} />
            <div style={{ paddingTop: 14 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                <span style={{ padding: '3px 8px', background: 'var(--ha-accent, #ee2244)', color: '#fff', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700, letterSpacing: 0.6 }}>{p.cat.toUpperCase()}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#888' }}>{p.format} · {p.read}</span>
              </div>
              <h3 style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: i === 0 ? 38 : 22, fontWeight: 500, letterSpacing: -1, lineHeight: 1.05, margin: '0 0 8px', textWrap: 'balance' }}>{p.title}</h3>
              <p style={{ fontSize: i === 0 ? 15 : 13, color: '#555', lineHeight: 1.5, margin: 0, textWrap: 'pretty' }}>{p.dek}</p>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#999', marginTop: 10 }}>{p.author} · {p.date}</div>
            </div>
          </article>
        ))}
      </section>

      {/* Long chronological list — mixed sizes for rhythm */}
      <section style={{ padding: '40px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 22, paddingBottom: 10, borderBottom: '1px solid #0a0a0a' }}>
          <h2 style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: 36, fontWeight: 500, letterSpacing: -1.2, margin: 0 }}>Mais recentes</h2>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#888' }}>RSS · ver feed →</span>
        </div>
        {sorted.slice(0, 12).map((p, i) => (
          <article key={p.title} style={{
            display: 'grid', gridTemplateColumns: '180px 1fr 100px', gap: 24,
            padding: '20px 0', borderBottom: i < 11 ? '1px solid #f0f0f0' : 'none',
            alignItems: 'start',
          }}>
            <div style={{ width: 180 }}>
              <CoverThumb p={p} ratio="4/3" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--ha-accent, #ee2244)', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 700 }}>{p.cat}</span>
                <span style={{ padding: '2px 6px', border: '1px solid #e0e0e0', borderRadius: 3, fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#666', textTransform: 'uppercase', letterSpacing: 0.4 }}>{p.format}</span>
                {p.hot && <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--ha-accent, #ee2244)', fontWeight: 700 }}>● hot</span>}
              </div>
              <h3 style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: 24, fontWeight: 500, letterSpacing: -0.6, lineHeight: 1.1, margin: '0 0 6px', textWrap: 'balance' }}>{p.title}</h3>
              <p style={{ fontSize: 14, color: '#666', lineHeight: 1.5, margin: 0, textWrap: 'pretty' }}>{p.dek}</p>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#999', marginTop: 10 }}>{p.author} · {p.read}</div>
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#888', textAlign: 'right' }}>{p.date}</div>
          </article>
        ))}
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <span style={{ padding: '12px 28px', border: '1px solid #0a0a0a', borderRadius: 999, fontWeight: 600, fontSize: 14 }}>Carregar mais 12 →</span>
        </div>
      </section>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// DIRECTION C — Híbrido: editor's pick + tabs por tema/formato
// ─────────────────────────────────────────────────────────────────
window.BlogC = function BlogC() {
  return (
    <div style={{ background: '#fff', minHeight: '100%', fontFamily: '"Schibsted Grotesk", system-ui, sans-serif' }}>
      <BlogNav />

      {/* Editor's pick hero */}
      <section style={{ padding: '40px 40px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 32, alignItems: 'flex-end', marginBottom: 32 }}>
          <div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--ha-accent, #ee2244)', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 700 }}>● Editor's pick · maio 2026</div>
            <h1 style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: 84, fontWeight: 400, letterSpacing: -3, lineHeight: 0.93, margin: '12px 0 0', textWrap: 'balance' }}>
              O melhor do <span style={{ fontStyle: 'italic', color: 'var(--ha-accent, #ee2244)' }}>HallyuHub</span>, sempre fresco.
            </h1>
            <p style={{ fontSize: 16, color: '#555', lineHeight: 1.5, margin: '20px 0 0', maxWidth: 540, textWrap: 'pretty' }}>
              {BS.total.toLocaleString('pt-BR')} matérias publicadas. Esta página combina o que <b>nossa redação destaca</b> com o feed completo organizado por tema e formato.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0, border: '1px solid #0a0a0a' }}>
            {BS.categories.slice(0, 4).map((c, i) => (
              <div key={c.name} style={{ padding: '14px 16px', borderRight: i % 2 === 0 ? '1px solid #e5e5e5' : 'none', borderBottom: i < 2 ? '1px solid #e5e5e5' : 'none' }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 0.6 }}>{c.name}</div>
                <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -1, lineHeight: 1, marginTop: 4 }}>{c.count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 3 picks */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: 16 }}>
          {BP.filter(p => p.featured).slice(0, 3).map((p, i) => (
            <article key={p.title}>
              <CoverThumb p={p} ratio={i === 0 ? '4/3' : '4/5'} />
              <div style={{ paddingTop: 14 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--ha-accent, #ee2244)', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 700 }}>#{i + 1} · {p.cat}</span>
                </div>
                <h3 style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: i === 0 ? 30 : 20, fontWeight: 500, letterSpacing: -0.7, lineHeight: 1.1, margin: '0 0 6px', textWrap: 'balance' }}>{p.title}</h3>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#888' }}>{p.author} · {p.read}</div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Tabbed browser */}
      <section style={{ padding: '0 40px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #0a0a0a', paddingBottom: 12, marginBottom: 22 }}>
          <div style={{ display: 'flex', gap: 24 }}>
            {[
              ['Mais recentes', true],
              ['Mais lidos da semana', false],
              ['Por tema', false],
              ['Por formato', false],
            ].map(([t, active]) => (
              <span key={t} style={{
                fontSize: 16, fontWeight: 600,
                color: active ? '#0a0a0a' : '#999',
                paddingBottom: 14,
                marginBottom: -12,
                borderBottom: active ? '2px solid var(--ha-accent, #ee2244)' : 'none',
                cursor: 'pointer',
              }}>{t}</span>
            ))}
          </div>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#888' }}>mostrando 24 · paginação no fim</span>
        </div>

        {/* Mixed grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {BP.slice(0, 12).map(p => (
            <article key={p.title} style={{ display: 'flex', flexDirection: 'column' }}>
              <CoverThumb p={p} ratio="4/3" />
              <div style={{ paddingTop: 10 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--ha-accent, #ee2244)', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 700 }}>{p.cat}</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#bbb' }}>{p.format}</span>
                </div>
                <h3 style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: 18, fontWeight: 500, letterSpacing: -0.4, lineHeight: 1.15, margin: '0 0 8px', textWrap: 'balance' }}>{p.title}</h3>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#999' }}>{p.date} · {p.read}</div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* By format strip */}
      <section style={{ padding: '32px 40px', background: '#0a0a0a', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: 28, fontWeight: 500, letterSpacing: -1, margin: 0 }}>Por <span style={{ fontStyle: 'italic', color: 'var(--ha-accent, #ee2244)' }}>formato</span></h2>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#888' }}>filtre por tipo de matéria</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
          {BS.formats.map((f, i) => (
            <div key={f.name} style={{ padding: '20px 18px', border: '1px solid #1c1c1c', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 0.6 }}>{f.name}</div>
              <div style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: 36, fontWeight: 400, fontStyle: 'italic', color: '#fff', lineHeight: 1 }}>{f.count}</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--ha-accent, #ee2244)', fontWeight: 600 }}>ver tudo →</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
