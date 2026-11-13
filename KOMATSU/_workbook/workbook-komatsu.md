> Vigente para todos os GAPs Komatsu. Antes de criar ou alterar objeto, ler a seção aplicável. Original com o logo: `Workbook_ABAP_Comum_Komatsu_V2.docx`, nesta mesma pasta.

# Workbook Numen — Komatsu

Fonte: Workbook Desenvolvimento Numen v2 (nomenclatura 01/02/2021, RAP 25/04/2024, SBPA 03/06/2024).

So quando o alvo for Komatsu (`KOMATSU_DS4_*`, host komatsu, ou o usuario pedir desenvolvimento na Komatsu). Fora isso, ignorar esta regra.

No alvo Komatsu, esta regra prevalece sobre nomenclatura, comentario e pacote da Suzano. Nao usar mascara `ZOTCSD` / `YCT_` / `ZS_`, nem `LOG MODIFICACOES`, `INS`/`DEL` ou cabecalho `*&---*`. Objeto que ja existe mantem o nome. Objeto novo segue as mascaras abaixo. O exemplo do workbook manda no nome quando a coluna da tabela vier generica.

## Modulos

`SD` `MM` `CO` `FI` `PP` `PM` `QM` `EWM` `TM` `TV` `GL`

`{MOD}` = um desses. `{DESC}` usa `_` antes do texto e entre palavras.

## Objetos

Um pacote por projeto, nome comeca com `Z` (`ZIMP`, `ZNFE`). BRF+ fica no pacote `ZBRF`.

| Objeto | Mascara | Exemplo |
|---|---|---|
| Classe | `Z{MOD}CL_{DESC}` | `ZAACL_ORDEM_VENDA` |
| BRF+ | `ZBRF_{DESC}` | `ZBRF_ENVIA_EMAIL` |
| Programa | `Z{MOD}R_{DESC}` | `ZSDR_EXIBE_OV` |
| Grupo de funcoes | `Z{MOD}G_{DESC}` | `ZSDG_ORDEM_VENDA` |
| Modulo de funcao | `Z{MOD}F_{DESC}` | `ZSDF_CRIA_OV` |
| Formulario | `Z{MOD}S_{DESC}` | `ZSDS_DANFE` (a tabela escreve o tipo A; o exemplo usa S) |
| Classe de mensagem | `Z{MOD}M_{DESC}` | `ZSDM_NFE` |
| Exit | `Z{MOD}E{TEXTO}` sem `_` | `ZSDAFXTSM` |
| BADI | `Z{MOD}B_{DESC}` | `ZSDB_NFE_PRINT` |
| Enhancement | `Z{MOD}E_{DESC}` | `ZSDE_CAMPO_OV` |
| Transacao | `Z{MOD}{DESC}` sem tipo | `ZSDDANFE` |
| Tabela | `Z{MOD}T_{DESC}` | `ZSDT_LOG_VENDAS` |
| Estrutura | `Z{MOD}S_{DESC}` | `ZSDS_LOG_VENDAS` |
| Dominio | `Z{MOD}D_{DESC}` | `ZSDD_ORDEM_VENDA` |
| Elemento de dados | `Z{MOD}E_{DESC}` | `ZSDE_ORDEM_VENDA` |
| Logo | `Z_{DESC}` | `Z_LOGO_EMPRESA` |
| App Fiori | `ZUI5_{DESC}` | `ZUI5_ORDEM_VENDA` |
| Business catalog | `ZBC_{DESC}` | `ZBC_ORDEM_VENDA` |
| Business group | `ZBG_{DESC}` | `ZBG_ORDEM_VENDA` |
| Objeto semantico | `Z{MOD}_UI5_{DESC}` | `ZSD_UI5_ORDEM_VENDA` |
| Semantico de transacao standard | `Z{MOD}_{TCODE}` | `ZSD_VA01` |
| CDS root / interface / consumption | `Z{MOD}_R_` / `_I_` / `_C_` + mesma descricao | `ZSD_R_ORDEM_VENDA` |
| Metadata extension | mesmo nome da consumption | `ZSD_C_ORDEM_VENDA` |
| Behavior definition | `Z{MOD}_R_` root, `Z{MOD}_C_` projection | `ZSD_R_ORDEM_VENDA` |
| Access control | `Z{MOD}_AC_{DESC}` | `ZSD_AC_ORDEM_VENDA` |
| Service definition | `Z{MOD}_UI_{DESC}` ou `Z{MOD}_API_{DESC}` | `ZSD_UI_ORDEM_VENDA` |
| Service binding | definicao + `_O2` ou `_O4` | `ZSD_UI_ORDEM_VENDA_O2` |
| Gateway | `Z{MOD}_{DESC}` | `ZSD_ORDEM_VENDA` |

CDS, metadata extension e behavior da mesma entidade compartilham a descricao, para agrupar na lista.

## Request

`{Consultoria}-{Modulo ou ID do gap}-{Usuario}-{Descricao}`

Exemplo: `Numen-FI-EBLIMA-Plano de Contas`

## Codigo

Cabecalho do programa e historico:

```abap
*----------------------------------------------------------------------*
* Programa.....: ZSDR_EXIBE_OV                                         *
* Titulo.......: Relatorio de Carga                                    *
* Transacao....: ZSDXXX                                                *
* Autor........: Nome                                                  *
* Data.........: 06/03/2019                                            *
* Descricao....: Carga de Materiais                                    *
* Projeto......: Implementacao S4 Hana                                 *
*----------------------------------------------------------------------*
*                     Historico das modificacoes                       *
*----------------------------------------------------------------------*
* Data       Autor             Descricao                               *
* 20/10/19   Nome              Incluir o campo cliente                 *
*----------------------------------------------------------------------*
```

Alteracao fica entre as marcas. Nao apagar linha existente: comentar. Registrar a mesma alteracao no historico do cabecalho.

```abap
* Inicio alteracao - Nome - Numen - 06.03.2019
DATA: vl_dados TYPE c.
* Fim alteracao - Nome - Numen - 06.03.2019
```

Antes de alterar, comparar o fonte entre os ambientes. Se diferir, parar e avisar o responsavel Numen. Guardar backup antes de mudanca de grande impacto.

Prefixos: local `VL_`, global `V_`, field-symbol `<fs_>`, constante `C_`, tabela interna local `TL_`, global `T_`, estrutura `ES_`, tipo `TY_`.

```abap
DATA: vl_matnr TYPE mara-matnr.
DATA: v_matnr TYPE mara-matnr.
FIELD-SYMBOLS: <fs_matnr> TYPE mara-matnr.
CONSTANTS: c_x TYPE c VALUE 'X'.
DATA: tl_mara TYPE TABLE OF mara.
DATA: t_mara TYPE TABLE OF mara.
DATA: es_mara TYPE mara.
TYPES: BEGIN OF ty_mara,
         matnr TYPE mara-matnr,
       END OF ty_mara.
```

## SAP Build Process Automation

Projeto `IS4_{GAP}_P_{DESC}` e automacao `IS4_{GAP}_A_{DESC}`, descricao ate 50 caracteres, sem caractere especial.

Objetos internos, descricao ate 40: `AUT_` `ALE_` `APL_` `INI_` `TAR_` `GPA_` `PRO_` `FOR_` `APR_` `CVI_` `DEC_` `TDA_` `MDO_` `ARQ_`.

Acao: `AC_{DESC}`, ate 50. Exemplo: `AC_API_SalesOrderA2X`.
