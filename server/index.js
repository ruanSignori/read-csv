import { createServer } from 'node:http';
import { createReadStream } from 'node:fs'
import { Readable, Transform } from 'node:stream'
import { WritableStream, TransformStream } from 'node:stream/web'
import { setTimeout } from 'node:timers/promises'
import csvtojson from 'csvtojson'

const PORT = 3000;
createServer(async (request, response) => {
  // Dando permissão para qualquer host acessar o servidor
  const headers = {
    "Access-Control-Allow-Origin": '*',
    "Access-Control-Allow-Method": '*',
  } 

  // A primeira request feita no navegador é o metodo OPTIONS, ele verifica se o servidor pode ser acessado, etc
  if (request.method === "OPTIONS") {
    response.writeHead(204, headers);
    response.end();
    return;
  }

  request.once('close', () => console.log(`connection was closed!`, items))
  let items = 0
  Readable.toWeb(createReadStream('./animes.csv'))

  // passo a passo que cada item individual vai trafegar
  .pipeThrough(Transform.toWeb(csvtojson()))
  .pipeThrough(new TransformStream({
    transform(chunk, controller) {
      const data = JSON.parse(Buffer.from(chunk));
      const mappedData = {
        title: data.title,
        description: data.description,
        url_anime: data.url_anime
      }
      // quebra de linha, pois é um NDJSON
      controller.enqueue(JSON.stringify(mappedData).concat('\n'))
    }
  }))

  // última etapa
  .pipeTo(new WritableStream({
    async write(chunk) {
      await setTimeout(200);
      items++;
      response.write(chunk);
    },
    close() {
      response.end();
    }

  }))

  response.writeHead(200, headers);
})
.listen(PORT)
.on('listening', () => console.log(`server is running at localhost:${PORT}`))