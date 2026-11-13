---
name: cutover-gap
description: >-
  Gera o Plano de Cutover do GAP no layout PDF Numen/Leroy Merlin (características,
  objetivo, inventário, transportes, atividades T-x, rollback, go/no-go). Use no
  mesmo chat da factory ABAP no estágio Close/Doc, ou quando o usuário pedir
  cutover, go-live, implantação, plano de transporte, STMS, rollback ou
  adt_copy_table_data / adt_list_package_objects para entrada em produção.
---

# Plano de Cutover do GAP (layout PDF)

Não redigir o plano em Markdown solto. Preencher `template.html` via `scripts/render.mjs`.

## Quando

- `factory_orchestrator` em **Doc** ou **Close**.
- Pedido de cutover, go-live, implantação, transportes, rollback.
- Pacote `documentos-gap` **somente** se o gate de cutover passar. Sem atividade de implantação: **não gerar nenhum documento** (`co-data.json`, HTML, PDF). Ver [criterio-cutover.md](../documentos-gap/criterio-cutover.md).

## Fluxo

1. `init_agent` (MCP `user-abap-mcp-local`).
2. `factory_orchestrator` `status` com `workspace_root` absoluto.
3. Ler `gap.json`, spec em `00_spec/`, ET em `06_doc/` se existir.
4. Inventário: `adt_list_package_objects` no pacote do GAP. Não listar objeto que a tool não devolver.
5. Transportes: só números confirmados (gap.json, conversa, Basis). Não inventar `DEVK…`.
6. Montar atividades CO-01… na ordem real (import → config/carga → smoke → close).
7. Carga: `adt_copy_table_data` só se houver tabela Z no destino; senão marcar Não se aplica.
8. Escrever `co-data.json` em `06_doc/`.
9. Renderizar:

```bash
node .cursor/skills/cutover-gap/scripts/render.mjs --data <gap>/06_doc/co-data.json --out <gap>/06_doc
```

10. Entregar `CO-<GAP-ID>.pdf`. No Close, evidência do `close` / gate = caminho do PDF.

## Regras

- Só três blocos: **1. Características · 2. Objetivo · 3. Plano**.
- Request de transporte, SID e janela: perguntar se não estiverem no GAP.
- `projeto` padrão: `Leroy Merlin`.
- Status padrão do plano: `Planejado` (só `Concluído` depois da evidência).
- Rollback sempre preenchido (mesmo que “revert da última request”).

## co-data.json

Ver [co-data.example.json](co-data.example.json). Obrigatórios: `gap_id`, `gap_name`, `objetivo_paragrafo`, `objetos[]`, `activities[]` com `id`, `title`, `quando`, `owner`, `tool`, `status`, `evidence`.

## Layout

Não alterar CSS nem ordem das seções de [template.html](template.html). Logos: sempre via `scripts/render.mjs` (data URI + cópia de `logo-numen.jpg` / `logo-leroy-merlin.jpg` na pasta de saída). Não usar `src` relativo a `assets/` do GAP.

## MCP

`adt_list_package_objects`, `adt_activate`, `adt_copy_table_data` (máx. 1000 linhas; Z destino já existente), `adt_run_tests` no smoke, `factory_orchestrator` `close`.
