const { authenticateJWT, authorizeRoles } = require('../middleware.js');
const express = require('express');
const router = express.Router();

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const forumController = require('../controllers/forumController.js'); 

router.post('/post/topico/:idtopico', authenticateJWT, upload.single('anexo'), forumController.createPost);
router.get('/post/:id', authenticateJWT, forumController.getPost);
router.delete('/post/:id', authenticateJWT, forumController.deletePost);
router.post('/post/:id/comment', authenticateJWT, forumController.respondPost);
router.get('/post/:id/comment', authenticateJWT, forumController.getRespostasPost);
router.post('/comment/:id/respond', authenticateJWT, forumController.respondComent);
router.delete('/comment/:id', authenticateJWT, forumController.deleteComentario);
router.get('/comment/:id/replies', authenticateJWT, forumController.getRespostasComentario);

router.get('/posts', authenticateJWT, (req, res) => {
  return forumController.getPosts(req, res, null);
});
router.get('/posts/topico/:id', authenticateJWT, (req, res) => {
  return forumController.getPosts(req, res, req.params.id);
});


// Iteracoes


router.post('/post/:id/upvote', authenticateJWT, (req, res) => {
  return forumController.votePost(req, res, true);
});

router.post('/post/:id/downvote', authenticateJWT, (req, res) => {
  return forumController.votePost(req, res, false);
});

router.delete('/post/:id/unvote', authenticateJWT, forumController.removeVotePost);

router.post('/post/:id/reportar', authenticateJWT, forumController.reportPost);

router.post('/comment/:id/upvote', authenticateJWT, (req, res) => {
  return forumController.voteComentario(req, res, true);
});

router.post('/comment/:id/downvote', authenticateJWT, (req, res) => {
  return forumController.voteComentario(req, res, false);
});

router.delete('/comment/:id/unvote', authenticateJWT, forumController.removeVoteComentario);


router.get('/comment/:id', authenticateJWT, forumController.getComentario);
router.post('/comment/:id/reportar', authenticateJWT, forumController.reportComentario);

router.get('/denuncias/tipos', authenticateJWT, forumController.getTiposDenuncia);

router.get('/denuncias/posts', authenticateJWT, authorizeRoles('admin'), forumController.getDenunciaPosts);

router.get('/denuncias/comentarios', authenticateJWT, authorizeRoles('admin'), forumController.getDenunciaComentarios);

router.delete('/denuncias/:id', authenticateJWT, authorizeRoles('admin'), forumController.rmDenuncia);






module.exports = router;
