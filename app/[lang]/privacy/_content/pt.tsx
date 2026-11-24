// プライバシーポリシーの本文（ブラジルのポルトガル語）。ja.tsx の 1〜6 と同じ内容にそろえる
// データの扱いを変えたら ja.tsx・en.tsx と一緒に直す

import Section from './Section'

export default function PrivacyPt() {
  return (
    <>
      <Section title="1. Informações coletadas">
        <p>O VeloAva obtém as seguintes informações por meio da API do Strava:</p>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li>Perfil do atleta (nome, sexo)</li>
          <li>Dados de atividades (distância, velocidade, ganho de elevação, potência)</li>
          <li>Um token de acesso temporário (usado só durante o diagnóstico; o VeloAva se desconecta do Strava logo depois)</li>
        </ul>
        <p className="mt-2">Também coletamos, de forma anônima, visualizações de página e cliques (início do diagnóstico, botões de compartilhar) com o Google Analytics 4.</p>
      </Section>

      <Section title="2. Como usamos as informações">
        <p>As informações são usadas apenas para gerar o diagnóstico do seu personagem ciclista. Nunca são usadas para marketing ou publicidade, nem vendidas a terceiros.</p>
      </Section>

      <Section title="3. Armazenamento dos dados">
        <p>O VeloAva não salva em seus servidores os dados de atividades obtidos do Strava. O resultado do diagnóstico existe apenas como parâmetro da URL no seu navegador e desaparece quando você o fecha.</p>
        <p>Para comparar com o diagnóstico anterior, o resultado mais recente de cada período de análise (tipo de personagem, pontuações, período e data) é salvo no localStorage do seu navegador. Essa informação nunca é enviada a um servidor e fica só no seu navegador. O palpite que você escolhe antes do diagnóstico também fica salvo temporariamente no navegador para a revelação e é apagado depois que o resultado aparece. Se você escolher um idioma no topo da página, ele é salvo em um cookie (veloava_locale) por um ano.</p>
      </Section>

      <Section title="4. Dados enviados a serviços de terceiros">
        <p>Enviamos dados ao seguinte serviço externo:</p>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li><span className="text-white/70 font-medium">Google Analytics</span> — coleta estatísticas de uso anônimas (visualizações de página, cliques e o tipo que você chutou antes do diagnóstico). Não inclui informações que identifiquem você nem dados do Strava.</li>
        </ul>
        <p className="mt-2">Os dados obtidos do Strava nunca são fornecidos a terceiros, incluindo serviços de IA.</p>
      </Section>

      <Section title="5. Sobre a API do Strava">
        <p>O VeloAva usa a API oficial do Strava. Usa apenas a permissão de leitura de atividades públicas e visíveis para seguidores (atividades em “Somente você” só são lidas se você escolher “Incluir pedais em ‘Somente você’” antes do diagnóstico) e nunca grava, altera ou apaga nenhum dado. Para a política de privacidade do Strava, veja <span className="text-orange-400">strava.com/legal/privacy</span>.</p>
      </Section>

      <Section title="6. Contato">
        <p>Para dúvidas sobre privacidade, entre em contato pelo e-mail abaixo.</p>
        <p className="mt-2">
          <a href="mailto:veloava@aoshika.net" data-ga-event="ui_click" data-ga-id="contact_mail" className="text-orange-400 hover:underline">veloava@aoshika.net</a>
        </p>
      </Section>
    </>
  )
}
