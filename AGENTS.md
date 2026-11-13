# Contexto do projeto

O projeto é a migração do Sistema BAAN do cliente Komatsu para o novo ambiente SAP S/4HANA.

Por enquanto os desenvolvimentos estão apenas com objetos novos, mas em caso de remediação ou simplificação, adicionar e mudar a descrição desse arquivo, com a intenção de self-building conforme o projeto avança.

Remediação = Cópia exata do legado, alterando somente o necessário para passar no ATC e adequar ao ambiente S/4.
Simplificação = Alteração da lógica que já existia no legado.

Quando a análise da spec no `factory_orchestrator` (`spec_analyzer`, Estágio 1), seguir a skill [`.cursor/skills/novo-objeto`](.cursor/skills/novo-objeto/SKILL.md) antes de gravar o plano e antes de criar ou alterar objeto.

| Tipo | Descrição |
|-----|-----|
| Novo | Desenvolvimento novo, do zero. |

# Estrutura do repositório

Segue a estrutura da tool `factory_orchestrator` do MCP `user-abap-mcp-local`:

```
chats.tmp.json                # temporário na raiz: chat → GAP (não versionado)
<CLIENTE>/
  _workbook/                  # templates e padrões do cliente
  projetos/
    <GAP-ID>__<slug>/         # gap_path
      gap.json
      00_spec/
      01_analise/
        transcrições/         # transcricao_<modulo>_<numero>-<AAAA-MM-DD>.md
      02_dev/
        tdd/
        test-data/
      03_review/
      04_atc/
      05_testes/
        bugs/
      06_doc/
```

# Contexto do chat por GAP

O chat atual é ligado ao GAP, antes de qualquer outra ação, sempre que:

- chamar o `factory_orchestrator` (start, kickoff, qualquer estágio); ou
- der continuidade a um GAP que já existe em `projetos/`, mesmo sem o `factory_orchestrator`: alterar código ou objeto SAP do GAP, corrigir bug, ajustar plano, teste, ATC, documentação ou qualquer artefato do `gap_path`.

## 1. Mapear chat → GAP

Arquivo temporário único `chats.tmp.json` na raiz do repositório (no `.gitignore`, local da máquina), com todos os GAPs trabalhados:

```json
{
  "chats": [
    { "chat_id": "dc9b6656-5019-4e83-8a37-0cd217d15db1", "gap_id": "EWM-021-FOR", "gap_path": "KOMATSU/projetos/EWM-021-FOR__slug", "data": "2026-10-07" },
    { "chat_id": "dc9b6656-5019-4e83-8a37-0cd217d15db1", "gap_id": "SD-073-INT", "gap_path": "KOMATSU/projetos/SD-073-INT__integracao-ibpt-pdv-self", "data": "2026-10-08" }
  ]
}
```

- `chat_id`: UUID do JSONL do chat atual em `agent-transcripts/`. Para achar: o JSONL que contém a mensagem atual do usuário (na dúvida, o modificado mais recentemente).
- `gap_path`: caminho relativo à raiz, com `/`.
- Criar o arquivo se não existir; se existir, acrescentar a entrada só se o par `chat_id` + `gap_id` ainda não estiver na lista. Se o par já existe, atualizar `data` para hoje.
- Um chat pode trabalhar em mais de um GAP: uma entrada por GAP.
- O GAP só existe depois do kickoff: gravar o mapeamento logo que o `gap_path` for conhecido.

Esse arquivo é a entrada da skill [`/adeus`](.cursor/skills/adeus/SKILL.md), que, rodando em qualquer chat, exporta as transcrições do dia de todos os GAPs mapeados para `<gap_path>/01_analise/transcrições/` e faz commit e push.

## 2. GAP existente em chat novo

Se o GAP já existe e o par `chat_id` + `gap_id` atual não está no `chats.tmp.json` da raiz (ou o arquivo não existe nesta máquina), é obrigatório ler as transcrições em `<gap_path>/01_analise/transcrições/` antes de qualquer ação no GAP:

- Ler todas, da mais antiga para a mais recente; a mais recente, por inteiro.
- Retomar a partir das decisões, respostas e pendências registradas lá. Não refazer pergunta já respondida nem contrariar decisão sem o usuário pedir.
- Sem pasta `transcrições`: seguir só com os artefatos do GAP (`gap.json`, `01_analise/`, etc.).

# Nomenclatura de desenvolvimento

SEMPRE utilizar o workbook `.cursor\rules\workbook-komatsu.mdc` para novos desenvolvimentos. Isso vale para nomeclatura de pacotes também.

# Parametrização

Utilizar `.cursor\rules\clean-core.mdc` como referencia para parametrização.

# Regras de Sincronização com o Jira

## 1. Aprovação de planos de desenvolvimento

Sempre que o usuário aprovar explicitamente um plano
de desenvolvimento, executar a skill `jira-story-sync`
antes de iniciar a implementação.

A skill deve:

1. Identificar o desenvolvimento atual.
2. Tentar identificar o GAP utilizando o contexto
   da conversa, o plano aprovado e os arquivos
   do projeto.
3. Se não for possível identificar o GAP com segurança,
   solicitar confirmação ao usuário.
4. Nunca presumir ou selecionar arbitrariamente um GAP.
5. Validar o GAP e o épico correspondente no Jira.
6. Criar dinamicamente a pasta do GAP, caso necessário.
7. Analisar o plano de desenvolvimento aprovado.
8. Consultar todas as User Stories existentes no épico.
9. Identificar histórias equivalentes, incompletas
   ou ausentes.
10. Atualizar ou criar User Stories conforme necessário.
11. Salvar as referências no caminho:
    `KOMATSU/projetos/[GAP]/jira-reference.json`
12. Prosseguir com a implementação após a sincronização,
    desde que não existam pendências que impeçam
    o desenvolvimento.

## 2. Execuções posteriores

Quando a skill for invocada durante ou após
o desenvolvimento:

1. Identificar o desenvolvimento atual.
2. Recuperar o GAP associado ao projeto.
3. Validar a associação com o épico no Jira.
4. Carregar as referências locais existentes.
5. Consultar novamente as User Stories do épico.
6. Comparar as histórias com o plano aprovado
   e com a implementação atual.
7. Atualizar histórias que estejam desatualizadas.
8. Criar histórias ausentes, quando necessário.
9. Preservar as histórias existentes que já estejam
   corretas.
10. Atualizar o arquivo de referências.
11. Apresentar um resumo das alterações realizadas.

## 3. Regras obrigatórias

- Nunca presumir qual é o GAP do desenvolvimento.
- Sempre solicitar confirmação quando houver ambiguidade.
- Nunca criar User Stories duplicadas.
- Nunca criar histórias para requisitos não aprovados.
- Nunca excluir User Stories automaticamente.
- Nunca alterar status ou responsáveis sem autorização.
- Nunca sobrescrever alterações manuais conflitantes.
- Sempre consultar o Jira antes de criar novas histórias.
- Sempre preservar referências locais válidas.
- Nunca informar sucesso sem verificar as operações.

## 4. Prioridade de execução

A sincronização com o Jira faz parte do fluxo
de desenvolvimento.

O fluxo esperado é:

1. Elaborar o plano de desenvolvimento.
2. Apresentar o plano ao usuário.
3. Aguardar aprovação explícita.
4. Executar a skill `jira-story-sync`.
5. Resolver eventuais pendências de identificação
   do GAP ou de sincronização.
6. Iniciar a implementação do plano aprovado.
7. Executar novamente a skill quando solicitado
   durante ou após o desenvolvimento.

A aprovação do plano não autoriza alterações
de escopo que não estejam previstas nele.

Não executar a sincronização para planos
que ainda não tenham sido aprovados.

## 5. Responsabilidade da skill

O arquivo AGENTS.md define quando a sincronização
deve ocorrer.

A skill `jira-story-sync` é responsável pelos
detalhes operacionais, incluindo:

- Identificação e validação do GAP.
- Consulta ao Jira.
- Análise semântica das User Stories.
- Prevenção de duplicidades.
- Criação e atualização de histórias.
- Persistência das referências locais.
- Tratamento de conflitos e erros.

Sempre seguir as instruções completas da skill
durante sua execução.