---
name: spec-tecnica-komatsu
description: >-
  Gera a Especificação Técnica Komatsu em .docx a
  partir da especificação funcional do GAP. Use quando o usuário pedir spec
  técnica, especificação técnica, template Komatsu, GAP MM/FI/SD,
  EspTec, ou para preencher o modelo Komatsu_REL de especificação técnica.
---

# Especificação técnica Komatsu

Gera o `.docx` no modelo criado pelos funcionais da Numen. Não recriar o layout à mão e não editar o OOXML. O gerador está em `scripts/build_gap_komatsu.py` (logos em `scripts/komatsu_media/`).

Dependências: `python-docx`. Com Word e `pywin32` instalados, o script recalcula SUMÁRIO e número de página. Sem Word, o arquivo abre e o SUMÁRIO só preenche depois de F9.

## Antes de gerar

Perguntar quem é o autor se o nome ainda não foi dito nesta conversa. Sem essa resposta, não gravar o JSON e não gerar o `.docx`.

O nome informado entra em Autor (`projeto_autor`), Responsável (`artefatos.responsavel`) e autor de cada linha do histórico. Não copiar nome de exemplo, de outro GAP nem da homologação da EF.

Não usar o Líder de Desenvolvimento da homologação da EF como responsável técnico. Consultor funcional vira Funcional. Analista funcional de TI vira Analista TI.

Não inventar classe de mensagem, campo, tabela ou objeto que a EF não cite. Onde a EF diz N/A, gravar o texto `N/A` (valor real, preto). Campo omitido ou vazio sai em vermelho, como placeholder do modelo.

## Gerar

1. Ler a EF (PDF ou docx) e montar um JSON UTF-8 com as chaves abaixo.
2. Gravar o JSON ao lado da EF, não dentro desta skill.
3. Rodar, a partir da pasta desta skill:

```bash
python scripts/build_gap_komatsu.py --data CAMINHO/gap.json --out CAMINHO/SAIDA.docx
```

Nome do arquivo: `KOMATSU_REL_{MODULO}_{ID}_{descricao}_EspTec_{DDMMAA}_V0.docx`, na mesma pasta da EF.

`\n` dentro de um valor vira parágrafo novo na célula.

## Chaves do JSON

| Chave | Origem |
|---|---|
| `id_gap` | ID GAP da EF (ex. `MM-018`) |
| `descricao_gap` | Descrição GAP |
| `projeto_autor` | Nome que o usuário informou ao ser perguntado |
| `projeto_funcional` | Consultor funcional |
| `analista_ti` | Analista funcional TI |
| `historico` | Lista `{versao, autor, data, descricao}`. `autor` é o mesmo nome. No máximo 2 linhas (o modelo só tem V0 e V1). |
| `artefatos.responsavel` | O mesmo nome |
| `artefatos.data_criacao` | `DD.MM.YYYY` |
| `artefatos.transacoes` | Uma transação por linha: `ME51N - Criar requisição de compra` |
| `artefatos.objetos_tecnicos` | BAdI, implementação, classe, método, tabela — uma linha cada |
| `artefatos.objetivo` | O que a remediação faz e o que ficou fora (BRF+, tabela nova, layout) |
| `artefatos.tela_selecao` | Print ou `N/A` |
| `artefatos.itens` | Lista `{objeto, logica}` — um item por objeto, com a regra de negócio |
| `artefatos.tvarv` / `brf` / `objeto_autorizacao` | Texto ou `N/A — motivo` |
| `qualidade.justificativas` | `N/A` se não houver proxy nem código standard a justificar. Omitir `inspecao` e `criterio` para manter o texto fixo de SCI / `CODE_INSP_KOMATSU_GLOBAL`. |
| `teste_unitario_texto` | Procedimento e resultado esperado da EF. Prints ainda não existem: descrever o que anexar, sem marcar como placeholder. |

Exemplo mínimo:

```json
{
  "id_gap": "MM-018",
  "descricao_gap": "Validação de criação de Requisições de Compra",
  "projeto_autor": "<nome informado pelo usuário>",
  "projeto_funcional": "Nome do consultor funcional",
  "analista_ti": "Nome do analista TI",
  "historico": [
    {"versao": "V0", "autor": "<mesmo nome>", "data": "31/08/26", "descricao": "Elaboração a partir da EF V0"}
  ],
  "artefatos": {
    "responsavel": "<mesmo nome>",
    "data_criacao": "31.08.2026",
    "transacoes": "ME51N - Criar requisição de compra",
    "objetos_tecnicos": "BAdI clássica: ME_PROCESS_REQ_CUST",
    "objetivo": "Centralizar a validação na criação da requisição.",
    "tela_selecao": "N/A",
    "itens": [{"objeto": "Método CHECK", "logica": "Bloquear a gravação se a combinação não estiver na tabela de parâmetro."}],
    "tvarv": "N/A",
    "brf": "N/A — fora de escopo.",
    "objeto_autorizacao": "N/A"
  },
  "qualidade": {"justificativas": "N/A"},
  "teste_unitario_texto": "1. ME51N com combinação válida — grava.\n2. Combinação inválida — mensagem de erro e bloqueio."
}
```
