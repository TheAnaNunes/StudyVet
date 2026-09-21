# StudyVet

App de estudos de veterinaria, estilo Duolingo: trilha de modulos organizados
cronologicamente, licoes com perguntas e respostas de multipla escolha,
coracoes, XP e streak. Funciona como PWA (Progressive Web App) e pode ser
instalado diretamente no celular, sem loja de aplicativos.

## Como abrir no celular

1. Publique esta pasta em algum servidor HTTPS (GitHub Pages, Vercel, Netlify,
   ou qualquer hospedagem estatica).
2. No navegador do celular (Chrome/Safari), abra o link.
3. Toque no menu do navegador e escolha **"Adicionar a tela inicial"**
   (Android/Chrome) ou **"Adicionar a Tela de Inicio"** (iPhone/Safari).
4. O app abre como um icone proprio, em tela cheia, e funciona offline depois
   do primeiro carregamento (graças ao `sw.js`, o service worker).

Para testar localmente antes de publicar:

```bash
cd StudyVet
python3 -m http.server 8000
# abra http://localhost:8000 no navegador do celular (mesma rede) ou no PC
```

## Estrutura

- `data/modulos.csv` — lista de modulos/licoes, com ordem cronologica e materia.
- `data/perguntas.csv` — perguntas de cada modulo (multipla escolha a/b/c/d).
- `js/app.js` — logica da trilha e do quiz.
- `js/storage.js` — progresso, XP e streak salvos no `localStorage` do celular.
- `js/csv.js` — parser de CSV simples (sem dependencias).
- `manifest.json` + `sw.js` — fazem o app instalavel e funcionar offline.

## Formato dos CSVs

### `modulos.csv`

| coluna     | descricao                                      |
|------------|-------------------------------------------------|
| id_modulo  | identificador unico (ex: `mod01`)               |
| ordem      | numero que define a posicao na trilha           |
| materia    | nome da materia/disciplina (agrupa os modulos)  |
| titulo     | titulo do modulo                                |
| descricao  | descricao curta                                 |
| icone      | livre, nao usado na interface ainda              |

### `perguntas.csv`

| coluna           | descricao                                      |
|------------------|-------------------------------------------------|
| id_pergunta      | identificador unico                             |
| id_modulo        | a qual modulo a pergunta pertence                |
| ordem            | ordem da pergunta dentro do modulo               |
| pergunta         | enunciado                                        |
| opcao_a..opcao_d | alternativas (opcao_d pode ficar vazia)         |
| resposta_correta | `a`, `b`, `c` ou `d`                            |
| explicacao       | texto mostrado apos responder                   |

Campos com virgula devem ficar entre aspas duplas, como em CSV comum.

## Prompt pronto para gerar novos CSVs com IA

Para criar um modulo novo a partir de material de aula (PDF, slides, resumo,
anotacoes), cole o conteudo junto com o prompt abaixo em qualquer IA (Claude,
ChatGPT etc.). Antes de colar, preencha os campos em `[colchetes]` — em
especial o numero inicial de `ordem`/`id`, que deve continuar a partir do
ultimo modulo já existente em `data/modulos.csv` e `data/perguntas.csv` (por
exemplo, se o ultimo modulo e `mod14`, o novo comeca em `mod15`).

```
Voce vai gerar conteudo para o app de estudos StudyVet, no formato de dois
arquivos CSV. Use o material que vou colar abaixo como fonte do conteudo.

Gere DUAS tabelas CSV separadas, exatamente com estas colunas e nesta ordem:

1) modulos.csv
id_modulo,ordem,materia,titulo,descricao,icone

2) perguntas.csv
id_pergunta,id_modulo,ordem,pergunta,opcao_a,opcao_b,opcao_c,opcao_d,resposta_correta,explicacao

Regras:
- Crie [1] modulo(s) novo(s), cobrindo os principais topicos do material.
- id_modulo comeca em "mod[15]" e incrementa (mod16, mod17...).
- ordem em modulos.csv comeca em [15] e segue a sequencia cronologica de
  estudo (do mais basico/introdutorio para o mais avancado).
- materia: use "[Inspecao de Produtos de Origem Animal]" se o modulo pertencer
  a essa mesma disciplina (assim ele fica agrupado com os modulos existentes),
  ou um nome novo se for uma disciplina diferente.
- Cada modulo deve ter entre 6 e 10 perguntas de multipla escolha.
- id_pergunta segue o padrao "p<numero do modulo com 2 digitos><numero da
  pergunta com 2 digitos>", ex.: mod15 -> p1501, p1502, p1503...
- ordem em perguntas.csv comeca em 1 dentro de cada modulo.
- Cada pergunta tem exatamente 4 alternativas (opcao_a a opcao_d), sendo
  apenas UMA correta. Alternativas erradas devem ser plausiveis, nao obvias.
- resposta_correta e sempre "a", "b", "c" ou "d" (minusculo).
- explicacao: 1-2 frases justificando a resposta correta, para aparecer
  depois que a pessoa responder.
- Nao invente numeros de lei, percentuais, prazos ou valores tecnicos que
  nao estejam no material colado ou que voce nao tenha certeza — nesse caso,
  formule a pergunta de forma conceitual em vez de citar o numero exato.
- Toda linha deve estar em CSV valido: campos de texto entre aspas duplas
  ("..."), sem quebras de linha dentro do campo. Sem markdown, sem numeracao
  de lista, apenas as duas tabelas CSV (a primeira linha de cada uma deve
  ser o cabecalho).
- Responda com as duas tabelas em blocos de codigo separados, prontas para
  copiar e colar (ou anexar) direto nos arquivos data/modulos.csv e
  data/perguntas.csv do StudyVet, apendando ao final (sem repetir o
  cabecalho).

Material de origem:
[cole aqui o conteudo da aula/PDF/resumo]
```

Depois de gerar, você pode colar as linhas novas direto no fim dos arquivos
`data/modulos.csv` e `data/perguntas.csv` (sem repetir a linha de cabeçalho),
ou importar como um CSV separado pelo botão "Importar CSV" do próprio app.

## Adicionar mais conteudo

Duas formas:

1. **Editar os CSVs da pasta `data/`** direto no repositorio e publicar de
   novo.
2. **Importar pelo proprio app**: na tela da trilha, toque em "Importar CSV"
   e selecione um `modulos.csv` e/ou `perguntas.csv` (podem ter qualquer
   nome de arquivo, o app detecta pelo cabecalho das colunas). Esses CSVs
   ficam salvos no celular da pessoa (`localStorage`) e continuam disponiveis
   nas proximas vezes que o app abrir, mesmo offline.

## Progresso

Progresso (licoes concluidas, XP, streak de dias estudando) fica salvo local
no `localStorage` do navegador/celular de cada pessoa — nao ha servidor nem
conta de usuario. Limpar os dados do navegador apaga o progresso.
