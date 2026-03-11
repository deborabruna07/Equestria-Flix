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
app.use('/media', express.static(path.join(__dirname, '../media')));

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
// Rota 3: Sincronizar com TMDB (Para ter tudo em Português pt-BR)
// Rota 3: Sincronizar com TMDB (Para ter tudo em Português pt-BR)
app.get('/api/sincronizar', async (req: Request, res: Response) => {
    try {
        console.log('Buscando magia no TMDB em Português...');
        
        // Sua chave colada aqui dentro das aspas (sem nenhum IF depois)
        const TMDB_API_KEY = '05ab0d074920b94fa6389b3352d3cdae'; 

        const tmdbShowId = 33765; // O código exato de My Little Pony no TMDB
        const temporadasMap = new Map();
        
        // ... (resto do código continua igual)

        // O TMDB exige que a gente busque uma temporada por vez. Como MLP tem 9 temporadas:
        for (let numTemporada = 1; numTemporada <= 9; numTemporada++) {
            // Repare no &language=pt-BR no final do link! É isso que traz o português.
            const url = `https://api.themoviedb.org/3/tv/${tmdbShowId}/season/${numTemporada}?api_key=${TMDB_API_KEY}&language=pt-BR`;
            
            try {
                const resposta = await axios.get(url);
                const dadosTemporada = resposta.data;

                const episodiosDaTemporada = dadosTemporada.episodes.map((ep: any) => {
                    const numEpisodio = ep.episode_number;
                    const idStr = `S${String(numTemporada).padStart(2, '0')}E${String(numEpisodio).padStart(2, '0')}`;
                    const nomeArquivoVideo = `mlp_${idStr.toLowerCase()}.mp4`;
                    
                    return {
                        id: idStr,
                        titulo: ep.name || `Episódio ${numEpisodio}`,
                        descricao: ep.overview || 'A sinopse mágica deste episódio ainda não foi traduzida.',
                        caminho_video: `/media/S${String(numTemporada).padStart(2, '0')}/${nomeArquivoVideo}`,
                        assistido: false,
                        // O TMDB já manda imagens lindíssimas! Nós montamos o link completo aqui:
                        imagem: ep.still_path ? `https://image.tmdb.org/t/p/w500${ep.still_path}` : 'capa-padrao.jpg'
                    };
                });

                temporadasMap.set(numTemporada, {
                    numero: numTemporada,
                    titulo: `Temporada ${numTemporada}`,
                    episodios: episodiosDaTemporada
                });
            } catch (err) {
                console.log(`Aviso: Falha ao carregar a temporada ${numTemporada}.`);
            }
        }

        const jsonFinal = { temporadas: Array.from(temporadasMap.values()) };
        const caminhoArquivo = path.join(__dirname, '../data/episodios.json');
        
        fs.writeFileSync(caminhoArquivo, JSON.stringify(jsonFinal, null, 2));

        res.status(200).json({ mensagem: 'Catálogo sincronizado em Português com sucesso!' });

    } catch (error) {
        console.error('Erro na sincronização TMDB:', error);
        res.status(500).json({ erro: 'Falha ao buscar dados no TMDB.' });
    }
});
app.listen(PORT, () => {
    console.log(`✨ Servidor de Equestria rodando na porta ${PORT} ✨`);
});