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
