---
name: relatorio-testes-gap
description: >-
  Gera o Relatório de Testes do GAP no layout PDF Numen/Leroy Merlin, com
  evidências das tools MCP user-abap-mcp-local (adt_run_tests, adt_run_atc,
  adt_read_atc_results, adt_read_runtime_errors, add_test_scenario). Use no
  mesmo chat da factory (estágios ATC e Tests, pastas 04_atc e 05_testes), ou
  quando o usuário pedir relatório de testes, evidência ABAP Unit, ATC, PDF de
  testes ou parecer de qualidade do GAP.
---

# Relatório de Testes do GAP (layout PDF)

Não redigir o relatório em Markdown solto. Preencher `template.html` via `scripts/render.mjs`.

## Quando

- `factory_orchestrator` em **ATC** (`04_atc/`) ou **Tests** (`05_testes/`).
- Pedido de relatório de testes / ABAP Unit / ATC / parecer de qualidade no mesmo chat do desenvolvimento.

## Fluxo

1. `init_agent` (MCP `user-abap-mcp-local`) — antes de qualquer tool SAP.
2. `factory_orchestrator` `status` com `workspace_root` absoluto.
3. Ler `gap.json`, spec em `00_spec/`, cenários em `add_test_scenario` / `05_testes/`.
4. Para cada CLAS (e PROG/FUGR se houver): `adt_run_tests`. **Não inventar** passed/failed.
5. `adt_run_atc` nos objetos do GAP (variant do customizing, a menos que o GAP peça outra). Guardar `worklist_id` e contagens P1–P4.
6. Se a tool devolver HTTP 500 ou falha de execução: `adt_read_runtime_errors` (`list` + `detail`).
7. Falha de método: `adt_read_testclass_source` para citar o assert no relatório.
8. Escrever `rt-data.json` em `05_testes/` (ou `04_atc/` se ainda no ATC). Sem placeholder.
9. Renderizar:

```bash
node .cursor/skills/relatorio-testes-gap/scripts/render.mjs --data <gap>/05_testes/rt-data.json --out <gap>/05_testes
```

10. Entregar `RT-<GAP-ID>.pdf`. No gate da factory, evidência = caminho do PDF.

## Regras

- Só três blocos: **1. Características · 2. Objetivo · 3. Evidências**.
- Status / contagens / findings = saída da tool, não memória.
- Recorte de evidência: assert, mensagem ATC ou dump. Não colar a test class inteira.
- Critério de aceite padrão: Unit 100% passed; ATC P1 e P2 = 0; cenários TD-* executados. Desvio só se a spec/factory disser o contrário.
- `projeto` padrão: `Leroy Merlin`.
- Bugs: IDs de `triage_bug` (T1/T2/T3) se existirem.

## rt-data.json

Ver [rt-data.example.json](rt-data.example.json). Obrigatórios: `gap_id`, `gap_name`, `objetivo_paragrafo`, `objetos[]`, `unit_tests[]` com `title`, `object`, `status`, `evidence` (texto da tool).

## Layout

Não alterar CSS nem ordem das seções de [template.html](template.html). Logos: sempre via `scripts/render.mjs` (data URI + cópia de `logo-numen.jpg` / `logo-leroy-merlin.jpg` na pasta de saída). Não usar `src` relativo a `assets/` do GAP.

## MCP

Namespace: `user-abap-mcp-local`. Nesta etapa: `adt_run_tests`, `adt_run_atc`, `adt_read_atc_results`, `adt_read_testclass_source`, `adt_read_runtime_errors`. Create/save de produção não entram neste relatório.
