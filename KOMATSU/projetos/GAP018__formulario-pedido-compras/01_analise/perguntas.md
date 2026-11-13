# Perguntas bloqueantes — GAP018

Estágio de análise. O desenvolvimento não grava objeto nem literal de negócio enquanto estas respostas não estiverem em `respostas.md`.

- [ ] Q1: O formulário novo se chama `ZMM_PEDIDO_COMPRA` ou `ZMMS_PEDIDO_COMPRA`?
  - Spec: objetos técnicos e item do formulário Adobe
  - Texto: "Formulário Adobe: ZMM_PEDIDO_COMPRA (cópia de MEDRUCK_PO, nome proposto)"
  - Por que falta: a spec propõe `ZMM_PEDIDO_COMPRA`. O workbook, para formulário novo, usa `Z{MOD}S_{DESC}`, o que dá `ZMMS_PEDIDO_COMPRA`. O objeto ainda não existe. Sem o nome, a cópia de `MEDRUCK_PO` não é criada.

- [ ] Q2: Qual é o nome do pacote deste GAP?
  - Spec: a spec técnica não cita pacote
  - Texto: um pacote por projeto, nome começando com `Z`
  - Por que falta: sem o pacote, o formulário não tem onde ser gravado. O nome não está na spec e não deve ser inventado.

- [ ] Q3: Os tipos de pedido da proposta da mensagem ficam fixos no código ou entram em `ZCL_XX_CONSTANTES`?
  - Spec: RN-02
  - Texto: a mensagem é proposta para `NB` e, depois de configurados, `ZURG`, `ZREG`, `ZCON`, `ZOP1`, `ZOP2`, `ZOP3` e `ZSER`. Não é proposta para `ZIMP`, `UB`, `UD`, `FO` e os demais tipos.
  - Por que falta: a comparação com esses tipos é valor fixo de negócio. Se ficar fixo, o literal entra no código. Se for parametrizar, falta o nome da constante para `zcl_xx_constantes=>get_unicos` ou `get_compostos`, e se a lista que propõe e a lista que não propõe são duas constantes ou uma só. Sem o nome, a constante não é cadastrada.

- [ ] Q4: As condições de imposto, frete e outros custos ficam fixas no código ou entram em `ZCL_XX_CONSTANTES`?
  - Spec: RN-05
  - Texto: as linhas ICMS (`BX13`), IPI (`BX23`), PIS (`IPIS`), COFINS (`ICOF`), FRETE (`FRA1` e `FRB1`) e OUTROS CUSTOS são sempre impressas. `PB00` e `PBXX` não entram em outros custos.
  - Por que falta: cada sigla está amarrada a uma linha do PDF. Se ficar fixo, o literal entra no formulário. Se for parametrizar, falta o nome da constante e se a leitura é `get_unicos` (uma lista) ou `get_compostos` (linha do PDF e código da condição na mesma entrada). Sem o nome, a constante não é cadastrada.
