/**
 * Detecção passiva de robôs de busca por User-Agent.
 *
 * Retorna o nome canônico do bot (ex: "Googlebot") ou null se for humano.
 * Não afeta o comportamento da resposta — apenas para logging.
 */

interface BotMatch {
    name: string
    /** Padrão a buscar no User-Agent (case-insensitive) */
    pattern: RegExp
}

const BOT_PATTERNS: BotMatch[] = [
    // Google
    { name: 'Googlebot',             pattern: /Googlebot(?!-Image|-Video)/i },
    { name: 'Googlebot-Image',       pattern: /Googlebot-Image/i },
    { name: 'Googlebot-Video',       pattern: /Googlebot-Video/i },
    { name: 'Google-InspectionTool', pattern: /Google-InspectionTool/i },
    { name: 'AdsBot-Google',         pattern: /AdsBot-Google/i },
    { name: 'GoogleOther',           pattern: /GoogleOther/i },
    // Microsoft / Bing
    { name: 'Bingbot',               pattern: /bingbot/i },
    { name: 'BingPreview',           pattern: /BingPreview/i },
    { name: 'MicrosoftPreview',      pattern: /MicrosoftPreview/i },
    // Apple
    { name: 'Applebot',              pattern: /Applebot/i },
    // DuckDuckGo
    { name: 'DuckDuckBot',           pattern: /DuckDuckBot/i },
    // Yahoo
    { name: 'Slurp',                 pattern: /Slurp/i },
    // Yandex
    { name: 'YandexBot',             pattern: /YandexBot/i },
    // Baidu
    { name: 'Baiduspider',           pattern: /Baiduspider/i },
    // Facebook / Meta
    { name: 'FacebookBot',           pattern: /facebookexternalhit|FacebookBot/i },
    // Twitter / X
    { name: 'Twitterbot',            pattern: /Twitterbot/i },
    // LinkedIn
    { name: 'LinkedInBot',           pattern: /LinkedInBot/i },
    // Discord
    { name: 'Discordbot',            pattern: /Discordbot/i },
    // Telegram
    { name: 'TelegramBot',           pattern: /TelegramBot/i },
    // WhatsApp
    { name: 'WhatsApp',              pattern: /WhatsApp/i },
    // Slack
    { name: 'Slackbot',              pattern: /Slackbot/i },
    // SEO crawlers
    { name: 'SemrushBot',            pattern: /SemrushBot/i },
    { name: 'AhrefsBot',             pattern: /AhrefsBot/i },
    { name: 'MJ12bot',               pattern: /MJ12bot/i },
    { name: 'DotBot',                pattern: /DotBot/i },
    { name: 'PetalBot',              pattern: /PetalBot/i },
    // Generic
    { name: 'Sogou',                 pattern: /Sogou/i },
    { name: 'Exabot',                pattern: /Exabot/i },
]

/**
 * Detecta o nome do bot pelo User-Agent.
 * @returns nome canônico do bot ou null se humano/desconhecido
 */
export function detectBot(userAgent: string | null): string | null {
    if (!userAgent) return null
    for (const { name, pattern } of BOT_PATTERNS) {
        if (pattern.test(userAgent)) return name
    }
    return null
}

/**
 * Grupos de bots para exibição (charts, filtros).
 */
export const BOT_GROUPS: Record<string, string[]> = {
    'Google':    ['Googlebot', 'Googlebot-Image', 'Googlebot-Video', 'Google-InspectionTool', 'AdsBot-Google', 'GoogleOther'],
    'Bing':      ['Bingbot', 'BingPreview', 'MicrosoftPreview'],
    'Social':    ['FacebookBot', 'Twitterbot', 'LinkedInBot', 'Discordbot', 'TelegramBot', 'WhatsApp', 'Slackbot'],
    'SEO':       ['SemrushBot', 'AhrefsBot', 'MJ12bot', 'DotBot', 'PetalBot'],
    'Outros':    ['Applebot', 'DuckDuckBot', 'Slurp', 'YandexBot', 'Baiduspider', 'Sogou', 'Exabot'],
}

export function getBotGroup(botName: string): string {
    for (const [group, bots] of Object.entries(BOT_GROUPS)) {
        if (bots.includes(botName)) return group
    }
    return 'Outros'
}
