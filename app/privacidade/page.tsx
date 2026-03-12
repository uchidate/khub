import type { Metadata } from 'next'
import Link from 'next/link'
import { PageTransition } from '@/components/features/PageTransition'

export const metadata: Metadata = {
  title: 'Política de Privacidade | HallyuHub',
  description: 'Saiba como o HallyuHub coleta, usa e protege seus dados pessoais, em conformidade com a LGPD.',
}

const LAST_UPDATED = '24 de fevereiro de 2026'

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-32">
      <h2 className="text-lg font-black text-white uppercase tracking-tighter mb-4 flex items-center gap-3">
        <span className="text-pink-400 font-mono text-sm">§</span>
        {title}
      </h2>
      <div className="text-sm text-zinc-400 leading-relaxed space-y-3">
        {children}
      </div>
    </section>
  )
}

const TOC = [
  { id: 'intro', label: 'Introdução' },
  { id: 'coleta', label: 'Dados que coletamos' },
  { id: 'uso', label: 'Como usamos seus dados' },
  { id: 'compartilhamento', label: 'Compartilhamento' },
  { id: 'cookies', label: 'Cookies e rastreamento' },
  { id: 'retencao', label: 'Retenção de dados' },
  { id: 'direitos', label: 'Seus direitos (LGPD)' },
  { id: 'menores', label: 'Menores de idade' },
  { id: 'seguranca', label: 'Segurança' },
  { id: 'alteracoes', label: 'Alterações' },
  { id: 'contato', label: 'Contato e DPO' },
]

export default function PrivacidadePage() {
  return (
    <PageTransition className="pt-24 md:pt-32 pb-20 px-4 sm:px-8 md:px-12">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-12">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3 block">
            Atualizado em {LAST_UPDATED}
          </span>
          <h1 className="text-4xl md:text-6xl font-display font-black text-white uppercase italic tracking-tight leading-none mb-4">
            Política de<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
              Privacidade
            </span>
          </h1>
          <p className="text-zinc-400 text-sm max-w-2xl">
            Sua privacidade é importante para nós. Esta política explica quais dados coletamos, como os usamos e quais são os seus direitos — em conformidade com a <strong className="text-zinc-300">Lei Geral de Proteção de Dados (LGPD, Lei nº 13.709/2018)</strong>.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">

          {/* Sumário */}
          <aside className="lg:w-56 shrink-0">
            <div className="lg:sticky lg:top-32 glass-card border-white/5 rounded-2xl p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">Sumário</p>
              <nav className="space-y-1">
                {TOC.map(item => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="block text-xs text-zinc-500 hover:text-white transition-colors py-1 px-2 rounded hover:bg-white/5"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Conteúdo */}
          <article className="flex-1 space-y-10">

            <Section id="intro" title="Introdução">
              <p>
                Esta Política de Privacidade aplica-se ao site HallyuHub (<strong className="text-zinc-300">hallyuhub.com.br</strong>) e a todos os serviços oferecidos pela plataforma. Ao usar o HallyuHub, você consente com as práticas descritas neste documento.
              </p>
              <p>
                Somos o controlador dos seus dados pessoais nos termos da LGPD. Tratamos dados de forma transparente, com finalidade definida e pelo tempo mínimo necessário.
              </p>
            </Section>

            <Section id="coleta" title="Dados que coletamos">
              <p><strong className="text-zinc-300">Dados fornecidos por você:</strong></p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong className="text-zinc-300">Cadastro:</strong> nome, endereço de e-mail e senha (armazenada com hash bcrypt)</li>
                <li><strong className="text-zinc-300">Login social:</strong> nome e e-mail obtidos do Google (se você escolher autenticar por esse meio)</li>
                <li><strong className="text-zinc-300">Comentários:</strong> texto publicado por você nas notícias</li>
                <li><strong className="text-zinc-300">Interações:</strong> favoritos, avaliações e preferências de conteúdo</li>
              </ul>
              <p><strong className="text-zinc-300">Dados coletados automaticamente:</strong></p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong className="text-zinc-300">Logs de acesso:</strong> endereço IP, navegador, sistema operacional, páginas visitadas e horários — para segurança e diagnóstico</li>
                <li><strong className="text-zinc-300">Cookies de sessão:</strong> necessários para manter você logado</li>
                <li><strong className="text-zinc-300">Dados analíticos:</strong> comportamento de navegação anonimizado via Google Analytics 4</li>
              </ul>
              <p>
                Não coletamos dados de categorias sensíveis (origem racial, convicções religiosas, saúde, biometria, etc.).
              </p>
            </Section>

            <Section id="uso" title="Como usamos seus dados">
              <p>Usamos seus dados para as seguintes finalidades (bases legais da LGPD em parênteses):</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong className="text-zinc-300">Fornecer o serviço</strong> — autenticação, feed personalizado, favoritos (execução de contrato)</li>
                <li><strong className="text-zinc-300">Comunicações transacionais</strong> — confirmação de cadastro, redefinição de senha, notificações de novidades nos seus artistas favoritos (execução de contrato)</li>
                <li><strong className="text-zinc-300">Segurança</strong> — detecção de fraudes, abuso e acesso não autorizado (interesse legítimo)</li>
                <li><strong className="text-zinc-300">Melhorias da plataforma</strong> — análise de uso anonimizado para entender como funcionalidades são utilizadas (interesse legítimo)</li>
                <li><strong className="text-zinc-300">Comunicações de marketing</strong> — novidades, lançamentos premium e promoções, <em>somente com seu consentimento explícito</em> (consentimento)</li>
              </ul>
            </Section>

            <Section id="compartilhamento" title="Compartilhamento de dados">
              <p>
                <strong className="text-white">Não vendemos seus dados pessoais.</strong> Podemos compartilhá-los apenas com:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong className="text-zinc-300">Google Analytics:</strong> dados de navegação anonimizados para análise de tráfego</li>
                <li><strong className="text-zinc-300">Google OAuth:</strong> somente para autenticação, quando você escolhe &quot;Entrar com Google&quot;</li>
                <li><strong className="text-zinc-300">Provedores de infraestrutura:</strong> hospedagem e banco de dados (dados processados sob acordo de confidencialidade)</li>
                <li><strong className="text-zinc-300">Autoridades públicas:</strong> quando exigido por lei ou ordem judicial</li>
              </ul>
              <p>
                Qualquer terceiro que processe dados em nosso nome está contratualmente obrigado a tratar esses dados com segurança e confidencialidade, de acordo com a LGPD.
              </p>
            </Section>

            <Section id="cookies" title="Cookies e rastreamento">
              <p>Usamos três categorias de cookies:</p>
              <div className="space-y-3">
                <div className="p-4 glass-card border-white/5 rounded-xl">
                  <p className="font-bold text-zinc-300 mb-1">Essenciais</p>
                  <p>Necessários para o funcionamento do site (sessão de login, preferências de tema). Não podem ser desativados.</p>
                </div>
                <div className="p-4 glass-card border-white/5 rounded-xl">
                  <p className="font-bold text-zinc-300 mb-1">Analíticos (Google Analytics 4)</p>
                  <p>Coletam dados anonimizados sobre como você usa o site. IP anonimizado. Você pode optar por não participar nas configurações do seu perfil ou usando extensões de bloqueio de rastreamento.</p>
                </div>
                <div className="p-4 glass-card border-white/5 rounded-xl">
                  <p className="font-bold text-zinc-300 mb-1">Publicitários (Google AdSense)</p>
                  <p>Usados para exibir anúncios relevantes. Somente ativados se você consentir. Você pode gerenciar preferências em <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">adssettings.google.com</a>.</p>
                </div>
              </div>
            </Section>

            <Section id="retencao" title="Retenção de dados">
              <p>Mantemos seus dados pelo tempo necessário para cumprir as finalidades descritas:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong className="text-zinc-300">Dados de conta:</strong> enquanto sua conta estiver ativa ou até solicitação de exclusão</li>
                <li><strong className="text-zinc-300">Logs de segurança:</strong> até 90 dias</li>
                <li><strong className="text-zinc-300">Dados analíticos (Google Analytics):</strong> 14 meses (configuração padrão)</li>
                <li><strong className="text-zinc-300">Backup de banco de dados:</strong> até 30 dias após geração</li>
              </ul>
              <p>
                Após o encerramento da conta, seus dados pessoais são excluídos em até 30 dias. Comentários publicados podem ser anonimizados (não excluídos) para manter a integridade das discussões.
              </p>
            </Section>

            <Section id="direitos" title="Seus direitos (LGPD)">
              <p>Nos termos da LGPD, você tem direito a:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong className="text-zinc-300">Confirmação e acesso:</strong> saber se tratamos seus dados e obter uma cópia</li>
                <li><strong className="text-zinc-300">Correção:</strong> solicitar atualização de dados incorretos ou incompletos</li>
                <li><strong className="text-zinc-300">Anonimização, bloqueio ou eliminação:</strong> dos dados desnecessários ou tratados em desconformidade</li>
                <li><strong className="text-zinc-300">Portabilidade:</strong> receber seus dados em formato estruturado</li>
                <li><strong className="text-zinc-300">Eliminação:</strong> solicitar a exclusão dos dados tratados com base no consentimento</li>
                <li><strong className="text-zinc-300">Revogação do consentimento:</strong> a qualquer momento, sem custo</li>
                <li><strong className="text-zinc-300">Oposição:</strong> opor-se a tratamentos que causem dano</li>
                <li><strong className="text-zinc-300">Reclamação:</strong> perante a ANPD (Autoridade Nacional de Proteção de Dados)</li>
              </ul>
              <p>
                Para exercer esses direitos, entre em contato pelo e-mail <a href="mailto:privacidade@hallyuhub.com.br" className="text-pink-400 hover:underline">privacidade@hallyuhub.com.br</a>. Responderemos em até 15 dias úteis.
              </p>
            </Section>

            <Section id="menores" title="Menores de idade">
              <p>
                O HallyuHub não é direcionado a crianças menores de 13 anos e não coletamos intencionalmente dados pessoais de menores de 13 anos. Usuários entre 13 e 18 anos necessitam de consentimento de um responsável legal.
              </p>
              <p>
                Se você tiver conhecimento de que um menor nos forneceu dados sem autorização, entre em contato com <a href="mailto:privacidade@hallyuhub.com.br" className="text-pink-400 hover:underline">privacidade@hallyuhub.com.br</a> e excluiremos os dados imediatamente.
              </p>
            </Section>

            <Section id="seguranca" title="Segurança">
              <p>
                Adotamos medidas técnicas e organizacionais para proteger seus dados:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Comunicação criptografada via HTTPS/TLS em todo o site</li>
                <li>Senhas armazenadas com hash bcrypt (nunca em texto plano)</li>
                <li>Controle de acesso por função (admin/usuário)</li>
                <li>Backups criptografados com retenção de 30 dias</li>
                <li>Infraestrutura isolada com firewall e monitoramento</li>
              </ul>
              <p>
                Em caso de incidente de segurança que afete seus dados, você será notificado dentro do prazo estabelecido pela LGPD (72h para comunicação à ANPD quando aplicável).
              </p>
            </Section>

            <Section id="alteracoes" title="Alterações nesta Política">
              <p>
                Podemos atualizar esta Política periodicamente. Usuários cadastrados serão notificados por e-mail sobre alterações relevantes. A data de última atualização está sempre indicada no topo da página.
              </p>
            </Section>

            <Section id="contato" title="Contato e DPO">
              <p>
                Para exercer seus direitos, tirar dúvidas ou fazer solicitações relacionadas a dados pessoais:
              </p>
              <ul className="list-none space-y-1">
                <li><strong className="text-zinc-300">Privacidade / LGPD:</strong> <a href="mailto:privacidade@hallyuhub.com.br" className="text-pink-400 hover:underline">privacidade@hallyuhub.com.br</a></li>
                <li><strong className="text-zinc-300">Contato geral:</strong> <a href="mailto:contato@hallyuhub.com.br" className="text-pink-400 hover:underline">contato@hallyuhub.com.br</a></li>
              </ul>
              <p>
                Você também pode registrar reclamações diretamente na <a href="https://www.gov.br/anpd/pt-br" target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:underline">ANPD (Autoridade Nacional de Proteção de Dados)</a>.
              </p>
            </Section>

            <div className="pt-6 border-t border-white/5 flex flex-wrap gap-4 text-xs text-zinc-600">
              <Link href="/termos" className="hover:text-zinc-400 transition-colors">Termos de Uso</Link>
              <span>·</span>
              <Link href="/faq" className="hover:text-zinc-400 transition-colors">FAQ</Link>
              <span>·</span>
              <Link href="/about" className="hover:text-zinc-400 transition-colors">Sobre nós</Link>
            </div>

          </article>
        </div>
      </div>
    </PageTransition>
  )
}
