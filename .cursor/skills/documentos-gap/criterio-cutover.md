# Gate: há atividade de cutover?

Marcar **sim** só com evidência. Um “sim” basta para gerar o plano. Zero “sim” → **não gerar nenhum documento de cutover**.

## Sim (gerar `CO-*.pdf`)

- [ ] Request de transporte confirmada (Workbench e/ou Customizing) para QAS ou PRD
- [ ] Importação STMS / janela de go-live / freeze combinados
- [ ] Configuração manual pós-transporte (SPRO, SICF, job SM36, role PFCG)
- [ ] Carga entre sistemas (`adt_copy_table_data` ou equivalente) prevista
- [ ] Spec, `gap.json` ou o usuário pedem implantação / cutover / entrada em produção
- [ ] Objetos do pacote precisam ser promovidos além do DEV (não ficam só no ambiente de desenvolvimento)

## Não (omitir tudo de cutover)

- GAP só em DEV / `$TMP` / sem transporte
- Spec e conversa sem implantação, job de PRD, carga ou janela
- Atividades seriam só “Não se aplica” ou CO-01 inventado
- Usuário disse que não há cutover

Não perguntar request/janela “para completar o modelo”. Sem evidência de atividade, o plano não existe.
