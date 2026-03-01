const FOOTER = `
  <div style="margin-top:40px;padding-top:20px;border-top:1px solid #2a2a3a;text-align:center;">
    <p style="color:#555;font-size:12px;margin:4px 0;"><strong style="color:#a78bfa;">HALLYU</strong><strong style="color:#f472b6;">HUB</strong></p>
    <p style="color:#555;font-size:11px;margin:4px 0;">O portal brasileiro da cultura coreana</p>
    <p style="color:#555;font-size:11px;margin:4px 0;"><a href="https://hallyuhub.com.br" style="color:#a78bfa;text-decoration:none;">hallyuhub.com.br</a></p>
  </div>
`

const WRAPPER_OPEN = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="font-family:Arial,sans-serif;line-height:1.6;color:#e4e4e7;background:#09090b;max-width:600px;margin:0 auto;padding:20px;">`
const WRAPPER_CLOSE = `</body></html>`

export const DEFAULT_TEMPLATES = [
    {
        slug: 'welcome',
        name: 'Boas-vindas',
        subject: '🎉 Bem-vindo ao HallyuHub, {{name}}!',
        variables: ['name', 'url'],
        htmlContent: `${WRAPPER_OPEN}
  <div style="background:linear-gradient(135deg,#7c3aed 0%,#db2777 100%);padding:32px;text-align:center;border-radius:12px 12px 0 0;">
    <h1 style="color:white;margin:0;font-size:26px;font-weight:900;letter-spacing:-0.5px;">🎉 Bem-vindo ao HallyuHub!</h1>
  </div>
  <div style="background:#18181b;padding:32px;border-radius:0 0 12px 12px;border:1px solid #27272a;border-top:none;">
    <p style="font-size:16px;">Olá, <strong style="color:#a78bfa;">{{name}}</strong>!</p>
    <p>É com muito prazer que te damos as boas-vindas ao <strong>HallyuHub</strong>, sua nova fonte de entretenimento coreano. 🇰🇷</p>
    <p style="color:#a1a1aa;">Aqui você vai encontrar:</p>
    <ul style="line-height:2.2;color:#d4d4d8;">
      <li>🎤 <strong>Artistas</strong> — perfis completos dos seus ídolos</li>
      <li>📰 <strong>Notícias</strong> — tudo sobre K-pop e K-drama</li>
      <li>🎬 <strong>Produções</strong> — filmes e séries coreanas</li>
      <li>⭐ <strong>Favoritos</strong> — salve e acompanhe seus conteúdos</li>
    </ul>
    <div style="text-align:center;margin:28px 0;">
      <a href="{{url}}" style="background:linear-gradient(135deg,#7c3aed,#db2777);color:white;padding:14px 36px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;font-size:15px;">
        Explorar Agora →
      </a>
    </div>
    ${FOOTER}
  </div>
${WRAPPER_CLOSE}`,
    },
    {
        slug: 'password-reset',
        name: 'Reset de Senha',
        subject: '🔐 Redefinir senha — HallyuHub',
        variables: ['name', 'resetUrl', 'expires'],
        htmlContent: `${WRAPPER_OPEN}
  <div style="background:linear-gradient(135deg,#7c3aed 0%,#db2777 100%);padding:32px;text-align:center;border-radius:12px 12px 0 0;">
    <h1 style="color:white;margin:0;font-size:26px;font-weight:900;">🔐 Reset de Senha</h1>
  </div>
  <div style="background:#18181b;padding:32px;border-radius:0 0 12px 12px;border:1px solid #27272a;border-top:none;">
    <p style="font-size:16px;">Olá, <strong style="color:#a78bfa;">{{name}}</strong>!</p>
    <p>Recebemos uma solicitação para redefinir a senha da sua conta no <strong>HallyuHub</strong>.</p>
    <p>Clique no botão abaixo para criar uma nova senha:</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="{{resetUrl}}" style="background:linear-gradient(135deg,#7c3aed,#db2777);color:white;padding:14px 36px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;font-size:15px;">
        Redefinir Senha →
      </a>
    </div>
    <p style="color:#71717a;font-size:13px;">Ou copie este link:<br><a href="{{resetUrl}}" style="color:#a78bfa;word-break:break-all;">{{resetUrl}}</a></p>
    <div style="background:#27272a;border-radius:8px;padding:14px;margin:20px 0;">
      <p style="color:#fbbf24;margin:0;font-size:13px;">⚠️ Este link expira em {{expires}}. Se não foi você, ignore este email.</p>
    </div>
    ${FOOTER}
  </div>
${WRAPPER_CLOSE}`,
    },
    {
        slug: 'news-instant',
        name: 'Notícia Instantânea',
        subject: '📰 {{newsTitle}} — HallyuHub',
        variables: ['name', 'newsTitle', 'newsUrl', 'artists', 'imageUrl'],
        htmlContent: `${WRAPPER_OPEN}
  <div style="background:linear-gradient(135deg,#7c3aed 0%,#db2777 100%);padding:32px;text-align:center;border-radius:12px 12px 0 0;">
    <h1 style="color:white;margin:0;font-size:22px;font-weight:900;">📰 Nova Notícia</h1>
  </div>
  <div style="background:#18181b;padding:32px;border-radius:0 0 12px 12px;border:1px solid #27272a;border-top:none;">
    <p>Olá, <strong style="color:#a78bfa;">{{name}}</strong>! Há uma nova notícia sobre seus artistas favoritos.</p>
    <div style="background:#27272a;border-radius:8px;padding:20px;margin:20px 0;">
      <p style="font-size:16px;font-weight:bold;color:#f4f4f5;margin:0 0 8px 0;">{{newsTitle}}</p>
      <p style="color:#a78bfa;font-size:13px;margin:0;">{{artists}}</p>
    </div>
    <div style="text-align:center;margin:24px 0;">
      <a href="{{newsUrl}}" style="background:linear-gradient(135deg,#7c3aed,#db2777);color:white;padding:12px 32px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">
        Ler Notícia →
      </a>
    </div>
    ${FOOTER}
  </div>
${WRAPPER_CLOSE}`,
    },
    {
        slug: 'news-digest',
        name: 'Resumo de Notícias',
        subject: '📬 Seu resumo {{period}} — HallyuHub',
        variables: ['name', 'period', 'newsListHtml'],
        htmlContent: `${WRAPPER_OPEN}
  <div style="background:linear-gradient(135deg,#7c3aed 0%,#db2777 100%);padding:32px;text-align:center;border-radius:12px 12px 0 0;">
    <h1 style="color:white;margin:0;font-size:22px;font-weight:900;">📬 Seu Resumo {{period}}</h1>
  </div>
  <div style="background:#18181b;padding:32px;border-radius:0 0 12px 12px;border:1px solid #27272a;border-top:none;">
    <p>Olá, <strong style="color:#a78bfa;">{{name}}</strong>! Confira as novidades dos seus artistas favoritos:</p>
    {{newsListHtml}}
    <div style="text-align:center;margin:24px 0;">
      <a href="https://hallyuhub.com.br/news" style="background:linear-gradient(135deg,#7c3aed,#db2777);color:white;padding:12px 32px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">
        Ver Todas as Notícias →
      </a>
    </div>
    <p style="color:#71717a;font-size:12px;text-align:center;">
      <a href="https://hallyuhub.com.br/settings/notifications" style="color:#71717a;">Gerenciar preferências de email</a>
    </p>
    ${FOOTER}
  </div>
${WRAPPER_CLOSE}`,
    },
]
