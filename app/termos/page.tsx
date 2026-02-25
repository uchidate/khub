import type { Metadata } from 'next'
import Link from 'next/link'
import { PageTransition } from '@/components/features/PageTransition'

export const metadata: Metadata = {
  title: 'Termos de Uso | HallyuHub',
  description: 'Leia os Termos de Uso do HallyuHub — as regras que regem o acesso e uso da plataforma.',
}

const LAST_UPDATED = '24 de fevereiro de 2026'

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-32">
      <h2 className="text-lg font-black text-white uppercase tracking-tighter mb-4 flex items-center gap-3">
        <span className="text-purple-400 font-mono text-sm">§</span>
        {title}
      </h2>
      <div className="text-sm text-zinc-400 leading-relaxed space-y-3">
        {children}
      </div>
    </section>
  )
}

const TOC = [
  { id: 'aceite', label: 'Aceite dos Termos' },
  { id: 'servico', label: 'Descrição do Serviço' },
  { id: 'conta', label: 'Conta de Usuário' },
  { id: 'conduta', label: 'Conduta do Usuário' },
  { id: 'conteudo', label: 'Conteúdo e Propriedade Intelectual' },
  { id: 'privacidade', label: 'Privacidade e Dados' },
  { id: 'responsabilidade', label: 'Limitação de Responsabilidade' },
  { id: 'suspensao', label: 'Suspensão e Encerramento' },
  { id: 'alteracoes', label: 'Alterações nos Termos' },
  { id: 'contato', label: 'Contato' },
]

export default function TermosPage() {
  return (
    <PageTransition className="pt-24 md:pt-32 pb-20 px-4 sm:px-8 md:px-12">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-12">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3 block">
            Atualizado em {LAST_UPDATED}
          </span>
          <h1 className="text-4xl md:text-6xl font-display font-black text-white uppercase italic tracking-tight leading-none mb-4">
            Termos de Uso
          </h1>
          <p className="text-zinc-400 text-sm max-w-2xl">
            Ao acessar ou usar o HallyuHub, você concorda com os termos abaixo. Leia com atenção antes de criar uma conta ou usar a plataforma.
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

            <Section id="aceite" title="Aceite dos Termos">
              <p>
                Estes Termos de Uso (&quot;Termos&quot;) regem o acesso e uso do site HallyuHub, disponível em <strong className="text-zinc-300">hallyuhub.com.br</strong>, e de todos os serviços associados (coletivamente, &quot;Plataforma&quot;), operados por HallyuHub (&quot;nós&quot;, &quot;nosso&quot;).
              </p>
              <p>
                Ao acessar ou utilizar a Plataforma, você (&quot;Usuário&quot;) declara ter lido, compreendido e concordado com estes Termos. Se você não concordar com qualquer parte destes Termos, não utilize a Plataforma.
              </p>
              <p>
                O uso da Plataforma por menores de 13 anos é proibido. Usuários entre 13 e 18 anos devem ter consentimento de um responsável legal.
              </p>
            </Section>

            <Section id="servico" title="Descrição do Serviço">
              <p>
                O HallyuHub é um portal de conteúdo dedicado à cultura coreana, oferecendo:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Perfis de artistas K-Pop e grupos musicais</li>
                <li>Catálogo de dramas e filmes coreanos (K-Drama, filmes)</li>
                <li>Notícias traduzidas automaticamente para português brasileiro</li>
                <li>Sistema de favoritos e feed personalizado para usuários cadastrados</li>
                <li>Comentários e interação social nas notícias</li>
              </ul>
              <p>
                A Plataforma está em fase beta pública. Isso significa que funcionalidades podem ser adicionadas, modificadas ou removidas sem aviso prévio. Buscamos minimizar interrupções, mas não garantimos disponibilidade ininterrupta.
              </p>
            </Section>

            <Section id="conta" title="Conta de Usuário">
              <p>
                Para acessar recursos avançados (favoritos, comentários, feed personalizado), você deve criar uma conta fornecendo um endereço de e-mail válido e uma senha, ou autenticar-se via Google.
              </p>
              <p>
                Você é responsável por:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Manter a confidencialidade de suas credenciais de acesso</li>
                <li>Todas as atividades realizadas em sua conta</li>
                <li>Notificar-nos imediatamente em caso de uso não autorizado</li>
              </ul>
              <p>
                É proibido criar múltiplas contas para contornar restrições ou para fins de abuso. Reservamo-nos o direito de encerrar contas duplicadas.
              </p>
            </Section>

            <Section id="conduta" title="Conduta do Usuário">
              <p>Ao usar a Plataforma, você concorda em NÃO:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Publicar conteúdo ofensivo, difamatório, discriminatório, de ódio ou violência</li>
                <li>Assediar, ameaçar ou intimidar outros usuários</li>
                <li>Fazer spam, phishing ou distribuir malware</li>
                <li>Usar a Plataforma para fins comerciais não autorizados</li>
                <li>Fazer scraping automatizado sem autorização prévia por escrito</li>
                <li>Tentar acessar sistemas internos, bancos de dados ou contas de outros usuários</li>
                <li>Publicar informações pessoais de terceiros sem consentimento (doxxing)</li>
                <li>Violar direitos autorais ou de propriedade intelectual</li>
              </ul>
              <p>
                Nos reservamos o direito de remover qualquer conteúdo que viole estas regras e de suspender ou encerrar contas infratoras, a nosso exclusivo critério.
              </p>
            </Section>

            <Section id="conteudo" title="Conteúdo e Propriedade Intelectual">
              <p>
                <strong className="text-zinc-300">Conteúdo da Plataforma:</strong> Todo o conteúdo original do HallyuHub — incluindo design, textos, código, logotipos e a coleção curada de dados — é de nossa propriedade ou licenciado por terceiros e protegido por leis de propriedade intelectual. É proibida a reprodução, distribuição ou criação de obras derivadas sem autorização prévia.
              </p>
              <p>
                <strong className="text-zinc-300">Conteúdo de terceiros:</strong> Notícias e imagens de artistas podem ser provenientes de fontes externas (agências, portais especializados). Respeitamos os direitos autorais e removemos conteúdo mediante solicitação fundamentada para: <a href="mailto:dmca@hallyuhub.com.br" className="text-purple-400 hover:underline">dmca@hallyuhub.com.br</a>.
              </p>
              <p>
                <strong className="text-zinc-300">Conteúdo do Usuário:</strong> Ao publicar comentários ou qualquer conteúdo na Plataforma, você nos concede uma licença não exclusiva, gratuita e mundial para exibir e distribuir esse conteúdo no contexto dos nossos serviços. Você declara ter os direitos necessários sobre o conteúdo publicado.
              </p>
            </Section>

            <Section id="privacidade" title="Privacidade e Dados">
              <p>
                O tratamento de dados pessoais é regulado pela nossa <Link href="/privacidade" className="text-purple-400 hover:underline">Política de Privacidade</Link>, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).
              </p>
              <p>
                Em resumo: coletamos apenas os dados necessários para o funcionamento da Plataforma, não vendemos seus dados a terceiros e você pode solicitar a exclusão dos seus dados a qualquer momento.
              </p>
            </Section>

            <Section id="responsabilidade" title="Limitação de Responsabilidade">
              <p>
                A Plataforma é fornecida &quot;como está&quot; e &quot;conforme disponível&quot;. Não garantimos que:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>A Plataforma estará disponível ininterruptamente ou sem erros</li>
                <li>As traduções automáticas serão 100% precisas</li>
                <li>As informações sobre artistas e produções estarão sempre atualizadas</li>
              </ul>
              <p>
                Em nenhuma hipótese o HallyuHub será responsável por danos indiretos, incidentais ou consequentes decorrentes do uso ou impossibilidade de uso da Plataforma. Nossa responsabilidade total, em qualquer caso, não excederá o valor pago pelo Usuário nos últimos 12 meses (zero, para usuários do plano gratuito).
              </p>
            </Section>

            <Section id="suspensao" title="Suspensão e Encerramento">
              <p>
                Podemos suspender ou encerrar sua conta, a qualquer momento e por qualquer motivo, incluindo violação destes Termos. Em casos de violações graves, a suspensão pode ser imediata e permanente.
              </p>
              <p>
                Você pode encerrar sua conta a qualquer momento acessando as configurações do seu perfil. Após o encerramento, seus dados pessoais serão excluídos em até 30 dias, exceto quando houver obrigação legal de retenção.
              </p>
            </Section>

            <Section id="alteracoes" title="Alterações nos Termos">
              <p>
                Podemos atualizar estes Termos periodicamente. Notificaremos usuários cadastrados por e-mail sobre alterações significativas. O uso continuado da Plataforma após a publicação de novos Termos constitui aceitação das mudanças.
              </p>
              <p>
                A versão mais recente sempre estará disponível nesta página, com a data da última atualização indicada no topo.
              </p>
            </Section>

            <Section id="contato" title="Contato">
              <p>
                Para dúvidas, solicitações relacionadas a estes Termos ou questões de propriedade intelectual, entre em contato:
              </p>
              <ul className="list-none space-y-1">
                <li><strong className="text-zinc-300">E-mail geral:</strong> <a href="mailto:contato@hallyuhub.com.br" className="text-purple-400 hover:underline">contato@hallyuhub.com.br</a></li>
                <li><strong className="text-zinc-300">DMCA / Direitos autorais:</strong> <a href="mailto:dmca@hallyuhub.com.br" className="text-purple-400 hover:underline">dmca@hallyuhub.com.br</a></li>
                <li><strong className="text-zinc-300">Proteção de dados (DPO):</strong> <a href="mailto:privacidade@hallyuhub.com.br" className="text-purple-400 hover:underline">privacidade@hallyuhub.com.br</a></li>
              </ul>
              <p>
                Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da Comarca de São Paulo/SP para dirimir eventuais conflitos, com renúncia a qualquer outro, por mais privilegiado que seja.
              </p>
            </Section>

            <div className="pt-6 border-t border-white/5 flex flex-wrap gap-4 text-xs text-zinc-600">
              <Link href="/privacidade" className="hover:text-zinc-400 transition-colors">Política de Privacidade</Link>
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
