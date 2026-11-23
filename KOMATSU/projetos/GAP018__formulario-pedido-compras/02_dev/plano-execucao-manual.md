# Execução manual — GAP018

Sistema: `KOMATSU_DEV_100`, mandante 100. Fonte: EF V1.3 e `01_analise/DEVELOPMENT_PLAN.md`. O plano de desenvolvimento ainda não está aprovado. Este arquivo é o roteiro para fazer na mão o que a EF pede. Nada aqui cria objeto novo fora da EF.

Não alterar `MEDRUCK_PO` nem `SAPFM06P`. Não criar tabela, módulo de função, objeto de autorização, TVARV nem BRF+. Fax, EDI e ALE permanecem como estão.

Requests já informadas:

| Uso | Request |
|---|---|
| Pacote, interface, formulário e classe | `DS4K900553` |
| Mensagem, formulário da mensagem e registros por tipo | `DS4K900551` |

## Antes de gravar

Decisões de 16/11/2026:

- A interface criada é `ZAFIMM_PEDIDO_COMPRA`, cópia da interface do `MEDRUCK_PO`. Os parâmetros que o `SAPFM06P` já preenche permanecem. Não criar parâmetro novo de importação.
- O formulário continua `ZAFMM_PEDIDO_COMPRA` e aponta para essa interface.
- A lógica das mudanças fica na classe `ZMMCL_PURCHASE_ORDER_FORM`. Identificador novo de classe, método e tipo fica em inglês. A Code Initialization, depois do switch de segmentação copiado, só chama a form routine `build_purchase_order`. Essa routine copia os parâmetros de importação e chama `build`. A regra de negócio não fica na routine.
- O layout só amarra campos. O `SAPFM06P` não recebe regra nova.
- Dado que a interface copiada já traz não é lido de novo em tabela clássica. Leitura que não vier nessa entrega usa CDS released. Tipo novo usa o campo da CDS.
- Os seis textos da área de observações ficam no SO10, nomes `ZAFIMM_PED_TXT_01` a `ZAFIMM_PED_TXT_06`, idioma de origem português. Outro idioma é o mesmo nome. Sem tradução, a leitura usa o português. `NAST-SPRAS` não existe na interface. Até haver um parâmetro de idioma já copiado, a leitura usa português.

Fechado em 23/11/2026:

1. Tipos de pedido da proposta: `NACE`, aplicação `EF`, mensagem `NEU`, condição `B026`. Não entra em `ZCL_XX_CONSTANTES`.
2. Condições do quadro: de-para fixo na rotina `build_purchase_order` (`BX13`, `BX23`, `IPIS`, `ICOF`, `FRA1`, `FRB1`, exclusão de `PB00` e `PBXX`). Não entra em `ZCL_XX_CONSTANTES`.

Os tipos `ZURG`, `ZREG`, `ZCON`, `ZOP1`, `ZOP2`, `ZOP3` e `ZSER` ainda não existem no mandante 100. O formulário e o teste do `NB` não dependem deles. O registro desses tipos só entra depois que o tipo existir.

## 1. Pacote

Fechado em 23/11/2026. Pacote `ZPKG_T3_MM_PURCHASE_ORDER`, pai `ZPKG_T3_MM`. A classe `ZMMCL_PURCHASE_ORDER_FORM`, a interface `ZAFIMM_PEDIDO_COMPRA` e o formulário `ZAFMM_PEDIDO_COMPRA` estão nesse pacote.

Conferido no `KOMATSU_DEV_100` em 23/11/2026: o pacote existe, o pai é `ZPKG_T3_MM` e os três objetos estão nele.

## 2. Interface

A interface `ZAFIMM_PEDIDO_COMPRA` já foi criada como cópia da interface do `MEDRUCK_PO`, na request `DS4K900553`.

Não alterar a interface original. Não incluir parâmetro novo de importação. Na Code Initialization, manter o switch de segmentação copiado e, depois dele, chamar a form routine `build_purchase_order`. A routine copia `HEADER`, `ADDRESSINFO`, `CONTACTINFO`, `ITEM`, `CONDITIONS` e `CONDITIONS_HDR` e chama `ZMMCL_PURCHASE_ORDER_FORM=>build`.

Pronto quando a interface ativa abre na `SFP`, o `MEDRUCK_PO` continua igual e a inicialização chama a routine.

## 3. Criar o formulário

Ainda na `SFP`. Criar um formulário novo, em branco, e apontá-lo para a interface `ZAFIMM_PEDIDO_COMPRA` do passo 2. Não usar o botão de copiar.

1. Nome: `ZAFMM_PEDIDO_COMPRA`.
2. Interface: `ZAFIMM_PEDIDO_COMPRA`.
3. Pacote: o do passo 1.
4. Request: `DS4K900553`.
5. Com o `MEDRUCK_PO` aberto ao lado, passar à mão o contexto e o que mais o formulário padrão tiver e o layout Komatsu for usar.
6. Não salvar alteração no `MEDRUCK_PO`.

Pronto quando o formulário novo abre na `SFP`, aponta para a interface nova e o `MEDRUCK_PO` continua igual.

## 4. Regras na classe

A lógica fica em `ZMMCL_PURCHASE_ORDER_FORM`, no pacote do passo 1 e na request `DS4K900553`. O método público é `build`. O programa `SAPFM06P` não é editado. Campo sem valor sai em branco e a emissão não para.

A classe recebe o que a interface copiada já traz e devolve os campos que o layout amarra. Não reler esse dado em tabela clássica. O que não vier na interface é lido em CDS released. Sem view released, a exceção fica registrada aqui antes de usar tabela clássica.

Cabeçalho, fornecedor e condições, lidos do pedido já gravado:

- Organização: código e descrição.
- Grupo de compras: só a descrição. O e-mail do grupo vai no cabeçalho.
- Centro: só o nome. O endereço do centro é o local de entrega do primeiro item impresso.
- Condição de pagamento: código e texto em português, limite de dias zero. Sem o texto, só o código.
- Incoterm: código, descrição em português e complemento.
- E-mail do fornecedor: e-mail padrão do endereço, vigente na data do pedido.
- CNPJ no formato `99.999.999/9999-99`.
- Finalidade: texto de cabeçalho do pedido. Sem texto, a célula fica em branco.
- Requisição e cotação: do primeiro item impresso que tiver o dado.

Itens:

- Item eliminado não entra.
- Uma linha por item, na ordem do item.
- Descrição é o texto breve. Especificação é o texto longo; sem texto longo, a célula fica em branco.
- Quantidade nas casas da unidade. Preço com 4 casas. Valor com 2 casas.
- Data do item: a menor data de remessa daquele item. Sem divisão, em branco.
- Data do cabeçalho: a menor entre os itens impressos. Sem divisão, em branco.
- Datas em `DD/MM/AAAA`.

Quadro de totais. As seis linhas saem sempre. Condição ausente sai `0,00`. Valores com 2 casas, milhar com ponto e decimal com vírgula.

| Linha | Condição | O que imprimir |
|---|---|---|
| ICMS | `BX13` | Base, alíquota e valor da condição |
| IPI | `BX23` | Base, alíquota e valor da condição |
| PIS | `IPIS` | Base, alíquota e valor da condição |
| COFINS | `ICOF` | Base, alíquota e valor da condição |
| FRETE | `FRA1` e `FRB1` | Alíquota da `FRA1`. Se só houver `FRB1`, alíquota em branco. Valor é a soma |
| OUTROS CUSTOS | qualquer outra condição com valor, exceto `PB00` e `PBXX` | Soma das bases, alíquota em branco, soma dos valores |

Cada condição do pedido entra uma vez. Condição de cabeçalho entra. Condição que o cálculo já distribuiu nos itens entra só nas linhas de item, sem somar de novo o cabeçalho. Item eliminado não entra. Total dos itens é a soma dos itens impressos. Valor total soma itens, impostos, frete e outros custos.

O de-para do quadro fica nos literais da rotina `build_purchase_order`. Não gravar esses códigos em `ZCL_XX_CONSTANTES`.

## 5. Layout

No desenho do formulário novo, título fixo `SAP S/4HANA PEDIDO DE COMPRA`. Sete áreas, nesta ordem: dados da compra, fornecedor, condições, itens, impostos e totais, textos, assinaturas.

Textos da área 6 saem do SO10, nesta ordem e com estas palavras. Nomes `ZAFIMM_PED_TXT_01` a `ZAFIMM_PED_TXT_06`:

1. Os materiais devem atender às especificações técnicas e normas aplicáveis.
2. Enviar Nota Fiscal eletrônica identificando o número deste Pedido de Compra.
3. Garantia mínima de 12 meses contra defeitos de fabricação.
4. Comunicar qualquer alteração no prazo de entrega com antecedência.
5. Especificação Técnica | Termo de qualidade
6. Favor confirmar o recebimento deste Pedido de Compra e o aceite das condições acima.

Área 7: Solicitado por é o nome do grupo de compras. Aprovado por e Recebido / Aceite saem com a data em branco, no formato `____/____/____`. O sistema não grava o aceite.

Um PDF, em português, sem código de barras e sem número de via.

## 6. Ativar

Ativar a classe `ZMMCL_PURCHASE_ORDER_FORM`, a interface `ZAFIMM_PEDIDO_COMPRA` e, depois, o formulário `ZAFMM_PEDIDO_COMPRA`. Não ativar mudança em `MEDRUCK_PO`, na interface original nem em `SAPFM06P`.

Pronto quando a `SFP` mostra os dois objetos novos ativos e a impressão standard, antes da configuração do passo 7, ainda aponta para `MEDRUCK_PO`.

## 7. Apontar a mensagem

Customizing, request `DS4K900551`. Transação `NACE`, aplicação `EF`, mensagem `NEU`.

No meio impressão `1`, trocar só o nome do formulário PDF para `ZAFMM_PEDIDO_COMPRA`. O programa permanece `SAPFM06P`.

Não mexer nestes meios:

| Meio | Formulário ou programa que permanece |
|---|---|
| Impressão `1` | programa `SAPFM06P`; só o formulário PDF muda |
| Fax `2` | `MEDRUCK` |
| EDI `6` e ALE `A` | `RSNASTED` |

Pronto quando a mensagem `NEU`, meio `1`, mostra o formulário novo e o programa `SAPFM06P`, e os outros meios continuam iguais.

## 8. Proposta da mensagem

Ainda na request `DS4K900551`. Um registro por tipo de pedido, na condição cuja chave é só o tipo. Essa condição é a `B026`. Não criar registro na `B025`: a chave dela exige fornecedor, e a proposta vale para qualquer fornecedor e qualquer organização.

Para cada tipo da linha 1 que já exista no mandante:

1. Tipo de pedido.
2. Mensagem de pedido novo.
3. Meio impressão.
4. Sem fornecedor.

Começar por `NB`. Os tipos `ZURG`, `ZREG`, `ZCON`, `ZOP1`, `ZOP2`, `ZOP3` e `ZSER` entram no mesmo formato só depois de existirem. Não criar registro para `ZIMP`, `UB`, `UD`, `FO` nem para os demais tipos.

Se a tela pedir função do parceiro, usar a mesma função que a mensagem de impressão do pedido já usa. Não inventar outra.

Pronto quando existe um registro de `NB` sem fornecedor e não existe registro novo para `UB`.

## 9. Conferir o que não muda

Antes do teste:

- `MEDRUCK_PO` sem alteração.
- Interface original do `MEDRUCK_PO` sem alteração.
- `SAPFM06P` sem alteração.
- Fax continua em `MEDRUCK`.
- EDI e ALE continuam em `RSNASTED`.
- Nenhum registro novo depende de fornecedor.

## 10. Testes

Massa sintética, no mandante 100. A organização `1410` existe e serve para o CT-05. No momento da EF não havia pedido. Anexar o PDF e a tela da mensagem.

Ordem: pedido nacional, depois o que não pode mudar, depois totais, por último a reemissão.

| Teste | O que fazer | Resultado |
|---|---|---|
| CT-01 | Gravar um pedido `NB` com um item e processar a mensagem de pedido novo, meio impressão | PDF com o título `SAP S/4HANA PEDIDO DE COMPRA` e o número do pedido |
| CT-02 | Processar a mensagem de fax do mesmo pedido | Não sai o PDF Komatsu |
| CT-03 | Emitir pedido `NB` | PDF emitido |
| CT-04 | Gravar pedido `UB` | A mensagem de pedido novo no meio impressão não é proposta |
| CT-05 | Emitir com organização `1410`, fornecedor com CNPJ e grupo de compras com e-mail | Cabeçalho com `1410` e a descrição cadastrada, CNPJ formatado e e-mail do grupo |
| CT-06 | Fornecedor sem e-mail e sem contato | E-mail e contato em branco, PDF gerado |
| CT-07 | Dois itens, o segundo com entrega posterior, e um item eliminado. Exemplo da EF: item 10 em 10/09/2026, item 20 em 12/09/2026, item 30 eliminado | Duas linhas. Cabeçalho em 10/09/2026. Item 30 ausente. Item 20 em 12/09/2026 |
| CT-08 | Item sem texto longo e sem divisão de remessa | Especificação e data do item em branco. Descrição breve impressa |
| CT-09 | Condições do layout: itens 1.075,00 + 540,00 + 175,00 + 575,00; `BX13` 425,70; `BX23` 0; `IPIS` 39,02; `ICOF` 179,74; sem frete | Total dos itens 2.365,00. Valor total 3.009,46 |
| CT-10 | Pedido sem IPI e sem frete | Linhas IPI e FRETE impressas com 0,00 |
| CT-11 | Qualquer pedido da regra de tipos | Os seis textos aparecem. Datas de aprovado por e de aceite em branco |
| CT-12 | Grupo de compras com nome | Solicitado por igual a esse nome |
| CT-13 | Emitir, alterar a quantidade e reemitir | O segundo PDF mostra a quantidade nova. Continua uma via, em português, sem código de barras |
| CT-14 | Olhar o PDF do CT-01 | Sem código de barras e sem marcação de segunda via |

Canais da mesma mensagem: `ME21N`, `ME22N`, `ME9F` e o aplicativo Administrar pedidos. A criação do pedido por BAPI não emite o PDF sozinha.
