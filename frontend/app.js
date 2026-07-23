const API_URL = 'http://localhost:3000/api/episodios';
let todasTemporadas = [];

// ==========================================
// 1. NAVEGAÇÃO ENTRE TELAS (Com Suporte a #principal)
// ==========================================
function abrirPrincipal() {
    const inicial = document.getElementById('pagina-inicial');
    const principal = document.getElementById('pagina-principal');
    const catalogo = document.getElementById('conteudo-catalogo');
    const secaoFav = document.getElementById('secao-favoritos');

    if (inicial) {
        inicial.classList.remove('tela-ativa');
        inicial.classList.add('tela-oculta');
    }
    if (principal) {
        principal.classList.remove('tela-oculta');
        principal.classList.add('tela-ativa');
    }
    if (catalogo) {
        catalogo.style.display = 'block';
    }
    if (secaoFav) {
        secaoFav.style.display = 'none';
        secaoFav.classList.add('tela-oculta');
    }

    const barraOriginal = document.querySelector('#pagina-principal .top-bar');
    if (barraOriginal) barraOriginal.style.display = 'flex';

    if (window.location.hash !== '#principal') {
        window.history.replaceState({}, document.title, window.location.pathname + '#principal');
    }
}

function voltarInicial() {
    const inicial = document.getElementById('pagina-inicial');
    const principal = document.getElementById('pagina-principal');

    if (principal) {
        principal.classList.remove('tela-ativa');
        principal.classList.add('tela-oculta');
    }
    if (inicial) {
        inicial.classList.remove('tela-oculta');
        inicial.classList.add('tela-ativa');
    }
    
    fecharPainelDireito();

    window.history.replaceState({}, document.title, window.location.pathname);
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
        
        todasTemporadas = dados.temporadas || [];
        configurarEpisodioDoDia();
        gerarBotoesTemporada();
        
        if(todasTemporadas.length > 0) {
            renderizarGrade(todasTemporadas[0]);
        }
    } catch (erro) {
        console.warn('Servidor local offline. Tentando carregar do arquivo episodios.json local...', erro);
        
        try {
            const respostaLocal = await fetch('episodios.json');
            const dadosLocais = await respostaLocal.json();
            
            todasTemporadas = dadosLocais.temporadas || [];
            configurarEpisodioDoDia();
            gerarBotoesTemporada();
            
            if(todasTemporadas.length > 0) {
                renderizarGrade(todasTemporadas[0]);
            }
        } catch (erroLocal) {
            console.error('Falha crítica: Nem o servidor nem o arquivo local foram encontrados.', erroLocal);
            const grid = document.getElementById('episode-grid');
            if (grid) grid.innerHTML = "<p style='color: white;'>Os pôneis estão descansando. Volte mais tarde!</p>";
        }
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
    const tituloTemp = document.getElementById('titulo-temporada-atual');
    if (tituloTemp) tituloTemp.textContent = `Temporada ${temporada.numero}`;

    const grade = document.getElementById('episode-grid');
    if (!grade) return;
    grade.innerHTML = '';

    if (!temporada.episodios) return;

    const assistidosSalvos = JSON.parse(localStorage.getItem('ponies_assistidos')) || [];

    temporada.episodios.forEach(episodio => {
        const card = document.createElement('div');
        card.className = 'card-episodio';
        card.onclick = () => assistir(episodio.caminho_video, episodio.titulo);
        
        const numeroEp = episodio.id.includes('E') ? episodio.id.split('E')[1] : episodio.id;
        const imagemCapa = episodio.imagem ? episodio.imagem : 'capa-padrao.jpg';

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

// Verifica rotas ao carregar
window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('view') === 'catalogo' || window.location.hash === '#principal') {
        abrirPrincipal();
    }

    const videoPath = urlParams.get('caminho');
    const videoTag = document.querySelector('video');
    const sourceTag = document.querySelector('video source');

    if (videoPath && videoTag) {
        if (sourceTag) sourceTag.src = videoPath;
        videoTag.src = videoPath;
        videoTag.load();
    }
});

let timerCarrossel; 

function iniciarTimer() {
    timerCarrossel = setInterval(() => {
        mudarBanner(1, false); 
    }, 4000);
}

function mudarBanner(direcao, foiCliqueManual = true) {
    if (foiCliqueManual) {
        clearInterval(timerCarrossel);
        iniciarTimer();
    }

    const track = document.getElementById('track');
    if (!track) return;
    track.style.transition = 'transform 0.5s ease-in-out';

    if (direcao === 1) {
        track.style.transform = `translateX(-100%)`; 
        setTimeout(() => {
            track.style.transition = 'none'; 
            if (track.firstElementChild) track.appendChild(track.firstElementChild); 
            track.style.transform = `translateX(0)`; 
        }, 500); 

    } else if (direcao === -1) {
        if (track.lastElementChild) track.prepend(track.lastElementChild);
        track.style.transition = 'none';
        track.style.transform = `translateX(-100%)`;
        
        setTimeout(() => {
            track.style.transition = 'transform 0.5s ease-in-out';
            track.style.transform = `translateX(0)`;
        }, 10); 
    }
}

iniciarTimer();

// ==========================================
// 5. SISTEMA DO EPISÓDIO DO DIA
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
        if (titulo) titulo.innerText = episodioEscolhido.titulo;
        
        const numeroEp = episodioEscolhido.id.includes('E') ? episodioEscolhido.id.split('E')[1] : episodioEscolhido.id;
        if (descricao) descricao.innerText = `Episódio ${numeroEp} • Clique para assistir!`;

        banner.onclick = () => assistir(episodioEscolhido.caminho_video, episodioEscolhido.titulo);
    }
}

// ==========================================
// 6. SISTEMA DE FAVORITOS
// ==========================================
let origemFavoritos = ''; 

async function abrirFavoritos(origem) {
    origemFavoritos = origem || 'catalogo'; 

    const barraOriginal = document.querySelector('#pagina-principal > .top-bar');
    if(barraOriginal) barraOriginal.style.display = 'none';

    fecharPainelDireito();
    
    const inicial = document.getElementById('pagina-inicial');
    if (inicial) {
        inicial.classList.remove('tela-ativa');
        inicial.classList.add('tela-oculta');
    }

    const catalogo = document.getElementById('conteudo-catalogo');
    if (catalogo) catalogo.style.display = 'none';
    
    const principal = document.getElementById('pagina-principal');
    if (principal) {
        principal.classList.remove('tela-oculta');
        principal.classList.add('tela-ativa');
    }

    const secaoFav = document.getElementById('secao-favoritos');
    if (secaoFav) {
        secaoFav.classList.remove('tela-oculta');
        secaoFav.style.display = 'block';
    }

    const favoritosSalvos = JSON.parse(localStorage.getItem('ponies_favoritos')) || [];
    const grid = document.getElementById('grid-favoritos');
    if (!grid) return;
    grid.innerHTML = ""; 

    if (favoritosSalvos.length === 0) {
        grid.innerHTML = "<div style='grid-column: 1/-1; text-align: center; padding: 4rem;'><h3 style='color: white; font-size: 1.5rem;'>Sua lista está vazia. Adicione episódios com o coração! 💔</h3></div>";
        return;
    }
    try {
        let dados = { temporadas: todasTemporadas };
        if (!todasTemporadas || todasTemporadas.length === 0) {
            const resposta = await fetch(API_URL);
            dados = await resposta.json();
        }
        const assistidosSalvos = JSON.parse(localStorage.getItem('ponies_assistidos')) || [];
        
        dados.temporadas.forEach(temporada => {
            temporada.episodios.forEach(ep => {
                if (favoritosSalvos.includes(ep.titulo)) {
                    const card = document.createElement('div');
                    card.className = 'card-episodio';
                    card.onclick = () => window.location.href = `player.html?caminho=${encodeURIComponent(ep.caminho_video)}&titulo=${encodeURIComponent(ep.titulo)}`;
                    
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
        grid.innerHTML = "<p style='color: white; text-align: center; grid-column: 1/-1;'>Erro ao carregar os favoritos.</p>";
    }
}

function fecharFavoritos() {
    const secaoFav = document.getElementById('secao-favoritos');
    if (secaoFav) {
        secaoFav.classList.add('tela-oculta');
        secaoFav.style.display = 'none';
    }

    const barraOriginal = document.querySelector('#pagina-principal .top-bar');
    if(barraOriginal) barraOriginal.style.display = 'flex';

    if (origemFavoritos === 'inicial') {
        voltarInicial(); 
    } else {
        const catalogo = document.getElementById('conteudo-catalogo');
        if (catalogo) catalogo.style.display = 'block';
    }
}

function voltarAoCatalogo() {
    fecharFavoritos();
}

// ==========================================
// 7. APRENDIZADOS MÁGICOS
// ==========================================
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

function carregarAprendizado() {
    const dataHoje = new Date();
    const diasPassados = Math.floor(dataHoje.getTime() / (1000 * 60 * 60 * 24));
    const indiceEscolhido = diasPassados % frasesDoDia.length;
    
    const espacoTexto = document.getElementById('texto-aprendizado');
    if (espacoTexto) {
        espacoTexto.innerText = frasesDoDia[indiceEscolhido];
    }
}

carregarAprendizado();
carregarEpisodios();