# GAP Init Komatsu

Conduza o usuário pelo fluxo usando o MCP App `komatsu-factory-wizard`.

## Regras de execução

1. Ao receber `/gap-init`, não use o contexto da conversa, arquivos, Jira ou mapeamento chat → GAP para decidir qual GAP abrir. O usuário pode alternar entre GAPs simultâneos; a seleção é sempre feita na interface.
2. Leia `AGENTS.md` e preserve as skills existentes para qualquer trabalho realizado após o usuário selecionar e submeter um GAP.
3. Não inicie kickoff, gravações ou ações SAP como consequência automática de abrir o wizard. A única chamada Jira permitida antes da aprovação é a consulta somente de leitura descrita na regra 8.
4. Não considere respostas comuns como aprovação. Somente a ação explícita de aprovação enviada pelo usuário constitui aprovação.
5. Depois de receber uma submissão do wizard, processe-a segundo `AGENTS.md`, as skills e os gates vigentes, usando o GAP selecionado explicitamente na submissão.
6. Antes da aprovação explícita do plano, qualquer consulta ao Jira para o seletor é somente leitura: listar épicos atribuídos ao usuário autenticado, sem buscar pelo nome e sem criar, editar, excluir, atribuir, comentar ou mudar status/prioridade.
7. Selecionar um épico no wizard apenas o associa como referência informada pelo usuário. Não identifica automaticamente um GAP e não constitui aprovação do plano nem autorização para gravar no Jira.
8. Se não houver ferramenta Jira disponível ou a consulta falhar, não invente resultados; abra o wizard sem épicos e informe essa limitação no resumo.

## Abrir a interface

Ao iniciar `/gap-init`, consulte somente os épicos Jira atribuídos ao usuário autenticado (por exemplo, `assignee = currentUser()` quando suportado). Não procure GAP atual, não leia `chats.tmp.json`, transcrições, `gap.json` ou `jira-reference.json`, e não consulte o `factory_orchestrator` antes da escolha do usuário. Em seguida, chame `open_factory_wizard` do servidor `komatsu-factory-wizard` com `mode: "new"`, sem `gapId`, e passe a lista obtida em `workflow.jiraEpics`.

Na abertura inicial, passe:

- `mode: "new"`, sem `gapId`, para sempre mostrar primeiro as opções “Novo GAP” e “Continuar GAP”.
- `workflow.jiraEpics`, com os épicos atribuídos ao usuário autenticado, obtidos em consulta somente de leitura. Para cada épico, envie `key`, `summary`, `issueType`, e, quando disponíveis, `id`, `status`, `assignee` e `url`.
- `workflow.summary` somente para informar que o usuário deve escolher um GAP existente ou iniciar um novo.

Não passe etapa, perguntas ou ações de um GAP nessa abertura inicial. Esses dados serão carregados depois que o usuário selecionar um GAP.

Aguarde a resposta do usuário no wizard.

- Ao receber `komatsu_factory_wizard_intake`, use `primarySpecPath` como EF principal, `technicalSpecPath` como especificação técnica opcional e `supportingDocumentPaths` como anexos. Leia os documentos e siga `AGENTS.md` e as skills antes de iniciar o `factory_orchestrator`. O envio dos arquivos não aprova o plano.
- Ao receber `komatsu_factory_wizard_submission`, retome o GAP explicitamente selecionado na submissão e processe as respostas e a ação escolhida conforme `AGENTS.md`, o estado real do orquestrador e as skills aplicáveis. Ao reabrir o wizard depois de uma submissão, use `mode: "continue"` com o `gapId` confirmado.

Para a abertura inicial de `/gap-init`, sempre chame `open_factory_wizard` assim:
{
  "mode": "new",
  "workflow": {
    "summary": "Aguardando a especificação funcional para iniciar o Intake.",
    "dependencies": [],
    "questions": [],
    "availableActions": []
  }
}

O `mode: "new"` significa iniciar a interface na tela de seleção; não significa que o agente já decidiu iniciar um desenvolvimento novo. Só use `mode: "continue"` para reabrir uma sessão depois que o usuário selecionou um GAP ou submeteu uma ação referente a ele.

Antes de abrir o wizard, faça somente a consulta Jira necessária para preencher `workflow.jiraEpics`, usando o usuário autenticado (por exemplo, `assignee = currentUser()` quando suportado). Não use busca por nome para inferir identidade. A seleção feita pelo usuário deve ser enviada ao agente como referência do GAP selecionado. A skill `jira-story-sync` e qualquer escrita Jira só podem ocorrer após a aprovação explícita do plano de desenvolvimento, conforme `AGENTS.md`.
