# Plano de desenvolvimento — GAP018

Formulário Adobe do pedido de compra. Fonte: `00_spec/GAP018-esptec.json` (spec técnica V0, 13/11/2026) e a EF V1.3 em `00_spec/`. Tipo: desenvolvimento novo. Sistema: `KOMATSU_DEV_100`. Sem alteração no SAP até as decisões abaixo.

## Objetivo

Emitir o PDF do pedido de compra nacional no layout Komatsu, em português e em uma via, pela mensagem de pedido novo no meio impressão. O formulário lê o pedido já gravado e não grava dado novo.

Fora deste GAP: contrato de compra, pedido de importação (DEX, Web ou Excel), fax, EDI, ALE, e-mail pelo sistema, GAP 020, GAP 022 e gravação do aceite do fornecedor.

## Decisões antes de criar objeto

1. Nome do formulário. A spec propõe `ZMM_PEDIDO_COMPRA`, cópia de `MEDRUCK_PO`. O workbook, para formulário novo, usa `Z{MOD}S_{DESC}` (exemplo `ZSDS_DANFE`), o que daria `ZMMS_PEDIDO_COMPRA`. O objeto ainda não existe. Confirmar qual nome gravar.
2. Pacote. A spec não cita. Um pacote por projeto, nome começando com `Z`. Confirmar o nome antes de criar.
3. Códigos fixos de negócio que a lógica compara: tipos de pedido (`NB`, `ZURG`, `ZREG`, `ZCON`, `ZOP1`, `ZOP2`, `ZOP3`, `ZSER` entram; `ZIMP`, `UB`, `UD`, `FO` não) e condições (`BX13`, `BX23`, `IPIS`, `ICOF`, `FRA1`, `FRB1`, e a exclusão de `PB00` e `PBXX`). Confirmar se cada grupo fica fixo no formulário ou vai para `ZCL_XX_CONSTANTES`, e, se for parametrizar, o nome da constante. Sem esse nome, não cadastrar e não inventar.

## O que não criar e não alterar

- Não alterar `SAPFM06P` nem `MEDRUCK_PO`.
- Sem tabela Z, sem módulo de função novo, sem objeto de autorização, sem TVARV, sem BRF+.
- Sem tela de seleção.
- A autorização continua a de exibição e de mensagem já usada em `ME22N` e `ME9F`.

## Requests

| Tipo | Request |
|---|---|
| Workbench | `DS4K900553` |
| Customizing | `DS4K900551` |

O formulário e o pacote entram em `DS4K900553`. A mensagem `NEU`, o `TNAPR` e os registros de `B026` entram em `DS4K900551`.

## Objetos

| Papel | Objeto | Ação |
|---|---|---|
| Formulário Adobe | nome confirmado na decisão 1 | Copiar `MEDRUCK_PO` e ajustar layout e regras |
| Programa de impressão | `SAPFM06P` | Não alterar. Ele chama o formulário da mensagem |
| Formulário standard | `MEDRUCK_PO` | Não alterar. Continua no fax e nos demais meios |
| Mensagem | `NEU`, aplicação `EF`, meio impressão `1` | Apontar o formulário novo |
| Determinação | `TNAPR` e um registro em `B026` por tipo, sem fornecedor | Configuração, não código |

A lógica nova fica no formulário copiado e na interface que a cópia trouxer. `SAPFM06P` só passa a usar o formulário novo porque a mensagem aponta para ele.

## Sequência

1. Confirmar as três decisões acima.
2. Gravar o pacote e o formulário na request de workbench `DS4K900553`. A configuração da mensagem vai na request de customizing `DS4K900551`.
3. Copiar `MEDRUCK_PO` para o formulário novo. Conferir que o standard não foi gravado por cima.
4. Ajustar o layout para as seções 1 a 7 da EF. Campo sem valor sai em branco e não bloqueia a emissão. Data em `DD/MM/AAAA`. CNPJ em `99.999.999/9999-99`. Um PDF, em português, sem código de barras e sem número de via.
5. Implementar as regras no contexto do formulário, lendo o pedido já gravado.
6. Configurar a mensagem: `NEU`, meio impressão `1`, formulário novo. Um registro em `B026` por tipo, sem fornecedor.
7. Executar CT-01 a CT-14 com massa sintética e anexar o PDF e a tela da mensagem.

## Regras no formulário

**Proposta da mensagem.** Propor para `NB` e, depois de configurados, `ZURG`, `ZREG`, `ZCON`, `ZOP1`, `ZOP2`, `ZOP3` e `ZSER`. Não propor para `ZIMP`, `UB`, `UD`, `FO` e os demais tipos. A proposta é um registro em `B026` por tipo, para qualquer fornecedor. Se a mensagem for inserida à mão, o PDF sai mesmo assim.

**Cabeçalho, fornecedor e condições.** Saem do pedido. Organização como código e descrição. Grupo de compras só com a descrição. Centro só com o nome. Condição de pagamento como código e texto de `T052U` no idioma `P` e limite de dias `00`; sem o texto, só o código. Incoterm como código, `TINCT-BEZEI` no idioma `P` e complemento. E-mail do fornecedor é o padrão de `ADR6`, vigente na data do pedido.

**Itens.** Item eliminado (`EKPO-LOEKZ`) não é impresso. Uma linha por item, na ordem do item. Preço com 4 casas e valor com 2. Data do item é a menor `EKET-EINDT`. A data do cabeçalho é a menor entre os itens impressos.

**Totais.** As linhas ICMS (`BX13`), IPI (`BX23`), PIS (`IPIS`), COFINS (`ICOF`), FRETE (`FRA1` e `FRB1`) e OUTROS CUSTOS são sempre impressas. Condição ausente sai `0,00`. Total dos itens é a soma dos itens impressos. Valor total soma itens, impostos, frete e outros custos. `PB00` e `PBXX` não entram em outros custos.

**Textos e assinaturas.** Imprimir os seis textos fixos do layout da EF, sem redigir texto novo. Solicitado por é o nome do grupo de compras. Aprovado por e Recebido / Aceite saem com data em branco. O sistema não grava o aceite.

**Reemissão.** O segundo PDF repete os dados atuais do pedido. Continua uma via, em português, sem código de barras.

## Configuração da mensagem

| Tipo | Mensagem de pedido novo, meio impressão |
|---|---|
| `NB`, `ZURG`, `ZREG`, `ZCON`, `ZOP1`, `ZOP2`, `ZOP3`, `ZSER` | Proposta |
| `ZIMP`, `UB`, `UD`, `FO` e os demais | Sem proposta |

`B025` não é usado. Quem configura os tipos além de `NB` é o consultor MM, um registro em `B026` por tipo.

## Testes

Massa sintética, criada depois dos pré-requisitos. `EKKO` no mandante 100 não tem pedido. A organização `1410` existe e pode ser usada. Anexar o PDF de cada emissão e a tela da mensagem (`ME22N` ou `ME9F`) mostrando o meio usado.

| Cenário | O que fazer | Resultado |
|---|---|---|
| CT-01 / RN-01 | Gravar pedido `NB` e processar a mensagem de pedido novo, meio impressão | PDF com o título SAP S/4HANA PEDIDO DE COMPRA e o número do pedido |
| CT-02 / RN-01 | Processar a mensagem de fax do mesmo pedido | Não sai o PDF Komatsu. O fax permanece no formulário antigo |
| CT-03 / RN-02 | Emitir pedido `NB` | PDF emitido |
| CT-04 / RN-02 | Gravar pedido `UB` | A mensagem de pedido novo no meio impressão não é proposta |
| CT-05 / RN-03 | Emitir pedido com organização `1410`, fornecedor com CNPJ e grupo de compras com e-mail | Cabeçalho mostra `1410` e a descrição cadastrada, CNPJ formatado e e-mail do grupo preenchido |
| CT-06 / RN-03 | Fornecedor sem e-mail e sem contato | Essas células em branco e o PDF gerado |
| CT-07 / RN-04 | Dois itens (10 em 10/09/2026 e 20 em 12/09/2026) e um item 30 eliminado | Duas linhas, cabeçalho em 10/09/2026, item 30 ausente e item 20 em 12/09/2026 |
| CT-08 / RN-04 | Item sem texto longo e sem divisão de remessa | Especificação e data do item em branco; descrição breve impressa |
| CT-09 / RN-05 | Itens 1.075,00 + 540,00 + 175,00 + 575,00, `BX13` 425,70, `BX23` 0, `IPIS` 39,02, `ICOF` 179,74, sem frete | Total dos itens 2.365,00 e valor total do pedido 3.009,46 |
| CT-10 / RN-05 | Sem IPI e sem frete | Linhas IPI e FRETE impressas com 0,00 |
| CT-11 / RN-06 | Emitir qualquer pedido da RN-02 | Os seis textos da RN-06 aparecem e as datas de aprovado por e de aceite ficam em branco |
| CT-12 / RN-06 | Grupo de compras com nome preenchido | Solicitado por igual ao nome do grupo |
| CT-13 / RN-07 | Emitir, alterar a quantidade e reemitir | O segundo PDF mostra a quantidade nova, continua uma via, em português e sem código de barras |
| CT-14 / RN-07 | Inspecionar o PDF do CT-01 | Não há código de barras nem marcação de segunda via |

## Ordem sugerida de construção

Cabeçalho e emissão do `NB` (CT-01, CT-03, CT-05) antes dos itens e dos totais. Fax e `UB` (CT-02, CT-04) logo depois, para travar o que não pode mudar. Totais (CT-09, CT-10) só com as condições da spec. Reemissão (CT-13) por último.
