# Riscos, limitações e roadmap de automação

Documento de apoio ao MVP. Cobre (a) os riscos e limitações do sistema —
especialmente disponibilidade de dados e scraping — e (b) quais partes podem,
no futuro, usar APIs ou parsing de e-mail, mantendo o núcleo manual e simples.

---

## 1. Princípio: por que o v1 é manual

Não existe uma fonte pública, gratuita e estável de tarifas aéreas e
disponibilidade de assentos-prêmio. Preços são dinâmicos, personalizados e
mudam o tempo todo. Por isso o v1 é **100% entrada manual**: é útil desde o
primeiro dia, não depende de nenhuma API paga e não viola termos de uso.

O valor do sistema é o **método** (alertas + flexibilidade + aeroportos
alternativos + milhas + gatilhos de compra), não a coleta automática de dados.

## 2. Riscos e limitações

| Tema | Limitação | Mitigação no sistema |
|------|-----------|----------------------|
| **Scraping** | Raspar Google Flights / sites de companhias viola os termos de uso, quebra com frequência (anti-bot) e tem risco jurídico. | **Não fazemos scraping.** Entrada manual + (futuro) parsing do seu próprio e-mail e APIs oficiais. |
| **Disponibilidade de dados** | Tarifas e assentos-prêmio não têm API pública gratuita e confiável. | Observações de preço manuais formam o histórico; médias melhoram com mais amostras. |
| **Frescor dos dados** | Os dados valem o quanto o usuário os mantém atualizados. | Página de Rotina (diária/semanal) reforça o hábito de registrar. |
| **Nota do deal** | É uma heurística calibrada pelo método, não uma garantia. Depende de uma boa baseline de preço. | Nota mostra o detalhamento ("como foi calculada"); referência manual por rota disponível. |
| **"Bom demais para ser verdade"** | Erros tarifários e golpes existem. | Aviso automático quando o preço cai >50% abaixo da média; checklist de confirmação no site oficial. |
| **Milhas** | Disponibilidade muda em tempo real e não é modelada. | Valor por milha calculado sobre o que o usuário observa; sem promessa de disponibilidade. |
| **Escopo** | Single-user, SQLite local, sem autenticação. | Adequado a uso pessoal local; **não** publicar como está sem auth/migração de banco. |
| **Não é booking** | O sistema não compra passagens. | Por design: sempre comprar no site oficial da companhia. |

## 3. O que pode usar APIs depois (opcional)

Tudo abaixo é **opcional** e deve escrever pelo mesmo ponto de entrada validado
(`POST /api/observacoes` ou `/api/oportunidades`), para que a lógica de
pontuação continue agnóstica à fonte dos dados.

| Camada | Opção | Custo / risco | Observação |
|--------|-------|---------------|------------|
| **Parsing de e-mail** | Ler alertas do Google Flights / Skyscanner na sua própria caixa (IMAP) e criar Observações. | Baixo — é o seu inbox, sem scraping. | **Primeira automação recomendada.** |
| **Tarifas em dinheiro** | Amadeus Self-Service, Duffel, Kiwi Tequila. | APIs oficiais; limites de uso, cobertura parcial, partes pagas. | Bom para alimentar Observações de monitoramento. |
| **Assentos-prêmio (milhas)** | Seats.aero API, AwardFares. | Pago; verificar termos. | Popula Oportunidades de business com milhas. |
| **Companhias / NDC** | APIs oficiais variam; em geral restritas a parceiros. | Acesso gated. | Caso a caso. |
| **Câmbio** | API de câmbio (ex.: exchangerate.host). | Gratuito/baixo. | Normalizar multi-moeda. |

### Seam de integração
Manter uma fronteira de **ingestão**: qualquer fonte (manual, parser de e-mail,
job de API) grava através das mesmas rotas validadas. O enriquecimento
(`src/lib/enrich.ts`) e as fórmulas (`scoring`, `miles`, `triggers`, `safety`)
permanecem puros e testados, sem saber de onde o dado veio.

## 4. Não-objetivos (explícitos)

- Não fazer scraping de Google Flights ou sites de companhias.
- Não prometer descontos garantidos nem "sistema secreto".
- Não ser um motor de reserva — a compra é sempre no site oficial.
- Não depender de API paga para o v1 ser útil.

## 5. Fase 3 — arquitetura de ingestão automática (sem OAuth ainda)

O ponto de entrada unificado já existe: `src/lib/ingestao.ts → ingerirTexto()`.
Qualquer fonte futura chama essa função com `{ textoBruto, assunto?, remetente? }`
e recebe `{ parsed: AlertaParseado, hash: string }`. Nenhuma mudança no parser,
na lógica de scoring ou nas APIs é necessária.

### Caminho recomendado para automação (sem OAuth/scraping)

| Passo | O que fazer | Risco |
|-------|-------------|-------|
| **5a. Encaminhamento de e-mail** | Criar filtro no Gmail que encaminha alertas do Google Flights / Skyscanner para um endereço próprio; processar via webhook. | Baixo — é o seu próprio inbox. |
| **5b. IMAP local** | Script Node.js usa `node-imap` + `mailparser` para ler a pasta de alertas sem OAuth; chama `ingerirTexto()` para cada mensagem nova. | Baixo — credenciais locais, sem terceiros. |
| **5c. Webhook / Zapier** | Zapier ou Make intercepta o e-mail e posta o corpo via `POST /api/importacoes` com `criarObservacao: true`. | Baixo — depende de serviço externo, mas sem scraping. |

### Restrições mantidas
- **Sem OAuth do Google** (escopo é v1 pessoal, local).
- **Sem scraping** de Google Flights, Skyscanner ou companhias aéreas.
- **Sem compra automática** — o sistema apenas detecta e pontua; a decisão de compra é sempre do usuário no site oficial.
- `ingerirTexto()` e `POST /api/importacoes` são os únicos pontos de entrada válidos;
  qualquer automação futura **deve** passar por eles.

## 6. Próximos passos sugeridos (pequenos incrementos)

1. Parser de e-mail de alertas (IMAP local, sem OAuth) → cria Observações automaticamente via `ingerirTexto()`.
2. Exportar/importar CSV de Observações (backup e carga em massa).
3. Gráfico de tendência de preço por rota (a partir das Observações).
4. Integração opcional com uma API oficial de tarifas (atrás de feature flag).
