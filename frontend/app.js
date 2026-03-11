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
    if (urlParams.get('view') === 'catalogo') {
        abrirPrincipal();
    }
});

let indexAtual = 0;

function mudarBanner(direcao) {
    const track = document.getElementById('track');
    const banners = document.querySelectorAll('.hero-banner');
    const totalBanners = banners.length;

    indexAtual += direcao;

    if (indexAtual >= totalBanners) indexAtual = 0;
    if (indexAtual < 0) indexAtual = totalBanners - 1;

    // Move exatamente o equivalente a 1 banner (100%)
    const deslocamento = indexAtual * -100;
    track.style.transform = `translateX(${deslocamento}%)`;
}

// Opcional: Auto-play a cada 6 segundos
setInterval(() => mudarBanner(1), 6000);

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

// ✨ FUNÇÃO PARA CONTROLAR A MÚSICA (Trocando a Imagem) ✨
function toggleMusica() {
    const musica = document.getElementById('musica-fundo');
    const icone = document.getElementById('icone-som-img'); // Pegamos a tag da imagem

    if (musica.paused) {
        musica.play();
        // ✨ Coloque aqui o nome da sua imagem de SOM LIGADO ✨
        icone.src = 'som-on.png'; 
        
        // (Opcional) Adiciona a classe para dar o brilho rosa que fizemos no CSS
        document.getElementById('btn-musica').classList.add('tocando'); 
    } else {
        musica.pause();
        // ✨ Coloque aqui o nome da sua imagem de SOM DESLIGADO ✨
        icone.src = 'som-off.png'; 
        
        // Remove o brilho rosa
        document.getElementById('btn-musica').classList.remove('tocando'); 
    }
}
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

// Inicia o sistema
carregarEpisodios();