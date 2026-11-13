---
name: komatsu-desenvolvimento-novo
description: >-
  Desenvolve objetos ABAP novos da Komatsu a partir da
  especificação funcional, começando do zero. Use para GAPs classificados como
  desenvolvimento novo, na Análise (Estágio 1) ou no Dev (Estágio 2) do
  factory_orchestrator. Não use para remediação, conversão de legado ou
  simplificação de objetos existentes.
---

# Desenvolvimento novo — Komatsu

Esta skill cobre somente GAPs de desenvolvimento novo. Os objetos e a lógica
serão implementados do zero conforme a EF, seguindo Clean Core e o Workbook
ABAP Komatsu. Código existente pode ser consultado apenas quando
for uma dependência explicitamente reutilizada ou quando a EF exigir integração
com ele; isso não transforma o desenvolvimento em conversão.

Se a EF indicar remediação, simplificação ou conversão de legado, esta skill
não se aplica. Não reclassificar esse trabalho como novo.

## Classificação e entrada no factory_orchestrator

Antes do `factory_orchestrator` `start`/`kickoff`, antes de gravar o
`DEVELOPMENT_PLAN` e antes de criar ou salvar qualquer objeto:

1. Confirmar que a EF descreve um desenvolvimento novo, implementado do zero.
   Se o tipo estiver ambíguo, registrar a dúvida e pedir esclarecimento; não
   presumir que seja novo.
2. Ler a EF e decompor os requisitos funcionais com seção e página. Identificar
   transações, regras, dados, autorizações, mensagens, integrações, parâmetros,
   objetos explicitamente pedidos e critérios de aceite.
3. Ler a seção aplicável de
   `KOMATSU/_workbook/workbook-komatsu.md` antes de propor
   nomes, arquitetura ou criar objetos. O Workbook define nomenclatura,
   Clean Core, tiers e qualidade.
4. Na Análise (Estágio 1), aplicar as regras desta skill depois das fases 1–2
   do `spec_analyzer` e antes de concluir o plano.
5. No Dev (Estágio 2), reabrir esta skill antes da primeira gravação.
6. Na Review, usar `auditoria-desenvolvimento`.

## Preparação antes de criar objetos

1. Executar `init_agent` antes das ferramentas SAP.
2. Descobrir os sistemas disponíveis e confirmar qual é o S/4 de
   desenvolvimento. Para um GAP novo, não abrir ECS/SCS para procurar código
   de origem nem copiar implementação legada.
3. Executar
   `knowledge_graph({ operation: "pre_flight", ferramenta: "komatsu" })`.
4. Ler a rule `pacote-gap-komatsu.mdc` e derivar o pacote do GAP a partir do
   módulo, cenário empresarial e ID do GAP. Definir o tier conforme a
   arquitetura aprovada e as regras do Workbook. Validar o pai e o pacote no
   DS4 (`TDEVC`); reutilizar o pacote do GAP se já existir. Não inventar
   sigla.
5. Usar a request de transporte informada pelo usuário ou registrada no
   `gap.json`. Se não houver request, perguntar; não inventar.
6. Depois do kickoff, conferir no workspace se existem `gap.json` e as pastas
   `00_spec` a `06_doc`. Se faltarem, criar a estrutura local usando os dados
   devolvidos pela factory e enviar `gap_json` nas chamadas seguintes.
7. Garantir que a EF esteja preservada em
   `<gap_path>/00_spec/`. Não sobrescrever nem editar o arquivo original da EF.
   Se a origem do arquivo não estiver clara, localizar o arquivo fornecido para
   este GAP antes de copiar; não selecionar uma EF de outro GAP.

## Arquitetura e implementação

- Implementar somente requisitos da EF e dependências necessárias para
  atendê-los. Não inventar regra de negócio, campo, tabela, autorização ou
  comportamento.
- Seguir Clean Core e o nível permitido para cada objeto. Preferir APIs e
  CDS released (C1) quando adequados. Acesso clássico ou API não released
  precisa de justificativa técnica e validação conforme o Workbook.
- Para parâmetros funcionais ou técnicos definidos pela EF, consultar 
  `parametros-komatsu.mdc` 
- Se a EF pedir uma parametrização que não possa ser atendida com a estrutura
  existente, explicitar a lacuna no plano; não criar mecanismo alternativo sem
  autorização funcional e técnica.
- Nomenclatura, pacote, tier, cabeçalho, mensagens, classes, tabelas e demais
  artefatos seguem a seção aplicável do Workbook.
- Não criar objetos auxiliares vazios ou não usados. Cada objeto novo deve ter
  requisito, finalidade e pacote identificados no plano.
- Antes de salvar, conferir se cada dependência existente está disponível e é
  adequada no DS4. Não recriar objeto compartilhado de outro GAP; reutilizá-lo
  conforme a EF e as regras de ownership.
- Seguir o ciclo do MCP: ler o estado atual do objeto antes de salvar,
  preservar alterações alheias, gravar sequencialmente, ativar e executar
  `adt_check_syntax` quando a ativação falhar. Não executar gravações em
  paralelo.

## Plano do Estágio 1

Registrar em `01_analise/DEVELOPMENT_PLAN.md` (ou no destino indicado pela
factory):

- escopo funcional e rastreabilidade requisito → objeto;
- arquitetura proposta e justificativas de Clean Core;
- inventário de objetos novos, tipo, nome proposto, tier e pacote;
- dependências existentes no DS4 e integrações;
- parametrização consultar `parametros-komatsu.mdc` 
- autorizações, mensagens, dados e pré-requisitos de configuração;
- cenários de teste e resultados esperados derivados da EF;
- pendências funcionais, riscos e critérios de aceite;
- plano de ATC, testes, Review e documentação.

Perguntar ao funcional somente quando houver ambiguidade ou requisito
insuficiente para uma decisão que afete o comportamento. Registrar cada
pergunta com seção/página, trecho da EF e a decisão necessária.

## Fluxo de Dev e verificação

1. Confirmar objetos, nomes, pacote, tier e request contra o plano aprovado.
2. Criar os objetos do zero conforme a EF e o Workbook;
3. Implementar testes por cenário da EF, cobrindo resultados positivos,
   negativos e limites relevantes. Os testes devem exercitar o código de
   produção e usar test doubles/massa controlada quando apropriado.
4. Executar verificações de sintaxe/ativação, testes e ATC; registrar as saídas
   reais com data. Worklist vazia ou execução incompleta não conta como ATC
   aprovado.
5. Revisar com `auditoria-desenvolvimento`; resolver achados críticos e altos
   antes de encerrar o GAP.
6. Manter a EF original em `00_spec/` e salvar artefatos técnicos nas pastas
   definidas pelo fluxo, por exemplo plano em `01_analise/` e documentação em
   `06_doc/`.

## Limites

- Não criar funcionalidades adicionais como “melhoria” sem requisito aprovado.
- Não alterar os objetos centrais de parametrização Komatsu nem inventar uma
  solução paralela.
- Se o escopo deixar de ser novo e passar a exigir conversão ou manutenção de
  objeto existente, parar e encaminhar para o fluxo apropriado.
