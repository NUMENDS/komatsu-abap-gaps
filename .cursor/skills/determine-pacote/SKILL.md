
---
name: determinacao-pacote-abap
description: >
  Determina o pacote SAP ABAP adequado para um desenvolvimento,
  respeitando a arquitetura Clean Core em três Tiers,
  os módulos funcionais e os processos de negócio.
  Consulta pacotes existentes por meio do MCP SAP e recomenda
  reutilização ou criação futura. Esta skill nunca cria,
  altera, move ou exclui pacotes.
---

# Skill: Determinação de Pacotes SAP ABAP

## 1. Objetivo

Esta skill é responsável por determinar o pacote SAP ABAP
mais adequado para um desenvolvimento.

A determinação deve considerar:

- O Tier do desenvolvimento.
- O módulo funcional SAP.
- O processo de negócio envolvido.
- O título e a descrição funcional do desenvolvimento.
- A estrutura real de pacotes existente no ambiente SAP.
- A possibilidade de reutilizar um pacote já existente.
- A necessidade de recomendar um novo pacote.

A skill deve consultar o ambiente SAP por meio do MCP
disponível e retornar uma recomendação fundamentada.

**IMPORTANTE: ESTA SKILL É EXCLUSIVAMENTE CONSULTIVA.**

Ela NUNCA deve criar, alterar, mover ou excluir pacotes.

A criação de pacotes pertence a outro fluxo de execução,
fora do escopo desta skill.

---

## 2. Quando executar

Executar esta skill sempre que for necessário determinar
o pacote de destino de um novo desenvolvimento ABAP.

Exemplos:

- Antes de criar uma classe ABAP.
- Antes de criar uma interface.
- Antes de criar um programa.
- Antes de criar uma CDS View.
- Antes de criar um Behavior Definition.
- Antes de criar um Function Group.
- Antes de criar outros objetos de desenvolvimento.
- Durante o planejamento técnico de um GAP.
- Durante a análise de uma nova funcionalidade.
- Quando um agente precisar decidir onde um objeto pertence.

A skill também pode ser executada para reavaliar a
adequação de um pacote existente.

Nesse caso, apenas recomenda alterações, sem executá-las.

---

## 3. Restrições obrigatórias

### 3.1 Proibição absoluta de criação

Esta skill NÃO POSSUI autorização para:

- Criar pacotes ABAP.
- Criar Superpackages.
- Criar pacotes de módulos.
- Criar pacotes de processos.
- Alterar propriedades de pacotes.
- Renomear pacotes.
- Excluir pacotes.
- Mover objetos entre pacotes.
- Alterar a hierarquia de pacotes.
- Executar operações de gravação no SAP.

A proibição vale mesmo quando:

- O pacote não existir.
- O MCP disponibilizar uma ferramenta de criação.
- A criação parecer simples.
- O agente identificar todos os parâmetros necessários.
- Um pacote pai ainda não existir.

**Identificar a necessidade de um pacote não autoriza
sua criação.**

### 3.2 Uso permitido do MCP

O MCP SAP deve ser utilizado exclusivamente para
operações de leitura e consulta.

Operações permitidas, quando disponibilizadas pelo MCP:

- Consultar pacote pelo nome técnico.
- Listar pacotes existentes.
- Consultar subpacotes.
- Consultar o Superpackage de um pacote.
- Consultar descrição e propriedades de pacotes.
- Consultar a versão de linguagem ABAP.
- Consultar objetos pertencentes a um pacote.
- Pesquisar pacotes por nome ou descrição.

O agente deve descobrir e utilizar as ferramentas reais
expostas pelo MCP.

Não deve inventar nomes de ferramentas, parâmetros,
endpoints ou respostas.

Se o MCP não disponibilizar consultas suficientes,
deve registrar a limitação e não afirmar que o pacote
existe ou não existe.

---

## 4. Arquitetura de pacotes

A organização utiliza três níveis hierárquicos.

### Nível 1 — Tier

Pacotes principais:

- ZPKG_TIER1
- ZPKG_TIER2
- ZPKG_TIER3

Responsabilidades:

**Tier 1 — ABAP Cloud**

Desenvolvimentos compatíveis com ABAP Cloud,
utilizando APIs e objetos liberados conforme as
restrições técnicas aplicáveis.

**Tier 2 — Wrappers**

Objetos de encapsulamento para funcionalidades
não disponibilizadas diretamente por APIs liberadas.

Pode utilizar Standard ABAP conforme a arquitetura
aprovada e os contratos de liberação necessários.

**Tier 3 — ABAP Clássico**

Desenvolvimentos legados ou clássicos que não
atendem à abordagem dos Tiers anteriores.

O Tier deve ser informado pelo plano técnico ou
determinado previamente por uma etapa responsável
pela arquitetura.

Esta skill não deve escolher arbitrariamente outro
Tier apenas para encontrar um pacote disponível.

### Nível 2 — Módulo funcional

Cada Tier possui pacotes organizados por módulo SAP.

Exemplos:

ZPKG_TIER1
  ZPKG_T1_MM
  ZPKG_T1_SD
  ZPKG_T1_FI
  ZPKG_T1_PP

ZPKG_TIER2
  ZPKG_T2_MM
  ZPKG_T2_SD
  ZPKG_T2_FI
  ZPKG_T2_PP

ZPKG_TIER3
  ZPKG_T3_MM
  ZPKG_T3_SD
  ZPKG_T3_FI
  ZPKG_T3_PP

Outros módulos podem existir.

O agente deve consultar a estrutura real para descobrir
quais módulos estão disponíveis, em vez de assumir
que todos os exemplos acima existem.

### Nível 3 — Processo de negócio

Dentro de cada pacote de módulo ficam os pacotes
dos processos de negócio ou funcionalidades.

Exemplo:

ZPKG_TIER1
  ZPKG_T1_MM
    ZPKG_T1_MM_PURCHASE_ORDER
    ZPKG_T1_MM_GOODS_RECEIPT
    ZPKG_T1_MM_INVOICE_VERIFY

ZPKG_TIER2
  ZPKG_T2_MM
    ZPKG_T2_MM_PURCHASE_ORDER

ZPKG_TIER3
  ZPKG_T3_MM
    ZPKG_T3_MM_PURCHASE_ORDER

Os nomes são ilustrativos.

O agente deve descobrir quais pacotes realmente
existem no ambiente.

---

## 5. Princípio fundamental de organização

**O pacote representa o processo ou a funcionalidade,
não o número do GAP.**

Um GAP representa uma demanda de desenvolvimento.

Um processo de negócio pode receber diversas demandas
ao longo do tempo.

Por isso, o pacote precisa possuir um nome reutilizável,
coerente e independente de chamados individuais.

### Exemplo

GAP: GAP-1045

Título:
"Implementar validação de centro de custo no
pedido de compra"

Processo identificado:
Gestão de pedidos de compra.

Pacote potencial:
ZPKG_T1_MM_PURCHASE_ORDER

Nomes incorretos:

- ZPKG_T1_MM_GAP1045
- ZPKG_T1_MM_US1234
- ZPKG_T1_MM_TASK998
- ZPKG_T1_MM_DEMANDA_NOVA

O número do GAP pode ser utilizado para rastreabilidade,
mas nunca deve determinar o nome do pacote.

---

## 6. Informações de entrada

Sempre que possível, receber:

- Identificador do GAP.
- Título do desenvolvimento.
- Descrição funcional.
- Especificação técnica ou plano aprovado.
- Tier definido para o desenvolvimento.
- Módulo SAP responsável.
- Processo de negócio relacionado.
- Ambiente SAP de destino.
- Tipo de objeto ABAP, caso conhecido.

O número do GAP é apenas contextual.

Não deve ser utilizado para nomear pacotes.

### 6.1 Informações ausentes

Se o Tier não estiver definido:

1. Consultar o contexto e o plano técnico.
2. Procurar uma definição explícita de Tier.
3. Se não houver informação confiável, solicitar
   confirmação.
4. Não assumir Tier 1 como padrão.

Se o módulo não estiver definido:

1. Analisar o processo funcional.
2. Identificar o módulo predominante.
3. Verificar a organização existente no SAP.
4. Se houver dúvida entre módulos, solicitar confirmação.

Se o processo não estiver claro:

1. Analisar o título e a especificação.
2. Identificar a finalidade real da funcionalidade.
3. Não utilizar um nome genérico apenas para
   evitar a necessidade de esclarecimento.
4. Solicitar confirmação quando necessário.

Não inventar informações técnicas ausentes.

---

## 7. Fluxo de determinação

A determinação deve seguir obrigatoriamente
as etapas abaixo.

### ETAPA 1 — Interpretar o desenvolvimento

Analisar o título e a descrição funcional.

Identificar:

- Qual problema de negócio está sendo resolvido.
- Qual processo será afetado.
- Qual funcionalidade será implementada.
- Qual é o módulo responsável.
- Qual Tier foi definido.
- Se a funcionalidade pertence a um processo existente.

O agente deve interpretar semanticamente o
desenvolvimento.

Não deve simplesmente converter cada palavra do
título em um nome técnico.

Exemplo:

Título:
"Bloquear alteração de preço após aprovação
do pedido de compra"

Interpretação:

Processo principal:
Purchase Order Management

Funcionalidade:
Controle de alteração de preço.

Módulo:
MM

O nome do pacote deve refletir o processo principal
ou uma funcionalidade suficientemente independente.

Não criar automaticamente um pacote específico
para cada validação implementada.

### ETAPA 2 — Identificar o Tier

Identificar o Tier aprovado para o desenvolvimento.

Mapeamento:

Tier 1 -> ZPKG_TIER1
Tier 2 -> ZPKG_TIER2
Tier 3 -> ZPKG_TIER3

O Tier selecionado define o domínio obrigatório
da pesquisa.

Pacotes de outros Tiers não são alternativas
automaticamente válidas.

Se o desenvolvimento precisa de objetos em Tiers
diferentes, a determinação deve ser executada
separadamente para cada conjunto de objetos.

### ETAPA 3 — Identificar o módulo

Determinar o módulo funcional responsável.

Exemplos:

MM -> Materials Management
SD -> Sales and Distribution
FI -> Financial Accounting
CO -> Controlling
PP -> Production Planning
QM -> Quality Management
PM -> Plant Maintenance
WM -> Warehouse Management
EWM -> Extended Warehouse Management

A lista não é exaustiva.

Priorizar o módulo proprietário do processo de negócio,
não necessariamente o módulo do objeto técnico acessado.

Exemplo:

Uma melhoria no pedido de compra que utiliza
informações financeiras continua podendo pertencer
ao módulo MM.

Se a funcionalidade for transversal, verificar
as convenções reais existentes.

Não inventar um módulo genérico como BC ou CROSS
sem evidência de que essa convenção é permitida.

### ETAPA 4 — Consultar a hierarquia

Utilizar o MCP SAP para verificar:

1. Existência do pacote raiz do Tier.
2. Existência do pacote do módulo.
3. Relação real de Superpackage.
4. Pacotes filhos do módulo.
5. Nomes e descrições dos pacotes encontrados.

Exemplo:

Tier: 1
Módulo: MM

Consultas lógicas necessárias:

- Existe ZPKG_TIER1?
- Existe ZPKG_T1_MM?
- ZPKG_T1_MM pertence a ZPKG_TIER1?
- Quais subpacotes pertencem a ZPKG_T1_MM?

As consultas devem usar os recursos reais do MCP.

Um nome aparentemente correto não comprova
que o pacote está na hierarquia correta.

Se a estrutura pai estiver ausente ou incorreta,
registrar a inconsistência.

Não criar os níveis ausentes.

### ETAPA 5 — Pesquisar pacotes compatíveis

Analisar os subpacotes encontrados.

A pesquisa não deve depender apenas de igualdade
textual.

Considerar:

- Nome técnico.
- Descrição funcional.
- Processo representado.
- Finalidade do pacote.
- Objetos existentes, quando necessário.
- Tier.
- Módulo.
- Superpackage.
- Compatibilidade técnica.

A prioridade é encontrar um pacote existente
que represente adequadamente o processo.

#### Exemplo de compatibilidade semântica

Desenvolvimento:
"Adicionar campos de aprovação no pedido de compra"

Pacote existente:
ZPKG_T1_MM_PURCHASE_ORDER

Resultado:
Pacote potencialmente compatível.

Mesmo que não exista a palavra APPROVAL no nome,
o processo principal continua sendo Purchase Order.

#### Exemplo de incompatibilidade

Desenvolvimento:
"Implementar recebimento físico de mercadorias"

Pacote existente:
ZPKG_T1_MM_PURCHASE_ORDER

Resultado:
Não assumir compatibilidade apenas porque ambos
pertencem ao módulo MM.

O processo de recebimento pode possuir um pacote
próprio, por exemplo:

ZPKG_T1_MM_GOODS_RECEIPT

### ETAPA 6 — Verificar reutilização

Antes de recomendar um novo pacote, o agente
DEVE avaliar a reutilização de um existente.

Reutilizar quando:

- O Tier for o correto.
- O módulo for o correto.
- A hierarquia estiver correta.
- O processo de negócio for compatível.
- O pacote possuir finalidade adequada.
- As propriedades técnicas forem compatíveis.
- Não houver evidência de restrição que impeça o uso.

Não reutilizar quando:

- Pertencer a outro Tier.
- Pertencer a outro módulo sem justificativa.
- Representar outro processo de negócio.
- Sua finalidade for incompatível.
- Estiver em uma hierarquia incorreta.
- Existir incompatibilidade técnica relevante.

Não escolher um pacote apenas por possuir palavras
semelhantes no nome.

### ETAPA 7 — Determinar necessidade de novo pacote

Somente recomendar um novo pacote quando:

1. A hierarquia existente tiver sido consultada.
2. Não houver pacote comprovadamente compatível.
3. O processo estiver claramente identificado.
4. O Tier estiver definido.
5. O módulo estiver definido.
6. O nome proposto respeitar as convenções.
7. A inexistência ou incompatibilidade tiver
   sido fundamentada.

A recomendação de um novo pacote NÃO autoriza
sua criação.

O agente deve retornar a proposta para o fluxo
responsável pela criação.

---

## 8. Regras de nomenclatura

### 8.1 Estrutura obrigatória

Pacotes de processo devem seguir:

ZPKG_T{TIER}_{MODULO}_{PROCESSO}

Exemplos:

ZPKG_T1_MM_PURCHASE_ORDER
ZPKG_T2_MM_PURCHASE_ORDER
ZPKG_T3_SD_SALES_ORDER
ZPKG_T1_FI_PAYMENT_RUN

Componentes:

ZPKG:
Prefixo de pacotes customizados.

T{TIER}:
Tier do desenvolvimento.

MODULO:
Sigla do módulo funcional SAP.

PROCESSO:
Identificador semântico do processo de negócio.

### 8.2 Regras obrigatórias do nome

- Utilizar letras maiúsculas.
- Utilizar caracteres compatíveis com nomes ABAP.
- Não utilizar acentos.
- Não utilizar espaços.
- Separar termos com underscore.
- Respeitar o limite de 30 caracteres.
- Evitar abreviações ambíguas.
- Evitar palavras redundantes.
- Evitar nomes excessivamente genéricos.
- Não incluir números de GAP.
- Não incluir números de User Story.
- Não incluir nomes de desenvolvedores.
- Não incluir datas ou versões.
- Não incluir identificadores de transporte.

A convenção desta skill adota letras A-Z,
números quando semanticamente necessários,
e underscore.

### 8.3 Idioma dos identificadores

Preferir termos técnicos de negócio em inglês,
seguindo a terminologia SAP.

Entretanto, a nomenclatura existente no módulo
deve prevalecer quando houver um padrão
organizacional consistente.

Exemplo:

Pedido de compra -> PURCHASE_ORDER
Recebimento de mercadoria -> GOODS_RECEIPT
Ordem de venda -> SALES_ORDER
Execução de pagamentos -> PAYMENT_RUN

Não misturar idiomas arbitrariamente dentro
de um mesmo conjunto de pacotes.

### 8.4 Limite de 30 caracteres

Validar o nome completo antes da recomendação.

A parte PROCESSO deve utilizar apenas o espaço
restante após o prefixo do Tier e módulo.

Se ultrapassar o limite:

1. Remover palavras redundantes.
2. Utilizar terminologia SAP reconhecida.
3. Aplicar abreviações conhecidas.
4. Preservar o significado funcional.
5. Validar novamente o tamanho.

Exemplos de abreviações possíveis:

PURCHASE_ORDER -> PO
SALES_ORDER -> SO
MATERIAL -> MAT
APPROVAL -> APPR
MANAGEMENT -> MGMT

Essas abreviações são alternativas, não regras
de substituição obrigatória.

Não abreviar se o nome completo couber e for
mais claro.

Não gerar abreviações aleatórias sem significado.

### 8.5 Qualidade semântica

O nome deve responder à pergunta:

"Qual processo ou funcionalidade de negócio
este pacote representa?"

Nomes inadequados:

ZPKG_T1_MM_NEW_DEV
ZPKG_T1_MM_MISC
ZPKG_T1_MM_CHANGE
ZPKG_T1_MM_PROGRAM
ZPKG_T1_MM_GAP1045

Nomes adequados:

ZPKG_T1_MM_PURCHASE_ORDER
ZPKG_T1_MM_GOODS_RECEIPT
ZPKG_T1_SD_SALES_ORDER
ZPKG_T1_FI_PAYMENT_RUN

A criação de nomes distintos depende de uma
distinção funcional real.

---

## 9. Granularidade dos pacotes

Não recomendar um novo pacote para cada:

- Classe.
- Interface.
- BAdI.
- CDS View.
- Validação simples.
- Campo adicional.
- User Story.
- GAP.
- Ajuste técnico.

O pacote deve agrupar objetos que compartilham
uma responsabilidade funcional coerente.

### Exemplo A — Reutilização

Desenvolvimento 1:
"Criar validação de preço no pedido de compra"

Desenvolvimento 2:
"Adicionar campo de aprovação no pedido de compra"

Desenvolvimento 3:
"Implementar regra de bloqueio do pedido de compra"

Todos podem pertencer a:

ZPKG_T1_MM_PURCHASE_ORDER

Desde que o pacote existente e sua finalidade
comportem essas responsabilidades.

### Exemplo B — Separação funcional

Desenvolvimento 1:
"Implementar criação de pedidos de compra"

Desenvolvimento 2:
"Implementar recebimento de mercadorias"

Os processos são distintos.

Pacotes possíveis:

ZPKG_T1_MM_PURCHASE_ORDER
ZPKG_T1_MM_GOODS_RECEIPT

### Exemplo C — Processo especializado

Desenvolvimento:
"Implementar fluxo independente de aprovação
de pedidos de compra"

Pacote existente:
ZPKG_T1_MM_PURCHASE_ORDER

Se a aprovação for apenas uma responsabilidade
do processo de pedidos, reutilizar o pacote.

Se representar um componente independente,
com responsabilidades próprias e separação
arquitetural justificada, avaliar:

ZPKG_T1_MM_PO_APPROVAL

A separação deve ter justificativa técnica
ou funcional clara.

---

## 10. Validação técnica

Antes de recomendar um pacote existente,
consultar suas propriedades quando o MCP permitir.

Verificar:

- Nome técnico.
- Descrição.
- Superpackage.
- Versão de linguagem ABAP.
- Componentes ou propriedades relevantes.
- Restrições conhecidas de utilização.

Para Tier 1:

Verificar compatibilidade com ABAP for Cloud
Development e as restrições do ambiente.

Para Tier 2:

Verificar a compatibilidade com a estratégia
de wrappers e Standard ABAP adotada.

Para Tier 3:

Verificar a compatibilidade com o desenvolvimento
ABAP clássico planejado.

Não considerar a nomenclatura T1, T2 ou T3 como
prova suficiente de conformidade técnica.

Caso as propriedades não sejam consultáveis,
deixar a verificação pendente.

Esta skill não executa ATC nem certifica
conformidade Clean Core.

---

## 11. Estratégia de pesquisa MCP

A consulta deve ocorrer na seguinte ordem:

### Pesquisa primária

1. Localizar o Tier.
2. Localizar o módulo dentro do Tier.
3. Listar pacotes de processo desse módulo.
4. Analisar nomes e descrições.

### Pesquisa complementar

Quando os dados forem insuficientes:

1. Consultar detalhes dos candidatos.
2. Consultar a hierarquia real.
3. Inspecionar objetos existentes, se necessário.
4. Pesquisar sinônimos funcionais.
5. Consultar nomes candidatos exatos.

### Pesquisa de nomes equivalentes

Exemplo:

Processo:
Purchase Order

Termos possíveis:
PURCHASE_ORDER
PURCHASE_ORD
PO

Um pacote com abreviação diferente pode ser
compatível.

Não recomendar duplicação apenas porque o nome
existente utiliza uma abreviação.

### Limites de pesquisa

Priorizar os pacotes do Tier e módulo corretos.

Não consultar indiscriminadamente todo o
repositório SAP quando a hierarquia fornece
um escopo de pesquisa suficiente.

Quando houver candidatos ambíguos, aprofundar
somente a investigação desses candidatos.

---

## 12. Tratamento de conflitos

### 12.1 Dois pacotes compatíveis

Se dois pacotes parecerem adequados:

1. Comparar descrições.
2. Consultar os objetos relacionados.
3. Verificar responsabilidades funcionais.
4. Verificar propriedades técnicas.
5. Escolher apenas se houver evidência suficiente.

Se a ambiguidade persistir, apresentar os
candidatos e solicitar confirmação.

Não decidir aleatoriamente.

### 12.2 Nome existente em outro Tier

Um pacote com processo semelhante em outro Tier
não deve ser utilizado automaticamente.

Exemplo:

Desenvolvimento:
Tier 1 / MM / Purchase Order

Pacote encontrado:
ZPKG_T2_MM_PURCHASE_ORDER

Resultado:

O pacote encontrado não atende ao Tier solicitado.

Pesquisar o Tier 1.

Se não houver pacote compatível no Tier 1,
recomendar um novo pacote naquele Tier.

### 12.3 Nome existente com hierarquia incorreta

Se o nome proposto já existir em outro
Superpackage, registrar colisão de nome.

Não recomendar sua criação com o mesmo nome.

Não assumir que um pacote pode ser movido.

Apresentar o conflito para resolução.

### 12.4 Pacote pai inexistente

Se ZPKG_T1_MM não existir:

- Não criar ZPKG_T1_MM.
- Não criar o pacote de processo.
- Informar que falta a estrutura obrigatória.
- Recomendar regularização da hierarquia.
- Não selecionar outro módulo para contornar
  o problema.

### 12.5 MCP indisponível

Se não for possível consultar o SAP:

- Não afirmar que o pacote não existe.
- Não afirmar que o nome está disponível.
- Não recomendar um pacote como validado.
- Informar que a determinação está pendente.

É permitido apresentar um nome preliminar,
claramente identificado como NÃO VALIDADO.

---

## 13. Estados possíveis da determinação

A execução deve resultar em um destes estados:

### REUTILIZAR_EXISTENTE

Existe um pacote validado e compatível.

O agente deve recomendar seu uso.

### PROPOR_NOVO

A pesquisa foi concluída e nenhum pacote
compatível foi encontrado.

O agente deve propor um nome e identificar
o Superpackage esperado.

Nenhum pacote será criado.

### CONFIRMACAO_NECESSARIA

As informações são insuficientes ou existem
candidatos igualmente plausíveis.

O agente deve solicitar a decisão necessária.

### HIERARQUIA_INCONSISTENTE

O Tier, o módulo ou a relação de Superpackage
está ausente ou incorreta.

O agente deve apontar a inconsistência.

### VERIFICACAO_PENDENTE

O MCP não permitiu obter evidência suficiente.

Não afirmar inexistência ou compatibilidade.

### COLISAO_NOME

O nome candidato já está ocupado por um pacote
incompatível ou localizado em outra hierarquia.

Não recomendar a criação com esse nome.

---

## 14. Contrato de saída

A skill deve sempre retornar uma resposta
estruturada.

Formato recomendado:

```json
{
  "status": "REUTILIZAR_EXISTENTE",
  "gap": "GAP-1045",
  "desenvolvimento": "Validacao de preco do pedido",
  "tier": 1,
  "modulo": "MM",
  "processo": "Purchase Order",
  "pacote_recomendado": "ZPKG_T1_MM_PURCHASE_ORDER",
  "superpackage": "ZPKG_T1_MM",
  "pacote_existe": true,
  "validado_mcp": true,
  "motivo": "Pacote existente compativel com o processo.",
  "acao_requerida": "UTILIZAR_PACOTE_EXISTENTE"
}
```

Valores possíveis para pacote_existe:

- true: existência confirmada pelo MCP.
- false: inexistência confirmada pela consulta.
- null: existência não verificada.

Em casos de proposta de novo pacote:

```json
{
  "status": "PROPOR_NOVO",
  "gap": "GAP-2077",
  "desenvolvimento": "Recebimento de mercadorias",
  "tier": 1,
  "modulo": "MM",
  "processo": "Goods Receipt",
  "pacote_recomendado": null,
  "pacote_proposto": "ZPKG_T1_MM_GOODS_RECEIPT",
  "superpackage": "ZPKG_T1_MM",
  "pacote_existe": false,
  "validado_mcp": true,
  "motivo": "Nenhum pacote compativel foi localizado.",
  "acao_requerida": "SOLICITAR_CRIACAO_POSTERIOR"
}
```

O campo validado_mcp somente será true quando
as consultas necessárias tiverem sido concluídas.

O campo pacote_recomendado somente deve indicar
um pacote existente e validado.

O campo pacote_proposto indica apenas uma sugestão,
nunca um pacote criado.

Para estados pendentes, registrar os dados conhecidos,
preencher valores não confirmados com null e
explicar claramente o bloqueio no campo motivo.

---

## 15. Exemplos de execução

### Cenário 1 — Pacote existente

Entrada:

GAP:
GAP-1045

Tier:
1

Módulo:
MM

Título:
"Adicionar validação no pedido de compra"

Resultado do MCP:

ZPKG_T1_MM_PURCHASE_ORDER existe.

Superpackage:
ZPKG_T1_MM

Descrição:
Purchase Order Management

Decisão:

REUTILIZAR_EXISTENTE

Pacote:
ZPKG_T1_MM_PURCHASE_ORDER

Motivo:

A alteração pertence ao processo de pedidos
de compra já representado pelo pacote.

Não criar novo pacote.

### Cenário 2 — Novo processo

Entrada:

GAP:
GAP-2077

Tier:
1

Módulo:
MM

Título:
"Criar funcionalidade de recebimento de mercadorias"

Resultado do MCP:

O pacote ZPKG_T1_MM existe.

Não foram identificados pacotes compatíveis
com Goods Receipt.

A ausência e a disponibilidade do nome
foram confirmadas.

Decisão:

PROPOR_NOVO

Nome sugerido:
ZPKG_T1_MM_GOODS_RECEIPT

Superpackage:
ZPKG_T1_MM

Ação:

Informar que um novo pacote é necessário.

**NÃO CRIAR O PACOTE.**

### Cenário 3 — Mesmo processo, outro Tier

Entrada:

Tier:
2

Módulo:
MM

Título:
"Criar wrapper de BAPI para pedido de compra"

Resultado do MCP:

ZPKG_T1_MM_PURCHASE_ORDER existe.

ZPKG_T2_MM_PURCHASE_ORDER existe.

Decisão:

REUTILIZAR_EXISTENTE

Pacote:
ZPKG_T2_MM_PURCHASE_ORDER

Motivo:

O desenvolvimento pertence ao Tier 2.

O pacote do Tier 1 não deve ser selecionado,
mesmo representando o mesmo processo.

### Cenário 4 — Nova demanda, pacote compartilhado

Entrada:

GAP:
GAP-3099

Tier:
1

Módulo:
MM

Título:
"Implementar campos adicionais no pedido de compra"

Resultado do MCP:

ZPKG_T1_MM_PURCHASE_ORDER existe.

O pacote já atende outras demandas relacionadas
ao mesmo processo.

Decisão:

REUTILIZAR_EXISTENTE

Motivo:

GAPs diferentes podem compartilhar o mesmo
pacote funcional.

Não recomendar ZPKG_T1_MM_GAP3099.

### Cenário 5 — Ambiguidade funcional

Entrada:

Título:
"Implementar integração de faturamento"

Tier:
1

Módulo:
Não informado.

O processo pode envolver SD ou FI.

Decisão:

CONFIRMACAO_NECESSARIA

Pergunta:

"O desenvolvimento pertence ao processo de
faturamento comercial (SD) ou ao processo
contábil/financeiro (FI)?"

Não escolher arbitrariamente um módulo.

---

## 16. Regras para agentes consumidores

O agente que executar esta skill deve:

1. Obter os dados funcionais do desenvolvimento.
2. Identificar o Tier definido no planejamento.
3. Identificar o módulo responsável.
4. Interpretar o processo de negócio.
5. Consultar a estrutura real utilizando o MCP.
6. Procurar pacotes semanticamente compatíveis.
7. Validar a hierarquia.
8. Validar propriedades técnicas disponíveis.
9. Priorizar a reutilização quando adequada.
10. Recomendar novo pacote somente se necessário.
11. Retornar o resultado estruturado.
12. Encerrar a execução sem alterar o SAP.

Se o resultado for REUTILIZAR_EXISTENTE,
o pacote poderá ser utilizado pelo fluxo de
desenvolvimento responsável.

Se o resultado for PROPOR_NOVO,
a proposta deve ser encaminhada ao fluxo
responsável pela criação e aprovação de pacotes.

O agente consumidor não deve tratar PROPOR_NOVO
como confirmação de que o pacote existe.

A criação de objetos no pacote proposto deve
aguardar sua efetiva existência e validação.

---

## 17. Critérios de qualidade

Antes de concluir, verificar:

- [ ] O Tier está corretamente definido?
- [ ] O módulo está corretamente identificado?
- [ ] O processo de negócio está claro?
- [ ] A hierarquia foi consultada via MCP?
- [ ] Os pacotes existentes foram avaliados?
- [ ] A semântica dos candidatos foi considerada?
- [ ] A reutilização foi priorizada?
- [ ] A compatibilidade técnica foi verificada?
- [ ] O nome proposto possui até 30 caracteres?
- [ ] O nome representa um processo reconhecível?
- [ ] O nome não contém o número do GAP?
- [ ] O Superpackage foi identificado?
- [ ] A existência ou inexistência foi confirmada?
- [ ] As ambiguidades foram explicitadas?
- [ ] Nenhuma operação de escrita foi executada?

Se uma verificação obrigatória estiver pendente,
não declarar a determinação como validada.

---

## 18. Regra de segurança final

ESTA SKILL NÃO CRIA PACOTES SAP.

Sua responsabilidade termina na determinação,
validação e recomendação.

Mesmo quando identificar que um pacote novo
é necessário, deve apenas informar:

- Nome técnico sugerido.
- Descrição funcional recomendada.
- Tier.
- Módulo.
- Superpackage esperado.
- Justificativa.
- Estado da validação.
- Necessidade de criação posterior.

NUNCA executar ferramenta MCP de criação,
alteração, movimentação ou exclusão de pacotes.

NUNCA assumir que uma proposta equivale a
um pacote existente.

NUNCA afirmar que houve criação de pacote.

**Determinar, consultar, validar e recomendar.
Nunca criar.**
