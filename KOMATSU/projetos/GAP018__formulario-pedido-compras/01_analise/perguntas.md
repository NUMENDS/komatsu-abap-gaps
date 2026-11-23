# Perguntas — GAP018

Fonte: EF V1.3, `[MM007] - EF - GAP018 FORMULÁRIO PEDIDO DE COMPRAS_V1.docx`. As quatro perguntas já foram respondidas.

## 1. Nome do formulário

Respondido em 16/11/2026. Formulário e interface se chamam `ZAFMM_PEDIDO_COMPRA`. A interface nasce em branco e recebe o conteúdo à mão. O botão de copiar da `SFP` não será usado.

## 2. Pacote

Respondido em 23/11/2026. Tier 3, processo Purchase Order, módulo MM. Pacote `ZPKG_T3_MM_PURCHASE_ORDER`, pai `ZPKG_T3_MM`. A classe, a interface e o formulário saíram de `ZPMM` e estão nesse pacote.

## 3. Tipos de pedido da proposta

Respondido em 23/11/2026. Não entra em `ZCL_XX_CONSTANTES` e não fica no formulário. A proposta é configuração da `NACE`, aplicação `EF`, mensagem `NEU`, condição `B026`. A chave é o tipo de pedido.

## 4. Condições do quadro de totais

Respondido em 23/11/2026. Ficam fixos na rotina `build_purchase_order` da interface `ZAFIMM_PEDIDO_COMPRA`. Não entram em `ZCL_XX_CONSTANTES`.

O de-para é o da EF: ICMS `BX13`, IPI `BX23`, PIS `IPIS`, COFINS `ICOF`, frete `FRA1` e `FRB1`. `PB00` e `PBXX` ficam fora de outros custos. O valor continua vindo da condição do pedido.
