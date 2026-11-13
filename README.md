# Komatsu ABAP GAPs

Repositório das skills, regras e do fluxo da factory ABAP da Komatsu. O desenvolvimento roda no mesmo chat, pelo MCP ABAP (`user-abap-mcp`), no sistema `KOMATSU_DEV_100`. A especificação funcional original fica em `KOMATSU/EF/` e não entra no git. A cópia usada pela factory fica em `00_spec/` do GAP.

O fluxo abaixo é o de desenvolvimento novo. Remediação e simplificação ainda não têm skill neste repositório.

## Skills

| Skill | Quando usar | O que entrega |
| --- | --- | --- |
| `spec-tecnica-komatsu` | Antes da factory, quando a especificação técnica em Word for pedida | `KOMATSU_REL_{MODULO}_{ID}_{descricao}_EspTec_{DDMMAA}_V0.docx`, ao lado da EF |
| `novo-objeto` | Análise (estágio 1) e Dev (estágio 2) de GAP novo | Plano em `01_analise/DEVELOPMENT_PLAN.md` e, depois da aprovação, os objetos no SAP |
| `jira-story-sync` | Só depois da aprovação explícita do plano, e de novo se for pedida no meio ou no fim | Histórias do épico alinhadas ao plano, mais `jira-reference.json` na pasta do GAP |
| `relatorio-testes-gap` | ATC (estágio 4) e Testes (estágio 5) | `05_testes/RT-<GAP-ID>.pdf`, com o resultado real de ABAP Unit e ATC |
| `especificacao-tecnica-gap` | Documentação (estágio 6), com o objeto já criado | `06_doc/ET-<GAP-ID>.pdf`, com trecho de código lido do SAP |
| `cutover-gap` | Documentação ou Encerramento, e só se houver atividade de implantação | `06_doc/CO-<GAP-ID>.pdf` |
| `documentos-gap` | Quando o pacote inteiro for pedido de uma vez | ET, relatório de testes e, se o critério de cutover passar, o plano de cutover |

`documentos-gap` não gera cutover vazio. Sem atividade de implantação, o PDF, o HTML e o JSON de cutover ficam de fora.

## Regras

| Regra | O que cobre |
| --- | --- |
| `workbook-komatsu` | Nomenclatura, pacote, cabeçalho e qualidade. O texto está em `KOMATSU/_workbook/workbook-komatsu.md` |
| `pacote-gap-komatsu` | Pacote do GAP pelo módulo e pelo cenário empresarial. Sem cenário, o pacote pai não é inventado |
| `parametros-komatsu` | Valor fixo de negócio: perguntar se fica no código ou em `ZCL_XX_CONSTANTES`, e qual é o nome da constante |
| `clean-core` | Desenvolvimento novo prefere CDS e API released. Remediação e simplificação mantêm a lógica do legado |

As quatro valem para desenvolvimento na Komatsu.

## Template de execução

Cada passo é uma mensagem sua no chat do GAP. O agente não cria objeto SAP e não sincroniza o Jira enquanto o plano não estiver aprovado por escrito.

### 0. Subir o cliente ABAP

O cliente precisa estar no ar antes de qualquer leitura ou gravação no SAP. Sem argumento, ele sobe. A troca de URL só vale depois de reiniciar o processo.

```bash
npx --yes @numends/abap-client
```

Confirme no log que o sistema ativo é `KOMATSU_DEV_100`.

### 1. Especificação técnica em Word

Opcional. Serve para o documento Word no modelo Numen. Não substitui a EF e não abre a factory.

Diga o caminho da EF e quem assina. Sem o nome do autor, o arquivo não é gerado.

```text
/spec-tecnica-komatsu
EF: KOMATSU/EF/<arquivo>.docx
Autor: <nome completo>
```

O `.docx` e o JSON saem na mesma pasta da EF. O nome do arquivo segue `KOMATSU_REL_..._EspTec_<data>_V0.docx`.

### 2. Abrir o GAP na factory

Este passo cria o acompanhamento. A EF original não é editada. A factory passa a usar a cópia em `00_spec/`.

```text
factory orchestrator
EF: KOMATSU/EF/<arquivo>.docx
```

O que conferir depois:

- pasta `KOMATSU/projetos/<GAP-ID>__<slug>/`, com `gap.json` e as pastas `00_spec` até `06_doc`;
- estágio 0, Intake, concluído;
- estágio atual 1, Análise e Plano.

### 3. Analisar a especificação

O `spec_analyzer` lê a EF no sistema confirmado e grava o plano. Pergunta em aberto vai para `01_analise/perguntas.md`. Objeto SAP ainda não é criado.

```text
roda o spec_analyzer
```

O plano fica em `01_analise/DEVELOPMENT_PLAN.md`. Leia as pendências. Nome, pacote, request e constante que a EF não fecha continuam em aberto até a resposta.

### 4. Responder e aprovar o plano

A aprovação precisa ser explícita. "Pode seguir" no meio de outra tarefa não conta. Enquanto não houver essa frase, o Jira não é sincronizado e o Dev não começa.

```text
Respostas:
1. <resposta>
2. <resposta>

Aprovo o plano de desenvolvimento.
```

Se ainda faltar resposta, diga isso e pare neste passo.

### 5. Sincronizar as histórias

Roda só depois do passo 4. A skill procura o épico do GAP, compara com o plano aprovado e cria ou atualiza histórias. Não apaga história e não muda status nem responsável sozinha.

```text
sincroniza as histórias do Jira com o plano aprovado
Épico: <URL do épico>
```

A referência fica em `jira-reference.json`, na pasta do GAP.

### 6. Desenvolver

Estágio 2, Dev. A skill `novo-objeto` cria só o que o plano aprovado lista, no pacote e na request já confirmados. Uma gravação por vez: criar, gravar, ativar.

```text
pode desenvolver o plano aprovado
```

O que não entra neste passo: objeto fora do plano, tabela nova que a EF não pediu, alteração de programa ou formulário standard que a EF mandou preservar.

### 7. Revisar

Estágio 3, Revisão. O agente relê o objeto no SAP e confronta com a EF e com o plano. Achado que muda regra volta para o Dev. Achado crítico ou alto não segue para o ATC.

```text
revisa o desenvolvimento contra a EF
```

### 8. Rodar o ATC

Estágio 4. O resultado tem de ser uma execução de verdade, com worklist. Lista vazia ou tool que falhou não conta como aprovado.

```text
roda o ATC do GAP
```

Se neste ponto já quiser o PDF de evidência, peça o relatório de testes. Ele também pode esperar o passo 9 e sair junto com os testes funcionais.

### 9. Testar

Estágio 5, Testes e bugs. Os cenários saem da EF. A massa e o resultado esperado ficam registrados. Bug encontrado volta para o Dev antes de fechar o estágio.

```text
executa os testes da EF e gera o relatório
```

A skill `relatorio-testes-gap` grava `05_testes/RT-<GAP-ID>.pdf` com o retorno de `adt_run_tests` e `adt_run_atc`. Não inventar quantidade de teste passado.

### 10. Documentar

Estágio 6. A ET em PDF só sai depois que o objeto existe, porque o trecho de código é lido do SAP.

Um PDF:

```text
/especificacao-tecnica-gap
```

O pacote inteiro:

```text
/documentos-gap
```

`documentos-gap` gera a ET e o relatório de testes. O plano de cutover entra só quando há atividade de implantação, com evidência na EF, no `gap.json` ou na conversa. Sem isso, a resposta declara a ressalva e não cria arquivo de cutover.

### 11. Encerrar

Estágio 7. O agente confere os gates anteriores e fecha o GAP na factory. Sem o PDF de um estágio obrigatório, o encerramento não é dado como concluído.

```text
encerra o GAP
```

Corte de produção, transporte e rollback continuam no `cutover-gap`, e só quando o passo 10 tiver gerado esse plano.
