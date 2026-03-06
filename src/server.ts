import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Rota 1: Buscar o catálogo
app.get('/api/episodios', (req: Request, res: Response) => {
    try {
        const caminhoArquivo = path.join(__dirname, '../data/episodios.json');
        const dadosBrutos = fs.readFileSync(caminhoArquivo, 'utf-8');
        res.status(200).json(JSON.parse(dadosBrutos));
    } catch (error) {
        res.status(500).json({ erro: 'Não foi possível carregar os episódios.' });
    }
});

// Rota 2: Streaming de Vídeo
app.get('/api/video', (req: Request, res: Response) => {
    const videoPath = req.query.caminho as string;
    
    if (!videoPath) {
        return res.status(400).send('Caminho do vídeo não informado.');
    }

    const fullPath = path.join(__dirname, '..', videoPath);

    if (!fs.existsSync(fullPath)) {
        return res.status(404).send('Vídeo não encontrado nos arquivos reais.');
    }

    const stat = fs.statSync(fullPath);
    const fileSize = stat.size;
    
    // Forçamos o tipo para string | undefined para remover o erro da linha 44
    const range = req.headers.range as string | undefined;

    if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(fullPath, { start, end });
        
        const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'video/mp4',
        };

        res.writeHead(206, head);
        file.pipe(res);
    } else {
        const head = {
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4',
        };
        res.writeHead(200, head);
        fs.createReadStream(fullPath).pipe(res);
    }
});

// Rota 3: Sincronizar com TVmaze (Corrigida com o ID oficial)
app.get('/api/sincronizar', async (req: Request, res: Response) => {
    try {
        console.log('Buscando dados no TVmaze...');
        
        // CORREÇÃO: Usando o ID 2818 (My Little Pony: Friendship is Magic)
        const tvmazeUrl = 'https://api.tvmaze.com/shows/2818?embed=episodes';
        const resposta = await axios.get(tvmazeUrl);
        const dados = resposta.data; 
        
        const episodiosRaw = dados._embedded.episodes;
        const temporadasMap = new Map();

        episodiosRaw.forEach((ep: any) => {
            const numTemporada = ep.season;
            const numEpisodio = ep.number;

            if (!temporadasMap.has(numTemporada)) {
                temporadasMap.set(numTemporada, {
                    numero: numTemporada,
                    titulo: `Temporada ${numTemporada}`,
                    episodios: []
                });
            }

            const idStr = `S${String(numTemporada).padStart(2, '0')}E${String(numEpisodio).padStart(2, '0')}`;
            const nomeArquivoVideo = `mlp_${idStr.toLowerCase()}.mp4`;
            const descricaoLimpa = ep.summary ? ep.summary.replace(/<[^>]*>?/gm, '') : 'Sinopse não disponível.';

            temporadasMap.get(numTemporada).episodios.push({
                id: idStr,
                titulo: ep.name,
                descricao: descricaoLimpa,
                caminho_video: `/media/S${String(numTemporada).padStart(2, '0')}/${nomeArquivoVideo}`,
                assistido: false,
                tema_personagem: "Magia"
            });
        });

        const jsonFinal = { temporadas: Array.from(temporadasMap.values()) };
        const caminhoArquivo = path.join(__dirname, '../data/episodios.json');
        
        fs.writeFileSync(caminhoArquivo, JSON.stringify(jsonFinal, null, 2));

        res.status(200).json({ 
            mensagem: 'Catálogo sincronizado com sucesso!', 
            total_episodios_baixados: episodiosRaw.length 
        });

    } catch (error) {
        console.error('Erro detalhado na sincronização:', error);
        res.status(500).json({ erro: 'Falha ao buscar dados no TVmaze.' });
    }
});

app.listen(PORT, () => {
    console.log(`✨ Servidor de Equestria rodando na porta ${PORT} ✨`);
});