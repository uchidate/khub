# Guia: Usando Fotos Reais do Google Drive no HallyuHub

Este guia explica como fazer upload de fotos reais dos artistas e produções para o Google Drive e usá-las no HallyuHub.

## Passo 1: Preparar as Imagens

Baixe ou obtenha as fotos oficiais dos artistas e produções:
- **Lisa**: Foto oficial de press kit
- **Felix**: Foto oficial de press kit
- **Song Kang**: Foto oficial de press kit
- **Han So-hee**: Foto oficial de press kit
- **Cha Eun-woo**: Foto oficial de press kit
- **Produções**: Pôsteres oficiais de "My Demon", "Gyeongseong Creature", "Wonderful World", "My Name"

**Recomendação de tamanho**: 800x1200px para artistas (portrait), 1920x1080px para pôsteres (landscape)

## Passo 2: Upload para o Google Drive

1. Acesse [Google Drive](https://drive.google.com)
2. Crie uma pasta chamada `HallyuHub/artists` e outra `HallyuHub/productions`
3. Faça upload das imagens com nomes descritivos:
   - `lisa.jpg`
   - `felix.jpg`
   - `song-kang.jpg`
   - `han-so-hee.jpg`
   - `cha-eun-woo.jpg`
   - `my-demon-poster.jpg`
   - `gyeongseong-creature-poster.jpg`
   - `wonderful-world-poster.jpg`
   - `my-name-poster.jpg`

## Passo 3: Tornar as Imagens Públicas

Para cada imagem:
1. Clique com o botão direito na imagem
2. Selecione "Compartilhar" ou "Get link"
3. Altere a permissão para "Anyone with the link" (Qualquer pessoa com o link)
4. Copie o link compartilhado

O link terá este formato:
```
https://drive.google.com/file/d/FILE_ID/view?usp=sharing
```

## Passo 4: Converter para URL de Imagem Direta

Transforme o link do Google Drive em uma URL de imagem direta usando este formato:
```
https://drive.google.com/uc?export=view&id=FILE_ID
```

**Exemplo:**
- Link original: `https://drive.google.com/file/d/1ABC123XYZ/view?usp=sharing`
- URL direta: `https://drive.google.com/uc?export=view&id=1ABC123XYZ`

## Passo 5: Atualizar o Script de Atualização

Edite o arquivo `v1/scripts/update-images.json` (criado automaticamente) com as URLs:

```json
{
  "artists": {
    "Lisa": "https://drive.google.com/uc?export=view&id=SEU_FILE_ID_AQUI",
    "Felix": "https://drive.google.com/uc?export=view&id=SEU_FILE_ID_AQUI",
    "Song Kang": "https://drive.google.com/uc?export=view&id=SEU_FILE_ID_AQUI",
    "Han So-hee": "https://drive.google.com/uc?export=view&id=SEU_FILE_ID_AQUI",
    "Cha Eun-woo": "https://drive.google.com/uc?export=view&id=SEU_FILE_ID_AQUI"
  },
  "productions": {
    "My Demon": "https://drive.google.com/uc?export=view&id=SEU_FILE_ID_AQUI",
    "A Criatura de Gyeongseong": "https://drive.google.com/uc?export=view&id=SEU_FILE_ID_AQUI",
    "Wonderful World": "https://drive.google.com/uc?export=view&id=SEU_FILE_ID_AQUI",
    "My Name": "https://drive.google.com/uc?export=view&id=SEU_FILE_ID_AQUI"
  }
}
```

## Passo 6: Executar o Script de Atualização

No terminal, execute:
```bash
npm run update:images
```

Este comando irá:
1. Ler as URLs do arquivo `update-images.json`
2. Atualizar o banco de dados com as novas URLs
3. Confirmar as atualizações

## Verificação

Após a atualização, acesse:
- http://localhost:3004/artists
- http://localhost:3004/productions

As fotos reais devem aparecer no lugar dos placeholders!

## Dicas

- **Qualidade**: Use imagens de alta resolução (mínimo 800px de largura)
- **Formato**: JPG ou PNG funcionam bem
- **Tamanho do arquivo**: Mantenha abaixo de 2MB para carregamento rápido
- **Backup**: Mantenha uma cópia local das imagens

## Alternativa: Imgur

Se preferir, você também pode usar o [Imgur](https://imgur.com) para hospedar as imagens:
1. Faça upload da imagem
2. Clique com o botão direito na imagem
3. Selecione "Copy image address"
4. Use essa URL diretamente no `update-images.json`
