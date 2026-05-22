// Home A — "Front page / news magazine"
// Strong editorial hero, grid of features, trending sidebar, latest list.

const HA = window.HOME;

const haStyles = {
  root: {
    fontFamily: '"Schibsted Grotesk", system-ui, sans-serif',
    background: 'var(--ha-bg, #ffffff)',
    color: 'var(--ha-fg, #0a0a0a)',
    width: '100%', minHeight: '100%',
  },
};

function HANav() {
  return (
    <div>
      <div style={{
        padding: '10px 40px',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 11, color: '#888',
        display: 'flex', justifyContent: 'space-between',
        borderBottom: '1px solid #f0f0f0',
      }}>
        <span>quarta-feira · 20 de maio de 2026 · seul 23:41 · são paulo 11:41</span>
        <span>edição diária · grátis · pt-br</span>
      </div>
      <div style={{
        padding: '20px 40px 24px',
        borderBottom: '2px solid #0a0a0a',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 56, fontWeight: 800, letterSpacing: -2.2, lineHeight: 0.95 }}>
            HallyuHub<span style={{ color: 'var(--ha-accent, #ee2244)' }}>.</span>
          </div>
          <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>k-pop · k-drama · cultura coreana, em português</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ padding: '8px 14px', border: '1px solid #e0e0e0', borderRadius: 999, fontSize: 12, color: '#444', fontFamily: 'JetBrains Mono, monospace' }}>⌘K buscar</span>
          <span style={{ padding: '8px 16px', border: '1px solid #0a0a0a', borderRadius: 999, fontSize: 13, fontWeight: 500 }}>Entrar</span>
          <span style={{ padding: '8px 16px', background: 'var(--ha-accent, #ee2244)', color: '#fff', borderRadius: 999, fontSize: 13, fontWeight: 600 }}>Assinar</span>
        </div>
      </div>
      <nav style={{ padding: '14px 40px', display: 'flex', gap: 28, fontSize: 14, fontWeight: 500, borderBottom: '1px solid #e8e8e8' }}>
        {['Início', 'K-Drama', 'K-Pop', 'Cinema', 'Artistas', 'Cultura', 'K-Beauty', 'Calendário'].map((n, i) => (
          <span key={n} style={{ color: i === 0 ? '#0a0a0a' : '#666', borderBottom: i === 0 ? '2px solid var(--ha-accent, #ee2244)' : 'none', paddingBottom: 6 }}>{n}</span>
        ))}
      </nav>
    </div>
  );
}

function HAHero() {
  return (
    <section style={{ padding: '40px 40px 56px', display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 48 }}>
      <div style={{
        aspectRatio: '4/3',
        background: 'repeating-linear-gradient(135deg, #efefef 0 12px, #e6e6e6 12px 24px)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: 16, left: 16, fontSize: 10, color: '#999', fontFamily: 'JetBrains Mono, monospace' }}>capa · Queen of Tears · 4:3</div>
        <div style={{ position: 'absolute', bottom: 16, left: 16, padding: '4px 10px', background: 'var(--ha-accent, #ee2244)', color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase' }}>● leitura essencial</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 18 }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--ha-accent, #ee2244)', fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase' }}>{HA.hero.kicker}</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#bbb' }}>· {HA.hero.readTime}</span>
        </div>
        <h1 style={{
          fontFamily: 'Newsreader, Georgia, serif',
          fontWeight: 500,
          fontSize: 64, letterSpacing: -2, lineHeight: 0.98,
          margin: 0, textWrap: 'balance',
        }}>
          {HA.hero.title}
        </h1>
        <p style={{ fontSize: 19, lineHeight: 1.5, color: '#333', marginTop: 22, textWrap: 'pretty' }}>{HA.hero.dek}</p>

        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          {HA.hero.tags.map(t => (
            <span key={t} style={{ padding: '4px 10px', border: '1px solid #e0e0e0', borderRadius: 999, fontSize: 12, color: '#555' }}>#{t}</span>
          ))}
        </div>

        <div style={{ marginTop: 'auto', paddingTop: 24, borderTop: '1px solid #e5e5e5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: '#666' }}>
          <span><b style={{ color: '#0a0a0a' }}>{HA.hero.author}</b> · {HA.hero.date}</span>
          <span style={{ color: 'var(--ha-accent, #ee2244)', fontWeight: 600 }}>continuar a leitura →</span>
        </div>
      </div>
    </section>
  );
}

function HAFeatures() {
  return (
    <section style={{ padding: '0 40px 56px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 22, paddingBottom: 10, borderBottom: '1px solid #0a0a0a' }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.4, margin: 0 }}>Em destaque <span style={{ fontFamily: '"Noto Sans KR", sans-serif', color: '#bbb', marginLeft: 6 }}>주요 기사</span></h2>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#888' }}>4 matérias selecionadas pela redação</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
        {HA.features.map((a, i) => (
          <article key={i}>
            <div style={{ aspectRatio: '4/3', background: 'repeating-linear-gradient(135deg, #efefef 0 10px, #e8e8e8 10px 20px)', position: 'relative', marginBottom: 14 }}>
              <div style={{ position: 'absolute', top: 10, left: 10, padding: '3px 8px', background: '#0a0a0a', color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>{a.category}</div>
            </div>
            <h3 style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: 23, fontWeight: 500, letterSpacing: -0.6, lineHeight: 1.1, margin: '0 0 8px', textWrap: 'balance' }}>{a.title}</h3>
            <p style={{ fontSize: 13, color: '#666', lineHeight: 1.45, margin: '0 0 12px', textWrap: 'pretty' }}>{a.dek}</p>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#999' }}>{a.author} · {a.date} · {a.readTime}</div>
          </article>
        ))}
      </div>
    </section>
  );
}

function HASplit() {
  return (
    <section style={{ padding: '40px 40px', background: '#fafafa', borderTop: '1px solid #e8e8e8', borderBottom: '1px solid #e8e8e8' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 56 }}>
        {/* Longreads */}
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 22, paddingBottom: 10, borderBottom: '1px solid #0a0a0a' }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.4, margin: 0 }}>Para ler com calma</h2>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#888' }}>longform · {HA.longreads.length}</span>
          </div>
          {HA.longreads.map((a, i) => (
            <article key={i} style={{
              display: 'grid', gridTemplateColumns: '120px 1fr 80px', gap: 20,
              padding: '20px 0',
              borderBottom: i < HA.longreads.length - 1 ? '1px solid #e5e5e5' : 'none',
              alignItems: 'start',
            }}>
              <div style={{
                aspectRatio: '4/5',
                background: 'repeating-linear-gradient(135deg, #ececec 0 8px, #e2e2e2 8px 16px)',
              }} />
              <div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--ha-accent, #ee2244)', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 700, marginBottom: 6 }}>{a.category}</div>
                <h3 style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: 26, fontWeight: 500, letterSpacing: -0.6, lineHeight: 1.05, margin: '0 0 8px', textWrap: 'balance' }}>{a.title}</h3>
                <p style={{ fontSize: 14, color: '#555', lineHeight: 1.5, margin: 0, textWrap: 'pretty' }}>{a.dek}</p>
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#888', textAlign: 'right' }}>{a.date}</div>
            </article>
          ))}
        </div>

        {/* Trending sidebar */}
        <aside>
          <div style={{ position: 'sticky', top: 24 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid #0a0a0a' }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.4, margin: 0 }}>Em alta agora</h2>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--ha-accent, #ee2244)' }}>● ao vivo</span>
            </div>
            {HA.trending.map(t => (
              <div key={t.rank} style={{
                display: 'grid', gridTemplateColumns: '36px 1fr auto', gap: 14,
                padding: '12px 0', borderBottom: '1px solid #ececec', alignItems: 'center',
              }}>
                <span style={{
                  fontFamily: 'Newsreader, Georgia, serif',
                  fontSize: 32, fontWeight: 500, fontStyle: 'italic',
                  color: t.rank <= 3 ? 'var(--ha-accent, #ee2244)' : '#bbb', lineHeight: 1,
                }}>{String(t.rank).padStart(2, '0')}</span>
                <span>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{t.label}</div>
                  <div style={{ fontSize: 11, color: '#888', fontFamily: 'JetBrains Mono, monospace', marginTop: 2 }}>{t.kind}</div>
                </span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#0a0a0a', fontWeight: 600 }}>{t.delta}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}

function HACategories() {
  return (
    <section style={{ padding: '56px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 22, paddingBottom: 10, borderBottom: '1px solid #0a0a0a' }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.4, margin: 0 }}>Navegar por seção</h2>
        <span style={{ fontFamily: 'JetBrainsEMono, monospace', fontSize: 11, color: '#888' }}>6 hubs · 2.275 matérias</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14 }}>
        {HA.categories.map((c, i) => (
          <div key={c.id} style={{
            position: 'relative',
            padding: '24px 18px 18px',
            border: '1px solid #0a0a0a',
            background: i % 2 === 0 ? '#0a0a0a' : '#fff',
            color: i % 2 === 0 ? '#fff' : '#0a0a0a',
            aspectRatio: '4/5',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', right: -10, top: -10,
              fontFamily: '"Noto Sans KR", sans-serif',
              fontSize: 100, fontWeight: 800,
              color: i % 2 === 0 ? '#1a1a1a' : '#f5f5f5',
              lineHeight: 0.85, letterSpacing: -4,
              pointerEvents: 'none',
            }}>{c.hangul.slice(0, 2)}</div>
            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.8 }}>{c.label}</div>
              <div style={{ fontFamily: '"Noto Sans KR", sans-serif', fontSize: 13, color: i % 2 === 0 ? '#888' : '#888', marginTop: 2 }}>{c.hangul}</div>
            </div>
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
              <span style={{ color: i % 2 === 0 ? '#888' : '#aaa' }}>{c.count} matérias</span>
              <span style={{ fontSize: 18 }}>→</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function HALatest() {
  return (
    <section style={{ padding: '0 40px 56px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 22, paddingBottom: 10, borderBottom: '1px solid #0a0a0a' }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.4, margin: 0 }}>Últimas publicações</h2>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#888' }}>RSS · ver feed →</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
        {HA.latest.map((a, i) => (
          <article key={i} style={{
            display: 'grid', gridTemplateColumns: '96px 1fr 92px',
            gap: 16,
            padding: '14px 22px 14px 0',
            borderBottom: '1px solid #f0f0f0',
            borderRight: i % 2 === 0 ? '1px solid #e8e8e8' : 'none',
            paddingLeft: i % 2 === 1 ? 22 : 0,
            alignItems: 'center',
          }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--ha-accent, #ee2244)', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 700 }}>{a.category}</span>
            <span style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.3, textWrap: 'pretty' }}>{a.title}</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#999', textAlign: 'right' }}>{a.date}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function HANewsletter() {
  return (
    <section style={{ padding: '56px 40px', background: '#0a0a0a', color: '#fff', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', right: -40, top: -20, fontFamily: '"Noto Sans KR", sans-serif', fontSize: 260, color: '#161616', fontWeight: 900, lineHeight: 0.85, letterSpacing: -8 }}>한류</div>
      <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--ha-accent, #ee2244)', letterSpacing: 0.8, textTransform: 'uppercase' }}>Newsletter HallyuHub</div>
          <h2 style={{ fontFamily: 'Newsreader, Georgia, serif', fontWeight: 400, fontSize: 56, letterSpacing: -1.8, lineHeight: 1, margin: '12px 0 16px' }}>
            Seul, todo <span style={{ fontStyle: 'italic', color: 'var(--ha-accent, #ee2244)' }}>domingo</span>, no seu inbox.
          </h2>
          <p style={{ fontSize: 17, lineHeight: 1.5, color: '#aaa', margin: 0, maxWidth: 440, textWrap: 'pretty' }}>
            Um resumo curado do que aconteceu na semana — comebacks, estreias, premiações e a coluna de cultura. Grátis. Sem spam.
          </p>
        </div>
        <div>
          <div style={{ display: 'flex', gap: 0, border: '1px solid #333', background: '#111' }}>
            <input style={{
              flex: 1, padding: '18px 20px',
              background: 'transparent', border: 'none', outline: 'none',
              color: '#fff', fontSize: 15, fontFamily: '"Schibsted Grotesk", sans-serif',
            }} placeholder="seu@email.com" defaultValue="ana.tanaka@gmail.com" />
            <button style={{
              padding: '0 28px', background: 'var(--ha-accent, #ee2244)', color: '#fff',
              border: 'none', fontWeight: 700, fontSize: 14, letterSpacing: 0.3,
            }}>Assinar →</button>
          </div>
          <div style={{ display: 'flex', gap: 24, marginTop: 18, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#666' }}>
            <span><b style={{ color: '#fff' }}>42k</b> inscritos</span>
            <span><b style={{ color: '#fff' }}>61%</b> taxa de abertura</span>
            <span><b style={{ color: '#fff' }}>4ª</b> newsletter brasileira de cultura coreana</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function HAFooter() {
  return (
    <footer style={{ padding: '40px', borderTop: '1px solid #e5e5e5', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
      <div>
        <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: -1.4 }}>HallyuHub<span style={{ color: 'var(--ha-accent, #ee2244)' }}>.</span></div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#999', marginTop: 6 }}>k-pop · k-drama · cultura coreana em pt-br · fundado em 2024</div>
      </div>
      <div style={{ display: 'flex', gap: 56, fontSize: 13 }}>
        <div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>Editorial</div>
          <div style={{ padding: '4px 0' }}>Manifesto</div>
          <div style={{ padding: '4px 0' }}>Equipe</div>
          <div style={{ padding: '4px 0' }}>Pauta aberta</div>
        </div>
        <div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>Comunidade</div>
          <div style={{ padding: '4px 0' }}>Discord</div>
          <div style={{ padding: '4px 0' }}>Instagram</div>
          <div style={{ padding: '4px 0' }}>TikTok</div>
        </div>
      </div>
    </footer>
  );
}

window.HomeA = function HomeA() {
  return (
    <div style={haStyles.root}>
      <HANav />
      <HAHero />
      <HAFeatures />
      <HASplit />
      <HACategories />
      <HALatest />
      <HANewsletter />
      <HAFooter />
    </div>
  );
};

Object.assign(window, { HANav, HAHero, HAFeatures, HASplit, HACategories, HALatest, HANewsletter, HAFooter });
