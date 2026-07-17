// ==========================================
// 🚀 INICIALIZAÇÃO DO FIREBASE (O CÉREBRO)
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyBye6-vDBDQC09qU5gDyjlW_kzvY71Ts5I",
    authDomain: "ponyverse-database-529ff.firebaseapp.com",
    projectId: "ponyverse-database-529ff",
    storageBucket: "ponyverse-database-529ff.firebasestorage.app",
    messagingSenderId: "744701284561",
    appId: "1:744701284561:web:2ffc66e7ca56ade12ab5f0"
};

// Inicializa o app e o banco de dados
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ==========================================
// 🐦 MOTOR DA COMUNIDADE (PONYFEED INTERFACE)
// ==========================================

function mostrarNotificacao(mensagem, icone = 'fa-wand-magic-sparkles') {
    const toast = document.createElement('div');
    toast.className = 'toast-magico';
    toast.innerHTML = `<i class="fa-solid ${icone}"></i> ${mensagem}`;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('sumir');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function avisarEmBreve(recurso) {
    mostrarNotificacao(`A magia de <b>${recurso}</b> está sendo preparada! ✨`);
}

function compartilharPost() {
    mostrarNotificacao("Relinchado com sucesso para o seu perfil! 🔄", "fa-retweet");
}

// ==========================================
// 📸 LÓGICA DE ANEXAR IMAGEM
// ==========================================
let imagemTemporaria = "";

function previewImagem(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader(); 
        reader.onload = function(e) {
            imagemTemporaria = e.target.result; 
            document.getElementById('img-preview').src = imagemTemporaria;
            document.getElementById('preview-container').style.display = 'block';
        }
        reader.readAsDataURL(file);
    }
}

function removerPreview() {
    imagemTemporaria = "";
    document.getElementById('input-imagem').value = "";
    document.getElementById('preview-container').style.display = 'none';
}

// ==========================================
// ☁️ FIREBASE: ENVIANDO DADOS PARA A NUVEM
// ==========================================
function enviarPost() {
    const inputArea = document.getElementById('texto-post');
    const texto = inputArea.value;

    if (texto.trim() === '' && imagemTemporaria === '') {
        mostrarNotificacao("Escreva algo mágico ou anexe uma imagem!", "fa-triangle-exclamation");
        return; 
    }

    mostrarNotificacao("Enviando relincho para a nuvem...", "fa-cloud-arrow-up");

    // Salva no Banco de Dados!
    db.collection("relinchos").add({
        autor: "Meu Pônei",
        handle: "@meuponei",
        texto: texto,
        imagem: imagemTemporaria, // Salva a imagem (base64)
        likes: 0,
        data: firebase.firestore.FieldValue.serverTimestamp() // Pega a hora exata da internet
    })
    .then(() => {
        // Limpa a tela depois de salvar com sucesso
        inputArea.value = '';
        removerPreview();
        mostrarNotificacao("Seu relincho foi enviado para toda Equestria!", "fa-paper-plane");
    })
    .catch((error) => {
        console.error("Erro ao enviar:", error);
        mostrarNotificacao("Erro ao enviar a magia. Tente novamente.", "fa-triangle-exclamation");
    });
}

// ==========================================
// ☁️ FIREBASE: LENDO DADOS AO VIVO
// ==========================================
// Esta função fica "ouvindo" o banco de dados o tempo todo. 
// Se alguém postar, a tela de todo mundo atualiza sozinha!
db.collection("relinchos").orderBy("data", "desc").onSnapshot((snapshot) => {
    const feed = document.getElementById('lista-de-posts');
    feed.innerHTML = ''; // Limpa o feed para não duplicar

    snapshot.forEach((doc) => {
        const post = doc.data();
        const postId = doc.id; // ID único do post no banco
        
        let imagemHTML = "";
        if (post.imagem && post.imagem !== "") {
            imagemHTML = `<img src="${post.imagem}" style="max-width: 100%; border-radius: 15px; margin-top: 15px; border: 1px solid rgba(255,255,255,0.1);">`;
        }

        const novoPostHTML = `
            <div class="post" id="${postId}">
                <div class="post-avatar">
                    <img src="https://ui-avatars.com/api/?name=${post.autor}&background=d500f9&color=fff" alt="Avatar" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover;">
                </div>
                <div class="post-content">
                    <div class="post-header">
                        <strong>${post.autor}</strong> 
                        <span class="user-handle">${post.handle}</span>
                    </div>
                    <p class="post-text">${post.texto}</p>
                    ${imagemHTML} 
                    <div class="post-interactions">
                        <span onclick="toggleComentarios(this)"><i class="fa-regular fa-comment"></i> <b class="contador-comentarios">0</b></span>
                        <span onclick="compartilharPost()"><i class="fa-solid fa-retweet"></i> 0</span>
                        <span onclick="curtirPost('${postId}', ${post.likes})"><i class="fa-regular fa-heart"></i> <b class="contador-likes">${post.likes || 0}</b></span>
                    </div>

                    <div class="sessao-comentarios" style="display: none; margin-top: 15px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px;">
                        <div class="comentarios-lista"></div>
                        <div class="add-comentario">
                            <img src="fundo.png" class="avatar-pequeno">
                            <input type="text" placeholder="Responda a este relincho..." class="input-comentario">
                            <button onclick="avisarEmBreve('Comentários na Nuvem')" class="btn-enviar-comentario"><i class="fa-solid fa-paper-plane"></i></button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        feed.insertAdjacentHTML('beforeend', novoPostHTML);
    });
});

// ==========================================
// 3. SISTEMA DE COMENTÁRIOS E CURTIDAS (INTERFACE)
// ==========================================
function toggleComentarios(botao) {
    const post = botao.closest('.post'); 
    const sessao = post.querySelector('.sessao-comentarios');
    if (sessao.style.display === 'none' || sessao.style.display === '') {
        sessao.style.display = 'block';
    } else {
        sessao.style.display = 'none';
    }
}

function curtirPost(postId, likesAtuais) {
    // Atualiza o número de likes direto no Banco de Dados!
    db.collection("relinchos").doc(postId).update({
        likes: (likesAtuais || 0) + 1
    });
}