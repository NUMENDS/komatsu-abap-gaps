# Skill Cursor — Especificação Técnica do GAP

Guia para colegas reutilizarem a skill **especificacao-tecnica-gap** no Cursor, no mesmo chat em que a factory ABAP (`factory_orchestrator` + MCP `user-abap-mcp-local`) cria o programa.

Anexe também o ZIP `especificacao-tecnica-gap.zip` (pasta completa da skill).

---

## 1. O que é

A skill manda o agente gerar a **Especificação Técnica (ET)** no layout PDF Numen × Komatsu, com três blocos:

1. Características (GAP, request, sistema, módulo, EF…)
2. Objetivo (síntese, sem copiar a EF)
3. Solução (visão geral + trechos de código **lidos do SAP** que comprovam cada RF da spec)

Não é um modelo para preencher à mão. O agente monta `et-data.json`, renderiza `template.html` e imprime o PDF.

## 2. Pré-requisitos

| Item | Para quê |
| --- | --- |
| Cursor | Carregar a skill |
| MCP **user-abap-mcp-local** (plugin Numen) | `init_agent`, `adt_read_source`, `factory_orchestrator` |
| Node.js | Rodar `scripts/render.mjs` |
| Chrome ou Edge | Gerar o PDF |
| Spec do GAP em `00_spec/` e objetos já criados no SAP | Conteúdo real da ET |

## 3. Instalação

Descompacte o ZIP. A pasta deve se chamar `especificacao-tecnica-gap` e conter `SKILL.md`.

**No projeto (recomendado — vai no Git com o time):**

```
<raiz-do-workspace>/.cursor/skills/especificacao-tecnica-gap/
```

**Na máquina (todos os projetos do colega):**

```
%USERPROFILE%\.cursor\skills\especificacao-tecnica-gap\
```

(macOS/Linux: `~/.cursor/skills/especificacao-tecnica-gap/`)

Não coloque em `~/.cursor/skills-cursor/` (reservado pelo Cursor).

Reabra o Cursor ou inicie um chat novo depois de copiar.

## 4. Conteúdo da pasta

```
especificacao-tecnica-gap/
├── SKILL.md                 ← instruções do agente
├── README.md                ← este guia
├── template.html            ← layout do PDF (não alterar CSS/logos)
├── et-data.example.json     ← schema do JSON
├── assets/
│   ├── logo-numen.jpg
│   └── logo-komatsu.jpg
└── scripts/
    └── render.mjs           ← HTML + PDF
```

## 5. Como usar no chat

Use o **mesmo chat** em que a factory desenvolveu o GAP (Dev → Review → ATC → Testes → **Doc**).

Exemplos de pedido:

- `Gera a especificação técnica do GAP em PDF`
- `Documenta a ET no estágio Doc da factory`
- `Cria a comprovação spec × código e exporta o PDF`

O agente deve:

1. Chamar `init_agent`
2. Orientar-se com `factory_orchestrator` (`status` / `get_step`) usando `workspace_root` absoluto
3. Ler `gap.json` + spec em `00_spec/`
4. Ler a fonte SAP com `adt_read_source` (código da ET **não é inventado**)
5. Gravar `<gap>/06_doc/et-data.json`
6. Rodar:

```bash
node .cursor/skills/especificacao-tecnica-gap/scripts/render.mjs --data <gap>/06_doc/et-data.json --out <gap>/06_doc
```

7. Entregar `06_doc/ET-<GAP-ID>.pdf` (e o HTML). No estágio Doc, usar o PDF como evidência do `submit_gate`.

## 6. Regras que o time precisa respeitar

- Só os três blocos da ET. Sem voltar ao modelo longo.
- Trecho de código = recorte que prova o RF (`METHOD`…`ENDMETHOD`, action, CDS). Classe inteira não.
- Sem placeholder e sem RF vazio.
- Não mudar `template.html` (layout aprovado).
- Na etapa de documentação a skill **só lê** o SAP. Create/save/activate continuam na factory de Dev.

## 7. Conferência rápida

- [ ] Pasta copiada para `.cursor/skills/especificacao-tecnica-gap/`
- [ ] MCP ABAP local conectado
- [ ] Node e Chrome/Edge no PATH / instalados
- [ ] Chat da factory no estágio Doc (ou pedido explícito de ET)
- [ ] PDF gerado em `06_doc/ET-<GAP-ID>.pdf`

## 8. Problemas comuns

| Sintoma | O que checar |
| --- | --- |
| Agente não usa a skill | Nome da pasta, `SKILL.md` na raiz da skill, chat novo |
| `workspace_root` rejeitado | Passar a raiz absoluta do workspace no `factory_orchestrator` |
| PDF não sai | Chrome/Edge; o script ainda grava o HTML |
| Código genérico na ET | A fonte tem de vir de `adt_read_source`, não de memória |

---

Numen · Projeto Komatsu · Skill `especificacao-tecnica-gap` · v1.0
