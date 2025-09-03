let imagens = [];
let indexAtual = 0;

window.onload = function () {
  const btnTopo = document.getElementById("btnTopo");
  const modal = document.getElementById("modal");
  const modalImg = document.getElementById("imagemModal");
  const descricao = document.getElementById("descricaoModal");
  const fechar = document.getElementById("fecharModal");
  const anterior = document.getElementById("anterior");
  const seguinte = document.getElementById("seguinte");

  imagens = Array.from(document.querySelectorAll('.imagem img'));

  imagens.forEach((img, index) => {
    img.addEventListener('click', () => {
      indexAtual = index;
      abrirModal();
    });
  });

  function abrirModal() {
    const img = imagens[indexAtual];
    modal.style.display = "flex";
    modalImg.src = img.src;
    descricao.textContent = img.nextElementSibling.textContent;
  }

  fechar.addEventListener("click", () => {
    modal.style.display = "none";
  });

  anterior.addEventListener("click", () => {
    indexAtual = (indexAtual - 1 + imagens.length) % imagens.length;
    abrirModal();
  });

  seguinte.addEventListener("click", () => {
    indexAtual = (indexAtual + 1) % imagens.length;
    abrirModal();
  });

  document.addEventListener("keydown", (event) => {
    if (document.getElementById("modal").style.display === "flex") {
      if (event.key === "ArrowLeft") {
        indexAtual = (indexAtual - 1 + imagens.length) % imagens.length;
        abrirModal();
      }
      if (event.key === "ArrowRight") {
        indexAtual = (indexAtual + 1) % imagens.length;
        abrirModal();
      }
      if (event.key === "Escape") {
        document.getElementById("modal").style.display = "none";
      }
    }
  });


  // Botão voltar ao topo
  window.onscroll = function () {
    if (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) {
      btnTopo.style.display = "block";
    } else {
      btnTopo.style.display = "none";
    }
  };

  btnTopo.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
};
