# Usar as listas do Saimo TV na aba Ao Vivo (e, opcionalmente, nos filmes)

## Como o Saimo TV funciona (o que encontrei)
- O site em si não guarda nenhum vídeo. Ele baixa **arquivos de texto públicos** de dois outros sites:
  - **Canais:** `canais-saimo.pages.dev/catalogo.txt`. São cerca de 350 canais, cada um com nome, categoria, logo e **vários links diretos `.m3u8`** com qualidade (4K/FHD/HD). Alguns também trazem o "referer" e o "agente" (navegador) que a fonte exige. O mesmo site tem ainda `guia.txt` (programação) e `radios.txt`.
  - **Filmes e séries:** `filmes-saimo.pages.dev/indice.txt` mais os arquivos `imdb/{id}.txt`. Os links apontam para servidores de IPTV pagos, acessados com usuário e senha embutidos no próprio link. Muitos já aparecem marcados como "desativado".
- Capas e informações vêm do TMDB, igual ao Movyra. As legendas vêm do OpenSubtitles.
- O player é HLS, com troca automática de fonte quando um link cai. É o mesmo modelo que o Movyra já usa na aba Ao Vivo.

## O que vou fazer

### 1. Aba Ao Vivo com a lista do Saimo
- A lista atual de canais (iptv-org) passa a vir do `catalogo.txt` do Saimo, sem mudar o visual.
- Canais +18 continuam bloqueados.
- Cada canal guarda todas as fontes dele. Se uma fonte falhar ou travar, o player passa sozinho para a próxima.
- No player aparece um seletor "Fonte 1 / 2 / 3…" com a qualidade de cada uma, para trocar na mão.
- O proxy de vídeo passa a enviar o referer e o agente que cada fonte pede. Isso faz funcionar canais que hoje dão "indisponível".

### 2. Filmes pelo Saimo (opcional, decida abaixo)
- No botão "Assistir", procurar o filme pelo código IMDb na lista do Saimo e tocar no player HLS. Se não achar, cair no WarezCDN atual.

## Avisos importantes
- **Filmes:** os links usam contas de IPTV pagas compartilhadas por terceiros. Eles caem com frequência e podem trazer problema de direitos autorais para o seu site. Recomendo começar só pelos canais e ver como fica.
- Os canais dependem de fontes de terceiros. Alguns vão estar fora do ar em certos momentos, e a troca automática diminui esse problema.
- Links `http://` (sem cadeado) só tocam através do proxy, e ele já faz essa parte.

## Detalhes técnicos
- Função `live-channels`: fazer o parse de `catalogo.txt` (blocos `canal:/categoria:/logo:/fonte:/qualidade:/referer:/agente:`), descartar fontes `error.txt` e `desativado.invalid`, guardar em cache por 30 min e devolver `sources[]`.
- Função `hls-proxy`: aceitar os parâmetros opcionais `ref` e `ua` e repassá-los também nas URLs reescritas do manifesto. O bloqueio de IPs privados (proteção SSRF) continua.
- `Live.tsx`: lista de fontes com fallback quando o HLS dá erro fatal ou fica 12 s sem tocar, e seletor de fontes. As sobreposições manuais de canais continuam funcionando.
- Filmes (se aprovado): nova função `saimo-movie` que lê `indice.txt` + `imdb/{id}.txt`, monta a URL com as bases e o `PlayerFrame` usa o HLS com fallback para o WarezCDN.
- Teste final: abrir 3 canais no preview, já logado, e confirmar que o vídeo toca.
