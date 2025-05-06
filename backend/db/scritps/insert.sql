/* INSERT DATA */


/*

Gerei os salts e hashes no mode iterativo do node com os seguintes comandos :

```js

const crypto = require('crypto'); // import do modulo de encriptação

const password = 'something';
const salt = crypto.randomBytes(8).toString('hex');
const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex') ;

```

*/



INSERT INTO Utilizadores (nome, email, salt, passwordhash, dataRegisto, morada, telefone, foto) VALUES
('João Silva', 'joao.silva@email.com', '6f08a8a9dd92ee1c', '5a4364dceb1416d1117e0085b0f5af12a30fe3a4f7a503f8f40309324972ecb3309b690141837b18ec3d9db8d5de8a172a3c05fe979ded9e90c30a8d70587b9c', '2024-05-01', 'Rua das Flores, 123', '912345678', NULL), -- pass : 'joaosilvajs'
('Maria Oliveira', 'maria.oliveira@email.com', 'e86fc168b15a6c88', '582d1914cecc6fdab240f121381c1857bd033d1e5c681e0c8fbba117bfa20447b239985ce935a973f437627191ad5996c6e1a23bfc5c299d2e48acb923b249fd', '2024-04-15', NULL, '923456789', NULL), -- pass : 'mariaoliveiramo'
('Carlos Santos', 'carlos.santos@email.com', 'c4e83f5caf2680e1', '86304abeed0c35aa7e35da2d3e24e6c21fa9ecbc9d7e181a996eaf4d0885bb451c8a88b55e7f883c1f6198c865569a32a5a5599b5d9a7be41b35795d0e3aebc6', '2024-03-20', 'Travessa do Norte, 78', NULL, NULL), -- pass : 'carlossantoscs'
('Ana Costa', 'ana.costa@email.com', 'a19b73db427ef1e1', 'cef81c760569db07cfcd311e94f871b56f192d93ab7901ff6db498860cb42a8fd7b776fd94fdd037688a2e7efe209fa6a316c76e395d7244d1e717a9f8c7d79a', '2024-02-10', NULL, NULL, NULL), -- pass : 'anacostaac'
('Pedro Martins', 'pedro.martins@email.com', '6dc37f61cf1b09b4', 'd801955b3bee04d91f2833aef4016a72af68478c3793b44416c1ad10f5e17c13a46bc62085e2e84f06b0461c93ef92be45cfba986bab6c5035c99b9f835a1d05', '2024-01-05', 'Av. do Mar, 321', '956789123', NULL), -- pass : 'pedromartinspm'
('Rita Lopes', 'rita.lopes@email.com', '4b6dea64d1384429', '9dffe6e237c6deb7337196cf536f79bcc1961e3f23c41d113a652f4b0e07a97ff808c1bb951366d4d947f3dd98a5e93c3e527250177d115fd908a53d263a0467', '2023-12-25', 'Rua Nova, 17', NULL, NULL), -- pass : 'ritalopesrl'
('Tiago Ferreira', 'tiago.ferreira@email.com', '3727f4d9143f5a75', '78eb4b98c62cb3e9991f3180cf206e7fca67ff91fc52d88a57acc9715fc1c2ed39f352b4f39c78183af60839ea5a64ddb97680cea0818be6f667f60b0d36e7d3', '2023-11-30', NULL, '922345678', NULL), -- pass : 'tiagoferreiratf'
('Sofia Rocha', 'sofia.rocha@email.com', 'add5babfd227948d', '1bf16d8d0d9953b050bf70628772883bcfa7061a1de3008c7ba8a22f6aa548257d23837334a2930ae291f4ef5a84f981ccc124cd3c05eb3fddcb7b68e23eafdf', '2023-10-18', 'Rua da Liberdade, 10', NULL, NULL), -- pass : 'sofiarochasr'
('Bruno Almeida', 'bruno.almeida@email.com', '5b7ff19c3e987c5c', '5de3b9b9c50030e57f123d26a881d472877a1056560df676ec2dfbf6f3a83e610f9d07cd586bab33e965cc51f41b37d2f95901354d9ddec84ef745ccff00c6f4', '2023-09-10', NULL, '944567890', NULL), -- pass : 'brunoalmeidaba'
('Inês Mendes', 'ines.mendes@email.com', '02f8af1b6ae8b4e6', '7c2eed7629656957d8c7303260690a5ab1340c9c405ace06c47269de85a2b59d53b0833c15e8f8da72b026b66aea077124e5b5e85f90afef24c09c29514daade', '2023-08-01', 'Rua das Palmeiras, 88', '955678901', NULL); -- pass : 'inesmendesim'

INSERT INTO Admin (utilizador) 
VALUES
(8),  -- Sofia Rocha
(3);  -- Carlos Santos

INSERT INTO formando (utilizador) 
VALUES
(2), -- Maria Oliveira
(1), -- Jõao Silva
(3), -- Carlos Santos
(7), -- Tiago Ferreira
(5); -- Pedro Martins

INSERT INTO formador (utilizador)
VALUES
(6), -- Rita Lopes
(7), -- Bruno Almeida
(10); -- Inês Mendes


INSERT INTO TipoDenuncia (designacao) 
VALUES
('Spam'),
('Ofensas e Linguagem Abusiva'),
('Conteúdo Inapropriado'),
('Publicidade Não Autorizada'),
('Assédio a Usuários'),
('Falsificação de Identidade'),
('Compartilhamento de Informações Pessoais'),
('Conteúdo Ilícito'),
('Discursos de Ódio');

INSERT INTO TipoMaterial (designacao) 
VALUES
('apresentação'),
('documento'),
('link'),
('folha de calculo');


INSERT INTO Categoria (designacao) 
VALUES
('Tecnologia'),
('Negócios'),
('Arte e Design'),
('Ciências Sociais');

INSERT INTO Area (categoria, designacao) 
VALUES
(1, 'Desenvolvimento Web'),
(1, 'Inteligência Artificial'),
(1, 'Segurança da Informação'),
(2, 'Gestão de Projetos'),
(2, 'Marketing Digital'),
(2, 'Empreendedorismo'),
(3, 'Design Gráfico'),
(3, 'Fotografia'),
(3, 'Ilustração Digital'),
(4, 'Psicologia'), (4, 'Sociologia'),
(4, 'Antropologia');


INSERT INTO Topico (designacao) 
VALUES
('HTML e CSS Básico'),
('JavaScript Avançado'),
('Frameworks Front-End (React, Angular, Vue)'),
('Redes Neurais Artificiais'),
('Machine Learning Básico'),
('Deep Learning e Redes Convolucionais'),
('Criptografia'),
('Testes de Penetração (Pen-Testing)'),
('Proteção contra Phishing'),
('Metodologias Ágeis (Scrum, Kanban)'),
('Planejamento de Projetos'),
('Gestão de Riscos'),
('SEO - Otimização para Motores de Busca'),
('Publicidade no Google Ads'),
('Marketing nas Redes Sociais'),
('Photoshop Avançado'),
('Criação de Logotipos'),
('Tipografia e Design Visual'),
('Fotografia Digital'),
('Edição de Imagens'),
('Técnicas de Fotografia Noturna'),
('Desenho Vetorial'),
('Pintura Digital em Photoshop'),
('Design de Personagens'),
('Psicologia Cognitiva'),
('Psicologia Clínica'),
('Psicologia do Desenvolvimento'),
('Teorias Sociológicas'),
('Desigualdade Social'),
('Comportamento Humano e Sociedade'),
('Antropologia Cultural'),
('Evolução Humana'),
('Antropologia Forense');



INSERT INTO TopicoArea (topico, area) 
VALUES
(1, 1), -- HTML e CSS Básico
(2, 1), -- JavaScript Avançado
(3, 1), -- Frameworks Front-End (React, Angular, Vue)
(4, 2), -- Redes Neurais Artificiais
(5, 2), -- Machine Learning Básico
(6, 2), -- Deep Learning e Redes Convolucionais
(7, 3), -- Criptografia
(8, 3), -- Testes de Penetração (Pen-Testing)
(9, 3), -- Proteção contra Phishing
(10, 4), -- Metodologias Ágeis (Scrum, Kanban)
(11, 4), -- Planejamento de Projetos
(12, 4), -- Gestão de Riscos
(13, 5), -- SEO - Otimização para Motores de Busca
(14, 5), -- Publicidade no Google Ads
(15, 5), -- Marketing nas Redes Sociais
(16, 6), -- Photoshop Avançado
(17, 6), -- Criação de Logotipos
(18, 6), -- Tipografia e Design Visual
(19, 7), -- Fotografia Digital
(20, 7), -- Edição de Imagens
(21, 7), -- Técnicas de Fotografia Noturna
(22, 8), -- Desenho Vetorial
(23, 8), -- Pintura Digital em Photoshop
(24, 8), -- Design de Personagens
(25, 9), -- Psicologia Cognitiva
(26, 9), -- Psicologia Clínica
(27, 9), -- Psicologia do Desenvolvimento
(28, 10), -- Teorias Sociológicas
(29, 10), -- Desigualdade Social
(30, 10), -- Comportamento Humano e Sociedade
(31, 11), -- Antropologia Cultural
(32, 11), -- Evolução Humana
(33, 11); -- Antropologia Forense


INSERT INTO CanalNotificacoes (descricao) 
VALUES
('Notificações Gerais'),
('Notificações Administrativas'),
('Inteligência Artificial'),
('Markting Digital'),
('Psicologia'),
('Desenvolvimento Web'),
('Design Gráfico');


INSERT INTO Notificacao (conteudo) 
VALUES
('Novo curso de Desenvolvimento Web está disponível!'),
('O seu curso de Marketing Digital começa amanhã.'),
('Sua inscrição no curso de Fotografia foi confirmada.'),
('Aulas sincronas começam em 2 horas.'),
('Notificação de atualização importante na plataforma.'),
('Nova lição foi adicionado ao curso.');


INSERT INTO NotificacaoGeral (idNotificacao, canal) 
VALUES
(1, 1), -- Novo curso díponivel : Desenvolvimento Web
(2, 4), -- Iniciação de Curos : Marketing Digital 
(4, 3), -- Lembrete de Curso : Inteligência Artificial
(5, 1), -- Atualização pendente
(5, 2), -- Atualização pendente
(6, 5); -- Nova Lição Adicionada : Psicologia


INSERT INTO NotificacaoPessoal (idNotificacao, utilizador) 
VALUES
(3, 2); -- Confirmação para maria oliveira


INSERT INTO Curso (nome, disponivel, inicioDeInscricoes, canal, fimDeInscricoes, maxInscricoes, planoCurricular, thumbnail) 
VALUES

('Desenvolvimento Web', TRUE, '2025-06-01 10:00:00', 6, '2025-08-01 23:59:59', 50, 
'Plano Curricular: Introdução ao HTML, CSS, JavaScript, Frameworks Front-End (React, Angular, Vue), Back-End com Node.js', 
NULL),

('Inteligência Artificial', TRUE, '2025-06-15 10:00:00', 3, '2025-07-15 23:59:59', 30, 
'Plano Curricular: Machine Learning, Deep Learning, Redes Neurais, Algoritmos de IA, Implementação Prática de Modelos', 
NULL),

('Design Gráfico', FALSE, '2025-07-01 10:00:00', 7, '2025-09-01 23:59:59', 40, 
'Plano Curricular: Photoshop Avançado, Illustrator, Criação de Logotipos, Tipografia, Design para Web', 
NULL),

('Psicologia', TRUE, '2025-08-01 10:00:00', 5, '2025-09-01 23:59:59', 60, 
'Plano Curricular: Psicologia Cognitiva, Psicologia Clínica, Psicologia do Desenvolvimento, Psicologia Social, Terapias Comportamentais', 
NULL),

('Marketing Digital', TRUE, '2025-07-15 10:00:00', 4, '2025-08-15 23:59:59', 100, 
'Plano Curricular: SEO, SEM, Google Ads, Marketing de Conteúdo, Marketing nas Redes Sociais, Estratégias de Crescimento Digital',NULL);



INSERT INTO CursoSincrono (curso, formador, nHoras, inicio, fim)
VALUES
(1, 2, 40, '2025-06-01', '2025-06-30'),
(2, 2, 50, '2025-06-15', '2025-07-15'),
(5, 1, 40, '2025-07-15', '2025-08-15'); 

INSERT INTO CursoAssincrono (curso)
VALUES
(3), 
(4);


INSERT INTO Licao (idLicao, curso, titulo, descricao)
VALUES 
(1, 3, 'Fundamentos do Design Visual', 
'Exploração dos princípios do design, como contraste, alinhamento, repetição e proximidade.'),
(2, 2, 'Introdução à Inteligência Artificial', 
'Apresentação dos conceitos básicos de IA, áreas de aplicação e histórico da disciplina.'),
(3, 5, 'Modelos de Negócio Inovadores', 
'Análise de modelos como Canvas, Lean Startup e como aplicá-los em projetos empreendedores.'),
(4, 2, 'Fundamentos de Machine Learning', 
'jonceitos centrais de aprendizagem supervisionada e não supervisionada, algoritmos clássicos e suas aplicações.'),
(5, 2, 'Redes Neurais e Deep Learning', 
'Introdução às redes neurais artificiais, perceptrons, e redes profundas (deep learning), incluindo CNNs e RNNs.'),
(6, 3, 'Fundamentos do Design Visual', 
'Exploração dos princípios do design, como contraste, alinhamento, repetição e proximidade.'),
(7, 3, 'Introdução ao Adobe Photoshop', 
'Noções básicas de interface, ferramentas de edição, camadas e ajustes de imagem.');


INSERT INTO Sessao (idSessao, licao, cursoSincrono, linkSessao, dataHora, plataformaVideoConferencia)
VALUES
(1, 2, 2, 'https://meet.example.com/ia-intro', '2025-06-17 10:00:00', 'Zoom'),
(2, 4, 2, 'https://meet.example.com/ia-ml', '2025-06-20 10:00:00', 'Microsoft Teams'),
(3, 5, 2, 'https://meet.example.com/ia-dl', '2025-06-24 10:00:00', 'Google Meet');



INSERT INTO TipoMaterial (designacao) 
VALUES
('apresentação'),
('documento'),
('video'),
('link'),
('folha de calculo');


INSERT INTO Material (titulo, link, tipo, criador) VALUES
('Introdução à IA', 'https://example.com/materiais/ia_intro_slides.pdf', 2, 7),
('Algoritmos de Machine Learning', 'https://example.com/materiais/ml_algorithms.mp4', 3, 7),
('Leitura Recomendada: Deep Learning Book', 'https://deeplearningbook.org', 4, 7),
('HTML e CSS Básico', 'https://example.com/materiais/html_css_slides.pdf', 2, 7),
('Flexbox e Grid', 'https://example.com/materiais/flexbox_guide.pdf', 2, 7),
('SEO e Google Ads', 'https://example.com/materiais/seo_googleads.pdf', 2, 3),
('Estratégias de Marketing nas Redes Sociais', 'https://example.com/materiais/social_marketing.mp4', 3, 3);





INSERT INTO Post (utilizador, titulo, topico, conteudo, pontuacao, nComentarios)
VALUES 
(1, 'Qual é a relação do Javascript ao java', 1, 'Sei que alem do nome existe uma história qualquer entre a Oracle e SunMicrosystems, mas nunca a entendi.', 5, 2),

(2, 'O que é Inteligência Artificial?', 2, 'Pergunta um bocado estupida, mas estava a pensar em increver me no curso de IA, no entanto estou com receio que não seja o meio emocionante que toda, mas na realidade uma area cheia de estatisca, queria saber de quem realmente trabalha ou tem conhecimento na area o que é Intelegência Artifical', 4, 1),

(3, 'Dicas para Iniciar no Marketing Digital', 3, 'Comentem ai as vossas melhores dicas para iniciantes no Marketing digital.', 3, 3);


INSERT INTO Comentario (utilizador, conteudo, pontuacao)
VALUES 
(4, 'Na minha opinião, são linguagens completamente diferentes, mas o nome "Javascript" foi mais uma estratégia de marketing.', 2),
(5, 'Sim, a Oracle e a Sun Microsystems estavam de facto a tentar competir no mercado, mas hoje em dia o Javascript é bem mais utilizado em desenvolvimento web.', 3),
(6, 'Inteligência Artificial envolve muito mais do que estatísticas, é sobre aprender com dados e melhorar as decisões automáticas. Mas sim, a estatística é uma parte fundamental.', 4),
(7, 'Uma dica importante é começar com SEO e aprender o básico sobre Google Ads, pois são essenciais para alcançar mais pessoas.', 5),
(8, 'Defina sempre um público-alvo claro e desenvolva conteúdo de qualidade que ressoe com eles. As redes sociais são um bom ponto de partida.', 4),
(9, 'Além do SEO e Ads, não se esqueça do marketing de conteúdo, é fundamental para manter um engajamento constante!', 3);


INSERT INTO RespostaPost (idComentario, post)
VALUES 
(1, 1),
(2, 1),
(3, 2),
(4, 3);

INSERT INTO RespostaComentario (idComentario, comentario)
VALUES 
(4, 5),
(5, 6);


INSERT INTO Denuncia (tipo, descricao, criador)
VALUES
(1, 'Post contém informações incorretas sobre as linguagens.', 10),
(2, 'Comentário agressivo e não construtivo.', 9),
(3, 'Este post contém conteúdo repetido de outros cursos.', 8);

INSERT INTO DenunciaPost (denuncia, post)
VALUES 
(1, 1),
(3, 3);

INSERT INTO DenunciaComentario (denuncia, comentario)
VALUES (2, 1);
