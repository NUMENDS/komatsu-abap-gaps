# Plano de desenvolvimento — GAP018

Fonte: `00_spec/[MM007] - EF - GAP018 FORMULÁRIO PEDIDO DE COMPRAS_V1.docx` (EF V1.3). Sistema confirmado: `KOMATSU_DEV_100`. Tipo: desenvolvimento novo. Análise do `spec_analyzer` em 13/11/2026. O plano não está aprovado.

## Entendimento

Em uma frase: o comprador passa a emitir o pedido de compra nacional em PDF, no modelo da Komatsu, para enviar ao fornecedor.

O pedido impresso hoje sai num modelo padrão que não tem as seções, os impostos brasileiros nem o bloco de aceite usados pela Komatsu. O pedido deste GAP é trocar só essa impressão do pedido nacional.

O que o comprador recebe: um PDF em português, em uma via, com o número do pedido, os dados do fornecedor, os itens que continuam válidos, os impostos, o frete, os outros custos e os textos do modelo. Campo sem informação fica em branco e a emissão não para por isso. Uma nova emissão mostra os dados atuais do pedido. As datas de aprovação e de aceite saem em branco. O sistema não grava o aceite do fornecedor.

Como funciona, passo a passo:

1. O comprador grava o pedido.
2. Para os tipos de pedido previstos, o sistema propõe a mensagem de pedido novo no meio de impressão.
3. Ao processar essa mensagem, sai o PDF no modelo Komatsu.
4. Se alguém inserir a mensagem à mão, o PDF também sai.
5. Fax, EDI e ALE continuam como estão. O fax não usa o modelo novo.

Fora deste desenvolvimento: formulário de contrato, pedido de importação, envio do PDF por e-mail a partir do sistema, GAP 020, GAP 022 e gravação do aceite.

Confirmação para o funcional:

- [ ] O documento entregue é o pedido de compra, não o contrato citado no texto original do GAP.
- [ ] Só a mensagem de pedido novo, no meio impressão, usa o modelo Komatsu.
- [ ] O fax permanece no modelo antigo.
- [ ] O sistema não grava o aceite do fornecedor.

Para quem for desenvolver: as seções abaixo registram o que copiar, o que não alterar, o que já existe no `KOMATSU_DEV_100` e o que ainda precisa de resposta antes de criar o objeto.

## Escopo

Emitir o PDF do pedido de compra nacional no layout Komatsu. O formulário lê o pedido já gravado e não grava dado novo.

| Requisito | O que a EF pede | Onde entra |
|---|---|---|
| RN-01 | PDF do pedido novo no meio impressão | Formulário novo chamado pela mensagem |
| RN-02 | Proposta da mensagem por tipo de pedido | Configuração, um registro por tipo, sem fornecedor |
| RN-03 | Cabeçalho, fornecedor e condições | Leitura do pedido já gravado |
| RN-04 | Itens, sem item eliminado | Leitura do pedido já gravado |
| RN-05 | Impostos, frete, outros custos e totais | Leitura das condições do pedido |
| RN-06 | Seis textos fixos e bloco de assinatura | Layout da EF, sem texto novo |
| RN-07 | Uma via, português, sem código de barras; reemissão com dados atuais | Layout e nova emissão |

## Arquitetura

Não é aplicativo, relatório nem extensão de gravação do pedido. É um formulário de impressão novo, cópia do formulário padrão do pedido, apontado na mensagem de pedido novo, meio impressão.

O programa de impressão do pedido não é alterado. Ele passa a chamar o formulário novo porque a mensagem aponta para ele. A lógica nova fica no formulário copiado e na interface que a cópia trouxer.

Não há tabela nova, módulo de função novo, objeto de autorização, TVARV nem BRF+.

## Objetos

| Papel | Nome | Situação no DS4 em 13/11/2026 | Ação |
|---|---|---|---|
| Formulário padrão | `MEDRUCK_PO` | Existe, tipo formulário Adobe, pacote `MMPUR_PRINT`, não eliminado | Não alterar |
| Programa de impressão | `SAPFM06P` | Existe, programa, pacote `ME`, não eliminado | Não alterar |
| Formulário novo | nome ainda em aberto | `ZMM_PEDIDO_COMPRA` não está no repositório | Criar como cópia, na request `DS4K900553` |
| Mensagem | `NEU`, aplicação `EF`, meio impressão `1` | Configuração | Apontar o formulário novo na request `DS4K900551` |
| Determinação | um registro por tipo, sem fornecedor | Configuração | Não usar o registro que depende do fornecedor |

Pacote do GAP, pela regra de pacote: `ZPMM_MM_018_T1`, `ZPMM_MM_018_T2` e `ZPMM_MM_018_T3`. O tier sai do objeto na criação. O pacote pai não fecha: a EF não tem o campo cenário empresarial, e o processo "Compra de materiais" não escolhe o nó.

## Validação técnica

Consulta no `KOMATSU_DEV_100`, tabela de repositório, em 13/11/2026:

- `MEDRUCK_PO`: presente, marca de eliminação vazia.
- `SAPFM06P`: presente, marca de eliminação vazia.
- `ZMM_PEDIDO_COMPRA`: sem linha.

A EF cita a leitura do pedido, da condição de pagamento, do incoterm e do e-mail do fornecedor. Essas leituras são do pedido já gravado. Não houve troca dessas leituras por outra fonte: a EF nomeia a origem e o resultado tem de ser o mesmo.

## Clean Core

Desenvolvimento novo, mas o ponto de chamada é o programa padrão de impressão do pedido, que a EF manda manter. O formulário novo é cópia do formulário padrão. Não se altera o programa nem o formulário padrão. Não se cria tabela, serviço nem aplicativo.

## Regras que o formulário precisa cumprir

A mensagem é proposta para `NB` e, depois de configurados, `ZURG`, `ZREG`, `ZCON`, `ZOP1`, `ZOP2`, `ZOP3` e `ZSER`. Não é proposta para `ZIMP`, `UB`, `UD`, `FO` e os demais. Se a mensagem for inserida à mão, o PDF sai mesmo assim.

Cabeçalho, fornecedor e condições saem do pedido. Organização com código e descrição. Grupo de compras só com a descrição. Centro só com o nome. Condição de pagamento com o texto no idioma português e limite de dias zero; sem o texto, só o código. Incoterm com a descrição em português e o complemento. E-mail do fornecedor é o e-mail padrão vigente na data do pedido.

Item eliminado não é impresso. Uma linha por item, na ordem do item. Preço com 4 casas e valor com 2. A data do item é a menor data de remessa. A data do cabeçalho é a menor entre os itens impressos.

As linhas de ICMS, IPI, PIS, COFINS, frete e outros custos são sempre impressas. Condição ausente sai 0,00. Total dos itens é a soma dos itens impressos. Valor total soma itens, impostos, frete e outros custos. As condições de preço `PB00` e `PBXX` não entram em outros custos.

Os seis textos saem do layout da EF. Solicitado por é o nome do grupo de compras. Aprovado por e Recebido / Aceite saem com data em branco.

## Testes

Massa sintética. No momento da EF, o mandante 100 não tinha pedido. A organização `1410` pode ser usada. Anexar o PDF e a tela da mensagem.

A ordem sugerida continua a do plano anterior: emissão do pedido nacional, depois o que não pode mudar (fax e pedido de transferência), depois totais e por último a reemissão. Os cenários são CT-01 a CT-14 da EF.

## Pendências

Estas perguntas impedem criar o objeto. Cada uma cita o que a EF diz e o que ela não fecha.

1. Nome do formulário. A EF, na seção "Design da Solução", propõe `ZMM_PEDIDO_COMPRA`, cópia de `MEDRUCK_PO`. O workbook, para formulário novo, usa a máscara `Z{MOD}S_{DESC}`, o que daria `ZMMS_PEDIDO_COMPRA`. Qual nome gravar?
2. Cenário empresarial. A regra de pacote escolhe o pai por módulo e cenário empresarial. A EF traz módulo MM e o processo "Compra de materiais", e não traz o campo cenário empresarial. Qual é o cenário do catálogo?
3. Tipos de pedido da proposta. A EF lista os tipos que propõem a mensagem e os que não propõem. Esses códigos ficam fixos ou entram em `ZCL_XX_CONSTANTES`? Se for parametrizar, qual é o nome da constante e se a leitura é lista ou par de valores?
4. Condições do quadro de totais. A EF amarra ICMS a `BX13`, IPI a `BX23`, PIS a `IPIS`, COFINS a `ICOF`, frete a `FRA1` e `FRB1`, e exclui `PB00` e `PBXX` de outros custos. Ficam fixos ou entram em `ZCL_XX_CONSTANTES`? Se for parametrizar, qual é o nome da constante e se a leitura é lista ou par de valores?

Requests já informadas: workbench `DS4K900553` e customizing `DS4K900551`.
