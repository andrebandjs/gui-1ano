# Convite digital do Guilherme

Página estática mobile-first baseada na frame `LP Guilherme` do Figma. A experiência desktop apenas centraliza o convite no viewport.

## Estrutura

- `index.html`: marcação da página.
- `gerador.html`: página para gerar links personalizados com convidados pré-preenchidos.
- `obrigado.html`: página exibida após confirmação enviada.
- `styles.css`: estilos responsivos e pixel art.
- `script.js`: convidados, validação, envio, cópia de endereço e áudio.
- `generator.js`: lógica do gerador de links.
- `assets/images/`: assets exportados do Figma.
- `assets/audio/`: coloque aqui o arquivo `background.mp3`.
- `google-apps-script.js`: código para colar no Apps Script.

## Assets do Figma

Os assets usados nesta implementação foram extraídos do MCP do Figma e salvos em `assets/images/`.

Se precisar exportar novamente:

1. Abra a frame `LP Guilherme` no Figma.
2. Exporte os assets raster em PNG mantendo transparência.
3. Exporte ícones e divisores em SVG.
4. Mantenha nomes equivalentes aos arquivos atuais ou ajuste os caminhos em `index.html` e `styles.css`.

Use `image-rendering: pixelated;` para assets pixel art, como já está configurado no CSS.

## Google Sheets

A planilha configurada para este projeto é:

```text
https://docs.google.com/spreadsheets/d/18r48bY5YF7JHnwZ3ez5vS88WkObS9kWDdHcNTDjCLCI/edit
```

O arquivo `google-apps-script.js` já está configurado com este `SPREADSHEET_ID`.

No arquivo `script.js`, substitua:

```js
const GOOGLE_SCRIPT_URL = "COLE_A_URL_DO_WEB_APP_AQUI";
```

pela URL do Web App publicado no Google Apps Script.

## Criar a planilha

A planilha atual já foi preparada com a aba `Respostas`.

Se precisar recriar:

1. Crie uma planilha no Google Sheets.
2. Crie uma aba chamada exatamente `Respostas`.
3. Na primeira linha, adicione as colunas:

```text
Data/Hora | Nome | Idade | Status | Origem
```

O campo `Data/Hora` é gravado pelo Apps Script em formato legível no fuso `America/Bahia`: `dd/MM/yyyy HH:mm:ss`.

## Publicar o Apps Script

1. Na planilha, vá em `Extensões > Apps Script`.
2. Cole o conteúdo de `google-apps-script.js`.
3. Salve o projeto.
4. Clique em `Implantar > Nova implantação`.
5. Escolha o tipo `App da Web`.
6. Em `Executar como`, selecione sua conta.
7. Em `Quem pode acessar`, selecione a opção adequada para receber respostas.
8. Publique e copie a URL do Web App.
9. Cole essa URL em `GOOGLE_SCRIPT_URL` no `script.js`.

Ao publicar como Web App, use:

- `Executar como`: você mesmo.
- `Quem pode acessar`: qualquer pessoa com o link.

Sempre que alterar o código do Apps Script, crie uma nova versão/implantação ou edite a implantação existente e selecione a versão mais recente. O frontend valida a URL antes do envio usando o `doGet` do Apps Script; uma URL inválida ou não pública exibirá erro na interface em vez de redirecionar para a página de obrigado.

## Testar envio

1. Abra `index.html` em um navegador ou rode um servidor local simples.
2. Preencha nome, idade e presença.
3. Clique em `Enviar Confirmação`.
4. Após o envio, a página redireciona para `obrigado.html`.
5. Confira se uma linha foi adicionada na aba `Respostas`.

O frontend envia este payload:

```json
{
  "submittedAt": "ISO_DATE_STRING",
  "guests": [
    {
      "name": "Nome do convidado",
      "age": "Adulto",
      "ageCategory": "adulto",
      "status": "confirmado"
    }
  ],
  "source": "convite-guilherme-1-ano"
}
```

O campo `age` recebe o texto da idade selecionada: `Adulto`, `Adolescente` ou `Criança/Bebê`.

## Links personalizados

Para abrir o convite com convidados preenchidos pela URL, use o parâmetro `convidados`.

Exemplo simples:

```text
index.html?convidados=Gabriel+Pinto&Isabelle+Pinto
```

Sem idade explícita, os convidados entram como `Adulto`.

Para definir a idade de cada convidado, coloque a categoria depois do nome usando `|`:

```text
index.html?convidados=Gabriel+Pinto|adulto&Isabelle+Pinto|crianca
```

Categorias aceitas:

- `adulto`
- `adolescente`
- `crianca`

Links antigos com `crianca_bebe` continuam funcionando, mas o gerador passa a emitir `crianca`.

Também é possível repetir o parâmetro:

```text
index.html?convidados=Gabriel+Pinto|adulto&convidados=Isabelle+Pinto|crianca
```

## Gerador de convites

Abra:

```text
gerador.html
```

Preencha os convidados e perfis, clique em `Gerar Link` e o link de compartilhamento será criado e copiado automaticamente.

O gerador usa o formato com parâmetros repetidos para preservar melhor nomes e perfis:

```text
index.html?convidados=Gabriel+Pinto%7Cadulto&convidados=Isabelle+Pinto%7Ccrianca
```

## Música

Coloque o arquivo da música em:

```text
assets/audio/background.mp3
```

A página principal tenta tocar a música automaticamente com volume inicial `0.25`. Alguns navegadores podem bloquear áudio com som antes da primeira interação; nesses casos, o botão `Tocar música` continua disponível como fallback.
