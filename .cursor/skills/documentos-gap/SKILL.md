---
name: documentos-gap
description: >-
  Gera de uma vez o pacote de PDFs do GAP (Especificação Técnica, Relatório de
  Testes e, se houver, Plano de Cutover) no layout Numen/Komatsu, no mesmo
  chat da factory ABAP (MCP user-abap-mcp-local). Use quando o usuário pedir
  todos os documentos, pacote de documentação, gerar ET + testes + cutover, ou
  documentação completa no Doc/Close. Se não houver atividade de cutover, não
  gera nenhum documento de cutover (nem PDF, HTML nem JSON).
---

# Pacote de documentos do GAP

Orquestra as skills filhas. Não reimplementar layout. Não inventar cutover.

| Ordem | Artefacto | Skill | Saída |
| --- | --- | --- | --- |
| 1 | Especificação Técnica | [especificacao-tecnica-gap](../especificacao-tecnica-gap/SKILL.md) | `06_doc/ET-<GAP-ID>.pdf` |
| 2 | Relatório de Testes | [relatorio-testes-gap](../relatorio-testes-gap/SKILL.md) | `05_testes/RT-<GAP-ID>.pdf` |
| 3 | Plano de Cutover | [cutover-gap](../cutover-gap/SKILL.md) | `06_doc/CO-<GAP-ID>.pdf` **só se o gate passar** |

Ler a SKILL.md da filha **antes** de gerar cada PDF.

## Gate de cutover (ressalva)

**Se não houver atividade de cutover, não gerar nenhum documento de cutover.**

Proibido nessa situação: `co-data.json`, `CO-*.html`, `CO-*.pdf`, placeholders “Não se aplica”, plano vazio.

Há cutover **somente** se pelo menos um item de [criterio-cutover.md](criterio-cutover.md) for verdadeiro com evidência (spec, `gap.json`, conversa, pacote/transporte confirmado). Na dúvida: **não gerar** e declarar a ressalva.

Na resposta final, obrigatório:

> **Ressalva — cutover:** omitido porque não há atividade de implantação. Nenhum PDF/HTML/JSON de cutover foi gerado.

ou, se o gate passou:

> **Ressalva — cutover:** gerado (`CO-…pdf`) porque [motivo concreto].

## Fluxo

1. `init_agent` uma vez. `factory_orchestrator` `status` com `workspace_root` absoluto.
2. Ler `gap.json` + spec em `00_spec/`.
3. **Decidir cutover** com [criterio-cutover.md](criterio-cutover.md). Registrar a decisão (gerar / omitir + motivo). Não perguntar só para preencher plano fictício.
4. Gerar a ET (skill filha).
5. Gerar o Relatório de Testes (skill filha). Se Unit/ATC ainda não rodaram neste chat, executar as tools da skill de testes **antes** do PDF.
6. Se o gate de cutover passou: gerar o Plano de Cutover (skill filha). Se falhou: pular o passo 6 por completo.
7. Listar os PDFs gerados e a ressalva de cutover.

Falha em ET ou testes: parar, não seguir para o próximo, não fingir PDF.

Logos Numen e Komatsu vêm de `assets/branding.json` (e JPG) de cada skill filha. O `render.mjs` as embute no HTML e copia os JPG para a pasta de saída. Não gerar HTML com `src` apontando para `assets/` do GAP.

## Compartilhar contexto

Características do GAP (id, request, sistema, módulo, EF, objetos) são as mesmas nos três. Não reler o SAP à toa: `adt_read_source` na ET; `adt_run_tests` / `adt_run_atc` nos testes; `adt_list_package_objects` só se o cutover for gerado.
