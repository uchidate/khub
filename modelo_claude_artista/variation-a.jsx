// Variation A — "Letterboxd-style fan dossier"
// Dense data, rating bars, filmography table, review cards.
// Density first, ornament second.

const A = window.ARTIST;

const aStyles = {
  root: {
    fontFamily: '"Schibsted Grotesk", system-ui, sans-serif',
    background: 'var(--ha-bg, #ffffff)',
    color: 'var(--ha-fg, #0a0a0a)',
    width: '100%',
    minHeight: '100%',
    fontFeatureSettings: '"ss01", "cv11"',
  },
};

function ANav() {
  return (
    <div style={{
      borderBottom: '1px solid #e8e8e8',
      padding: '14px 40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontSize: 13,
      fontWeight: 500,
      letterSpacing: 0.2,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
        <div style={{ fontWeight: 800, letterSpacing: -0.4, fontSize: 17 }}>
          HallyuHub<span style={{ color: 'var(--ha-accent, #ee2244)' }}>.</span>
        </div>
        <nav style={{ display: 'flex', gap: 22, color: '#444' }}>
          <span>Artistas</span><span>K-Drama</span><span>K-Pop</span><span>Cinema</span><span>Cultura</span>
        </nav>
      </div>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', color: '#666' }}>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>⌘K · buscar</span>
        <span style={{ padding: '6px 12px', border: '1px solid #0a0a0a', borderRadius: 999, color: '#0a0a0a', fontSize: 12 }}>Entrar</span>
      </div>
    </div>
  );
}

function ABreadcrumb() {
  return (
    <div style={{
      padding: '12px 40px',
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 11,
      color: '#888',
      borderBottom: '1px solid #f3f3f3',
      display: 'flex',
      gap: 8,
      alignItems: 'center',
    }}>
      <span>hallyuhub</span><span>/</span><span>artistas</span><span>/</span>
      <span style={{ color: '#0a0a0a' }}>kim-soo-hyun</span>
      <span style={{ marginLeft: 'auto', color: '#bbb' }}>atualizado · 14 mai 2026</span>
    </div>
  );
}

function APortrait() {
  return (
    <div style={{
      aspectRatio: '3/4',
      background: 'repeating-linear-gradient(135deg, #f0f0f0 0 12px, #e8e8e8 12px 24px)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'flex-end', padding: 16,
        fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#999',
      }}>
        portrait · key visual · 3:4
      </div>
      <div style={{
        position: 'absolute', top: 14, left: 14,
        background: '#0a0a0a', color: '#fff',
        padding: '4px 8px', fontSize: 10,
        fontFamily: 'JetBrains Mono, monospace',
        letterSpacing: 0.4,
      }}>{A.hangul}</div>
    </div>
  );
}

function AHero() {
  return (
    <section style={{ padding: '36px 40px 48px', display: 'grid', gridTemplateColumns: '360px 1fr', gap: 40 }}>
      <APortrait />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          {A.tags.map(t => (
            <span key={t} style={{
              fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
              padding: '3px 8px', border: '1px solid #d0d0d0', borderRadius: 999, color: '#444',
            }}>{t}</span>
          ))}
          <span style={{
            fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
            padding: '3px 8px', background: 'var(--ha-accent, #ee2244)', color: '#fff', borderRadius: 999,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>● em alta</span>
        </div>

        <h1 style={{
          fontSize: 88, fontWeight: 800, letterSpacing: -3.2, lineHeight: 0.95,
          margin: 0, textWrap: 'pretty',
        }}>
          {A.name}<span style={{ color: 'var(--ha-accent, #ee2244)' }}>.</span>
        </h1>
        <div style={{
          fontFamily: '"Noto Sans KR", sans-serif',
          fontSize: 22, color: '#888', marginTop: 6, fontWeight: 500,
        }}>{A.hangul} · also known as {A.also.join(', ')}</div>

        <p style={{
          fontSize: 19, lineHeight: 1.45, marginTop: 24, color: '#222',
          maxWidth: 620, textWrap: 'pretty', fontWeight: 400,
        }}>{A.blurb}</p>

        {/* Quick facts strip */}
        <div style={{ marginTop: 'auto', paddingTop: 32, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
          {[
            ['Nascimento', A.born],
            ['Local', A.birthplace],
            ['Altura', A.height],
            ['Agência', A.agency],
            ['Estreia', A.debut],
            ['Anos ativos', `${A.stats.yearsActive}`],
            ['Dramas', `${A.stats.dramas}`],
            ['Filmes', `${A.stats.movies}`],
          ].map(([k, v], i) => (
            <div key={k} style={{
              borderTop: '1px solid #e5e5e5',
              borderRight: i % 4 !== 3 ? '1px solid #e5e5e5' : 'none',
              padding: '12px 14px 10px 0',
            }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: 0.6 }}>{k}</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginTop: 4 }}>{v}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button style={{
            background: '#0a0a0a', color: '#fff', border: 'none',
            padding: '12px 22px', fontSize: 14, fontWeight: 600, borderRadius: 999,
            display: 'flex', gap: 8, alignItems: 'center',
          }}>★ Favoritar artista <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#888' }}>· 142k</span></button>
          <button style={{
            background: '#fff', color: '#0a0a0a', border: '1px solid #0a0a0a',
            padding: '12px 22px', fontSize: 14, fontWeight: 600, borderRadius: 999,
          }}>Adicionar à watchlist</button>
          <button style={{
            background: '#fff', color: '#0a0a0a', border: '1px solid #e5e5e5',
            padding: '12px 14px', fontSize: 14, borderRadius: 999,
          }}>↗ Compartilhar</button>
        </div>
      </div>
    </section>
  );
}

function StatBlock({ label, value, sub }) {
  return (
    <div style={{ padding: '20px 22px', borderRight: '1px solid #e5e5e5', minWidth: 0 }}>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</div>
      <div style={{ fontSize: 42, fontWeight: 700, letterSpacing: -1.5, lineHeight: 1, marginTop: 6 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#999', marginTop: 4, fontFamily: 'JetBrains Mono, monospace' }}>{sub}</div>}
    </div>
  );
}

function AStats() {
  return (
    <section style={{ borderTop: '1px solid #0a0a0a', borderBottom: '1px solid #0a0a0a', display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)' }}>
      <StatBlock label="Avaliação" value={A.stats.rating.toFixed(1)} sub="de 5.0 · 142k votos" />
      <StatBlock label="Seguidores" value={A.stats.followers} sub="+ 4.1k esta semana" />
      <StatBlock label="Daesangs" value={A.stats.daesang} sub="grand prizes" />
      <StatBlock label="Baeksangs" value={A.stats.baeksang} sub="incl. 2024" />
      <StatBlock label="Prêmios" value={A.stats.awards} sub="totais" />
      <div style={{ padding: '20px 22px', minWidth: 0 }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: 0.8 }}>Endossos</div>
        <div style={{ fontSize: 42, fontWeight: 700, letterSpacing: -1.5, lineHeight: 1, marginTop: 6 }}>35</div>
        <div style={{ fontSize: 11, color: '#999', marginTop: 4, fontFamily: 'JetBrains Mono, monospace' }}>contratos simultâneos</div>
      </div>
    </section>
  );
}

function ARatingDist() {
  const dist = [2, 3, 4, 9, 14, 22, 31, 48, 78, 100]; // 0.5..5.0
  return (
    <div style={{ flex: '0 0 320px', borderLeft: '1px solid #e5e5e5', paddingLeft: 28 }}>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>Distribuição de notas</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80 }}>
        {dist.map((d, i) => (
          <div key={i} style={{ flex: 1, height: `${d}%`, background: i >= 7 ? 'var(--ha-accent, #ee2244)' : '#0a0a0a', borderRadius: '2px 2px 0 0' }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#999', marginTop: 8 }}>
        <span>★0.5</span><span>★2.5</span><span>★5.0</span>
      </div>
      <div style={{ marginTop: 18, display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <span style={{ fontSize: 48, fontWeight: 800, letterSpacing: -1.5, lineHeight: 1 }}>4.6</span>
        <span style={{ color: '#666', fontSize: 13 }}>média de 12 produções</span>
      </div>
    </div>
  );
}

function AFilmography() {
  return (
    <section style={{ padding: '56px 40px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#999', letterSpacing: 0.6 }}>01 · FILMOGRAFIA</div>
          <h2 style={{ fontSize: 44, fontWeight: 700, letterSpacing: -1.5, margin: '6px 0 0' }}>Toda a obra, listada</h2>
        </div>
        <div style={{ display: 'flex', gap: 6, fontSize: 12 }}>
          {['Tudo', 'Drama', 'Filme', 'Sitcom'].map((t, i) => (
            <span key={t} style={{
              padding: '6px 12px', border: '1px solid #e0e0e0', borderRadius: 999,
              background: i === 0 ? '#0a0a0a' : '#fff',
              color: i === 0 ? '#fff' : '#444',
              fontWeight: i === 0 ? 600 : 400,
            }}>{t}</span>
          ))}
          <span style={{ marginLeft: 8, padding: '6px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#666' }}>↕ ordenar por ano</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 32 }}>
        <div style={{ flex: 1 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '64px 1.6fr 1.2fr 0.8fr 120px 64px',
            padding: '10px 0',
            borderBottom: '1px solid #0a0a0a',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10,
            color: '#999',
            textTransform: 'uppercase',
            letterSpacing: 0.8,
          }}>
            <span>Ano</span><span>Título</span><span>Papel</span><span>Tipo</span><span>Avaliação</span><span style={{ textAlign: 'right' }}>★</span>
          </div>
          {A.filmography.map((f, i) => (
            <div key={i} style={{
              display: 'grid',
              gridTemplateColumns: '64px 1.6fr 1.2fr 0.8fr 120px 64px',
              padding: '14px 0',
              borderBottom: '1px solid #f0f0f0',
              fontSize: 14,
              alignItems: 'center',
            }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: '#888' }}>{f.year}</span>
              <span style={{ fontWeight: 600 }}>
                {f.title}
                {f.note && <div style={{ fontSize: 12, color: '#888', fontWeight: 400, marginTop: 3, fontStyle: 'italic' }}>{f.note}</div>}
              </span>
              <span style={{ color: '#444' }}>{f.role}</span>
              <span style={{ color: '#888', fontSize: 12 }}>{f.type} · {f.network}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ flex: 1, height: 4, background: '#f0f0f0', borderRadius: 2, overflow: 'hidden' }}>
                  <span style={{ display: 'block', width: `${(f.rating / 5) * 100}%`, height: '100%', background: f.rating >= 4.5 ? 'var(--ha-accent, #ee2244)' : '#0a0a0a' }} />
                </span>
              </span>
              <span style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, fontSize: 13 }}>{f.rating.toFixed(1)}</span>
            </div>
          ))}
        </div>
        <ARatingDist />
      </div>
    </section>
  );
}

function ABiography() {
  return (
    <section style={{ padding: '56px 40px', background: '#fafafa', borderTop: '1px solid #e8e8e8', borderBottom: '1px solid #e8e8e8' }}>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#999', letterSpacing: 0.6 }}>02 · BIOGRAFIA</div>
      <h2 style={{ fontSize: 44, fontWeight: 700, letterSpacing: -1.5, margin: '6px 0 32px' }}>De Seul ao topo da Netflix</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 60 }}>
        <div style={{ fontSize: 17, lineHeight: 1.6, color: '#222' }}>
          {A.longBio.map((p, i) => (
            <p key={i} style={{ margin: '0 0 18px', textWrap: 'pretty' }}>
              {i === 0 && <span style={{
                float: 'left', fontSize: 72, lineHeight: 0.8, fontWeight: 800,
                marginRight: 10, marginTop: 4, letterSpacing: -3,
              }}>{p[0]}</span>}
              {i === 0 ? p.slice(1) : p}
            </p>
          ))}
        </div>
        <div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 }}>Curiosidades</div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {A.trivia.map((t, i) => (
              <li key={i} style={{
                padding: '14px 0',
                borderTop: '1px solid #e5e5e5',
                display: 'flex', gap: 16,
                fontSize: 14, lineHeight: 1.5, color: '#222',
              }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#bbb', minWidth: 24 }}>0{i + 1}</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function AAwards() {
  return (
    <section style={{ padding: '56px 40px' }}>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#999', letterSpacing: 0.6 }}>03 · PRÊMIOS</div>
      <h2 style={{ fontSize: 44, fontWeight: 700, letterSpacing: -1.5, margin: '6px 0 32px' }}>O que ele já ganhou</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
        {A.awards.map((a, i) => (
          <div key={i} style={{
            display: 'flex', gap: 18, padding: '20px 24px 20px 0',
            borderTop: '1px solid #e5e5e5',
            borderRight: i % 2 === 0 ? '1px solid #e5e5e5' : 'none',
            paddingLeft: i % 2 === 1 ? 28 : 0,
          }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: 'var(--ha-accent, #ee2244)', minWidth: 44, fontWeight: 600 }}>{a.year}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{a.name}</div>
              <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>{a.category}</div>
              <div style={{ fontSize: 12, color: '#999', fontStyle: 'italic', marginTop: 4 }}>por {a.work}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AReviews() {
  return (
    <section style={{ padding: '56px 40px', background: '#0a0a0a', color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#666', letterSpacing: 0.6 }}>04 · COMUNIDADE</div>
          <h2 style={{ fontSize: 44, fontWeight: 700, letterSpacing: -1.5, margin: '6px 0 0' }}>O que os fãs dizem</h2>
        </div>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#888' }}>3.2k posts · ver tudo →</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {A.fanQuotes.map((q, i) => (
          <div key={i} style={{
            padding: '24px 22px',
            border: '1px solid #222',
            background: '#111',
            display: 'flex', flexDirection: 'column', gap: 18,
          }}>
            <div style={{ fontSize: 32, lineHeight: 1, color: 'var(--ha-accent, #ee2244)', fontFamily: 'Newsreader, serif' }}>“</div>
            <p style={{ fontSize: 16, lineHeight: 1.45, margin: 0, color: '#eee', textWrap: 'pretty' }}>{q.text}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 8 }}>
              <span style={{ fontSize: 13, color: '#aaa' }}>{q.user}</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#666' }}>♥ {q.likes}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ARelated() {
  return (
    <section style={{ padding: '56px 40px' }}>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#999', letterSpacing: 0.6 }}>05 · CONEXÕES</div>
      <h2 style={{ fontSize: 44, fontWeight: 700, letterSpacing: -1.5, margin: '6px 0 32px' }}>Contracenou com</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
        {A.related.map((r, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{
              aspectRatio: '1', background: 'repeating-linear-gradient(135deg, #f0f0f0 0 10px, #e8e8e8 10px 20px)',
              borderRadius: 999, position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', inset: 0, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontFamily: '"Noto Sans KR", sans-serif', fontSize: 28, fontWeight: 600, color: '#aaa',
              }}>{r.hangul}</div>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{r.name}</div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 2, lineHeight: 1.4 }}>{r.relation}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AFooter() {
  return (
    <footer style={{ padding: '40px 40px 56px', borderTop: '1px solid #e5e5e5', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
      <div>
        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.8 }}>HallyuHub<span style={{ color: 'var(--ha-accent, #ee2244)' }}>.</span></div>
        <div style={{ fontSize: 12, color: '#999', marginTop: 6, fontFamily: 'JetBrains Mono, monospace' }}>K-pop · K-drama · cultura coreana, em PT-BR</div>
      </div>
      <div style={{ fontFamily: 'Noto Sans KR, sans-serif', fontSize: 80, color: '#f0f0f0', fontWeight: 800, lineHeight: 0.9, letterSpacing: -3 }}>한류허브</div>
    </footer>
  );
}

window.VariationA = function VariationA() {
  return (
    <div style={aStyles.root}>
      <ANav />
      <ABreadcrumb />
      <AHero />
      <AStats />
      <AFilmography />
      <ABiography />
      <AAwards />
      <AReviews />
      <ARelated />
      <AFooter />
    </div>
  );
};
