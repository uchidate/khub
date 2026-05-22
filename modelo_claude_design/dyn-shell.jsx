// Shell (nav, hero, forum, shopping, footer) for the dynamic home.

window.DynNav = function DynNav() {
  return (
    <header>
      <div style={{
        padding: '8px 40px',
        background: '#0a0a0a', color: '#fff',
        fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span>quarta · 20 mai 2026 · seul 23:41 · são paulo 11:41 · seoul 18°C</span>
        <span style={{ display: 'flex', gap: 16 }}>
          <span>pt-br · ko · en</span>
          <span style={{ color: 'var(--ha-accent, #ee2244)' }}>● 2.4k assinantes online</span>
        </span>
      </div>
      <div style={{ padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e8e8e8' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -1 }}>
            HallyuHub<span style={{ color: 'var(--ha-accent, #ee2244)' }}>.</span>
          </div>
          <nav style={{ display: 'flex', gap: 24, fontSize: 14, fontWeight: 500 }}>
            {['Início', 'Stream ▾', 'K-Drama ▾', 'K-Pop ▾', 'Cinema', 'Cultura', 'Quizzes', 'Shop', 'Calendário'].map((n, i) => (
              <span key={n} style={{ color: i === 0 ? '#0a0a0a' : '#444', borderBottom: i === 0 ? '2px solid var(--ha-accent, #ee2244)' : 'none', paddingBottom: 4 }}>{n}</span>
            ))}
          </nav>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ padding: '7px 14px', border: '1px solid #e0e0e0', borderRadius: 999, fontSize: 12, color: '#444', fontFamily: 'JetBrains Mono, monospace' }}>⌘K buscar</span>
          <span style={{ padding: '7px 14px', border: '1px solid #d0d0d0', borderRadius: 999, fontSize: 13 }}>🔔 12</span>
          <span style={{ width: 32, height: 32, borderRadius: 999, background: '#0a0a0a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>AT</span>
        </div>
      </div>
    </header>
  );
};

window.DynHero = function DynHero() {
  const h = window.HOME.hero;
  return (
    <section style={{ padding: '36px 40px 44px', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 32 }}>
      <div style={{ position: 'relative', aspectRatio: '16/9', background: 'linear-gradient(135deg, #1a0d12, #2a1620 50%, #ee2244 280%)', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 32, color: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ padding: '5px 12px', background: 'var(--ha-accent, #ee2244)', color: '#fff', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase' }}>● Capa · K-Drama</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, opacity: 0.7 }}>{h.readTime}</span>
          </div>
          <div>
            <div style={{ fontFamily: '"Noto Sans KR", sans-serif', fontSize: 13, color: '#bbb', marginBottom: 8 }}>드라마</div>
            <h1 style={{
              fontFamily: 'Newsreader, Georgia, serif', fontWeight: 500,
              fontSize: 60, letterSpacing: -2, lineHeight: 0.98, margin: 0, textWrap: 'balance',
            }}>{h.title}</h1>
            <p style={{ fontSize: 16, lineHeight: 1.5, color: '#ddd', margin: '14px 0 0', maxWidth: 520, textWrap: 'pretty' }}>{h.dek}</p>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 18 }}>
              <button style={{ padding: '12px 20px', background: '#fff', color: '#0a0a0a', border: 'none', borderRadius: 4, fontSize: 14, fontWeight: 700 }}>▶ Ver trailer</button>
              <span style={{ fontSize: 13, opacity: 0.7 }}>{h.author} · {h.date}</span>
            </div>
          </div>
        </div>
      </div>
      {/* Right: stack of breaking headlines */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        <div style={{ padding: '10px 0', borderBottom: '1px solid #0a0a0a', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#888', letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: 700 }}>Última hora</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--ha-accent, #ee2244)' }}>● atualizado há 4 min</span>
        </div>
        {[
          ['K-Pop', 'BLACKPINK anuncia retorno conjunto para outubro', '4 min'],
          ['K-Drama', 'Lee Min-ho confirmado em série da Netflix dirigida por Hwang Dong-hyuk', '23 min'],
          ['Cinema', 'Park Chan-wook fecha distribuição mundial com A24', '1 h'],
          ['Cultura', 'Coreia do Sul ultrapassa o Japão em exportação cultural pela 1ª vez', '2 h'],
          ['K-Pop', 'NewJeans bate 5 bilhões de streams no Spotify', '4 h'],
        ].map(([cat, t, ago], i) => (
          <article key={i} style={{
            padding: '13px 0', borderBottom: '1px solid #ececec',
            display: 'grid', gridTemplateColumns: '70px 1fr 50px', gap: 12, alignItems: 'baseline',
          }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--ha-accent, #ee2244)', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 700 }}>{cat}</span>
            <span style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>{t}</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#999', textAlign: 'right' }}>{ago}</span>
          </article>
        ))}
      </div>
    </section>
  );
};

window.DynForum = function DynForum() {
  const forum = window.DYN.forum;
  return (
    <section style={{ padding: '56px 40px', display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 32 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 22, paddingBottom: 10, borderBottom: '1px solid #0a0a0a' }}>
          <div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--ha-accent, #ee2244)', letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: 700 }}>● Comunidade · agora</div>
            <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.8, margin: '4px 0 0' }}>Threads em alta no fórum</h2>
          </div>
          <span style={{ padding: '7px 14px', background: '#0a0a0a', color: '#fff', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>+ Nova thread</span>
        </div>
        {forum.map((t, i) => (
          <div key={i} style={{
            padding: '14px 0', borderBottom: '1px solid #ececec',
            display: 'grid', gridTemplateColumns: '40px 1fr 80px 80px', gap: 12, alignItems: 'center',
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 999, background: '#0a0a0a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
              {t.user.slice(1, 3).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.3, textWrap: 'pretty' }}>
                {t.hot && <span style={{ marginRight: 8, padding: '2px 6px', background: 'var(--ha-accent, #ee2244)', color: '#fff', fontFamily: 'JetBrains Mono, monospace', fontSize: 9, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', verticalAlign: 'middle' }}>● hot</span>}
                {t.topic}
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#888', marginTop: 4 }}>{t.user} · há {Math.floor(Math.random() * 50) + 5}min</div>
            </div>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#444', textAlign: 'right' }}>💬 {t.replies}</span>
            <span style={{ fontSize: 12, color: 'var(--ha-accent, #ee2244)', fontWeight: 600, textAlign: 'right' }}>entrar →</span>
          </div>
        ))}
      </div>

      {/* MPU ad in sidebar */}
      <aside style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <AdMPU />
        <div style={{ padding: 20, background: '#fafafa', border: '1px solid #e5e5e5' }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>Top da semana · fórum</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {window.HOME.trending.slice(0, 5).map((t, i) => (
              <div key={t.rank} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingBottom: 8, borderBottom: i < 4 ? '1px solid #ececec' : 'none' }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{String(t.rank).padStart(2, '0')} · {t.label}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--ha-accent, #ee2244)' }}>{t.delta}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </section>
  );
};

window.DynShop = function DynShop() {
  const items = window.DYN.shopping;
  return (
    <section style={{ padding: '56px 40px', background: '#fafafa', borderTop: '1px solid #e8e8e8', borderBottom: '1px solid #e8e8e8' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 22, paddingBottom: 10, borderBottom: '1px solid #0a0a0a' }}>
        <div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--ha-accent, #ee2244)', letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: 700 }}>● Shop K-Beauty · links de afiliado</div>
          <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.8, margin: '4px 0 0' }}>Produtos que a redação testou esta semana</h2>
        </div>
        <span style={{ padding: '7px 14px', border: '1px solid #0a0a0a', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>Ver tudo →</span>
      </div>
      <AdAffiliate />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginTop: 18 }}>
        {items.map((p, i) => (
          <article key={i} style={{ background: '#fff', border: '1px solid #e5e5e5', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{
              aspectRatio: '1', position: 'relative',
              background: `linear-gradient(135deg, hsl(${(i * 80) % 360} 30% 92%), hsl(${(i * 80 + 50) % 360} 25% 80%))`,
            }}>
              <span style={{ position: 'absolute', top: 8, left: 8, padding: '3px 7px', background: '#0a0a0a', color: '#fff', fontFamily: 'JetBrains Mono, monospace', fontSize: 9, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase' }}>● {p.tag}</span>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Newsreader, serif', fontStyle: 'italic', fontSize: 36, color: '#fff', fontWeight: 500, textShadow: '0 0 2px rgba(0,0,0,0.2)' }}>{p.brand}</div>
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 0.6 }}>{p.brand}</div>
            <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3, textWrap: 'pretty' }}>{p.product}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
              <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.5 }}>{p.price}</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--ha-accent, #ee2244)', fontWeight: 700 }}>comprar →</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

window.DynNewsletter = function DynNewsletter() {
  return (
    <section style={{ padding: '64px 40px', background: '#0a0a0a', color: '#fff', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', right: -60, top: -40, fontFamily: '"Noto Sans KR", sans-serif', fontSize: 320, fontWeight: 900, color: '#161616', lineHeight: 0.78, letterSpacing: -12 }}>한류</div>
      <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--ha-accent, #ee2244)', letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: 700 }}>Newsletter · grátis</div>
          <h2 style={{ fontFamily: 'Newsreader, Georgia, serif', fontWeight: 400, fontSize: 60, letterSpacing: -2, lineHeight: 1, margin: '12px 0 16px' }}>
            Seul, todo <span style={{ fontStyle: 'italic', color: 'var(--ha-accent, #ee2244)' }}>domingo</span>.
          </h2>
          <p style={{ fontSize: 16, color: '#aaa', margin: 0, maxWidth: 460, textWrap: 'pretty' }}>
            Quiz da semana, calendário de comebacks, melhores reviews, ofertas K-Beauty. Resumido em 5 minutos de leitura.
          </p>
        </div>
        <div>
          <div style={{ display: 'flex', border: '1px solid #333', background: '#111' }}>
            <input style={{ flex: 1, padding: '18px 20px', background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 15, fontFamily: 'inherit' }} placeholder="seu@email.com" defaultValue="ana.tanaka@gmail.com" />
            <button style={{ padding: '0 26px', background: 'var(--ha-accent, #ee2244)', color: '#fff', border: 'none', fontWeight: 700, fontSize: 14 }}>Assinar →</button>
          </div>
          <div style={{ display: 'flex', gap: 20, marginTop: 18, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#666' }}>
            <span><b style={{ color: '#fff' }}>42k</b> inscritos</span>
            <span><b style={{ color: '#fff' }}>61%</b> abertura</span>
            <span><b style={{ color: '#fff' }}>Mensal</b> + extras</span>
          </div>
        </div>
      </div>
    </section>
  );
};

window.DynFooter = function DynFooter() {
  return (
    <footer style={{ padding: '48px 40px 32px', borderTop: '1px solid #e5e5e5' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 32, marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: -1.4 }}>HallyuHub<span style={{ color: 'var(--ha-accent, #ee2244)' }}>.</span></div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#888', marginTop: 8, lineHeight: 1.6 }}>
            k-pop · k-drama · cultura coreana<br />
            em português · desde 2024<br />
            <span style={{ color: 'var(--ha-accent, #ee2244)' }}>● 2.4k usuários online agora</span>
          </div>
        </div>
        {[
          ['Conteúdo', ['K-Drama', 'K-Pop', 'Cinema', 'Artistas', 'Cultura', 'K-Beauty']],
          ['Features', ['Stream', 'Quizzes', 'Calendário', 'Shop', 'Fórum', 'Reels']],
          ['Editorial', ['Manifesto', 'Equipe', 'Pauta aberta', 'Errata', 'Anuncie']],
          ['HallyuHub', ['Newsletter', 'Discord', 'Instagram', 'TikTok', 'RSS']],
        ].map(([title, items]) => (
          <div key={title}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>{title}</div>
            {items.map(it => (
              <div key={it} style={{ padding: '4px 0', fontSize: 13, color: '#444' }}>{it}</div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ paddingTop: 20, borderTop: '1px solid #ececec', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#999' }}>
        <span>© 2026 HallyuHub. Conteúdo licenciado sob CC BY-SA exceto onde indicado.</span>
        <span>Termos · Privacidade · Cookies · Não vender meus dados</span>
      </div>
    </footer>
  );
};
