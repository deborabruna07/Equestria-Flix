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

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ==========================================
// 🐦 FUNÇÕES DA INTERFACE
// ==========================================
function mostrarNotificacao(mensagem, icone = 'fa-wand-magic-sparkles') {
    const toast = document.createElement('div');
    // Adicionando o estilo mágico direto no JS para garantir que funcione
    toast.style.cssText = "position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:linear-gradient(135deg, #ff007f, #9b59b6); color:white; padding:12px 25px; border-radius:30px; font-weight:bold; box-shadow:0 10px 25px rgba(255,0,127,0.5); z-index:9999; display:flex; align-items:center; gap:10px;";
    toast.innerHTML = `<i class="fa-solid ${icone}"></i> ${mensagem}`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transition = "opacity 0.3s";
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function avisarEmBreve(recurso) {
    mostrarNotificacao(`A magia de <b>${recurso}</b> está sendo preparada! ✨`);
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

    db.collection("relinchos").add({
        autor: "Meu Pônei",
        handle: "@meuponei",
        texto: texto,
        imagem: imagemTemporaria, 
        likes: 0,
        data: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
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
// ☁️ FIREBASE: LENDO DADOS AO VIVO (COM DESIGN NOVO)
// ==========================================
db.collection("relinchos").orderBy("data", "desc").onSnapshot((snapshot) => {
    const feed = document.getElementById('lista-de-posts');
    feed.innerHTML = ''; 

    snapshot.forEach((doc) => {
        const post = doc.data();
        const postId = doc.id; 
        
        let imagemHTML = "";
        if (post.imagem && post.imagem !== "") {
            imagemHTML = `<img src="${post.imagem}" style="max-width: 100%; border-radius: 15px; margin-bottom: 15px; border: 1px solid rgba(255,255,255,0.1);">`;
        }

        // ✨ O HTML NOVO INJETADO AQUI! ✨
        const novoPostHTML = `
            <div class="glass-panel post-premium" id="${postId}">
                <img src="https://ui-avatars.com/api/?name=${post.autor.replace(' ', '+')}&background=c756a7&color=fff" class="avatar-comunidade" alt="Avatar">
                
                <div class="post-conteudo">
                    <div class="post-topo">
                        <div>
                            <strong class="post-autor">
                                ${post.autor} 
                                <i class="fa-solid fa-star" style="color: #c756a7; font-size: 0.9rem;"></i>
                            </strong>
                            <span class="post-tempo">${post.handle}</span>
                        </div>
                        <i class="fa-solid fa-ellipsis" style="color: #a491b8; cursor: pointer;" onclick="avisarEmBreve('Opções do Post')"></i>
                    </div>
                    
                    <p class="post-texto">${post.texto}</p>
                    
                    ${imagemHTML}
                    
                    <div class="post-botoes">
                        <button class="btn-interacao" onclick="curtirPost('${postId}', ${post.likes || 0})">
                            <i class="fa-solid fa-heart"></i> ${post.likes || 0}
                        </button>
                        <button class="btn-interacao" onclick="avisarEmBreve('Comentários')">
                            <i class="fa-solid fa-comment"></i> 0
                        </button>
                    </div>
                </div>
            </div>
        `;
        feed.insertAdjacentHTML('beforeend', novoPostHTML);
    });
});

// ==========================================
// 3. SISTEMA DE CURTIDAS
// ==========================================
function curtirPost(postId, likesAtuais) {
    db.collection("relinchos").doc(postId).update({
        likes: (likesAtuais || 0) + 1
    });
}
