const { authenticateJWT, authorizeRoles } = require('../middleware.js');
const express = require('express');
const router = express.Router();

const forumController = require('../controllers/forumController.js'); 

router.post('/post/topico/:idtopico', authenticateJWT, forumController.createPost);
router.get('/post/:id', authenticateJWT, forumController.getPost);
router.delete('/post/:id', authenticateJWT, forumController.deletePost);
router.post('/post/:id/comment', authenticateJWT, forumController.respondPost);
router.post('/comment/:id/respond', authenticateJWT, forumController.respondComent);
router.delete('/comment/:id', authenticateJWT, forumController.deleteComentario);


// Iteracoes


router.post('/post/:id/upvote', authenticateJWT, (req, res) => {
  return forumController.votePost(req, res, true);
});
router.post('/post/:id/downvote', authenticateJWT, (req, res) => {
  return forumController.votePost(req, res, false);
});
router.delete('/post/:id/unvote', authenticateJWT, forumController.removeVotePost);
router.post('/comment/:id/upvote', authenticateJWT, (req, res) => {
  return forumController.voteComentario(req, res, true);
});
router.post('/comment/:id/downvote', authenticateJWT, (req, res) => {
  return forumController.voteComentario(req, res, false);
});
router.delete('/comment/:id/unvote', authenticateJWT, forumController.removeVoteComentario);






module.exports = router;
