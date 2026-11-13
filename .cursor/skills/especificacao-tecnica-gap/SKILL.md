---
name: especificacao-tecnica-gap
description: >-
  Gera a Especificação Técnica (ET) do GAP no layout PDF Numen/Leroy Merlin
  (características, objetivo, solução com trechos de código comprovando a spec).
  Use no mesmo chat da factory ABAP (factory_orchestrator, estágio Doc, pasta
  06_doc) depois de criar/alterar objetos via MCP user-abap-mcp-local, ou quando
  o usuário pedir ET, especificação técnica, documentação técnica, PDF da ET ou
  comprovação requisito × código.
---

# ET do GAP (layout PDF)

Não redigir a ET em Markdown solto. Preencher o layout de `template.html` e gerar o PDF com `scripts/render.mjs`.

## Quando

- `factory_orchestrator` em estágio **Doc** (artefactos em `06_doc/`).
- Usuário pediu ET / especificação técnica / PDF técnico após o desenvolvimento no mesmo chat.

## Fluxo

1. `init_agent` (MCP `user-abap-mcp-local`) — antes de qualquer tool SAP.
2. `factory_orchestrator` `status` com `workspace_root` = raiz absoluta do workspace. `gap_path` relativo exige `workspace_root`.
3. Ler `gap.json`, spec em `00_spec/` e o que a factory devolver em `get_step`.
4. Listar objetos **criados/alterados neste GAP** (conversa, `gap.json`, `02_dev/`). Não inventar objeto.
5. Para cada objeto: `adt_read_source` (leituras podem ir em paralelo). O trecho da ET sai **só** dessa fonte.
6. Mapear cada RF da spec → objeto/método → recorte que prova o requisito.
7. Escrever `et-data.json` em `06_doc/` (schema abaixo). Sem placeholder, sem RF vazio, sem código inventado.
8. Renderizar:

```bash
node .cursor/skills/especificacao-tecnica-gap/scripts/render.mjs --data <gap>/06_doc/et-data.json --out <gap>/06_doc
```

9. Entregar o PDF. Se o estágio for Doc, `submit_gate` com evidência = caminho do PDF.

Sem Chrome/Edge o script grava o HTML e falha — não inventar PDF.

## Regras de conteúdo

- Só três blocos: **1. Características · 2. Objetivo · 3. Solução**.
- Objetivo: síntese (problema + resultado da spec). Não copiar a EF.
- Código: recorte que prova o RF (`METHOD`…`ENDMETHOD`, action/validation, CDS relevante). Não colar a classe inteira.
- HTML: escapar no `et-data.json` em texto puro; o script faz escape.
- Campos desconhecidos: perguntar ou usar o valor do `gap.json`. Não inventar request, módulo ou nome de desenvolvedor.
- `projeto` padrão: `Leroy Merlin`. `status` padrão após testes da factory: `Em revisão`.

## et-data.json

Ver [et-data.example.json](et-data.example.json). Obrigatórios: `gap_id`, `gap_name`, `objetivo_paragrafo`, `requirements[]` com `id`, `title`, `spec`, `object`, `code`.

`requirements[].code` = texto ABAP/CDS lido do SAP, não um resumo.

## Layout

- Sempre rodar `scripts/render.mjs`. O script embute as logos (data URI) e copia `logo-numen.jpg` / `logo-leroy-merlin.jpg` para a pasta de saída. Sem isso as imagens somem no HTML do GAP.
- Não apontar `src` para `assets/` relativo ao GAP. Logos: `assets/branding.json` + `assets/logo-*.jpg` da skill.

## MCP

Namespace: `user-abap-mcp-local`. Nesta sessão a ET **só lê** SAP (`adt_read_source`, `rfc_read_source`). Create/save/activate ficam na factory de Dev, não na Doc.
