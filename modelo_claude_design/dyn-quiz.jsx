// Interactive quiz — full state machine: intro → questions → result.

window.QuizMain = function QuizMain() {
  const quiz = window.DYN.quizzes[0]; // idol-match
  const [stage, setStage] = React.useState('intro'); // intro | q | result
  const [qIdx, setQIdx] = React.useState(0);
  const [scores, setScores] = React.useState({ stage: 0, introvert: 0, creator: 0, performer: 0 });
  const [picked, setPicked] = React.useState(null);

  function start() {
    setStage('q'); setQIdx(0); setPicked(null);
    setScores({ stage: 0, introvert: 0, creator: 0, performer: 0 });
  }
  function pick(opt) {
    setPicked(opt);
    setTimeout(() => {
      setScores(s => ({ ...s, [opt.profile]: s[opt.profile] + 1 }));
      if (qIdx + 1 < quiz.questions.length) {
        setQIdx(qIdx + 1);
        setPicked(null);
      } else {
        setStage('result');
        setPicked(null);
      }
    }, 360);
  }
  function topProfile() {
    return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
  }
  function reset() { setStage('intro'); }

  const progress = stage === 'q' ? ((qIdx) / quiz.questions.length) * 100 : stage === 'result' ? 100 : 0;
  const currQ = quiz.questions[qIdx];

  return (
    <section style={{ padding: '72px 40px', background: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 22, paddingBottom: 10, borderBottom: '1px solid #0a0a0a' }}>
        <div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--ha-accent, #ee2244)', letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: 700 }}>● Quiz HallyuHub · interativo</div>
          <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.8, margin: '4px 0 0' }}>Descubra. Compartilhe. Voltar pra disputar.</h2>
        </div>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#888' }}>3 quizzes ativos · 505k respondidos</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24 }}>
        {/* Main quiz card */}
        <div style={{
          border: '1px solid #0a0a0a', background: '#fff', padding: 40,
          position: 'relative', minHeight: 480,
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Progress strip */}
          {stage !== 'intro' && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: '#f0f0f0' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'var(--ha-accent, #ee2244)', transition: 'width 240ms ease' }} />
            </div>
          )}

          {stage === 'intro' && (
            <React.Fragment>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ padding: '4px 10px', background: 'var(--ha-accent, #ee2244)', color: '#fff', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase' }}>● em alta</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#888' }}>{quiz.taken} pessoas fizeram</span>
              </div>
              <h3 style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: 56, fontWeight: 400, letterSpacing: -1.8, lineHeight: 1, margin: '20px 0 14px', textWrap: 'balance' }}>
                {quiz.title}
              </h3>
              <p style={{ fontSize: 16, color: '#555', lineHeight: 1.5, margin: 0, maxWidth: 460 }}>{quiz.subtitle}</p>
              <div style={{ marginTop: 'auto', paddingTop: 32, display: 'flex', gap: 10 }}>
                <button onClick={start} style={{
                  padding: '14px 28px', background: '#0a0a0a', color: '#fff',
                  border: 'none', borderRadius: 4, fontWeight: 700, fontSize: 14, letterSpacing: 0.2, cursor: 'pointer',
                }}>Começar quiz →</button>
                <button style={{ padding: '14px 18px', background: 'transparent', color: '#0a0a0a', border: '1px solid #d0d0d0', borderRadius: 4, fontSize: 14 }}>Ver resultado dos amigos</button>
              </div>
            </React.Fragment>
          )}

          {stage === 'q' && (
            <React.Fragment>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#999', letterSpacing: 0.6, textTransform: 'uppercase' }}>
                Pergunta {qIdx + 1} de {quiz.questions.length}
              </div>
              <h3 style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: 40, fontWeight: 500, letterSpacing: -1.2, lineHeight: 1.05, margin: '12px 0 28px', textWrap: 'balance' }}>
                {currQ.q}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {currQ.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => !picked && pick(opt)}
                    style={{
                      textAlign: 'left',
                      padding: '20px 22px',
                      background: picked === opt ? 'var(--ha-accent, #ee2244)' : '#fff',
                      color: picked === opt ? '#fff' : '#0a0a0a',
                      border: `1px solid ${picked === opt ? 'var(--ha-accent, #ee2244)' : '#d0d0d0'}`,
                      borderRadius: 6, fontSize: 16, lineHeight: 1.3, fontWeight: 500,
                      fontFamily: 'inherit', cursor: 'pointer',
                      transition: 'all 180ms ease',
                      display: 'flex', alignItems: 'center', gap: 14,
                    }}>
                    <span style={{
                      width: 28, height: 28, borderRadius: 999, flexShrink: 0,
                      border: '1px solid currentColor', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700,
                    }}>{String.fromCharCode(65 + i)}</span>
                    <span style={{ textWrap: 'pretty' }}>{opt.text}</span>
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 'auto', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#888' }}>
                  {Math.round(progress)}% · {quiz.questions.length - qIdx} restantes
                </span>
                <span onClick={reset} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#888', cursor: 'pointer' }}>recomeçar ↺</span>
              </div>
            </React.Fragment>
          )}

          {stage === 'result' && (() => {
            const profile = topProfile();
            const r = quiz.results[profile];
            return (
              <React.Fragment>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--ha-accent, #ee2244)', letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: 700 }}>● Seu resultado</div>
                <div style={{ marginTop: 12, fontSize: 15, color: '#666' }}>O idol K-pop que combina com você é</div>
                <h3 style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: 72, fontWeight: 500, letterSpacing: -2.4, lineHeight: 1, margin: '10px 0 4px' }}>
                  <span style={{ fontStyle: 'italic' }}>{r.name}</span>
                </h3>
                <div style={{ fontFamily: '"Noto Sans KR", sans-serif', fontSize: 30, color: '#bbb', fontWeight: 600, marginBottom: 18 }}>{r.hangul}</div>
                <p style={{ fontSize: 17, color: '#333', lineHeight: 1.5, margin: 0, maxWidth: 480, textWrap: 'pretty' }}>{r.line}</p>
                <div style={{ marginTop: 'auto', paddingTop: 28, display: 'flex', gap: 10 }}>
                  <button style={{ padding: '14px 22px', background: 'var(--ha-accent, #ee2244)', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>↗ Compartilhar</button>
                  <button onClick={reset} style={{ padding: '14px 22px', background: '#fff', color: '#0a0a0a', border: '1px solid #d0d0d0', borderRadius: 4, fontSize: 14, cursor: 'pointer' }}>Refazer</button>
                  <button style={{ padding: '14px 22px', background: 'transparent', color: '#0a0a0a', border: '1px solid #d0d0d0', borderRadius: 4, fontSize: 14, cursor: 'pointer' }}>Ler perfil completo →</button>
                </div>
              </React.Fragment>
            );
          })()}
        </div>

        {/* Sidebar: more quizzes + sponsor */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            padding: '20px 22px', border: '1px solid #e5e5e5', background: '#fafafa',
          }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 }}>+ outros quizzes</div>
            {window.DYN.quizzes.slice(1).map(q => (
              <div key={q.id} style={{ padding: '12px 0', borderTop: '1px solid #ececec', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 44, height: 44, background: '#0a0a0a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Newsreader, serif', fontStyle: 'italic', fontSize: 22, flexShrink: 0 }}>Q</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.25 }}>{q.title}</div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#888', marginTop: 4 }}>{q.taken} respondidos · {q.subtitle.split(' · ')[0]}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Quiz leaderboard */}
          <div style={{ padding: '20px 22px', border: '1px solid #0a0a0a', background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid #f0f0f0', paddingBottom: 10, marginBottom: 12 }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 0.6 }}>Ranking · trivia NewJeans</div>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--ha-accent, #ee2244)' }}>esta semana</span>
            </div>
            {[
              ['@bunny.bia', '10/10', '00:42'],
              ['@kpopdaisy', '10/10', '00:51'],
              ['@hallyu.lu', '10/10', '01:04'],
              ['@brazaesa', '9/10', '00:58'],
              ['@dramaverse', '9/10', '01:12'],
            ].map(([u, s, t], i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '20px 1fr 50px 60px', gap: 8, padding: '7px 0', borderTop: i > 0 ? '1px solid #f3f3f3' : 'none', fontSize: 13, alignItems: 'center' }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: i < 3 ? 'var(--ha-accent, #ee2244)' : '#bbb', fontWeight: 700 }}>{i + 1}</span>
                <span style={{ fontWeight: 500 }}>{u}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 600 }}>{s}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#888', textAlign: 'right' }}>{t}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
};
