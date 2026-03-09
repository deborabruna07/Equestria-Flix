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
    document.getElementById('pagina-principal').classList.replace('tela-ativa', 'tela-oculta');
    document.getElementById('pagina-inicial').classList.replace('tela-oculta', 'tela-ativa');
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

    temporada.episodios.forEach(episodio => {
        const card = document.createElement('div');
        card.className = 'card-episodio';
        
        // Adiciona o clique no card inteiro de forma segura
        card.onclick = () => assistir(episodio.caminho_video, episodio.titulo);
        
        // Evita erros se o ID não tiver o formato esperado
        const numeroEp = episodio.id.includes('E') ? episodio.id.split('E')[1] : episodio.id;
        
        // Se a imagem não vier do banco, usa uma padrão provisória
        const imagemCapa = episodio.imagem ? episodio.imagem : 'capa-padrao.jpg';

        card.innerHTML = `
            <div class="thumb-container">
                <img src="${imagemCapa}" alt="Capa" class="capa-episodio">
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
}

// Verifica se voltamos do player querendo ver o catálogo direto
window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('view') === 'catalogo') {
        abrirPrincipal(); // Chama a função que você já tem para mostrar o catálogo
    }
});

// Inicia o sistema
carregarEpisodios();