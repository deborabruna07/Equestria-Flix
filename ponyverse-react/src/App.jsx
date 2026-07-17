import React, { useState, useEffect } from 'react';
import './index.css';
import { db, auth, provider } from './firebase'; 
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

function App() {
  const [novoPostTexto, setNovoPostTexto] = useState('');
  const [posts, setPosts] = useState([]); 
  const [usuario, setUsuario] = useState(null);
  
  // Estados de Login/Cadastro
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [isCadastro, setIsCadastro] = useState(false);

  // ✨ NOVO: Estado para controlar em qual tela estamos!
  const [abaAtual, setAbaAtual] = useState('inicio'); // Pode ser 'inicio', 'explorar' ou 'perfil'

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const cancelarInscricao = onSnapshot(q, (snapshot) => {
      const postsMapeados = [];
      snapshot.forEach((doc) => {
        postsMapeados.push({ id: doc.id, ...doc.data() });
      });
      setPosts(postsMapeados);
    });
    return () => cancelarInscricao();
  }, []);

  // Funções de Login (Mantidas)
  const fazerLoginGoogle = async () => {
    try {
      const res = await signInWithPopup(auth, provider);
      setUsuario(res.user);
    } catch (erro) { console.error("Erro no login:", erro); }
  };

  const fazerLoginEmail = async () => {
    if (!email || !senha) return alert("Preencha e-mail e senha!");
    try {
      const res = await signInWithEmailAndPassword(auth, email, senha);
      setUsuario(res.user);
    } catch (erro) { alert("Erro ao entrar. Verifique os dados."); }
  };

  const criarConta = async () => {
    if (!email || !senha || !nome) return alert("Preencha todos os campos!");
    try {
      const res = await createUserWithEmailAndPassword(auth, email, senha);
      await updateProfile(res.user, {
        displayName: nome,
        photoURL: `https://ui-avatars.com/api/?name=${nome.replace(' ', '+')}&background=d500f9&color=fff`
      });
      setUsuario({ ...res.user, displayName: nome, photoURL: `https://ui-avatars.com/api/?name=${nome.replace(' ', '+')}&background=d500f9&color=fff` });
    } catch (erro) {
      alert("Erro: " + erro.message);
    }
  };

  // Funções de Postagem
  const relinchar = async () => {
    if (novoPostTexto.trim() === '' || !usuario) return;
    const nomeExibicao = usuario.displayName || usuario.email.split('@')[0];
    const fotoExibicao = usuario.photoURL || `https://ui-avatars.com/api/?name=${nomeExibicao}&background=d500f9&color=fff`;

    try {
      await addDoc(collection(db, 'posts'), {
        autor: nomeExibicao, 
        foto: fotoExibicao,     
        uid: usuario.uid, // ✨ NOVO: Salvamos o ID de quem postou para ele poder apagar depois!
        handle: `@${usuario.email.split('@')[0]}`, 
        texto: novoPostTexto,
        curtidas: [], // ✨ NOVO: Agora é uma lista de quem curtiu!
        comentarios: 0,
        createdAt: serverTimestamp() 
      });
      setNovoPostTexto(''); 
      setAbaAtual('inicio'); // Força ir pro feed ao postar
    } catch (erro) { console.error("Erro ao postar:", erro); }
  };

  // ✨ NOVO: Função de Curtir Real
  const curtirPost = async (postId, listaCurtidasAtual) => {
    if (!usuario) return;
    const postRef = doc(db, 'posts', postId);
    
    // Se o usuário já curtiu, nós tiramos o like dele. Se não, adicionamos!
    let novaLista = [...(listaCurtidasAtual || [])];
    if (novaLista.includes(usuario.uid)) {
      novaLista = novaLista.filter(id => id !== usuario.uid); // Descurtir
    } else {
      novaLista.push(usuario.uid); // Curtir
    }

    await updateDoc(postRef, { curtidas: novaLista });
  };

  // ✨ NOVO: Função de Apagar o próprio post
  const deletarPost = async (postId) => {
    if(window.confirm("Tem certeza que quer apagar esse relincho?")) {
      await deleteDoc(doc(db, 'posts', postId));
    }
  };

  // ==========================================
  // TELA DESLOGADA (Login/Cadastro)
  // ==========================================
  if (!usuario) {
    // ... [O código do Login continua igual ao de antes, omiti para não poluir, 
    // mas mantenha o seu código de "if(!usuario) { return (...) }" exatamente como estava!]
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
        <h1 style={{ color: '#ff80ff', fontSize: '3rem', margin: '0 0 10px 0' }}><i className="fa-solid fa-horse-head"></i> PonyVerse</h1>
        {isCadastro ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%', maxWidth: '300px', marginBottom: '25px', alignItems: 'center' }}>
            <p style={{ fontSize: '1.2rem', marginBottom: '15px' }}>Crie seu perfil mágico!</p>
            <input type="text" placeholder="Como você quer ser chamado?" value={nome} onChange={(e) => setNome(e.target.value)} style={{ width: '100%', padding: '15px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none' }} />
            <input type="email" placeholder="Seu melhor E-mail" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '15px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none' }} />
            <input type="password" placeholder="Crie uma Senha forte" value={senha} onChange={(e) => setSenha(e.target.value)} style={{ width: '100%', padding: '15px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none' }} />
            <button onClick={criarConta} className="btn-postar-grande" style={{ width: '100%', marginTop: '5px' }}>Criar Conta</button>
            <button onClick={() => setIsCadastro(false)} style={{ background: 'transparent', border: 'none', color: '#ff80ff', cursor: 'pointer', fontWeight: 'bold', marginTop: '5px' }}>Voltar para o Login</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%', maxWidth: '300px', marginBottom: '25px', alignItems: 'center' }}>
            <p style={{ fontSize: '1.2rem', marginBottom: '15px' }}>Bem-vindo de volta a Equestria!</p>
            <input type="email" placeholder="Seu E-mail" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '15px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none' }} />
            <input type="password" placeholder="Sua Senha" value={senha} onChange={(e) => setSenha(e.target.value)} style={{ width: '100%', padding: '15px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none' }} />
            <button onClick={fazerLoginEmail} className="btn-postar-grande" style={{ width: '100%', marginTop: '5px' }}>Entrar</button>
            <button onClick={() => setIsCadastro(true)} style={{ background: 'transparent', border: 'none', color: '#ff80ff', cursor: 'pointer', fontWeight: 'bold', marginTop: '5px' }}>Não tem conta? Crie uma aqui!</button>
          </div>
        )}
        <button onClick={fazerLoginGoogle} className="btn-postar-pequeno" style={{ padding: '12px 25px', fontSize: '1.1rem', background: '#ffffff', color: '#000' }}><i className="fa-brands fa-google"></i> Entrar com o Google</button>
      </div>
    );
  }

  // ==========================================
  // TELA LOGADA (Comunidade)
  // ==========================================
  const nomeMeuPerfil = usuario.displayName || usuario.email.split('@')[0];
  const fotoMeuPerfil = usuario.photoURL || `https://ui-avatars.com/api/?name=${nomeMeuPerfil}&background=d500f9&color=fff`;

  // ✨ NOVO: Filtra os posts caso estejamos na aba "Meu Perfil"
  const postsExibidos = abaAtual === 'perfil' 
    ? posts.filter(post => post.uid === usuario.uid) 
    : posts;

  return (
    <div className="app-container">
      
      {/* MENU LATERAL */}
      <nav className="sidebar">
        <div className="logo"><i className="fa-solid fa-horse-head"></i> PonyVerse</div>
        
        {/* ✨ NOVO: Botões agora alteram a abaAtual */}
        <a href="#" className={`nav-link ${abaAtual === 'inicio' ? 'active' : ''}`} onClick={() => setAbaAtual('inicio')}>
          <i className="fa-solid fa-house"></i> Início
        </a>
        <a href="#" className={`nav-link ${abaAtual === 'explorar' ? 'active' : ''}`} onClick={() => setAbaAtual('explorar')}>
          <i className="fa-solid fa-hashtag"></i> Explorar
        </a>
        <a href="#" className={`nav-link ${abaAtual === 'perfil' ? 'active' : ''}`} onClick={() => setAbaAtual('perfil')}>
          <i className="fa-solid fa-user"></i> Meu Perfil
        </a>
        
        <button className="btn-postar-grande" onClick={() => { setAbaAtual('inicio'); setTimeout(() => document.getElementById('caixa-post')?.focus(), 100); }}>Relinchar</button>
        
        <div className="minha-conta-mini" onClick={() => { auth.signOut(); setUsuario(null); setEmail(''); setSenha(''); }}>
          <img src={fotoMeuPerfil} alt="Avatar" className="avatar" />
          <div className="conta-info">
            <strong>{nomeMeuPerfil}</strong>
            <span style={{fontSize: '0.8rem', color: '#ff3366'}}>Sair</span>
          </div>
        </div>
      </nav>

      {/* ÁREA CENTRAL MUDANDO CONFORME A ABA */}
      <main className="feed">
        <header className="feed-header">
          <h2>
            {abaAtual === 'inicio' && "Página Inicial"}
            {abaAtual === 'explorar' && "Explorar Equestria"}
            {abaAtual === 'perfil' && "Meu Perfil"}
          </h2>
        </header>

        {/* Mostra a caixa de postar apenas no Início ou no Perfil */}
        {abaAtual !== 'explorar' && (
          <>
            <div className="compose-post">
              <img src={fotoMeuPerfil} alt="Avatar" className="avatar" />
              <div className="compose-form">
                <textarea id="caixa-post" value={novoPostTexto} onChange={(e) => setNovoPostTexto(e.target.value)} placeholder="O que está acontecendo em Equestria?" />
                <div className="compose-actions">
                  <div className="action-icons">
                    <i className="fa-solid fa-image" onClick={() => alert('Envio de imagens em breve!')}></i>
                    <i className="fa-solid fa-face-smile"></i>
                  </div>
                  <button onClick={relinchar} className="btn-postar-pequeno">Relinchar</button>
                </div>
              </div>
            </div>
            <div className="divider"></div>
          </>
        )}

        <div id="lista-de-posts">
          {postsExibidos.length === 0 ? (
            <p style={{ textAlign: 'center', marginTop: '30px', color: '#8899a6' }}>
              Nenhum relincho por aqui ainda... 🐴✨
            </p>
          ) : (
            postsExibidos.map((post) => {
              // Verifica se o usuário atual curtiu esse post
              const euCurti = post.curtidas?.includes(usuario.uid);
              const totalCurtidas = post.curtidas?.length || 0;

              return (
                <div className="post" key={post.id}>
                  <div className="post-avatar">
                    <img src={post.foto || `https://ui-avatars.com/api/?name=${post.autor?.replace(' ', '+')}&background=9c27b0&color=fff`} alt="Avatar" className="avatar" />
                  </div>
                  <div className="post-content" style={{ width: '100%' }}>
                    
                    <div className="post-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <strong>{post.autor}</strong> <span className="user-handle">{post.handle}</span>
                      </div>
                      {/* ✨ NOVO: Lixeira! Só aparece se o post for seu! */}
                      {post.uid === usuario.uid && (
                        <i className="fa-solid fa-trash" style={{ color: '#ff3366', cursor: 'pointer', opacity: 0.6 }} onClick={() => deletarPost(post.id)}></i>
                      )}
                    </div>

                    <p className="post-text">{post.texto}</p>
                    
                    <div className="post-interactions">
                      {/* ✨ NOVO: Botão de Curtir interativo! */}
                      <span onClick={() => curtirPost(post.id, post.curtidas)} style={{ color: euCurti ? '#ff3366' : '#8899a6', fontWeight: euCurti ? 'bold' : 'normal' }}>
                        <i className={euCurti ? "fa-solid fa-heart" : "fa-regular fa-heart"}></i> {totalCurtidas}
                      </span>
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* BARRA DIREITA */}
      <aside className="right-sidebar">
        <div className="search-bar">
          <input type="text" placeholder="Buscar..." style={{background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none'}}/>
        </div>
        <div className="trending-box">
          <h3>Em alta</h3>
          <div className="trend-item">
            <span className="trend-category">Assunto do Momento</span>
            <strong>#MagiaEmAção</strong>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default App;