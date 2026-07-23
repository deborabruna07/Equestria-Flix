// musica.js - Controle Global de Áudio do PonyVerse

function toggleMusica() {
    const musica = document.getElementById('musica-fundo');
    const icone = document.getElementById('icone-som-img');
    const btn = document.getElementById('btn-musica');

    if (musica.paused) {
        musica.play();
        icone.src = 'som-on.png'; 
        btn.classList.add('tocando');
        localStorage.setItem('musica_tocando', 'true');
    } else {
        musica.pause();
        icone.src = 'som-off.png'; 
        btn.classList.remove('tocando');
        localStorage.setItem('musica_tocando', 'false');
    }
}

window.addEventListener('load', () => {
    const musica = document.getElementById('musica-fundo');
    const icone = document.getElementById('icone-som-img');
    const btn = document.getElementById('btn-musica');

    if (musica) {
        musica.volume = 0.1;
        
        // Puxa a memória. Se for a primeira vez no site, assume 'true' para forçar a tocar.
        const tocando = localStorage.getItem('musica_tocando') !== 'false';
        
        const navegacao = performance.getEntriesByType("navigation")[0];
        const ehF5 = navegacao ? (navegacao.type === "reload") : false;

        let tempoSalvo = 0;
        
        if (!ehF5 && sessionStorage.getItem('musica_tempo')) {
            tempoSalvo = parseFloat(sessionStorage.getItem('musica_tempo'));
        }

        musica.currentTime = tempoSalvo;

        setInterval(() => {
            if(!musica.paused) {
                sessionStorage.setItem('musica_tempo', musica.currentTime);
            }
        }, 500);

        if (tocando) {
            // Tenta forçar o play imediatamente e de forma direta
            let playPromise = musica.play();
            
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    icone.src = 'som-on.png'; 
                    btn.classList.add('tocando');
                }).catch(() => {
                    // O navegador barrou a aba nova. Apenas desliga o ícone sem exibir mensagens.
                    icone.src = 'som-off.png'; 
                    btn.classList.remove('tocando');
                });
            }
        } else {
            icone.src = 'som-off.png';
            btn.classList.remove('tocando'); 
        }
    }
});