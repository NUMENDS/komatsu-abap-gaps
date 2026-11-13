# Komatsu ABAP GAPs

Repositório das skills e regras do Cursor usadas na factory ABAP da Komatsu. As skills geram a documentação do GAP em PDF no layout Numen, no mesmo chat em que o desenvolvimento roda pelo MCP ABAP.

## Skills

| Skill | O que gera |
| --- | --- |
| `documentos-gap` | Pacote completo: Especificação Técnica, Relatório de Testes e, só quando há atividade de implantação, Plano de Cutover |
| `especificacao-tecnica-gap` | Especificação Técnica (`06_doc/ET-<GAP-ID>.pdf`), com a solução comprovada no código |
| `relatorio-testes-gap` | Relatório de Testes (`05_testes/RT-<GAP-ID>.pdf`), com evidências de ABAP Unit e ATC |
| `cutover-gap` | Plano de Cutover (`06_doc/CO-<GAP-ID>.pdf`): inventário, transportes, atividades, rollback e go/no-go |

`documentos-gap` só chama o cutover quando o critério de implantação passa. Sem atividade de cutover, esse PDF não é gerado.

## Regras

| Regra | O que cobre |
| --- | --- |
| `workbook-komatsu` | Nomenclatura e código do Workbook Numen no sistema Komatsu |
| `parametros-komatsu` | Valor fixo de negócio passa pela classe de parâmetros `ZCL_XX_CONSTANTES` |

As duas regras valem para desenvolvimento na Komatsu. Fora desse alvo, ficam de fora.
