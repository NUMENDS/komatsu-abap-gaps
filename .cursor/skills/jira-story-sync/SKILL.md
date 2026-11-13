---
name: jira-story-sync
description: >-
  Sincroniza automaticamente as User Stories de um épico
  do Jira com o plano de desenvolvimento aprovado.
  Identifica o GAP dinamicamente, verifica histórias
  existentes, atualiza informações e cria histórias
  ausentes. Pode ser executada no início, durante ou
  após o desenvolvimento, sem gerar duplicidades.
---

# Skill de Sincronização de User Stories com o Jira

## 1. Objetivo

Esta skill é responsável por manter as User Stories
de um épico do Jira alinhadas ao plano de desenvolvimento
aprovado e à evolução do projeto.

Ela deve funcionar independentemente do estágio
do desenvolvimento:

- Após a aprovação inicial do plano.
- Durante a implementação.
- Ao final do desenvolvimento.
- Sempre que o usuário solicitar uma sincronização.

A skill deve identificar o contexto do desenvolvimento,
localizar o GAP correspondente, consultar o Jira e
sincronizar as User Stories existentes.

Todas as interações, perguntas, análises e respostas
devem ser realizadas em português brasileiro.

## 2. Regras fundamentais

As seguintes regras são obrigatórias:

1. Nunca presumir qual GAP está sendo desenvolvido.
2. Sempre utilizar o contexto para tentar identificar
   o GAP antes de perguntar ao usuário.
3. Solicitar confirmação quando houver qualquer
   ambiguidade na identificação.
4. Nunca criar User Stories duplicadas.
5. Sempre consultar o Jira antes de criar ou
   atualizar uma User Story.
6. Preservar alterações manuais realizadas no Jira.
7. Nunca excluir User Stories automaticamente.
8. Nunca modificar status, responsável ou prioridade
   sem autorização explícita.
9. Nunca inventar funcionalidades não previstas
   no plano aprovado.
10. Sempre manter as referências locais atualizadas.
11. Nunca informar que uma operação foi concluída
    sem verificar seu resultado no Jira.

## 3. Condições de execução

A skill deve ser executada quando:

- O usuário aprovar explicitamente um plano de
  desenvolvimento.
- O usuário solicitar sincronização das User Stories.
- O usuário invocar manualmente a skill.
- O usuário solicitar revisão do épico durante
  o desenvolvimento.
- O usuário solicitar sincronização ao finalizar
  o projeto.

A aprovação de um plano de desenvolvimento autoriza
a sincronização das funcionalidades previstas nele.

Não realizar alterações no Jira com base em planos
que ainda não foram aprovados.

## 4. Identificação dinâmica do GAP

O GAP representa o desenvolvimento atualmente
em execução e deve ser identificado pelo contexto.

O identificador não deve ser definido previamente.

### 4.1 Fontes para identificação

Investigue as seguintes fontes, nesta ordem:

1. Informações explícitas na conversa atual.
2. Plano de desenvolvimento aprovado.
3. Documentação do desenvolvimento atual.
4. Diretório de trabalho do projeto.
5. Arquivo de referências Jira já existente.
6. Referências ao GAP presentes no código ou
   em documentos relacionados.

A identificação automática somente é permitida
quando existir uma associação inequívoca entre
o desenvolvimento atual e o GAP encontrado.

Nunca selecionar um GAP apenas porque:

- Foi utilizado anteriormente.
- É o único diretório disponível.
- Possui um nome parecido com o projeto.
- Está registrado em outro desenvolvimento.
- Foi encontrado em uma referência sem contexto.

### 4.2 Ausência de identificação

Se não for possível identificar o GAP com segurança,
perguntar:

"Qual é o GAP do Jira relacionado a este
desenvolvimento? Pode me informar a chave ou o link?"

Aguardar a resposta antes de continuar a sincronização.

### 4.3 Múltiplos GAPs encontrados

Se existirem múltiplos candidatos:

1. Apresentar os GAPs encontrados.
2. Explicar brevemente de onde vieram.
3. Solicitar que o usuário identifique o correto.
4. Não selecionar automaticamente nenhum deles.

### 4.4 Validação do GAP

Após identificar o GAP:

1. Consultar a referência no Jira.
2. Confirmar que a issue existe.
3. Identificar o épico relacionado.
4. Verificar se o épico corresponde ao desenvolvimento.
5. Comparar com referências locais existentes.

O GAP não precisa obrigatoriamente possuir
a mesma chave do épico.

Caso o GAP e o épico sejam issues diferentes,
armazenar ambos os identificadores.

Se existir divergência entre o GAP identificado
e as referências locais, solicitar confirmação.

Nunca substituir silenciosamente o GAP armazenado.

## 5. Estrutura de diretórios

As informações devem ser armazenadas em:

KOMATSU/projetos/[GAP]/jira-reference.json

O diretório [GAP] deve ser criado dinamicamente
com base no identificador confirmado.

Exemplo:

KOMATSU/
  projetos/
    GAP-1234/
      jira-reference.json

### Regras de criação

1. Identificar a raiz real do projeto KOMATSU.
2. Identificar e validar o GAP.
3. Verificar se a pasta do GAP já existe.
4. Criar a pasta somente quando necessário.
5. Preservar os arquivos existentes.
6. Carregar o JSON existente, se disponível.
7. Criar o JSON caso ainda não exista.

Nunca criar uma pasta com o nome literal [GAP].

Nunca criar pastas para GAPs não identificados.

Nunca criar uma segunda pasta KOMATSU dentro
de uma raiz KOMATSU já existente.

## 6. Análise do plano de desenvolvimento

Localizar o último plano de desenvolvimento
aprovado para o projeto atual.

Analisar:

- Objetivo do desenvolvimento.
- Requisitos funcionais.
- Regras de negócio.
- Integrações necessárias.
- Funcionalidades previstas.
- Critérios de aceite.
- Dependências técnicas.
- Arquitetura definida.
- Entregas planejadas.

Quando o projeto estiver em andamento,
também analisar:

- Código já implementado.
- Funcionalidades desenvolvidas.
- Testes existentes.
- Pendências de implementação.
- Divergências entre código e plano.

O plano aprovado deve ser considerado
a principal referência de escopo.

O código implementado deve ser utilizado
como evidência do progresso.

Alterações identificadas no código não devem
ser consideradas automaticamente aprovadas.

## 7. Consulta ao Jira

Utilizar as ferramentas MCP do Jira disponíveis
no ambiente.

Identificar quais operações estão disponíveis
antes de tentar utilizá-las.

A skill deve consultar:

- GAP identificado.
- Épico correspondente.
- Descrição e objetivo do épico.
- Todas as User Stories vinculadas.
- Resumo de cada User Story.
- Descrição de cada User Story.
- Critérios de aceite.
- Status atual.
- Responsáveis.
- Dependências e relacionamentos.

Consultar todas as páginas de resultados
para garantir que nenhuma issue seja ignorada.

Quando compatível com o Jira utilizado,
consultar as issues do épico utilizando
uma expressão equivalente a:

parent = "CHAVE-DO-EPICO"

Adaptar a consulta à configuração real do Jira.

Se não houver conexão funcional com o Jira,
interromper as operações remotas e informar
ao usuário o motivo.

## 8. Identificação das User Stories necessárias

A partir do plano aprovado, identificar todas
as funcionalidades que precisam ser representadas
por User Stories.

Cada funcionalidade deve possuir:

- Um identificador lógico estável.
- Um objetivo funcional claro.
- Uma descrição do comportamento esperado.
- Regras de negócio relevantes.
- Critérios de aceite verificáveis.
- Dependências, quando existirem.
- Referência à seção correspondente do plano.

Evitar criar histórias excessivamente fragmentadas.

Não gerar uma User Story automaticamente para cada:

- Classe.
- Método.
- Arquivo.
- Tabela.
- Endpoint.
- Alteração técnica isolada.

Priorizar entregas funcionais completas.

### Modelo de User Story

Título:
Descrição objetiva da funcionalidade.

Descrição:
Como [usuário ou sistema],
quero [funcionalidade],
para [benefício esperado].

Escopo:
Descrição das regras e comportamentos
que fazem parte da entrega.

Critérios de aceite:
Condições necessárias para considerar
a funcionalidade corretamente implementada.

Observações técnicas:
Informações relevantes sobre integrações,
dependências e arquitetura.

## 9. Comparação com as User Stories existentes

Antes de criar qualquer User Story, comparar
as funcionalidades do plano com todas as
issues existentes no épico.

A comparação deve considerar:

1. Chaves Jira previamente armazenadas.
2. Identificadores lógicos das funcionalidades.
3. Referências explícitas aos requisitos.
4. Objetivos funcionais.
5. Comportamentos esperados.
6. Regras de negócio.
7. Critérios de aceite.
8. Contexto técnico.

A comparação deve ser semântica.

Uma User Story pode representar determinada
funcionalidade mesmo utilizando um título diferente.

Da mesma forma, títulos semelhantes não garantem
que as funcionalidades sejam equivalentes.

Cada funcionalidade deve ser classificada
em uma das seguintes categorias.

### 9.1 User Story existente e correta

Quando uma história já representar adequadamente
a funcionalidade prevista:

- Reutilizar a issue existente.
- Não criar outra User Story.
- Não realizar alterações desnecessárias.
- Registrar o relacionamento no JSON.

### 9.2 User Story existente e desatualizada

Quando a história representar a funcionalidade,
mas possuir informações incompletas ou antigas:

- Identificar as diferenças.
- Atualizar a descrição quando necessário.
- Complementar os critérios de aceite.
- Preservar informações manuais válidas.
- Preservar histórico e status.
- Registrar o resultado no JSON.

Se existir conflito entre o conteúdo aprovado
e alterações manuais posteriores, solicitar
orientação antes de sobrescrever informações.

### 9.3 User Story inexistente

Quando não existir nenhuma história equivalente:

1. Consultar novamente o épico.
2. Verificar possíveis duplicidades.
3. Preparar a User Story.
4. Criar a issue no épico correto.
5. Verificar o resultado no Jira.
6. Armazenar a chave retornada.
7. Atualizar o arquivo JSON.

Não criar histórias para requisitos
que não estejam aprovados.

### 9.4 Correspondência ambígua

Se duas ou mais issues puderem representar
a mesma funcionalidade:

- Não criar uma nova User Story.
- Não atualizar as candidatas.
- Apresentar as correspondências encontradas.
- Solicitar confirmação ao usuário.
- Registrar a pendência.

## 10. Execução após aprovação do plano

Quando a skill for executada pela primeira vez:

1. Identificar o desenvolvimento atual.
2. Identificar ou confirmar o GAP.
3. Validar o épico no Jira.
4. Localizar ou criar a pasta dinâmica do GAP.
5. Carregar as referências locais existentes.
6. Analisar integralmente o plano aprovado.
7. Consultar todas as User Stories do épico.
8. Comparar as funcionalidades com as histórias.
9. Reutilizar histórias equivalentes.
10. Atualizar histórias incompletas.
11. Criar histórias ausentes.
12. Verificar as operações realizadas.
13. Atualizar o arquivo jira-reference.json.
14. Apresentar o resumo ao usuário.

## 11. Execução durante o desenvolvimento

Quando a skill for invocada durante a implementação:

1. Identificar o desenvolvimento atual.
2. Recuperar o GAP utilizando o contexto.
3. Validar a associação com o épico.
4. Carregar o JSON de referências.
5. Consultar novamente as issues do Jira.
6. Carregar o plano aprovado mais recente.
7. Analisar o progresso do desenvolvimento.
8. Identificar funcionalidades implementadas.
9. Comparar o escopo aprovado com as histórias.
10. Atualizar User Stories desatualizadas.
11. Criar histórias ausentes.
12. Identificar divergências de escopo.
13. Preservar os status existentes.
14. Atualizar o JSON.
15. Apresentar o resultado.

Não considerar uma funcionalidade concluída
apenas pela existência de código relacionado.

Não alterar automaticamente o status das issues.

## 12. Execução ao final do desenvolvimento

Quando a skill for invocada na finalização:

1. Identificar e validar o GAP.
2. Carregar o plano aprovado.
3. Analisar a implementação final.
4. Consultar todas as User Stories do épico.
5. Comparar entregas e requisitos.
6. Identificar histórias ausentes.
7. Identificar histórias desatualizadas.
8. Atualizar descrições e critérios de aceite.
9. Criar histórias faltantes.
10. Identificar critérios de aceite sem evidência.
11. Identificar funcionalidades fora do escopo.
12. Registrar pendências encontradas.
13. Atualizar o JSON de referências.
14. Apresentar o resumo final.

Não encerrar automaticamente as User Stories.

Não presumir que todos os critérios de aceite
foram cumpridos sem evidências suficientes.

## 13. Persistência das referências

Armazenar o mapeamento no arquivo:

KOMATSU/projetos/[GAP]/jira-reference.json

O arquivo deve conter, no mínimo:

- Versão do formato de armazenamento.
- Identificador do GAP.
- Chave do épico.
- Identificador interno do épico.
- Projeto Jira correspondente.
- Endereço da instância Jira.
- Referência ao plano aprovado.
- Impressão digital do plano.
- Data da última sincronização bem-sucedida.
- Identificadores lógicos das funcionalidades.
- Chaves das User Stories relacionadas.
- Referências às seções do plano.
- Impressões digitais dos conteúdos sincronizados.
- Conflitos ou ambiguidades pendentes.

O JSON deve ser atualizado após sincronizações
bem-sucedidas e verificadas.

Preservar mapeamentos anteriores válidos.

O Jira deve continuar sendo consultado como
fonte das informações atuais das issues.

Se o JSON estiver ausente, reconstruir
os relacionamentos a partir do Jira antes
de criar novas histórias.

Nunca armazenar senhas ou tokens no JSON.

Salvar o arquivo de forma segura, evitando
perda de dados durante falhas de gravação.

## 14. Prevenção de duplicidades

A sincronização deve ser idempotente.

Isso significa que executar a skill repetidamente,
sem modificações relevantes no plano ou no Jira,
não deve gerar novas issues nem alterações
desnecessárias.

Para isso:

1. Consultar todas as histórias existentes.
2. Verificar os mapeamentos previamente armazenados.
3. Realizar comparação semântica.
4. Confirmar que a funcionalidade está ausente.
5. Consultar novamente o Jira antes da criação.
6. Criar somente quando necessário.
7. Verificar o retorno da criação.
8. Persistir a referência corretamente.

Se uma operação de criação apresentar
resultado incerto, consultar novamente o Jira
antes de repetir a operação.

Não executar criações paralelas que possam
resultar em histórias duplicadas.

## 15. Tratamento de erros

Se ocorrer uma falha:

- Não presumir que uma operação foi concluída.
- Não inventar resultados retornados pelo Jira.
- Preservar as referências válidas existentes.
- Identificar quais operações foram confirmadas.
- Registrar as pendências.
- Informar o usuário sobre o problema.

Caso o GAP esteja incorreto ou ambíguo,
interromper a sincronização antes de modificar
qualquer issue.

Caso o Jira esteja indisponível, não executar
alterações remotas.

Caso existam conflitos de informações,
não sobrescrever dados sem confirmação.

## 16. Resumo obrigatório

Ao concluir uma execução, apresentar:

- GAP identificado.
- Épico associado.
- Plano de desenvolvimento utilizado.
- Quantidade de User Stories analisadas.
- Quantidade de histórias reutilizadas.
- Quantidade de histórias atualizadas.
- Quantidade de histórias criadas.
- Quantidade de histórias sem alterações.
- Conflitos encontrados.
- Pendências identificadas.
- Links das issues criadas ou atualizadas.
- Caminho do JSON atualizado.

Se nenhuma alteração for necessária, informar:

"O épico já está sincronizado com o plano de
desenvolvimento aprovado. Nenhuma User Story
precisou ser criada ou atualizada."

Não informar sucesso para operações
que não tenham sido verificadas.

## 17. Princípio final

O objetivo desta skill não é simplesmente
criar User Stories.

Seu objetivo é garantir que o épico do Jira
represente corretamente o escopo aprovado
do desenvolvimento, independentemente
do momento em que a sincronização ocorrer.

Sempre priorizar:

- Identificação correta do GAP.
- Preservação das informações existentes.
- Rastreabilidade dos requisitos.
- Ausência de duplicidades.
- Consistência entre plano, implementação e Jira.
- Segurança das operações.
- Clareza na comunicação com o usuário.

## 18. Estrutura obrigatória do jira-reference.json

Todos os projetos devem utilizar exatamente a mesma
estrutura de JSON, independentemente do GAP, do épico
ou da fase do desenvolvimento.

É proibido criar formatos diferentes para cada projeto.

### 18.1 Modelo obrigatório

O arquivo jira-reference.json deve seguir este modelo:

```json
{
  "schema_version": 1,
  "gap": "GAP-1234",
  "jira": {
    "base_url": "https://jira.exemplo.com",
    "epic_key": "GAP-1234",
    "epic_id": "123456",
    "project_key": "GAP"
  },
  "plan": {
    "source": "plano-desenvolvimento.md",
    "fingerprint": "sha256:exemplo",
    "approved": true
  },
  "last_successful_sync_at": null,
  "stories": [
    {
      "sync_id": "integracao-sap",
      "issue_key": "GAP-1235",
      "summary": "Implementar integração SAP",
      "plan_reference": "Integracao",
      "last_synced_hash": null
    },
    {
      "sync_id": "validacao-dados",
      "issue_key": "GAP-1236",
      "summary": "Implementar validação de dados",
      "plan_reference": "Validacoes",
      "last_synced_hash": null
    }
  ],
  "conflicts": []
}
```

Os valores apresentados são apenas ilustrativos.
Nunca utilizar dados fictícios em referências reais.

### 18.2 Regras de preenchimento

- schema_version: versão do formato, inicialmente 1.
- gap: identificador validado do desenvolvimento.
- jira.base_url: endereço real da instância Jira.
- jira.epic_key: chave real do épico.
- jira.epic_id: identificador interno retornado pelo Jira.
- jira.project_key: chave do projeto Jira.
- plan.source: origem do plano aprovado.
- plan.fingerprint: SHA-256 do conteúdo do plano.
- plan.approved: indica aprovação explícita do plano.
- last_successful_sync_at: data e hora da última
  sincronização bem-sucedida, em ISO 8601 UTC.
- stories: lista de funcionalidades associadas
  às User Stories existentes.
- conflicts: lista de conflitos pendentes.

Cada objeto da lista stories deve conter:

- sync_id: identificador lógico único e estável.
- issue_key: chave real da User Story.
- summary: resumo atual da User Story.
- plan_reference: seção correspondente do plano.
- last_synced_hash: SHA-256 do conteúdo sincronizado.

Se um valor ainda não for conhecido, utilizar null
quando o campo permitir, sem inventar informações.

### 18.3 Identificadores estáveis

O campo sync_id identifica uma funcionalidade
independentemente de sua chave ou título no Jira.

Depois de atribuído, o sync_id não deve ser
alterado em sincronizações futuras.

Se uma User Story mudar de título, preservar
seu sync_id original.

Se o GAP possuir uma nova funcionalidade,
adicionar um novo objeto à lista stories.

Não substituir identificadores existentes
por novos nomes gerados automaticamente.

### 18.4 Validação obrigatória

Antes de salvar o JSON:

1. Verificar se o conteúdo é um JSON válido.
2. Verificar se schema_version é igual a 1.
3. Validar a presença de todos os campos obrigatórios.
4. Validar os tipos de dados de cada campo.
5. Garantir que não existam sync_id duplicados.
6. Garantir que o GAP corresponda ao projeto atual.
7. Garantir que as chaves Jira correspondam
   às issues verificadas.
8. Preservar todos os mapeamentos anteriores válidos.

Nunca adicionar, remover ou renomear campos
do contrato sem uma migração de versão.

### 18.5 Compatibilidade entre versões

Se um JSON existente apresentar uma versão
diferente da suportada:

1. Não sobrescrever o arquivo.
2. Identificar a versão encontrada.
3. Procurar instruções de migração disponíveis.
4. Realizar a migração somente se houver
   uma transformação definida e segura.
5. Caso contrário, informar a incompatibilidade.

Nunca reinterpretar silenciosamente
um JSON de versão desconhecida.

### 18.6 Inicialização de novos GAPs

Quando um novo GAP for identificado e validado:

1. Criar dinamicamente a pasta do GAP.
2. Inicializar o arquivo com schema_version = 1.
3. Preencher os dados confirmados pelo Jira.
4. Inicializar stories como uma lista vazia.
5. Inicializar conflicts como uma lista vazia.
6. Consultar todas as User Stories existentes.
7. Reconstruir os mapeamentos possíveis.
8. Sincronizar o plano aprovado.
9. Salvar o arquivo seguindo o contrato fixo.

A ausência de jira-reference.json não significa
que o épico não possui User Stories.

### 18.7 Regra final

Todos os arquivos jira-reference.json devem ter
o mesmo contrato de dados.

Somente os valores podem variar entre GAPs.

Mudanças estruturais exigem uma nova versão
do contrato e uma estratégia de migração.
```