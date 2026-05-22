// Ad slot components — always clearly marked.
// Demonstrating IAB-standard sizes + native sponsored content patterns.

window.AdLabel = function AdLabel({ light, children }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontFamily: 'JetBrains Mono, monospace', fontSize: 9,
      letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 700,
      color: light ? '#999' : '#999',
      padding: '2px 8px', border: `1px solid ${light ? '#333' : '#ddd'}`,
      borderRadius: 2,
    }}>
      <span style={{ width: 4, height: 4, borderRadius: 1, background: '#ee2244' }} />
      {children || 'Anúncio'}
    </span>
  );
};

// Full-width leaderboard (970×90 / responsive)
window.AdLeaderboard = function AdLeaderboard() {
  const ad = window.DYN.ads.leaderboard;
  return (
    <div style={{ padding: '14px 40px', background: '#fafafa', borderBottom: '1px solid #e8e8e8' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 22px', border: '1px dashed #d0d0d0', background: '#fff', minHeight: 80 }}>
        <AdLabel />
        <div style={{ width: 1, height: 36, background: '#e5e5e5' }} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 999, background: '#0a0a0a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800 }}>CP</div>
          <div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#999', letterSpacing: 0.6 }}>{ad.brand} · oferta especial</div>
            <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: -0.3, marginTop: 2 }}>{ad.line}</div>
          </div>
        </div>
        <button style={{ padding: '10px 18px', background: 'var(--ha-accent, #ee2244)', color: '#fff', border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 700, letterSpacing: 0.2 }}>{ad.cta} →</button>
        <span style={{ fontSize: 14, color: '#bbb', cursor: 'pointer' }}>×</span>
      </div>
    </div>
  );
};

// Native sponsored card — looks like editorial but clearly tagged
window.AdNative = function AdNative() {
  const ad = window.DYN.ads.sponsored;
  return (
    <article style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28,
      padding: 24, border: '1px solid #0a0a0a', background: '#fff', position: 'relative',
    }}>
      <div style={{
        position: 'absolute', top: -1, left: 18, padding: '4px 10px',
        background: '#0a0a0a', color: '#fff', fontFamily: 'JetBrains Mono, monospace',
        fontSize: 10, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase',
      }}>● {ad.tag}</div>
      <div style={{
        aspectRatio: '4/3',
        background: 'linear-gradient(135deg, #1ed760 0%, #0a0a0a 100%)',
        position: 'relative',
      }}>
        <div style={{ position: 'absolute', inset: 0, padding: 24, color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', opacity: 0.7, letterSpacing: 0.6 }}>oferecido por</div>
          <div style={{ fontSize: 56, fontWeight: 900, letterSpacing: -2, lineHeight: 1 }}>{ad.brand}</div>
        </div>
      </div>
      <div style={{ paddingTop: 22, display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--ha-accent, #ee2244)', letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: 700 }}>conteúdo da marca</span>
        <h3 style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: 30, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1.1, margin: '10px 0 14px', textWrap: 'balance' }}>{ad.title}</h3>
        <p style={{ fontSize: 14, color: '#555', lineHeight: 1.55, margin: 0, textWrap: 'pretty' }}>{ad.dek}</p>
        <div style={{ marginTop: 'auto', paddingTop: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ padding: '10px 18px', background: '#0a0a0a', color: '#fff', borderRadius: 4, fontSize: 13, fontWeight: 700 }}>{ad.cta} →</span>
          <span style={{ fontSize: 11, color: '#999', fontFamily: 'JetBrains Mono, monospace' }}>por que vejo isso?</span>
        </div>
      </div>
    </article>
  );
};

// MPU 300x250 (medium rectangle)
window.AdMPU = function AdMPU() {
  const ad = window.DYN.ads.mpu;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <AdLabel />
      <div style={{
        aspectRatio: '300/250', width: '100%',
        border: '1px dashed #d0d0d0', background: '#fff',
        padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', right: -20, bottom: -30,
          fontFamily: '"Noto Sans KR", sans-serif', fontSize: 160, color: '#f3f3f3', fontWeight: 800, lineHeight: 0.8, letterSpacing: -6,
        }}>여행</div>
        <div style={{ position: 'relative' }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: 0.6 }}>{ad.brand}</div>
          <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: -0.3, lineHeight: 1.2, marginTop: 6 }}>{ad.line}</div>
        </div>
        <button style={{ position: 'relative', padding: '8px 14px', background: 'var(--ha-accent, #ee2244)', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 700, alignSelf: 'flex-start' }}>{ad.cta} →</button>
      </div>
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#bbb' }}>300×250 · Google Ad Manager</span>
    </div>
  );
};

// Skyscraper 160x600
window.AdSkyscraper = function AdSkyscraper() {
  const ad = window.DYN.ads.skyscraper;
  return (
    <div style={{ width: 160, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <AdLabel />
      <div style={{
        width: 160, height: 600,
        border: '1px dashed #d0d0d0', background: '#fff',
        padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ writingMode: 'vertical-rl', fontFamily: 'Newsreader, serif', fontStyle: 'italic', fontSize: 36, fontWeight: 500, letterSpacing: -1, color: '#0a0a0a', lineHeight: 1, alignSelf: 'flex-start' }}>{ad.brand}</div>
        <div style={{
          width: 110, height: 110, borderRadius: 999,
          background: '#5a7f4d', alignSelf: 'center',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontFamily: '"Noto Sans KR", sans-serif', fontSize: 28, fontWeight: 800,
        }}>녹차</div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.3, marginBottom: 10, textWrap: 'pretty' }}>{ad.line}</div>
          <button style={{ width: '100%', padding: '8px 0', background: '#0a0a0a', color: '#fff', border: 'none', fontSize: 11, fontWeight: 700 }}>{ad.cta} →</button>
        </div>
      </div>
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#bbb' }}>160×600 sky</span>
    </div>
  );
};

// Inline product/affiliate strip
window.AdAffiliate = function AdAffiliate() {
  return (
    <div style={{
      padding: '20px 24px', background: '#fff8e8',
      border: '1px solid #e8d59a', borderRadius: 6,
      display: 'flex', alignItems: 'center', gap: 18,
    }}>
      <span style={{ padding: '4px 10px', background: '#0a0a0a', color: '#fff', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase' }}>● link afiliado</span>
      <span style={{ flex: 1, fontSize: 14, color: '#333' }}>
        <b>K-Beauty na Amazon BR</b> · usamos parte da venda para manter o site grátis. Ofertas selecionadas pela nossa redação.
      </span>
      <span style={{ fontSize: 12, color: 'var(--ha-accent, #ee2244)', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>ver ofertas →</span>
    </div>
  );
};
