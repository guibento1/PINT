// Abrir modal
document.querySelectorAll('.imagem img').forEach(img => {
  img.addEventListener('click', () => {
    const modal = document.getElementById('modal');
    const modalImg = document.getElementById('imagemModal');
    const descricao = document.getElementById('descricaoModal');

    modal.style.display = "flex";
    modalImg.src = img.src;
    descricao.textContent = img.nextElementSibling.textContent;
  });
});

// Fechar modal
document.getElementById('fecharModal').addEventListener('click', () => {
  document.getElementById('modal').style.display = "none";
});
// Fechar modal ao clicar fora da imagem
window.addEventListener('click', (event) => {
  const modal = document.getElementById('modal');
  if (event.target === modal) {
    modal.style.display = "none";
  }
});