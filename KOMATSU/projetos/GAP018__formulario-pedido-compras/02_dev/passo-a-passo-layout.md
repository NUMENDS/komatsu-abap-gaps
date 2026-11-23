# Passo a passo do layout — ZAFMM_PEDIDO_COMPRA

Montagem manual no Form Builder. Não usar upload de XML. A referência é a página da especificação: título SAP S/4HANA / PEDIDO DE COMPRA, sete áreas, A4 deitado.

Os menus abaixo são os que aparecem na tela, em inglês: Hierarchy, Palettes, Object Library, Data View, Object, Border, Layout.

Salvar com Ctrl+S ao fim de cada área. O save grava o formulário no SAP.

## O que a página usa

A classe já entrega cinco estruturas. No layout elas entram com estes nomes:

| Contexto | O que é |
|---|---|
| GS_HEADER | Cabeçalho, fornecedor e condições |
| GT_ITEMS | Linhas do pedido |
| GS_TOTALS | Impostos, frete, totais |
| GS_TEXTS | Os seis textos da SO10 |
| GS_SIGNATURE | Solicitado, aprovado e datas |

`DOCUMENT_DATE` continua sendo a menor data de entrega dos itens e entra em **Data de entrega**. A data do pedido é o `BEDAT` que já vem no import `HEADER`. Não passa pela classe.

Código, razão social, CNPJ, contato, telefone, e-mail e endereço saem de `GS_HEADER`. A classe lê o cadastro do fornecedor pelo código. `SUPPLIER_ADDRESS` já vem montado numa linha (rua, número, bairro, CEP, cidade, região e país). `PURCHASING_ORG`, `PAYMENT_TERMS`, `INCOTERMS` e `CURRENCY` já vêm com o código e o texto juntos, no formato `código - texto`. O nome da planta e o local de entrega saem da planta do primeiro item impresso. Na rotina do item, acrescente `ls_item-plant = ls_print_item-werks`. Sem essa linha os dois campos ficam em branco. Depois de ativar a classe, apague o `GS_HEADER` da árvore da direita e arraste de novo. Sem isso a Data View continua com a estrutura antiga.

## 1. Contexto

1. Abra o formulário `ZAFMM_PEDIDO_COMPRA` em alteração.
2. Aba **Context**.
3. À esquerda, em **Global Data**, confira `GS_HEADER`, `GT_ITEMS`, `GS_TOTALS`, `GS_TEXTS` e `GS_SIGNATURE`.
4. Se algum não estiver na árvore da direita, arraste da esquerda para a raiz `ZAFMM_PEDIDO_COMPRA`.
5. `GV_SWITCH` fica na esquerda. Não arrasta.
6. Abra `GS_HEADER` e confira `PURCHASE_ORDER` e `PURCHASING_ORG`.
7. Salve.

Os nós antigos (`TITLE`, `MODE`, `ITEM` e o resto) podem continuar. O desenho novo usa deles só o `HEADER-BEDAT`, a data do pedido.

## 2. Limpar o desenho standard

1. Aba **Layout**. Espere o Designer abrir.
2. À esquerda, **Hierarchy**.
3. Abra **(Master Pages)** e depois **Page1**.
4. Apague, um por um, com a tecla Delete, tudo que estiver dentro de Page1, menos a área de conteúdo. O nome dela costuma ser `First` ou `(untitled Content Area)`. Se apagar essa área, o miolo da página não tem onde entrar. Os outros (`PageNo`, `TITLE`, `FOOTER`, `VENDORADDRESS`, `EBELN`, `BEDATTXT`) saem.
5. Se existir **Page2**, clique com o botão direito em Page2 e escolha **Delete Master Page**.
6. Abra **Main**. Clique no primeiro filho, segure Shift, clique no último, e aperte Delete. Confirme. `Main` fica vazio. `Header`, `Item`, `Address` e o restante somem da hierarquia.
7. A hierarquia tem que ficar assim: `data`, `(Master Pages)`, `Page1` com só a área de conteúdo, e `Main` sem filhos.
8. Salve.

Se a página continuar cheia de caixas laranja, a exclusão não pegou o objeto que está na tela. Clique na caixa, veja o nome que acende na Hierarchy e apague esse nome.

## 3. Página A4 deitada

1. Na Hierarchy, clique em **Page1**.
2. Menu **Palettes** → **Object**.
3. No painel Object, em Paper Type, escolha **A4**. Em Orientation, escolha **Landscape**. A página passa a ser mais larga do que alta.
4. Clique na área de conteúdo (`First`).
5. Menu **Palettes** → **Layout**.
6. Preencha, em milímetros:
   - X = 6
   - Y = 6
   - Width = 285
   - Height = 198
7. Salve.

## 4. O corpo da página

Tudo que for texto e campo entra dentro de `Main`, não na Page1. Page1 só guarda a folha.

1. Clique em **Main** na Hierarchy.
2. **Palettes** → **Object**.
3. Content = **Flowed**. Flow Direction = **Top to Bottom**.
4. **Palettes** → **Layout**. Width = 285 mm. Deixe a altura livre para crescer com o conteúdo.
5. **Palettes** → **Data View**. Essa paleta é a ponte com o contexto. Expanda até ver `GS_HEADER`, `GT_ITEMS`, `GS_TOTALS`, `GS_TEXTS` e `GS_SIGNATURE`. Se a paleta estiver vazia, volte ao passo 1: o nó não foi para o Context.

Para soltar um campo: arraste o nome da Data View para cima de `Main` na Hierarchy, não para um canto vazio fora do Main. O campo nasce dentro de Main.

Para mudar o texto que o usuário lê: clique no campo, **Palettes** → **Object**, Caption = **Custom**, e escreva o rótulo. Position = **Left**. Reserve = 46 mm. Fonte do valor: Arial 8. Fonte do rótulo: Arial 7.

Para um título de área: **Palettes** → **Object Library** → grupo **Standard** → arraste **Text** para dentro de Main. Clique duas vezes no texto e escreva. Object → Appearance, ou a barra de fonte: Arial, 9, negrito. Layout → Width 285 mm, Height 6 mm.

## 5. Título

A faixa nasce antes dos textos. O `Main` empilha de cima para baixo, então um texto solto nele ocupa a linha inteira.

1. **Object Library** → **Standard** → arraste um **Subform** para dentro de `Main`. Botão direito na Hierarchy → **Rename**: `TITULO`.
2. Com `TITULO` selecionado, **Object**: Content = **Flowed**, Flow Direction = **Western Text**. **Layout**: Width 285 mm, Height 44 mm. A faixa precisa dessa altura porque o número e a data ficam empilhados na direita.
3. Arraste os textos para dentro de `TITULO`, não para o `Main`. A largura de cada um tem que ser a da coluna, não 285 mm. Se um deles estiver com 285 mm, o próximo desce.

| Objeto | Onde mexe | Valor |
|---|---|---|
| Text1 | Layout → Width / Height. Barra de fonte. | 70 mm, 8 mm, Arial 14 negrito. Texto `SAP S/4HANA`. |
| Text2 | Layout → Width / Height. Barra de fonte. Paragraph → Center. | A largura é o que sobra da faixa, não 130 mm fixo. Texto `PEDIDO DE COMPRA`, Arial 14 negrito, alinhado ao centro. |
| `PURCHASE_ORDER` | Painel Object, aba Object, com o campo selecionado na Hierarchy. | Veja o bloco abaixo. |

O `PURCHASE_ORDER` nasce com o rótulo técnico `Pur. Doc.` e Appearance `None`. É isso que aparece na tela: a sigla em inglês e uma caixa sem borda. Com o campo selecionado, no painel que já está aberto:

1. **Caption:** apague `Pur. Doc.` e escreva `Nº do pedido (PO)`.
2. **Appearance:** abra a lista que está em `None` e escolha `Solid Box`.
3. Menu **Palettes** → **Layout**. Width = 85 mm. Height = 20 mm. Com 14 mm o rótulo e a caixa dividem a mesma faixa e o campo fica uma tira. O quadrado vermelho na direita é o texto que não coube.
4. No mesmo painel Layout, em **Caption**, Position = **Top** e Reserve = 7 mm. O rótulo fica em cima do número.
5. Menu **Palettes** → **Font**. No topo dessa paleta tem uma lista do que a fonte vai alterar. Escolha **Caption**, não Value. Arial, tamanho 10, negrito. O rótulo do número nasce pequeno porque essa fonte não foi mexida.

`DATA DO PEDIDO` é o `BEDAT` do import `HEADER`. Ele só fica embaixo do número se os dois forem filhos do mesmo subform. Com `PURCHASE_ORDER` e `CAIXA_PEDIDO` irmãos, o `TITULO` (Western Text) coloca o número na primeira linha e joga a data para a linha de baixo, na esquerda. É o que a tela mostrou.

Na Hierarchy, a árvore tem que ficar assim:

```text
TITULO
  Text1
  Text1
  CAIXA_PEDIDO
    PURCHASE_ORDER
    BEDAT
```

1. Se `CAIXA_PEDIDO` ainda não existir, arraste um Subform para dentro de `TITULO` e renomeie. **Object**: Content = **Flowed**, Flow Direction = **Top to Bottom**. **Layout**: Width 85 mm, Height 42 mm. Se já existir, só troque essas duas medidas.
2. Arraste `PURCHASE_ORDER` para dentro de `CAIXA_PEDIDO`, como primeiro filho.
3. Arraste `BEDAT` para dentro de `CAIXA_PEDIDO`, como segundo filho, debaixo do `PURCHASE_ORDER`.
4. Selecione `TITULO` e suba a Height para 44 mm.
5. Encoste a caixa na direita da folha. No modelo, `SAP S/4HANA` e `PEDIDO DE COMPRA` ficam no meio e o número cola na borda. Hoje a caixa para no fim de 70 + 130 + 85 e o resto da página sobra na direita, então o bloco fica mais para o centro.
   - Clique na área de conteúdo da Page1 e anote o Width. Esse é o limite da direita.
   - `TITULO`: Width = esse número.
   - `Text2`: Width = Width do `TITULO` − 70 − 85. Os 70 são o `Text1`, os 85 são a `CAIXA_PEDIDO`.
   - **Palettes** → **Paragraph**, com `Text1` e com `Text2`: alinhamento **Center**.

No `BEDAT`, com o campo selecionado. O texto `Data do pedido` escrito dentro da caixa não é o rótulo: é o valor de exemplo. O rótulo só aparece em cima da caixa quando a posição do Caption está em Top.

1. Painel **Object**, **Caption:** `Data do pedido`.
2. **Appearance:** `Solid Box`.
3. **Layout:** Width 85 mm, Height 20 mm. Em **Caption**, Position = **Top** e Reserve = 7 mm.
4. **Palettes** → **Font**. Na lista do topo, escolha **Caption**. Arial, tamanho 10, negrito. Volte na lista, escolha **Value**, Arial, tamanho 10, sem negrito.
5. **Object**, aba **Field**, **Patterns**. Em Display, escreva `date{DD/MM/YYYY}`. O `BEDAT` chega como data SAP (`AAAAMMDD`); esse padrão mostra `DD/MM/AAAA`.

Se `SAP S/4HANA` e `PEDIDO DE COMPRA` já existirem soltos no `Main`, não crie de novo. Na Hierarchy, arraste os dois para dentro de `TITULO` e troque a Width de cada um para 70 mm e 130 mm.

## 6. Área 1 e área 2, lado a lado

1. Arraste dois subforms para Main, depois de `TITULO`. Renomeie para `BLOCO_PEDIDO` e `BLOCO_FORNECEDOR`.
2. Crie um terceiro subform, nome `LINHA_1_2`. O Height nasce cinza porque o Content está **Flowed**: o Designer calcula a altura pelos filhos e trava o campo. Com `LINHA_1_2` selecionado, **Object** → Content = **Positioned**. O Height destrava. **Layout**: Width = o mesmo Width da área de conteúdo, Height = 78 mm. Aí volte em **Object** → Content = **Flowed**, Flow Direction = **Western Text**.
3. Mova `BLOCO_PEDIDO` e `BLOCO_FORNECEDOR` para dentro de `LINHA_1_2`.
4. Em cada bloco, Content = **Positioned**, Width = 140 mm, Height = 78 mm. O Height só aceita valor nesse modo. Depois volte Content = **Flowed**, Flow Direction = **Top to Bottom**. Se ao voltar para Flowed a altura zerar, deixe o bloco em **Positioned**. Os campos entram do mesmo jeito; a diferença é que você posiciona o próximo campo pelo Y, em vez de ele descer sozinho.

Dentro de `BLOCO_PEDIDO`, nesta ordem:

1. Texto `1. DADOS DO PEDIDO`. Width 140 mm, Height 6 mm, Arial 9 negrito.
2. Arraste e rotule:

| Campo no contexto | Rótulo na página |
|---|---|
| PURCHASING_ORG | Organização de Compras |
| PURCHASING_GROUP_TEXT | Grupo de Compras |
| PLANT_NAME | Centro / Planta |
| PURCHASING_GROUP_TEXT de novo | Comprador Responsável |
| PURCHASING_GROUP_EMAIL | E-mail |
| REQUISITION | Requisição de Compra |
| QUOTATION | Nº da RFQ / Cotação |
| PURPOSE | Finalidade |

O comprador usa o mesmo dado do grupo de compras. Arrastar `PURCHASING_GROUP_TEXT` uma segunda vez é o esperado. O Designer pode nomear a cópia com um sufixo. O rótulo é que muda.

Dentro de `BLOCO_FORNECEDOR`:

1. Texto `2. DADOS DO FORNECEDOR`. Width 140 mm, Height 6 mm, Arial 9 negrito.
2. `SUPPLIER_CODE` com rótulo `Código SAP do Fornecedor`.
3. `SUPPLIER_NAME` com rótulo `Razão Social`.
4. `TAX_NUMBER` com rótulo `CNPJ`.
5. `SUPPLIER_ADDRESS` com rótulo `Endereço`. O campo já traz a linha inteira.
6. `SUPPLIER_CONTACT` com rótulo `Contato`.
7. `SUPPLIER_EMAIL` com rótulo `E-mail`.
8. `SUPPLIER_PHONE` com rótulo `Telefone`.

Cada campo desses dois blocos: Width 140 mm, Height 5,5 mm, rótulo à esquerda com Reserve 50 mm.

## 7. Faixa de pagamento, incoterm, moeda e entrega

1. Subform `FAIXA_CONDICOES` dentro de Main, Flow Direction **Western Text**, Width 285 mm, Height 12 mm.
2. Arraste para dentro dele, cada um com Width 57 mm e Height 10 mm, rótulo em cima (Object → Caption → Position = **Top**):

| Campo | Rótulo |
|---|---|
| PAYMENT_TERMS | Condição de pagamento |
| INCOTERMS | Incoterm |
| INCOTERMS_LOCATION | Complemento |
| CURRENCY | Moeda |
| DOCUMENT_DATE | Data de entrega |
| DELIVERY_ADDRESS | Local de entrega |

São seis células. Cada uma já traz o código e o texto, por exemplo `Z030 - 30 dias`. Se não couberem em 285 mm, reduza a largura de cada uma para 47 mm.

## 8. Itens

1. Texto `4. ITENS DO PEDIDO` direto em Main. Width 285 mm, Height 6 mm, Arial 9 negrito.
2. Na Data View, abra `GT_ITEMS`. O filho que se repete chama `DATA`. Abra `DATA`.
3. Segure Ctrl e clique, nesta ordem: `ITEM`, `MATERIAL`, `DESCRIPTION`, `SPECIFICATION`, `QUANTITY`, `UNIT`, `PRICE`, `AMOUNT`, `DELIVERY_DATE`.
4. Arraste o conjunto para Main, abaixo do título.
5. Se abrir uma pergunta para criar tabela, confirme **OK**.
6. Se não abrir, os campos nascem soltos. Selecione os nove na Hierarchy e use o menu **Table** → **Insert Table**, ou deixe-os dentro de um subform. O ponto obrigatório é o subform pai:
   - Clique no subform que o Designer criou em volta desses campos.
   - **Object** → **Binding**.
   - Marque **Repeat Subform for Each Data Item**.
   - Min Count = 0.
   - O binding tem que apontar para `GT_ITEMS.DATA[*]`. Se estiver só em `GT_ITEMS`, abra a lista e escolha o nó `DATA`.
7. Rótulos da linha de título da tabela, da esquerda para a direita:

| Campo | Rótulo | Largura |
|---|---|---|
| ITEM | Item | 16 mm |
| MATERIAL | Código SAP | 34 mm |
| DESCRIPTION | Descrição do material / serviço | 58 mm |
| SPECIFICATION | Especificação | 40 mm |
| QUANTITY | Quantidade | 22 mm |
| UNIT | UN | 12 mm |
| PRICE | Preço unitário (R$) | 34 mm |
| AMOUNT | Valor total (R$) | 38 mm |
| DELIVERY_DATE | Data de entrega | 31 mm |

8. Abaixo da tabela, arraste `GS_TOTALS` → `ITEMS_TOTAL`. Rótulo `Total dos itens`. Alinhe à direita: Layout → Width 80 mm, e no Object do parágrafo (**Palettes** → **Paragraph**) Horizontal = **Right**. Caption Position = **Left**, Reserve 40 mm.

Item excluído não aparece. A classe já tira essa linha. O layout não testa exclusão.

## 9. Impostos e custos

1. Texto `5. IMPOSTOS E CUSTOS` em Main. Width 168 mm, Height 6 mm, Arial 9 negrito.
2. Uma linha de textos, dentro de um subform `CAB_IMPOSTOS`, Flow Direction **Western Text**:

| Texto | Largura |
|---|---|
| Descrição | 42 mm |
| Base de cálculo (R$) | 46 mm |
| Alíquota (%) | 34 mm |
| Valor (R$) | 46 mm |

3. Para cada imposto, um subform de Flow Direction **Western Text**, Width 168 mm, Height 5,5 mm. O nome do subform pode ser o do imposto. Dentro, um texto com o nome e três campos:

| Subform | Texto fixo | Campos, nesta ordem |
|---|---|---|
| ICMS | ICMS | ICMS → BASE_AMOUNT, RATE, AMOUNT |
| IPI | IPI | IPI → BASE_AMOUNT, RATE, AMOUNT |
| PIS | PIS | PIS → BASE_AMOUNT, RATE, AMOUNT |
| COFINS | COFINS | COFINS → BASE_AMOUNT, RATE, AMOUNT |
| FRETE | FRETE | FREIGHT → BASE_AMOUNT, RATE, AMOUNT |
| OUTROS | OUTROS CUSTOS | OTHER_COSTS → BASE_AMOUNT, RATE, AMOUNT |

Larguras: texto 42 mm, base 46 mm, alíquota 34 mm, valor 46 mm. Rótulo de cada campo = **None**, porque o título da coluna já existe. Paragraph do número = **Right**.

4. Última linha: texto `VALOR TOTAL DO PEDIDO`, Width 122 mm, Arial 8 negrito. Ao lado, `GS_TOTALS` → `GRAND_TOTAL`, Width 46 mm, Caption = **None**, Paragraph **Right**.

`LABEL` de cada imposto pode ficar sem usar. O nome na página é o texto fixo (ICMS, IPI, PIS, COFINS, FRETE, OUTROS CUSTOS).

## 10. Informações adicionais

Esta área fica à direita dos impostos na referência. Para chegar nisso:

1. Crie o subform `LINHA_5_6`, Flow Direction **Western Text**, Width 285 mm.
2. Mova para dentro dele o bloco inteiro da seção 5 (título, cabeçalho, seis linhas e total). Esse bloco fica com Width 168 mm.
3. Ao lado, subform `INFO_ADICIONAIS`, Width 114 mm, Content **Flowed**, Top to Bottom.

Dentro de `INFO_ADICIONAIS`:

1. Texto `6. INFORMAÇÕES ADICIONAIS`. Width 114 mm, Height 6 mm, Arial 9 negrito.
2. Texto `Observações do Pedido`. Arial 8 negrito.
3. `GS_TEXTS` → `TEXT_01`. Caption **None**. Width 114 mm, Height 6 mm.
4. `TEXT_02`, do mesmo jeito.
5. Texto `Condições Específicas de Fornecimento`. Arial 8 negrito.
6. `TEXT_03` e `TEXT_04`, Caption **None**.
7. `TEXT_05`, Caption **None**. Este é o destaque amarelo do passo 13.

O texto que aparece em cada um vem da SO10. O layout não escreve a frase.

## 11. Aprovações

1. Texto `7. APROVAÇÕES` em Main, Width 285 mm, Height 6 mm, Arial 9 negrito.
2. Subform `ASSINATURAS`, Flow Direction **Western Text**, Width 285 mm, Height 22 mm.
3. Dentro, quatro blocos. Cada bloco é um subform Top to Bottom:

| Bloco | Largura | Conteúdo |
|---|---|---|
| SOLICITADO | 70 mm | Texto `Solicitado por`. Campo `REQUESTED_BY`, Caption **None**. Texto `Comprador`. |
| APROVADO | 70 mm | Texto `Aprovado por`. Campo `APPROVED_BY`, Caption **None**. Campo `APPROVAL_DATE`, rótulo `Data`. |
| ACEITE | 75 mm | Texto `Recebido / Aceite do Fornecedor`. Texto `Carimbo e Assinatura`. Campo `ACCEPTANCE_DATE`, rótulo `Data`. |
| CONFIRMA | 70 mm | Campo `TEXT_06`, Caption **None**, Height 16 mm. |

`APPROVED_BY` pode imprimir vazio. A classe deixa esse nome em branco e manda a data como `____/____/____`.

## 12. Cores

A faixa azul é o fundo do texto da área (`1. DADOS DO PEDIDO` e os outros títulos), não do `SAP S/4HANA`. O retângulo pintado é o próprio objeto: a largura dele é a largura da faixa.

1. Clique no texto na Hierarchy.
2. **Palettes** → **Border**.
3. No quadrado de cor ao lado de **Background** (o balde), abra a cor e escolha **More Colors**. RGB: Red 0, Green 51, Blue 102.
4. Marque o preenchimento. Se existir um traço em **Edges**, deixe o estilo em **None** nesse título.
5. Na barra de fonte, no **A** com o risco colorido embaixo, escolha branco. Arial 9, negrito.

| Objeto | Fundo | Letra |
|---|---|---|
| `1. DADOS DO PEDIDO`, `2. DADOS DO FORNECEDOR`, `4. ITENS DO PEDIDO`, `5. IMPOSTOS E CUSTOS`, `6. INFORMAÇÕES ADICIONAIS`, `7. APROVAÇÕES` | Azul 0, 51, 102 | Branco, Arial 9 negrito |
| `PURPOSE` | Amarelo 255, 242, 204 | Preto |
| `TEXT_05` e `TEXT_06` | Amarelo 255, 242, 204 | Preto |
| Cabeçalho das colunas Item, Código, Descrição, Quantidade, UN, Data | Azul claro 217, 226, 243 | Preto, Arial 7 negrito |
| Cabeçalho de Especificação, Preço e Valor | Pêssego 248, 203, 173 | Preto, Arial 7 negrito |
| Cabeçalho da faixa de condições | Pêssego claro 252, 228, 214 | Preto, Arial 7 negrito |
| Textos ICMS, IPI, PIS, COFINS, FRETE, OUTROS CUSTOS | Pêssego claro 252, 228, 214 | Preto |
| `ITEMS_TOTAL` e `GRAND_TOTAL` | Azul claro 217, 226, 243 | Preto, negrito |
verde 215 240 204

A letra branca no título azul: com o texto selecionado, a barra de fonte tem a cor da letra. Escolha branco.

## 13. Conferir e gravar

1. Hierarchy, de cima para baixo, tem que ter: `TITULO`, `LINHA_1_2`, `FAIXA_CONDICOES`, o título dos itens, a tabela de `GT_ITEMS`, `ITEMS_TOTAL`, `LINHA_5_6`, `7. APROVAÇÕES`, `ASSINATURAS`.
2. Clique em `GT_ITEMS` (ou no subform que repete). Object → Binding mostra **Repeat Subform for Each Data Item** e Min Count 0.
3. Ctrl+S.
4. Feche o Designer.
5. No Form Builder, ative o formulário.

Aba **Preview PDF** do Designer mostra o desenho com os campos vazios. Os valores só entram na impressão de um pedido, depois que a form routine chama a classe.

## Se a página voltar ao standard

O upload de XML não entra neste roteiro. Para desfazer um erro de exclusão, Ctrl+Z enquanto o Designer ainda estiver aberto. Se o formulário for salvo já sem volta, o XML original está em `99_arquivos_extras\SFPF_ZAFMM_PEDIDO_COMPRA.XML`, fora da pasta `para_upload`. Esse arquivo restaura o standard. O da pasta `para_upload` não restaura.
