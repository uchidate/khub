// Three directions for the /artists directory page.

const ART = window.ARTISTS;
const LC = window.LETTER_COUNTS;
const AG = window.AGENCIES_TOP;

const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

// Shared bits
function ArtistsNav() {
  return (
    <div style={{ padding: '14px 40px', borderBottom: '1px solid #e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <div style={{ fontWeight: 800, letterSpacing: -0.6, fontSize: 22 }}>HallyuHub<span style={{ color: 'var(--ha-accent, #ee2244)' }}>.</span></div>
        <nav style={{ display: 'flex', gap: 22, color: '#444', fontWeight: 500 }}>
          <span>Início</span><span style={{ color: '#0a0a0a', fontWeight: 700, borderBottom: '2px solid var(--ha-accent, #ee2244)', paddingBottom: 4 }}>Artistas</span>
          <span>K-Drama</span><span>K-Pop</span><span>Cinema</span><span>Cultura</span>
        </nav>
      </div>
      <span style={{ padding: '7px 14px', border: '1px solid #e0e0e0', borderRadius: 999, fontSize: 12, color: '#444', fontFamily: 'JetBrains Mono, monospace' }}>⌘K buscar</span>
    </div>
  );
}

function PortraitTile({ a, size = 'md' }) {
  const seed = a.name.charCodeAt(0) + a.name.charCodeAt(a.name.length - 1);
  const h1 = (seed * 7) % 360;
  const h2 = (seed * 17 + 60) % 360;
  return (
    <div style={{
      aspectRatio: '4/5',
      background: `linear-gradient(135deg, hsl(${h1} 40% ${size === 'lg' ? 28 : 35}%), hsl(${h2} 45% ${size === 'lg' ? 18 : 24}%))`,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: '"Noto Sans KR", sans-serif', fontWeight: 800,
        fontSize: size === 'lg' ? 120 : size === 'md' ? 72 : 40,
        color: 'rgba(255,255,255,0.15)', letterSpacing: -3, lineHeight: 0.9,
      }}>{a.hangul.slice(0, 2)}</div>
      {a.top && (
        <span style={{
          position: 'absolute', top: 8, left: 8,
          padding: '2px 6px', background: 'var(--ha-accent, #ee2244)', color: '#fff',
          fontFamily: 'JetBrains Mono, monospace', fontSize: 9, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
        }}>● top</span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// DIRECTION A — Diretório enciclopédico (A-Z, filtros, grid denso)
// ─────────────────────────────────────────────────────────────────
window.ArtistsA = function ArtistsA() {
  return (
    <div style={{ background: '#fff', minHeight: '100%', fontFamily: '"Schibsted Grotesk", system-ui, sans-serif' }}>
      <ArtistsNav />

      {/* Header */}
      <section style={{ padding: '36px 40px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: 0.6 }}>Diretório · 1.247 artistas</div>
            <h1 style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: 72, fontWeight: 500, letterSpacing: -2.6, lineHeight: 1, margin: '8px 0 0', textWrap: 'balance' }}>
              Todos os <span style={{ fontStyle: 'italic', color: 'var(--ha-accent, #ee2244)' }}>artistas</span> que cobrimos.
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ padding: '10px 14px', border: '1px solid #e0e0e0', borderRadius: 4, fontSize: 13, color: '#888', minWidth: 280, fontFamily: 'JetBrains Mono, monospace' }}>⌕ buscar nome, hangul ou grupo…</span>
            <span style={{ padding: '10px 14px', background: '#0a0a0a', color: '#fff', borderRadius: 4, fontSize: 13, fontWeight: 600 }}>+ Adicionar artista</span>
          </div>
        </div>
      </section>

      {/* Sticky toolbar — filters */}
      <section style={{ padding: '14px 40px', background: '#fafafa', borderTop: '1px solid #e8e8e8', borderBottom: '1px solid #e8e8e8', position: 'sticky', top: 0, zIndex: 5, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        {[
          ['Tipo', ['Todos', 'Idol', 'Ator', 'Atriz', 'Solista', 'Produtor']],
          ['Gênero', ['Todos', 'F', 'M']],
          ['Geração', ['1ª', '2ª', '3ª', '4ª', '5ª']],
          ['Status', ['Em atividade', 'Hiato', 'Encerrada']],
        ].map(([k, opts], i) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#888', letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: 700 }}>{k}</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {opts.map((o, j) => (
                <span key={o} style={{
                  padding: '5px 10px', borderRadius: 999, fontSize: 12,
                  background: (i === 0 && j === 0) || (i === 3 && j === 0) ? '#0a0a0a' : '#fff',
                  color: (i === 0 && j === 0) || (i === 3 && j === 0) ? '#fff' : '#444',
                  border: '1px solid #e0e0e0', fontWeight: 500,
                }}>{o}</span>
              ))}
            </div>
          </div>
        ))}
        <span style={{ marginLeft: 'auto', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#666' }}>↕ A-Z</span>
      </section>

      {/* Alphabet bar */}
      <section style={{ padding: '24px 40px 14px', borderBottom: '1px solid #0a0a0a' }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {ALPHA.map((L, i) => (
            <a key={L} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '8px 10px', minWidth: 36,
              background: L === 'K' ? 'var(--ha-accent, #ee2244)' : 'transparent',
              color: L === 'K' ? '#fff' : (LC[L] < 5 ? '#bbb' : '#0a0a0a'),
              borderRadius: 4, fontFamily: 'JetBrains Mono, monospace',
              cursor: LC[L] < 5 ? 'default' : 'pointer',
            }}>
              <span style={{ fontSize: 18, fontWeight: 700 }}>{L}</span>
              <span style={{ fontSize: 9, opacity: 0.7, marginTop: 2 }}>{LC[L] || 0}</span>
            </a>
          ))}
        </div>
      </section>

      {/* Letter section — K */}
      <section style={{ padding: '36px 40px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 24, marginBottom: 22 }}>
          <span style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: 96, fontWeight: 400, color: 'var(--ha-accent, #ee2244)', lineHeight: 0.8, letterSpacing: -3, fontStyle: 'italic' }}>K</span>
          <div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#999', letterSpacing: 0.6, textTransform: 'uppercase' }}>168 artistas começando com K</div>
            <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.6, margin: '4px 0 0' }}>Karina · Kim Soo-hyun · KARD · Key · Kun…</h2>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14 }}>
          {ART.filter(a => a.name.startsWith('K')).slice(0, 12).map((a, i) => (
            <article key={a.name} style={{ display: 'flex', flexDirection: 'column' }}>
              <PortraitTile a={a} />
              <div style={{ padding: '10px 0 14px', borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{a.name}</span>
                  <span style={{ fontFamily: '"Noto Sans KR", sans-serif', fontSize: 11, color: '#888' }}>{a.hangul}</span>
                </div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#888', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.4 }}>{a.type}{a.group !== '—' ? ` · ${a.group}` : ''}</div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Letter section — J */}
      <section style={{ padding: '12px 40px 36px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 24, marginBottom: 22 }}>
          <span style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: 96, fontWeight: 400, color: '#0a0a0a', lineHeight: 0.8, letterSpacing: -3, fontStyle: 'italic' }}>J</span>
          <div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#999', letterSpacing: 0.6, textTransform: 'uppercase' }}>142 artistas começando com J</div>
            <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.6, margin: '4px 0 0' }}>Jennie · Jisoo · Jin · Jungkook · Jung Hae-in…</h2>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14 }}>
          {ART.filter(a => a.name.startsWith('J')).slice(0, 6).map(a => (
            <article key={a.name}>
              <PortraitTile a={a} />
              <div style={{ padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{a.name}</span>
                  <span style={{ fontFamily: '"Noto Sans KR", sans-serif', fontSize: 11, color: '#888' }}>{a.hangul}</span>
                </div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#888', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.4 }}>{a.type}{a.group !== '—' ? ` · ${a.group}` : ''}</div>
              </div>
            </article>
          ))}
        </div>
        <div style={{ marginTop: 18, textAlign: 'center' }}>
          <span style={{ padding: '10px 22px', border: '1px solid #0a0a0a', borderRadius: 999, fontWeight: 600, fontSize: 13 }}>Ver mais 136 artistas com J →</span>
        </div>
      </section>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// DIRECTION B — Editorial curado + lista
// ─────────────────────────────────────────────────────────────────
window.ArtistsB = function ArtistsB() {
  const topMonth = ART.filter(a => a.top).slice(0, 4);
  const rookies = ART.filter(a => a.debut >= 2020 && !a.top).slice(0, 6);
  const legends = ART.filter(a => a.debut < 2010 && a.active).slice(0, 6);

  return (
    <div style={{ background: '#fff', minHeight: '100%', fontFamily: '"Schibsted Grotesk", system-ui, sans-serif' }}>
      <ArtistsNav />

      {/* Editorial header */}
      <section style={{ padding: '44px 40px 36px', display: 'grid', gridTemplateColumns: '1fr 380px', gap: 56 }}>
        <div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--ha-accent, #ee2244)', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 700 }}>● Edição · maio 2026</div>
          <h1 style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: 88, fontWeight: 400, letterSpacing: -3, lineHeight: 0.95, margin: '12px 0 0', textWrap: 'balance' }}>
            Os <span style={{ fontStyle: 'italic', color: 'var(--ha-accent, #ee2244)' }}>1.247</span> nomes que movem a onda.
          </h1>
          <p style={{ fontSize: 17, color: '#444', lineHeight: 1.55, margin: '20px 0 0', maxWidth: 580, textWrap: 'pretty' }}>
            Atores, atrizes, idols, solistas e produtores. De Yoo Ah-in a Hanni. Do debut em 1980 a 2026. Atualizamos toda semana.
          </p>
        </div>
        <div style={{ padding: 20, border: '1px solid #0a0a0a', display: 'flex', flexDirection: 'column', gap: 14, alignSelf: 'flex-end' }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: 0.8 }}>Filtre rapidamente</div>
          <span style={{ padding: '12px 14px', border: '1px solid #e0e0e0', borderRadius: 4, fontSize: 13, color: '#888' }}>⌕ buscar nome, hangul ou grupo…</span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['Idol', 'Ator', 'Atriz', 'Solista', '+ Filtros'].map((t, i) => (
              <span key={t} style={{ padding: '5px 10px', borderRadius: 999, fontSize: 12, background: i === 4 ? '#0a0a0a' : '#fafafa', color: i === 4 ? '#fff' : '#444', border: '1px solid #e0e0e0', fontWeight: 500 }}>{t}</span>
            ))}
          </div>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--ha-accent, #ee2244)', fontWeight: 600 }}>ou navegue de A a Z →</span>
        </div>
      </section>

      {/* Curated row 1 — TOP do mês */}
      <section style={{ padding: '40px 40px', borderTop: '1px solid #0a0a0a' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 22, paddingBottom: 10, borderBottom: '1px solid #e8e8e8' }}>
          <div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#999', letterSpacing: 0.6, textTransform: 'uppercase' }}>Capa · maio 2026</div>
            <h2 style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: 36, fontWeight: 500, letterSpacing: -1.2, margin: '4px 0 0' }}>Os artistas do <span style={{ fontStyle: 'italic' }}>momento</span></h2>
          </div>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#888' }}>indicação da redação · 4 nomes</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
          {topMonth.map((a, i) => (
            <article key={a.name}>
              <PortraitTile a={a} size="md" />
              <div style={{ padding: '14px 0 0' }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--ha-accent, #ee2244)', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 700 }}>#{String(i + 1).padStart(2, '0')} · em alta</div>
                <h3 style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: 28, fontWeight: 500, letterSpacing: -0.7, lineHeight: 1.05, margin: '6px 0 4px' }}>{a.name}</h3>
                <div style={{ fontFamily: '"Noto Sans KR", sans-serif', fontSize: 13, color: '#999' }}>{a.hangul}</div>
                <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>{a.type}{a.group !== '—' ? ` · ${a.group}` : ''}</div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Curated row 2 — Rookies */}
      <section style={{ padding: '40px 40px', background: '#fafafa', borderTop: '1px solid #e8e8e8', borderBottom: '1px solid #e8e8e8' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: 30, fontWeight: 500, letterSpacing: -1, margin: 0 }}>
            Rookies <span style={{ fontStyle: 'italic', color: 'var(--ha-accent, #ee2244)' }}>2020+</span>
          </h2>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#888' }}>recém-estreados · 124 no total</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
          {rookies.map(a => (
            <article key={a.name}>
              <PortraitTile a={a} />
              <div style={{ padding: '10px 0' }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{a.name}</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#888', marginTop: 2 }}>est. {a.debut} · {a.type}</div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Curated row 3 — Legends */}
      <section style={{ padding: '40px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: 30, fontWeight: 500, letterSpacing: -1, margin: 0 }}>
            <span style={{ fontStyle: 'italic' }}>Lendas</span> · debut antes de 2010
          </h2>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#888' }}>ainda em atividade · 287 no total</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
          {legends.map(a => (
            <article key={a.name}>
              <PortraitTile a={a} />
              <div style={{ padding: '10px 0' }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{a.name}</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#888', marginTop: 2 }}>est. {a.debut} · {a.type}</div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* By agency */}
      <section style={{ padding: '40px 40px', background: '#0a0a0a', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: 30, fontWeight: 500, letterSpacing: -1, margin: 0 }}>
            Navegar por <span style={{ fontStyle: 'italic', color: 'var(--ha-accent, #ee2244)' }}>agência</span>
          </h2>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#666' }}>8 maiores · ver todas →</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {AG.map(ag => (
            <div key={ag.name} style={{
              padding: '20px 22px', border: '1px solid #1c1c1c',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: 24, fontWeight: 500, fontStyle: 'italic' }}>{ag.name}</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#888', marginTop: 4 }}>{ag.count} artistas</div>
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
// DIRECTION C — Wall + sticky toolbar (Letterboxd-like)
// ─────────────────────────────────────────────────────────────────
window.ArtistsC = function ArtistsC() {
  return (
    <div style={{ background: '#fff', minHeight: '100%', fontFamily: '"Schibsted Grotesk", system-ui, sans-serif' }}>
      <ArtistsNav />

      {/* Toolbar sticky */}
      <section style={{ padding: '20px 40px', background: '#fff', borderBottom: '1px solid #0a0a0a', position: 'sticky', top: 0, zIndex: 5 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#999', letterSpacing: 0.6, textTransform: 'uppercase' }}>Artistas</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontFamily: 'Newsreader, Georgia, serif', fontStyle: 'italic', fontSize: 36, fontWeight: 400, letterSpacing: -1 }}>1.247</span>
              <span style={{ fontSize: 13, color: '#888' }}>resultados</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginLeft: 24 }}>
            {['Tudo', 'Idols', 'Atores', 'Atrizes', 'Solistas', 'Produtores'].map((t, i) => (
              <span key={t} style={{
                padding: '7px 14px', borderRadius: 999, fontSize: 13,
                background: i === 0 ? '#0a0a0a' : '#fff',
                color: i === 0 ? '#fff' : '#444',
                border: '1px solid #d0d0d0', fontWeight: i === 0 ? 600 : 500,
              }}>{t}</span>
            ))}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ padding: '8px 14px', border: '1px solid #e0e0e0', borderRadius: 4, fontSize: 12, color: '#888', minWidth: 240, fontFamily: 'JetBrains Mono, monospace' }}>⌕ buscar 1.247 artistas…</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#444', padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: 4 }}>↕ popularidade ▾</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#444', padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: 4 }}>⊞ grid · ☰ lista</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 700, marginRight: 4 }}>Filtros ativos:</span>
          {['Gen 3ª', 'Em atividade', 'Idol', '× limpar'].map((t, i) => (
            <span key={t} style={{
              padding: '4px 10px', borderRadius: 999, fontSize: 11,
              background: i === 3 ? 'transparent' : '#fff8e8',
              color: i === 3 ? '#999' : '#5a4a2a',
              border: i === 3 ? 'none' : '1px solid #e8d59a',
              cursor: 'pointer',
            }}>{t}</span>
          ))}
        </div>
      </section>

      {/* Mega wall */}
      <section style={{ padding: '24px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 10 }}>
          {ART.slice(0, 48).map(a => (
            <article key={a.name} style={{ position: 'relative', cursor: 'pointer' }}>
              <PortraitTile a={a} size="sm" />
              <div style={{ padding: '8px 2px 0' }}>
                <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.name}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 2 }}>
                  <span style={{ fontFamily: '"Noto Sans KR", sans-serif', fontSize: 10, color: '#999' }}>{a.hangul}</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#bbb' }}>{a.type.slice(0, 4)}</span>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div style={{ marginTop: 32, padding: '16px 0', borderTop: '1px solid #e5e5e5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#666' }}>mostrando 1 — 48 de 1.247</span>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
            {['‹', '1', '2', '3', '4', '...', '26', '›'].map((p, i) => (
              <span key={i} style={{
                padding: '7px 11px', borderRadius: 4,
                background: p === '1' ? 'var(--ha-accent, #ee2244)' : '#fff',
                color: p === '1' ? '#fff' : '#444',
                border: p === '1' ? 'none' : '1px solid #e0e0e0',
                fontWeight: 600,
              }}>{p}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Quick jump A-Z floating */}
      <section style={{ padding: '24px 40px 40px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ display: 'flex', gap: 2, background: '#fafafa', padding: '8px 12px', borderRadius: 999, border: '1px solid #e5e5e5' }}>
          {ALPHA.map(L => (
            <span key={L} style={{
              padding: '6px 8px', minWidth: 26, textAlign: 'center',
              fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 600,
              color: LC[L] < 5 ? '#ccc' : '#444', cursor: LC[L] < 5 ? 'default' : 'pointer',
            }}>{L}</span>
          ))}
        </div>
      </section>
    </div>
  );
};
