const API_URL = 'http://localhost:3000/api/episodios';
let todasTemporadas = [];

// ==========================================
// 1. NAVEGAÇÃO ENTRE TELAS (O que estava faltando!)
// ==========================================

function abrirPrincipal() {
    console.log("✨ Botão clicado! Trocando para o catálogo...");
    
    const telaInicial = document.getElementById('pagina-inicial');
    const telaPrincipal = document.getElementById('pagina-principal');
    
    // Remove a classe visível e adiciona a oculta na página inicial
    telaInicial.classList.remove('tela-ativa');
    telaInicial.classList.add('tela-oculta');
    
    // Faz o oposto na página do catálogo
    telaPrincipal.classList.remove('tela-oculta');
    telaPrincipal.classList.add('tela-ativa');
}

function voltarInicial() {
    const telaInicial = document.getElementById('pagina-inicial');
    const telaPrincipal = document.getElementById('pagina-principal');
    
    telaPrincipal.classList.remove('tela-ativa');
    telaPrincipal.classList.add('tela-oculta');
    
    telaInicial.classList.remove('tela-oculta');
    telaInicial.classList.add('tela-ativa');
}

// ==========================================
// 2. CONTROLE DO MENU DIREITO (Perfil)
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
        todasTemporadas = dados.temporadas;
        
        gerarBotoesTemporada();
        
        // Se tiver temporadas, já carrega a primeira na tela
        if(todasTemporadas.length > 0) {
            renderizarGrade(todasTemporadas[0]);
        }
    } catch (erro) {
        console.error('Erro ao buscar episódios. O servidor Node.js está rodando?', erro);
    }
}

function gerarBotoesTemporada() {
    const seletor = document.getElementById('season-selector');
    seletor.innerHTML = '';

    todasTemporadas.forEach((temporada, index) => {
        const btn = document.createElement('button');
        btn.className = `btn-season ${index === 0 ? 'active' : ''}`;
        btn.textContent = `Season ${temporada.numero}`;
        
        btn.onclick = () => {
            // Tira o 'active' de todos e põe no botão clicado
            document.querySelectorAll('.btn-season').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Renderiza a grade correspondente
            renderizarGrade(temporada);
        };
        
        seletor.appendChild(btn);
    });
}

function renderizarGrade(temporada) {
    document.getElementById('titulo-temporada-atual').textContent = `Temporada ${temporada.numero}`;
    const grade = document.getElementById('episode-grid');
    grade.innerHTML = '';

    if (!temporada.episodios) return;

    temporada.episodios.forEach(episodio => {
        const card = document.createElement('div');
        card.className = 'card-episodio';
        
        card.innerHTML = `
            <h4>Ep. ${episodio.id.split('E')[1]} - ${episodio.titulo}</h4>
            <p>${episodio.descricao}</p>
            <button class="btn-assistir" onclick="assistir('${episodio.caminho_video}', '${episodio.titulo.replace(/'/g, "\\'")}')">
                ▶ Assistir
            </button>
        `;
        grade.appendChild(card);
    });
}

// ==========================================
// 4. ABRIR O VÍDEO NO PLAYER
// ==========================================

function assistir(caminhoVideo, tituloEpisodio) {
    const url = `player.html?caminho=${encodeURIComponent(caminhoVideo)}&titulo=${encodeURIComponent(tituloEpisodio)}`;
    window.location.href = url;
}

// Inicia a busca dos dados silenciosamente assim que a página abre
carregarEpisodios();