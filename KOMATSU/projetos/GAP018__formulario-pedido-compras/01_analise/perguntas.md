# Perguntas — GAP018

Fonte: EF V1.3, `[MM007] - EF - GAP018 FORMULÁRIO PEDIDO DE COMPRAS_V1.docx`. Estas quatro respostas bloqueiam a criação do formulário.

## 1. Nome do formulário

A EF, na seção "Design da Solução", propõe `ZMM_PEDIDO_COMPRA`, cópia de `MEDRUCK_PO`. O workbook, para formulário novo, usa a máscara `Z{MOD}S_{DESC}`, o que daria `ZMMS_PEDIDO_COMPRA`.

Qual nome gravar?

## 2. Cenário empresarial

A regra de pacote escolhe o pacote pai por módulo e cenário empresarial. A EF traz módulo MM e o processo "Compra de materiais", e não traz o campo cenário empresarial. O processo não escolhe o nó.

Qual é o cenário empresarial do catálogo?

## 3. Tipos de pedido da proposta

A EF lista os tipos que propõem a mensagem (`NB`, `ZURG`, `ZREG`, `ZCON`, `ZOP1`, `ZOP2`, `ZOP3`, `ZSER`) e os que não propõem (`ZIMP`, `UB`, `UD`, `FO` e os demais).

Esses códigos ficam fixos no código ou entram em `ZCL_XX_CONSTANTES`?

Se for parametrizar, qual é o nome da constante? A leitura é lista de valores ou par de valores?

## 4. Condições do quadro de totais

A EF amarra ICMS a `BX13`, IPI a `BX23`, PIS a `IPIS`, COFINS a `ICOF`, frete a `FRA1` e `FRB1`, e exclui `PB00` e `PBXX` de outros custos.

Esses códigos ficam fixos no código ou entram em `ZCL_XX_CONSTANTES`?

Se for parametrizar, qual é o nome da constante? A leitura é lista de valores ou par de valores?
