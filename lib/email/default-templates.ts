// ─────────────────────────────────────────────────────────────────────────────
// Shared layout pieces
// ─────────────────────────────────────────────────────────────────────────────

const HEAD = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
</head>`

// Outer shell: light purple-tinted background, centered 600px container
const SHELL_OPEN = `
<body style="margin:0;padding:0;background-color:#f2f0f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f2f0f9;">
<tr><td align="center" style="padding:48px 20px;">
<table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;">

<!-- Wordmark -->
<tr><td style="text-align:center;padding-bottom:36px;">
  <span style="font-size:16px;font-weight:800;letter-spacing:2px;color:#18181b;">HALLYU</span><span style="font-size:16px;font-weight:800;letter-spacing:2px;color:#7c3aed;">HUB</span>
</td></tr>

<!-- Card -->
<tr><td style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
  <!-- Purple accent line -->
  <table width="100%" cellpadding="0" cellspacing="0"><tr>
    <td style="background:#7c3aed;height:4px;font-size:0;line-height:0;">&nbsp;</td>
  </tr></table>
  <!-- Content -->
  <div style="padding:48px 52px 44px;">`

const FOOTER_INNER = `
  <div style="margin-top:44px;padding-top:28px;border-top:1px solid #f4f4f5;text-align:center;">
    <p style="margin:0 0 6px;font-size:13px;font-weight:700;letter-spacing:1.5px;color:#3f3f46;">HALLYU<span style="color:#7c3aed;">HUB</span></p>
    <p style="margin:0 0 4px;font-size:12px;color:#a1a1aa;">O portal brasileiro da cultura coreana</p>
    <p style="margin:0;font-size:12px;">
      <a href="https://hallyuhub.com.br" style="color:#7c3aed;text-decoration:none;">hallyuhub.com.br</a>
    </p>
  </div>`

const SHELL_CLOSE = `
  </div>
</td></tr>

<!-- Legal footer -->
<tr><td style="padding:28px 0 0;text-align:center;">
  <p style="margin:0;font-size:11px;color:#a1a1aa;line-height:1.9;">
    Você recebeu este email porque possui uma conta no HallyuHub.<br>
    <a href="https://hallyuhub.com.br/settings/notifications" style="color:#a1a1aa;text-decoration:underline;">Gerenciar preferências de email</a>
    &nbsp;&middot;&nbsp;
    <a href="https://hallyuhub.com.br" style="color:#a1a1aa;text-decoration:underline;">hallyuhub.com.br</a>
  </p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`

// ─────────────────────────────────────────────────────────────────────────────
// Reusable UI elements
// ─────────────────────────────────────────────────────────────────────────────

function heading(text: string) {
    return `<h1 style="margin:0 0 20px;font-size:24px;font-weight:700;color:#18181b;letter-spacing:-0.5px;line-height:1.3;">${text}</h1>`
}

function paragraph(text: string) {
    return `<p style="margin:0 0 16px;font-size:15px;color:#52525b;line-height:1.75;">${text}</p>`
}

function ctaButton(href: string, label: string) {
    return `
  <div style="margin:32px 0;">
    <a href="${href}" style="display:inline-block;background:#7c3aed;color:#ffffff;font-size:14px;font-weight:600;padding:14px 32px;border-radius:8px;text-decoration:none;letter-spacing:0.1px;">${label}</a>
  </div>`
}

function infoBox(text: string) {
    return `
  <div style="margin:24px 0;padding:16px 20px;background:#faf5ff;border-left:3px solid #7c3aed;border-radius:0 8px 8px 0;">
    <p style="margin:0;font-size:13px;color:#52525b;line-height:1.6;">${text}</p>
  </div>`
}

function warningBox(text: string) {
    return `
  <div style="margin:24px 0;padding:16px 20px;background:#fffbeb;border-left:3px solid #d97706;border-radius:0 8px 8px 0;">
    <p style="margin:0;font-size:13px;color:#78350f;line-height:1.6;">${text}</p>
  </div>`
}

function featureRow(title: string, desc: string) {
    return `
  <tr>
    <td width="8" valign="top" style="padding:2px 14px 14px 0;">
      <div style="width:6px;height:6px;border-radius:50%;background:#7c3aed;margin-top:6px;"></div>
    </td>
    <td style="padding-bottom:14px;font-size:14px;color:#52525b;line-height:1.6;">
      <strong style="color:#18181b;">${title}</strong> &mdash; ${desc}
    </td>
  </tr>`
}

// ─────────────────────────────────────────────────────────────────────────────
// Templates
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_TEMPLATES = [
    {
        slug: 'welcome',
        name: 'Boas-vindas',
        subject: 'Bem-vindo ao HallyuHub, {{name}}',
        variables: ['name', 'url'],
        htmlContent: `${HEAD}${SHELL_OPEN}
${heading('Bem-vindo ao HallyuHub')}
${paragraph('Olá, <strong style="color:#18181b;">{{name}}</strong>,')}
${paragraph('Sua conta foi criada com sucesso. Estamos felizes em ter você no HallyuHub — o maior portal brasileiro dedicado à cultura coreana.')}
${paragraph('Explore tudo o que preparamos para você:')}
<table cellpadding="0" cellspacing="0" width="100%" style="margin:8px 0 8px;">
  ${featureRow('Artistas', 'perfis completos, discografias e informações dos seus ídolos')}
  ${featureRow('Notícias', 'novidades sobre K-pop, K-drama e a cultura coreana')}
  ${featureRow('Produções', 'filmes e séries para descobrir e acompanhar')}
  ${featureRow('Favoritos', 'salve e organize seus conteúdos preferidos')}
</table>
${ctaButton('{{url}}', 'Acessar minha conta')}
${paragraph('Se tiver qualquer dúvida, basta responder a este email.')}
${FOOTER_INNER}
${SHELL_CLOSE}`,
    },

    {
        slug: 'password-reset',
        name: 'Reset de Senha',
        subject: 'Redefinição de senha — HallyuHub',
        variables: ['name', 'resetUrl', 'expires'],
        htmlContent: `${HEAD}${SHELL_OPEN}
${heading('Redefinição de senha')}
${paragraph('Olá, <strong style="color:#18181b;">{{name}}</strong>,')}
${paragraph('Recebemos uma solicitação para redefinir a senha da sua conta no HallyuHub. Clique no botão abaixo para criar uma nova senha.')}
${ctaButton('{{resetUrl}}', 'Redefinir senha')}
${warningBox('Este link é válido por <strong>{{expires}}</strong> e pode ser usado apenas uma vez. Após esse prazo, será necessário solicitar um novo link.')}
${infoBox('Se você não solicitou a redefinição de senha, ignore este email. Sua senha permanece inalterada.')}
<p style="margin:20px 0 0;font-size:12px;color:#a1a1aa;line-height:1.7;">
  Ou copie e cole o endereço abaixo no seu navegador:<br>
  <a href="{{resetUrl}}" style="color:#7c3aed;word-break:break-all;text-decoration:none;">{{resetUrl}}</a>
</p>
${FOOTER_INNER}
${SHELL_CLOSE}`,
    },

    {
        slug: 'news-instant',
        name: 'Notícia Instantânea',
        subject: '{{newsTitle}} — HallyuHub',
        variables: ['name', 'newsTitle', 'newsUrl', 'artists', 'imageUrl'],
        htmlContent: `${HEAD}${SHELL_OPEN}
<p style="margin:0 0 28px;font-size:12px;font-weight:600;letter-spacing:1.5px;color:#7c3aed;text-transform:uppercase;">Nova notícia</p>
${heading('{{newsTitle}}')}
${paragraph('Olá, <strong style="color:#18181b;">{{name}}</strong>,')}
${paragraph('Uma nova publicação sobre <strong style="color:#18181b;">{{artists}}</strong> foi adicionada ao HallyuHub.')}
<div style="margin:28px 0;padding:24px;background:#fafafa;border-radius:10px;border:1px solid #f0f0f0;">
  <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:1.2px;color:#a1a1aa;text-transform:uppercase;">Artistas relacionados</p>
  <p style="margin:0;font-size:15px;font-weight:600;color:#18181b;">{{artists}}</p>
</div>
${ctaButton('{{newsUrl}}', 'Ler notícia completa')}
${paragraph('<span style="font-size:13px;color:#a1a1aa;">Você recebe este email porque segue estes artistas no HallyuHub.</span>')}
${FOOTER_INNER}
${SHELL_CLOSE}`,
    },

    {
        slug: 'news-digest',
        name: 'Resumo de Notícias',
        subject: 'Novidades {{period}} — HallyuHub',
        variables: ['name', 'period', 'newsListHtml'],
        htmlContent: `${HEAD}${SHELL_OPEN}
<p style="margin:0 0 28px;font-size:12px;font-weight:600;letter-spacing:1.5px;color:#7c3aed;text-transform:uppercase;">Resumo {{period}}</p>
${heading('Novidades dos seus artistas')}
${paragraph('Olá, <strong style="color:#18181b;">{{name}}</strong>,')}
${paragraph('Confira as publicações mais recentes sobre os artistas que você acompanha no HallyuHub.')}
<div style="margin:28px 0;">
  {{newsListHtml}}
</div>
${ctaButton('https://hallyuhub.com.br/news', 'Ver todas as notícias')}
<p style="margin:0;font-size:12px;color:#a1a1aa;line-height:1.7;">
  Você recebe este resumo porque tem notificações ativadas no HallyuHub.<br>
  <a href="https://hallyuhub.com.br/settings/notifications" style="color:#7c3aed;text-decoration:none;">Alterar frequência ou cancelar</a>
</p>
${FOOTER_INNER}
${SHELL_CLOSE}`,
    },
]
