# Canais Ao Vivo mais estáveis + links diretos de filmes salvos

## 1. Ao Vivo: descobrir por que alguns canais não tocam
Ainda não sei a causa. O primeiro passo é medir:
- Testar todas as fontes dos ~350 canais pelo proxy e registrar o resultado de cada uma: tocou, erro 403/404, tempo esgotado, ou link `http` bloqueado.
- Com o resultado, aplicar as correções que fizerem sentido:
  - Esconder os canais em que **nenhuma** fonte funciona, e mostrar o resto primeiro.
  - Tentar primeiro as fontes que funcionaram no último teste.
  - Ajustar o proxy para os erros que aparecerem mais, por exemplo cabeçalhos que a fonte exige ou redirecionamentos.
- O teste roda de novo a cada 30 minutos, junto com a atualização da lista.

## 2. Filmes e séries: achar o link direto uma vez e guardar
- Ao apertar **Assistir**, o site procura um link direto (`.m3u8`/`.mp4`) pelo código IMDb, seguindo esta ordem:
  1. **Banco de dados.** Se alguém já encontrou o link e ele ainda funciona, toca na hora.
  2. **Busca nova** nas fontes: lista do Saimo, depois os addons já usados no projeto.
  3. Se nada funcionar, abre o **WarezCDN**, como hoje.
- Um link encontrado e testado fica salvo para todos os usuários.
- Se um link salvo falhar ao tocar, ele é marcado como quebrado e a próxima pessoa dispara uma busca nova.
- Episódios de série são salvos um por um (temporada e episódio).
- Durante a busca aparece um aviso "Procurando melhor fonte…".

## Aviso
Os links do Saimo para filmes usam contas de IPTV pagas de terceiros. Eles caem com frequência e podem trazer problemas de direitos autorais.

## Detalhes técnicos
- Nova tabela `media_links`: `imdb_id`, `tmdb_id`, `media_type`, `season`, `episode`, `url`, `source`, `referer`, `ua`, `status` (ok/quebrado), `last_checked_at`, `fail_count`. Chave única por (tmdb_id, media_type, season, episode, url). Leitura para quem está logado. Gravação só pelo `service_role`, através da função.
- Nova função `resolve-media`: consulta o cache. Quando não acha, lê `filmes-saimo.pages.dev/indice.txt` + `imdb/{id}.txt` e o proxy de `streams`, testa a URL com um HEAD/GET pelo proxy e salva. Também recebe `report_broken` para aumentar o `fail_count`.
- `PlayerFrame`: chama `resolve-media` e toca com hls.js pelo `hls-proxy`. Se der erro fatal, reporta a falha e cai para o iframe do WarezCDN.
- `live-channels`: health-check paralelo com limite de 10 conexões e 6 s de tempo máximo por fonte. Ordena `sources[]` pelo resultado e adiciona `alive` por canal. `Live.tsx` esconde os canais com `alive=false`.
- Teste final: logado no preview, abrir 5 canais e 2 filmes. No segundo clique do mesmo filme, o link deve vir do banco.
