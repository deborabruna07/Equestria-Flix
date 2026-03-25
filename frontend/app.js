const API_URL = 'http://localhost:3000/api/episodios';
let todasTemporadas = [];

// ==========================================
// 1. NAVEGAÇÃO ENTRE TELAS
// ==========================================
function abrirPrincipal() {
    document.getElementById('pagina-inicial').classList.replace('tela-ativa', 'tela-oculta');
    document.getElementById('pagina-principal').classList.replace('tela-oculta', 'tela-ativa');
}

function voltarInicial() {
    // Tira a ativa da principal e coloca oculta
    const principal = document.getElementById('pagina-principal');
    const inicial = document.getElementById('pagina-inicial');
    
    principal.classList.remove('tela-ativa');
    principal.classList.add('tela-oculta');
    
    // Mostra a inicial
    inicial.classList.remove('tela-oculta');
    inicial.classList.add('tela-ativa');
    
    // Limpa a URL para não bugar no F5
    window.history.pushState({}, document.title, window.location.pathname);
}

// ==========================================
// 2. CONTROLE DO MENU DIREITO
// ==========================================
function abrirPainelDireito() {
    document.getElementById('painel-direito').classList.add('aberto');
}

function fecharPainelDireito() {
    document.getElementById('painel-direito').classList.remove('aberto');
}

// ==========================================
// 3. CARREGAMENTO DOS EPISÓDIOS
// ==========================================
async function carregarEpisodios() {
    try {
        const resposta = await fetch(API_URL);
        const dados = await resposta.json();
        
        // Garante que não vai quebrar se o JSON estiver vazio
        todasTemporadas = dados.temporadas || [];

        configurarEpisodioDoDia();
        
        gerarBotoesTemporada();
        
        if(todasTemporadas.length > 0) {
            renderizarGrade(todasTemporadas[0]);
        }
    } catch (erro) {
        console.error('Erro ao buscar episódios. O backend está rodando?', erro);
    }
}

function gerarBotoesTemporada() {
    const seletor = document.getElementById('season-selector');
    if (!seletor) return;
    seletor.innerHTML = '';

    todasTemporadas.forEach((temporada, index) => {
        const btn = document.createElement('button');
        btn.className = `btn-season ${index === 0 ? 'active' : ''}`;
        btn.textContent = `Season ${temporada.numero}`;
        
        btn.onclick = () => {
            document.querySelectorAll('.btn-season').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderizarGrade(temporada);
        };
        
        seletor.appendChild(btn);
    });
}

function renderizarGrade(temporada) {
    document.getElementById('titulo-temporada-atual').textContent = `Temporada ${temporada.numero}`;
    const grade = document.getElementById('episode-grid');
    if (!grade) return;
    grade.innerHTML = '';

    if (!temporada.episodios) return;

    // ✨ Busca a lista de assistidos no momento em que vai desenhar a tela
    const assistidosSalvos = JSON.parse(localStorage.getItem('ponies_assistidos')) || [];

    temporada.episodios.forEach(episodio => {
        const card = document.createElement('div');
        card.className = 'card-episodio';
        card.onclick = () => assistir(episodio.caminho_video, episodio.titulo);
        
        const numeroEp = episodio.id.includes('E') ? episodio.id.split('E')[1] : episodio.id;
        const imagemCapa = episodio.imagem ? episodio.imagem : 'capa-padrao.jpg';

        // ✨ Verifica se este episódio está na lista de assistidos
        const foiAssistido = assistidosSalvos.includes(episodio.titulo);
        const seloAssistido = foiAssistido ? '<div class="badge-assistido">✔ Assistido</div>' : '';

        card.innerHTML = `
            <div class="thumb-container">
                ${seloAssistido} <img src="${imagemCapa}" alt="Capa" class="capa-episodio">
                <div class="overlay-play">
                    <div class="play-icon">▶</div>
                </div>
            </div>
            <div class="info-episodio">
                <h4>Ep. ${numeroEp} - ${episodio.titulo}</h4>
                <p>${episodio.descricao}</p>
            </div>
        `;
        grade.appendChild(card);
    });
}

// ==========================================
// 4. ABRIR O VÍDEO NO PLAYER
// ==========================================
function assistir(caminhoVideo, tituloEpisodio) {
    if (!caminhoVideo) {
        alert("O vídeo deste episódio ainda não foi encontrado.");
        return;
    }
    const url = `player.html?caminho=${encodeURIComponent(caminhoVideo)}&titulo=${encodeURIComponent(tituloEpisodio)}`;
    window.location.href = url;
    const musica = document.getElementById('musica-fundo');
    if (musica) musica.pause();
}

// Verifica se voltamos do player querendo ver o catálogo direto
window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    
    // MÁGICA DO BOTÃO VOLTAR: Lê a URL e pula para o catálogo automaticamente
    if (urlParams.get('view') === 'catalogo') {
        abrirPrincipal();
        // Limpa a URL logo em seguida para ficar bonita e não bugar ao dar F5
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    const videoPath = urlParams.get('caminho');
    const videoTag = document.querySelector('video');
    const sourceTag = document.querySelector('video source');

    if (videoPath && videoTag) {
        // Atualiza o src do source e do video
        sourceTag.src = videoPath;
        videoTag.src = videoPath;
        
        // Recarrega o player para reconhecer o novo ficheiro
        videoTag.load();
    }
});

let indexAtual = 0;

// ==========================================
// 6. CARROSSEL INFINITO (Sem Rebobinar)
// ==========================================
function mudarBanner(direcao) {
    const track = document.getElementById('track');
    
    // Animação suave ativada (para que o deslize seja bonito)
    track.style.transition = 'transform 0.5s ease-in-out';

    if (direcao === 1) {
        // Clicou para a DIREITA (Próximo)
        track.style.transform = `translateX(-100%)`; // Desliza 1 banner para a esquerda
        
        // Espera a animação terminar (0.5s) e faz a mágica acontecer
        setTimeout(() => {
            track.style.transition = 'none'; // Desliga a animação por um milissegundo
            // Pega o primeiro banner e joga lá pro final da fila!
            track.appendChild(track.firstElementChild); 
            track.style.transform = `translateX(0)`; // Volta a posição do trilho pro zero
        }, 500); 

    } else if (direcao === -1) {
        // Clicou para a ESQUERDA (Anterior)
        // Primeiro, pega o último banner da fila e joga lá pro começo, escondido!
        track.prepend(track.lastElementChild);
        
        // Dá um "pulo" invisível para -100% (para que o banner que acabamos de mover fique escondido)
        track.style.transition = 'none';
        track.style.transform = `translateX(-100%)`;
        
        // Agora sim, liga a animação e desliza para a posição 0 (trazendo o banner pro meio)
        setTimeout(() => {
            track.style.transition = 'transform 0.5s ease-in-out';
            track.style.transform = `translateX(0)`;
        }, 10); 
    }
}

// Opcional: Auto-play a cada 6 segundos (continua funcionando normal!)
setInterval(() => mudarBanner(1), 4000);

// ==========================================
// 7. SISTEMA DO EPISÓDIO DO DIA (Automático)
// ==========================================
function configurarEpisodioDoDia() {
    let listaCompletaEpisodios = [];
    todasTemporadas.forEach(temporada => {
        if(temporada.episodios) {
            listaCompletaEpisodios.push(...temporada.episodios);
        }
    });

    if (listaCompletaEpisodios.length === 0) return;

    const dataHoje = new Date();
    const diasPassados = Math.floor(dataHoje.getTime() / (1000 * 60 * 60 * 24));
    const indiceDoDia = diasPassados % listaCompletaEpisodios.length;
    
    const episodioEscolhido = listaCompletaEpisodios[indiceDoDia];

    const banner = document.getElementById('banner-ep-dia');
    const titulo = document.getElementById('titulo-ep-dia');
    const descricao = document.getElementById('desc-ep-dia');

    if (banner && episodioEscolhido) {
        // ✨ MÁGICA NOVA: Apenas atualizamos o texto para ficar chique!
        titulo.innerText = episodioEscolhido.titulo;
        
        // Pega o número do episódio para colocar na descrição
        const numeroEp = episodioEscolhido.id.includes('E') ? episodioEscolhido.id.split('E')[1] : episodioEscolhido.id;
        descricao.innerText = `Episódio ${numeroEp} • Clique para assistir!`;

        banner.onclick = () => assistir(episodioEscolhido.caminho_video, episodioEscolhido.titulo);
    }
}

// ==========================================
// 5. SISTEMA DE PÁGINA DE FAVORITOS
// ==========================================
async function abrirFavoritos() {
    // 1. Fecha o painel lateral
    document.getElementById('painel-direito').classList.remove('aberto');
    
    // 2. Esconde O CATÁLOGO INTEIRO DE UMA VEZ
    document.getElementById('conteudo-catalogo').style.display = 'none';
    
    // 3. Mostra SÓ OS FAVORITOS
    const secaoFav = document.getElementById('secao-favoritos');
    secaoFav.classList.remove('tela-oculta');
    secaoFav.style.display = 'block';

    // 4. Busca a lista no LocalStorage
    const favoritosSalvos = JSON.parse(localStorage.getItem('ponies_favoritos')) || [];
    const grid = document.getElementById('grid-favoritos');
    grid.innerHTML = ""; 

    if (favoritosSalvos.length === 0) {
        grid.innerHTML = "<div style='grid-column: 1/-1; text-align: center; padding: 4rem;'><h3 style='color: white; font-size: 1.5rem;'>Sua lista está vazia. Adicione episódios com o coração! 💔</h3></div>";
        return;
    }
    try {
        const resposta = await fetch('http://localhost:3000/api/episodios');
        const dados = await resposta.json();
        
        // ✨ Busca a lista de assistidos também para a tela de favoritos
        const assistidosSalvos = JSON.parse(localStorage.getItem('ponies_assistidos')) || [];
        
        dados.temporadas.forEach(temporada => {
            temporada.episodios.forEach(ep => {
                if (favoritosSalvos.includes(ep.titulo)) {
                    const card = document.createElement('div');
                    card.className = 'card-episodio';
                    card.onclick = () => window.location.href = `player.html?caminho=${encodeURIComponent(ep.caminho_video)}&titulo=${encodeURIComponent(ep.titulo)}`;
                    
                    // ✨ Verifica assistido aqui também
                    const foiAssistido = assistidosSalvos.includes(ep.titulo);
                    const seloAssistido = foiAssistido ? '<div class="badge-assistido">✔ Assistido</div>' : '';

                    card.innerHTML = `
                        <div class="thumb-container">
                            ${seloAssistido} <img src="${ep.imagem || 'fundo.png'}" class="capa-episodio" alt="${ep.titulo}">
                            <div class="overlay-play">
                                <div class="play-icon">▶</div>
                            </div>
                        </div>
                        <div class="info-episodio">
                            <h4>${ep.titulo}</h4>
                            <p>${ep.descricao ? ep.descricao.substring(0, 100) + '...' : 'Sem sinopse disponível.'}</p>
                        </div>
                    `;
                    grid.appendChild(card);
                }
            });
        });
    } catch (erro) {
        grid.innerHTML = "<p style='color: white; text-align: center; grid-column: 1/-1;'>Erro ao carregar a magia da amizade (falha na API).</p>";
    }
}

function voltarAoCatalogo() {
    // Esconde a página exclusiva de favoritos
    const secaoFav = document.getElementById('secao-favoritos');
    secaoFav.classList.add('tela-oculta');
    secaoFav.style.display = 'none';
    
    // Mostra todo o catálogo normal de volta
    document.getElementById('conteudo-catalogo').style.display = 'block';
}

function toggleMusica() {
    const musica = document.getElementById('musica-fundo');
    const icone = document.getElementById('icone-som-img'); 
    const btn = document.getElementById('btn-musica');

    if (musica.paused) {
        musica.play();
        icone.src = 'som-on.png'; 
        btn.classList.add('tocando'); 
        localStorage.setItem('musica_tocando', 'true'); // Grava a preferência
    } else {
        musica.pause();
        icone.src = 'som-off.png'; 
        btn.classList.remove('tocando'); 
        localStorage.setItem('musica_tocando', 'false'); // Grava a preferência
    }
}

// ✨ AUTOPLAY COM DETECÇÃO DE F5 E NAVEGAÇÃO ✨
window.addEventListener('load', () => {
    const musica = document.getElementById('musica-fundo');
    const icone = document.getElementById('icone-som-img');
    const btn = document.getElementById('btn-musica');

    if (musica) {
        musica.volume = 0.1; 

        const tocando = localStorage.getItem('musica_tocando') === 'true';
        
        // Sensor que descobre como a página foi carregada
        const navegacao = performance.getEntriesByType("navigation")[0];
        const ehF5 = navegacao ? (navegacao.type === "reload") : false;

        let tempoSalvo = 0;
        
        // Se NÃO for F5 e existir um tempo salvo nesta aba, a música continua
        if (!ehF5 && sessionStorage.getItem('musica_tempo')) {
            tempoSalvo = parseFloat(sessionStorage.getItem('musica_tempo'));
        }

        musica.currentTime = tempoSalvo;

        // Fica salvando o segundo atual na memória da aba
        setInterval(() => {
            if(!musica.paused) {
                sessionStorage.setItem('musica_tempo', musica.currentTime);
            }
        }, 500);

        if (tocando) {
            let playPromise = musica.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    icone.src = 'som-on.png';
                    btn.classList.add('tocando');
                }).catch(error => {
                    icone.src = 'som-off.png'; 
                    btn.classList.remove('tocando');
                });
            }
        } else {
             icone.src = 'som-off.png';
        }       
        // Remove o brilho rosa
        document.getElementById('btn-musica').classList.remove('tocando'); 
    }
});
// ✨ TENTATIVA DE AUTOPLAY INTELIGENTE (Substitui o ajuste de volume antigo) ✨
window.addEventListener('load', () => {
    const musica = document.getElementById('musica-fundo');
    const icone = document.getElementById('icone-som-img');
    const btn = document.getElementById('btn-musica');

    if (musica) {
        musica.volume = 0.1; // Mantive o seu volume em 0.1 (10%) que você escolheu!

        // O navegador retorna uma "Promessa" ao tentar tocar o áudio
        let playPromise = musica.play();

        if (playPromise !== undefined) {
            playPromise.then(() => {
                // Sucesso! O navegador deixou tocar sozinho.
                icone.src = 'som-on.png'; // Usando a sua imagem de ligado
                btn.classList.add('tocando');
            }).catch(error => {
                // Bloqueado! O navegador barrou o som automático.
                console.log("O navegador bloqueou o áudio automático. Aguardando interação.");
                // Corrige o ícone para desligado, já que não está tocando
                icone.src = 'som-off.png'; // Usando a sua imagem de desligado
                btn.classList.remove('tocando');
            });
        }
    }
});

// ✨ ARRAY DE APRENDIZADOS MÁGICOS ✨
        // Você pode adicionar quantas frases quiser aqui dentro!
        const frasesDoDia = [
            "Lembre-se de sempre ser gentil! 🌸",
            "A amizade é a mágica mais poderosa! ✨",
            "Acredite em si mesma, mesmo quando for difícil. 🦄",
            "Um sorriso pode iluminar o dia mais nublado. ☀️",
            "Pequenos gestos de bondade criam grandes ondas. 🌊",
            "Nunca tenha medo de mostrar suas verdadeiras cores. 🌈",
            "Ajudar um amigo é o melhor tipo de aventura! 🗺️",
            "Até os menores pôneis podem fazer a maior diferença. 🦋",
            "A verdadeira magia está em aceitar as diferenças de cada um. 🌟",
            "Sua voz é única, não tenha medo de usá-la para o bem! 🎶",
            "Mesmo na noite mais escura, as estrelas continuam a brilhar. ✨",
            "Um coração generoso é o tesouro mais valioso de todos. 💎",
            "A lealdade fortalece os laços que o tempo não pode quebrar. 🤝",
            "Rir com os amigos é o melhor remédio para qualquer tristeza. 😂",
            "A honestidade constrói pontes de confiança que duram para sempre. 🌉",
            "Cada novo dia é uma página em branco para escrevermos nossa história. 📖",
            "O perdão é uma mágica que cura quem dá e quem recebe. 💖",
            "Estudar e aprender nos dá asas para voar cada vez mais alto! 📚",
            "Trabalhar em equipe torna o fardo mais leve e a diversão maior. 🍎",
            "Nunca subestime o poder de um abraço apertado num momento difícil. 🤗",
            "A paciência é a sementinha de onde brotam as mais belas flores. 🌱",
            "Celebrar a vitória de um amigo é como vencer duas vezes! 🎉",
            "Quando não souber o caminho, siga a bússola da bondade. 🧭",
            "A coragem não é não ter medo, mas sim agir apesar dele. 🛡️",
            "O talento de cada um forma o arco-íris perfeito quando estamos juntos. 🌈",
            "Sempre há tempo para parar e fazer a coisa certa. ⏳",
            "Os pequenos erros de hoje são as suas lições de mágica do amanhã. 🔮",
            "Compartilhar sua alegria faz ela se multiplicar por toda Equestria! 🎈",
            "Os melhores conselhos às vezes vêm de quem fala baixinho. 🦋",
            "Juntos, nós somos uma tempestade imparável de coisas boas! ⚡",
            "Um elogio sincero pode mudar completamente o dia de alguém. 💝",
            "Acredite nos seus sonhos, mesmo que pareçam estar nas nuvens! ☁️",
            "A criatividade é a mágica de transformar ideias em realidade. 🎨",
            "Ouvir com carinho é o abraço invisível que a alma precisa. 👂",
            "Ser diferente é o que torna o nosso mundo tão maravilhoso. 🌍",
            "A coragem cresce um pouquinho a cada vez que tentamos algo novo. 🌱",
            "O amor e o cuidado que damos sempre voltam para nós. 💖",
            "Até os obstáculos mais difíceis nos ensinam grandes lições. 🧗‍♀️",
            "A gratidão transforma o que temos em mais do que o suficiente. 🙏",
            "Um amigo de verdade conhece todas as suas falhas e te ama mesmo assim. 💕",
            "Pequenos passos todos os dias levam a grandes jornadas. 🛤️",
            "A luz que você espalha nunca diminui a sua própria luz. 🕯️",
            "Às vezes, a melhor solução é apenas dar boas risadas! 😆",
            "Ser gentil com os animais é uma forma pura de amor. 🐾",
            "O trabalho em equipe faz o sonho se realizar mais rápido. 🤝",
            "Mantenha a mente aberta: a magia acontece onde menos esperamos. 🪄",
            "Não tenha pressa de crescer, aproveite a doçura de cada momento. 🍭",
            "Sua felicidade é uma escolha que você pode fazer todos os dias. ☀️",
            "Palavras doces são como mel para a alma e colírio para os ouvidos. 🍯",
            "O medo é só um degrau na escada da sua coragem. 🪜",
            "Seja a luz no dia nublado de alguém. 🌥️",
            "A verdadeira força está na capacidade de perdoar a si mesmo. 💪",
            "Cada pôr do sol é a prova de que finais podem ser lindos. 🌅",
            "O respeito é a chave mágica que abre todas as portas. 🔑",
            "Acreditar em si mesma é o primeiro passo para voar. 🦋",
            "A amizade é como um jardim: precisa de cuidado e carinho para florescer. 🌻",
            "Seja corajosa o suficiente para ser quem você realmente é. 🛡️",
            "Um sorriso é a linguagem universal da gentileza. 😊",
            "As estrelas só brilham quando a noite está escura. ✨",
            "Você é capaz de fazer coisas incríveis, apenas tente! 🌟",
            "A harmonia começa quando aprendemos a ouvir com o coração. 🎵",
            "Cair faz parte da aventura; levantar é onde a verdadeira mágica acontece. 🎠",
            "Suas imperfeições são exatamente o que te torna especial e único. 💎",
            "Compartilhar um doce é bom, mas compartilhar momentos é inesquecível. 🧁",
            "A jornada é tão importante quanto o destino final. 🛤️",
            "Nunca é tarde demais para descobrir um novo talento escondido. 🎯",
            "Uma palavra de incentivo pode dar asas a quem perdeu a esperança. 🕊️",
            "A natureza tem seu próprio ritmo; respire fundo e aprecie a paisagem. 🌲",
            "Quando a tempestade passar, lembre-se de procurar o arco-íris. 🌦️",
            "Ser um bom líder significa saber a hora de escutar seus amigos. 👑",
            "A imaginação é o único limite para o que podemos construir juntos. 🏰",
            "Dizer 'eu não sei' é o primeiro e mais corajoso passo para aprender. 🧭",
            "As melhores memórias são feitas das pequenas aventuras do dia a dia. 🏕️",
            "Toda grande floresta começou com uma pequena e corajosa semente. 🌳",
            "Não compare o seu começo com a metade do caminho de outra pessoa. 📖",
            "Descansar também é uma forma de cuidar da sua própria magia. 💤",
            "A curiosidade abre portas que a gente nem sabia que existiam. 🚪",
            "Mostre gratidão por quem caminha ao seu lado nos momentos difíceis. 🐾",
            "O mundo fica mais colorido quando você compartilha seu brilho. 🖍️",
            "Ninguém precisa ser perfeito para ser um amigo maravilhoso. 🍎",
            "A empatia é o superpoder de entender o coração do outro. ❤️",
            "Cante a sua própria música, mesmo que os outros não saibam a letra. 🎤",
            "Promessas cumpridas são os tijolos que constroem a confiança. 🧱",
            "Olhe para as nuvens: sempre há algo novo para descobrir. ☁️",
            "A paciência transforma pequenos esforços em grandes conquistas. 🏆",
            "Deixe as tristezas voarem como balões e abrace a alegria do agora. 🎈",
            "Todo pônei tem uma faísca esperando o momento certo para reluzir. 🌟",
            "A sabedoria não vem de não errar, mas de aprender com cada tropeço. 🦉",
            "Um bom amigo é o melhor espelho que você pode ter. 🪞",
            "Você é muito mais forte e capaz do que imagina! 🦸‍♀️"
        ];

        // 🧠 FUNÇÃO QUE DESCOBRE A FRASE DO DIA
        function carregarAprendizado() {
            const dataHoje = new Date();
            
            // Um truque matemático para transformar a data de hoje num número contínuo
            const diasPassados = Math.floor(dataHoje.getTime() / (1000 * 60 * 60 * 24));
            
            // Esse símbolo "%" faz a lista "dar a volta" e recomeçar quando chegar no fim!
            const indiceEscolhido = diasPassados % frasesDoDia.length;
            
            // Pega a frase selecionada e injeta no HTML
            const espacoTexto = document.getElementById('texto-aprendizado');
            if (espacoTexto) {
                espacoTexto.innerText = frasesDoDia[indiceEscolhido];
            }
        }

        // 🚀 Faz a função rodar assim que a página abre!
        carregarAprendizado();

// Inicia o sistema
carregarEpisodios();