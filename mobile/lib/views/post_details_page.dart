import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/backend/server.dart';
import 'package:mobile/backend/shared_preferences.dart' as prefs;

class PostDetailsPage extends StatefulWidget {
  final int id;
  const PostDetailsPage({super.key, required this.id});

  @override
  State<PostDetailsPage> createState() => _PostDetailsPageState();
}

class _PostDetailsPageState extends State<PostDetailsPage> {
  final Servidor _server = Servidor();
  Map<String, dynamic>? post;
  List<dynamic> comments = [];
  bool loading = true;
  String? error;

  // Replies and interactions state
  final Map<int, List<dynamic>> _replies = {}; // commentId -> replies list
  final Set<int> _expanded = {}; // expanded comments
  final Set<int> _loadingReplies = {}; // loading state per comment
  final Set<int> _replyBoxOpen = {}; // which comments show reply field
  Map<String, dynamic>? _currentUser;
  final TextEditingController _newCommentCtrl = TextEditingController();
  final Map<int, TextEditingController> _replyCtrls = {};

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    _currentUser = await prefs.getUser();
    await _fetch();
  }

  Future<void> _fetch() async {
    setState(() {
      loading = true;
      error = null;
    });
    try {
      final p = await _server.getData('forum/post/${widget.id}');
      if (p is Map<String, dynamic>) {
        post = p;
      }
      // Prefer generic comments endpoint used in server helpers
      final c = await _server.getData('forum/post/${widget.id}/comment');
      comments =
          (c is List)
              ? c
              : (c is Map && c['data'] is List)
              ? List.from(c['data'] as List)
              : [];
    } catch (e) {
      error = 'Erro a carregar post.';
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  Future<void> _handleVote(
    int postId,
    String voteType,
    dynamic currentVote,
  ) async {
    // Optimistic update similar to forums list
    try {
      final current = post;
      if (current == null) return;
      final int score = (current['pontuacao'] ?? 0) as int;
      dynamic newVote = currentVote;
      int delta = 0;
      if (voteType == 'upvote') {
        if (currentVote == true) {
          newVote = null;
          delta = -1;
        } else if (currentVote == false) {
          newVote = true;
          delta = 2;
        } else {
          newVote = true;
          delta = 1;
        }
      } else {
        if (currentVote == false) {
          newVote = null;
          delta = -1;
        } else if (currentVote == true) {
          newVote = false;
          delta = -2;
        } else {
          newVote = false;
          delta = -1;
        }
      }
      setState(() {
        post = {...current, 'iteracao': newVote, 'pontuacao': score + delta};
      });

      if (voteType == 'upvote') {
        if (currentVote == true) {
          await _server.deleteData('forum/post/$postId/unvote');
        } else if (currentVote == false) {
          await _server.deleteData('forum/post/$postId/unvote');
          await _server.postData('forum/post/$postId/upvote', {});
        } else {
          await _server.postData('forum/post/$postId/upvote', {});
        }
      } else {
        if (currentVote == false) {
          await _server.deleteData('forum/post/$postId/unvote');
        } else if (currentVote == true) {
          await _server.deleteData('forum/post/$postId/unvote');
          await _server.postData('forum/post/$postId/downvote', {});
        } else {
          await _server.postData('forum/post/$postId/downvote', {});
        }
      }
    } catch (e) {
      await _fetch();
    }
  }

  String _authorName(Map<String, dynamic> p) {
    final a = p['autor'] ?? p['utilizador'] ?? p['username'];
    if (a is Map && a['nome'] != null) return a['nome'].toString();
    return (a ?? 'Autor desconhecido').toString();
  }

  String? _authorAvatar(Map<String, dynamic> p) {
    final a = p['autor'] ?? p['utilizador'];
    if (a is Map) {
      final possibleKeys = [
        'avatar',
        'foto',
        'imagem',
        'profile',
        'fotoPerfil',
        'avatarUrl',
      ];
      for (final k in possibleKeys) {
        final v = a[k];
        if (v != null && v.toString().isNotEmpty) return v.toString();
      }
    }
    final rootKeys = ['avatar', 'foto', 'avatarUrl'];
    for (final k in rootKeys) {
      final v = p[k];
      if (v != null && v.toString().isNotEmpty) return v.toString();
    }
    return null;
  }

  bool _isOwner(Map<String, dynamic> entity) {
    final uid =
        _currentUser != null
            ? (_currentUser!['idutilizador'] ?? _currentUser!['id'])?.toString()
            : null;
    if (uid == null) return false;
    final au = entity['autor'] ?? entity['utilizador'];
    if (au is Map) {
      final eid = (au['idutilizador'] ?? au['id'])?.toString();
      return eid != null && eid == uid;
    }
    return false;
  }

  Future<void> _toggleReplies(int commentId) async {
    if (_expanded.contains(commentId)) {
      setState(() {
        _expanded.remove(commentId);
      });
      return;
    }
    setState(() {
      _expanded.add(commentId);
      _loadingReplies.add(commentId);
    });
    try {
      final res = await _server.getData('forum/comment/$commentId/replies');
      final list =
          res is List
              ? res
              : (res is Map && res['data'] is List)
              ? List.from(res['data'] as List)
              : <dynamic>[];
      setState(() {
        _replies[commentId] = list;
      });
    } catch (_) {
      // ignore
    } finally {
      setState(() {
        _loadingReplies.remove(commentId);
      });
    }
  }

  Future<void> _submitComment() async {
    final text = _newCommentCtrl.text.trim();
    if (text.isEmpty) return;
    try {
      await _server.postData('forum/post/${widget.id}/comment', {
        'conteudo': text,
      });
      _newCommentCtrl.clear();
      await _fetch();
    } catch (_) {}
  }

  Future<void> _submitReply(int commentId) async {
    final ctrl = _replyCtrls.putIfAbsent(
      commentId,
      () => TextEditingController(),
    );
    final text = ctrl.text.trim();
    if (text.isEmpty) return;
    try {
      await _server.postData('forum/comment/$commentId/respond', {
        'conteudo': text,
      });
      ctrl.clear();
      if (_expanded.contains(commentId)) {
        await _toggleReplies(commentId); // collapse first
        await _toggleReplies(commentId); // expand and reload
      }
    } catch (_) {}
  }

  void _reportPost() async {
    await _server.reportPost(
      widget.id,
      tipo: 0,
      descricao: 'Reportado via app',
    );
    if (mounted) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Post reportado')));
    }
  }

  void _reportComment(int id) async {
    await _server.reportComment(id, tipo: 0, descricao: 'Reportado via app');
    if (mounted) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Comentário reportado')));
    }
  }

  @override
  void dispose() {
    _newCommentCtrl.dispose();
    for (final c in _replyCtrls.values) {
      c.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF6F9FB),
      appBar: AppBar(
        backgroundColor: const Color(0xFFF6F9FB),
        elevation: 0,
        leading: Container(
          margin: const EdgeInsets.only(left: 8, top: 6, bottom: 6),
          decoration: const BoxDecoration(
            color: Color(0xFF007BFF),
            shape: BoxShape.circle,
          ),
          child: IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.white),
            onPressed: () => context.go('/forums'),
          ),
        ),
        title: const Text(
          'Detalhes do Post',
          style: TextStyle(
            color: Color(0xFF007BFF),
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body:
          loading
              ? const Center(child: CircularProgressIndicator())
              : error != null
              ? Center(
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Text(
                    error!,
                    style: const TextStyle(color: Colors.red),
                  ),
                ),
              )
              : post == null
              ? const Center(child: Text('Post não encontrado'))
              : RefreshIndicator(
                onRefresh: _fetch,
                child: ListView(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20.0,
                    vertical: 20.0,
                  ),
                  children: [
                    const SizedBox(height: 4),
                    // Post card mirroring forums layout
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.grey.withOpacity(0.3),
                            spreadRadius: 1,
                            blurRadius: 1,
                            offset: const Offset(1, 3),
                          ),
                        ],
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Voting
                          Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              IconButton(
                                onPressed:
                                    () => _handleVote(
                                      widget.id,
                                      'upvote',
                                      post?['iteracao'],
                                    ),
                                icon: Icon(
                                  (post?['iteracao'] == true)
                                      ? Icons.thumb_up_alt
                                      : Icons.thumb_up_alt_outlined,
                                  color:
                                      (post?['iteracao'] == true)
                                          ? Colors.green
                                          : Colors.grey,
                                  size: 26,
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 2,
                                ),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFECECEC),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  '${post?['pontuacao'] ?? 0}',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                              IconButton(
                                onPressed:
                                    () => _handleVote(
                                      widget.id,
                                      'downvote',
                                      post?['iteracao'],
                                    ),
                                icon: Icon(
                                  (post?['iteracao'] == false)
                                      ? Icons.thumb_down_alt
                                      : Icons.thumb_down_alt_outlined,
                                  color:
                                      (post?['iteracao'] == false)
                                          ? Colors.red
                                          : Colors.grey,
                                  size: 26,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(width: 12),
                          // Content
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Header: avatar + author name + actions
                                Row(
                                  children: [
                                    Builder(
                                      builder: (_) {
                                        final avatar = _authorAvatar(post!);
                                        if (avatar != null &&
                                            avatar.isNotEmpty) {
                                          return CircleAvatar(
                                            radius: 12,
                                            backgroundImage: NetworkImage(
                                              avatar,
                                            ),
                                          );
                                        }
                                        return const CircleAvatar(
                                          radius: 12,
                                          backgroundColor: Color(0xFF00B0DA),
                                          child: Icon(
                                            Icons.person,
                                            size: 14,
                                            color: Colors.white,
                                          ),
                                        );
                                      },
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        _authorName(post!),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(
                                          fontSize: 12,
                                          color: Color(0xFF8F9BB3),
                                        ),
                                      ),
                                    ),
                                    IconButton(
                                      padding: EdgeInsets.zero,
                                      constraints: const BoxConstraints(),
                                      icon: const Icon(
                                        Icons.flag,
                                        size: 18,
                                        color: Color(0xFF8F9BB3),
                                      ),
                                      onPressed: _reportPost,
                                      tooltip: 'Reportar',
                                    ),
                                    if (_isOwner(post!))
                                      IconButton(
                                        padding: EdgeInsets.zero,
                                        constraints: const BoxConstraints(),
                                        icon: const Icon(
                                          Icons.delete_outline,
                                          size: 18,
                                          color: Color(0xFF8F9BB3),
                                        ),
                                        onPressed: () {
                                          ScaffoldMessenger.of(
                                            context,
                                          ).showSnackBar(
                                            const SnackBar(
                                              content: Text(
                                                'Eliminar post não suportado.',
                                              ),
                                            ),
                                          );
                                        },
                                        tooltip: 'Eliminar',
                                      ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  (post!['titulo'] ?? post!['title'] ?? '—')
                                      .toString(),
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16,
                                    color: Color(0xFF222B45),
                                  ),
                                  maxLines: 3,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  (post!['conteudo'] ?? post!['content'] ?? '')
                                      .toString(),
                                  style: const TextStyle(
                                    fontSize: 14,
                                    color: Color(0xFF49454F),
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Row(
                                  children: [
                                    const Icon(
                                      Icons.comment,
                                      size: 14,
                                      color: Color(0xFF8F9BB3),
                                    ),
                                    const SizedBox(width: 4),
                                    Text(
                                      '${comments.length}',
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: Color(0xFF8F9BB3),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    // New comment box
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.grey.withOpacity(0.2),
                            spreadRadius: 1,
                            blurRadius: 1,
                            offset: const Offset(1, 2),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: _newCommentCtrl,
                              decoration: const InputDecoration(
                                hintText: 'Escreve um comentário...',
                                border: OutlineInputBorder(),
                              ),
                              minLines: 1,
                              maxLines: 3,
                            ),
                          ),
                          const SizedBox(width: 8),
                          ElevatedButton(
                            onPressed: _submitComment,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF00B0DA),
                              foregroundColor: Colors.white,
                            ),
                            child: const Text('Enviar'),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),
                    const Text(
                      'Comentários',
                      style: TextStyle(
                        fontSize: 19,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF1D1B20),
                      ),
                    ),
                    const SizedBox(height: 8),
                    if (comments.isEmpty)
                      const Padding(
                        padding: EdgeInsets.all(8.0),
                        child: Text('Sem comentários ainda.'),
                      )
                    else
                      ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: comments.length,
                        itemBuilder: (context, index) {
                          final m = comments[index] as Map<String, dynamic>;
                          final cid = (m['idcomentario'] ?? m['id']) as int;
                          final authorName = _authorName(m);
                          final avatar = _authorAvatar(m);
                          final replies = _replies[cid] ?? const [];
                          final expanded = _expanded.contains(cid);
                          final loadingReplies = _loadingReplies.contains(cid);
                          final replyCtrl = _replyCtrls.putIfAbsent(
                            cid,
                            () => TextEditingController(),
                          );

                          return Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.grey.withOpacity(0.2),
                                  spreadRadius: 1,
                                  blurRadius: 1,
                                  offset: const Offset(1, 2),
                                ),
                              ],
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    if (avatar != null && avatar.isNotEmpty)
                                      CircleAvatar(
                                        radius: 10,
                                        backgroundImage: NetworkImage(avatar),
                                      )
                                    else
                                      const CircleAvatar(
                                        radius: 10,
                                        backgroundColor: Color(0xFF00B0DA),
                                        child: Icon(
                                          Icons.person,
                                          size: 12,
                                          color: Colors.white,
                                        ),
                                      ),
                                    const SizedBox(width: 6),
                                    Expanded(
                                      child: Text(
                                        authorName,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(
                                          fontSize: 12,
                                          color: Color(0xFF8F9BB3),
                                        ),
                                      ),
                                    ),
                                    IconButton(
                                      padding: EdgeInsets.zero,
                                      constraints: const BoxConstraints(),
                                      icon: const Icon(
                                        Icons.flag,
                                        size: 16,
                                        color: Color(0xFF8F9BB3),
                                      ),
                                      onPressed: () => _reportComment(cid),
                                      tooltip: 'Reportar',
                                    ),
                                    if (_isOwner(m))
                                      IconButton(
                                        padding: EdgeInsets.zero,
                                        constraints: const BoxConstraints(),
                                        icon: const Icon(
                                          Icons.delete_outline,
                                          size: 16,
                                          color: Color(0xFF8F9BB3),
                                        ),
                                        onPressed: () {
                                          ScaffoldMessenger.of(
                                            context,
                                          ).showSnackBar(
                                            const SnackBar(
                                              content: Text(
                                                'Eliminar comentário não suportado.',
                                              ),
                                            ),
                                          );
                                        },
                                        tooltip: 'Eliminar',
                                      ),
                                    IconButton(
                                      padding: EdgeInsets.zero,
                                      constraints: const BoxConstraints(),
                                      icon: Icon(
                                        expanded
                                            ? Icons.expand_less
                                            : Icons.expand_more,
                                        size: 18,
                                        color: const Color(0xFF8F9BB3),
                                      ),
                                      onPressed: () => _toggleReplies(cid),
                                      tooltip: 'Ver respostas',
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  (m['conteudo'] ?? m['content'] ?? '')
                                      .toString(),
                                  style: const TextStyle(
                                    fontSize: 14,
                                    color: Color(0xFF49454F),
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Row(
                                  children: [
                                    TextButton.icon(
                                      onPressed: () {
                                        setState(() {
                                          if (_replyBoxOpen.contains(cid)) {
                                            _replyBoxOpen.remove(cid);
                                          } else {
                                            _replyBoxOpen.add(cid);
                                          }
                                        });
                                      },
                                      icon: const Icon(Icons.reply, size: 16),
                                      label: const Text('Responder'),
                                    ),
                                  ],
                                ),
                                if (_replyBoxOpen.contains(cid)) ...[
                                  const SizedBox(height: 6),
                                  Row(
                                    children: [
                                      Expanded(
                                        child: TextField(
                                          controller: replyCtrl,
                                          decoration: const InputDecoration(
                                            hintText: 'A tua resposta...',
                                            border: OutlineInputBorder(),
                                          ),
                                          minLines: 1,
                                          maxLines: 3,
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      ElevatedButton(
                                        onPressed: () => _submitReply(cid),
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: const Color(
                                            0xFF00B0DA,
                                          ),
                                          foregroundColor: Colors.white,
                                        ),
                                        child: const Text('Enviar'),
                                      ),
                                    ],
                                  ),
                                ],
                                if (expanded)
                                  Padding(
                                    padding: const EdgeInsets.only(
                                      top: 8.0,
                                      left: 8.0,
                                    ),
                                    child:
                                        loadingReplies
                                            ? const Padding(
                                              padding: EdgeInsets.all(8.0),
                                              child: SizedBox(
                                                width: 20,
                                                height: 20,
                                                child:
                                                    CircularProgressIndicator(
                                                      strokeWidth: 2,
                                                    ),
                                              ),
                                            )
                                            : Column(
                                              children:
                                                  replies.map((r) {
                                                    final ra =
                                                        r
                                                            as Map<
                                                              String,
                                                              dynamic
                                                            >;
                                                    final rname = _authorName(
                                                      ra,
                                                    );
                                                    final rav = _authorAvatar(
                                                      ra,
                                                    );
                                                    return Container(
                                                      margin:
                                                          const EdgeInsets.only(
                                                            bottom: 8,
                                                          ),
                                                      padding:
                                                          const EdgeInsets.all(
                                                            10,
                                                          ),
                                                      decoration: BoxDecoration(
                                                        color: const Color(
                                                          0xFFF9FAFB,
                                                        ),
                                                        borderRadius:
                                                            BorderRadius.circular(
                                                              10,
                                                            ),
                                                        border: Border.all(
                                                          color: const Color(
                                                            0xFFE5E7EB,
                                                          ),
                                                        ),
                                                      ),
                                                      child: Column(
                                                        crossAxisAlignment:
                                                            CrossAxisAlignment
                                                                .start,
                                                        children: [
                                                          Row(
                                                            children: [
                                                              if (rav != null &&
                                                                  rav.isNotEmpty)
                                                                CircleAvatar(
                                                                  radius: 9,
                                                                  backgroundImage:
                                                                      NetworkImage(
                                                                        rav,
                                                                      ),
                                                                )
                                                              else
                                                                const CircleAvatar(
                                                                  radius: 9,
                                                                  backgroundColor:
                                                                      Color(
                                                                        0xFF00B0DA,
                                                                      ),
                                                                  child: Icon(
                                                                    Icons
                                                                        .person,
                                                                    size: 11,
                                                                    color:
                                                                        Colors
                                                                            .white,
                                                                  ),
                                                                ),
                                                              const SizedBox(
                                                                width: 6,
                                                              ),
                                                              Expanded(
                                                                child: Text(
                                                                  rname,
                                                                  maxLines: 1,
                                                                  overflow:
                                                                      TextOverflow
                                                                          .ellipsis,
                                                                  style: const TextStyle(
                                                                    fontSize:
                                                                        12,
                                                                    color: Color(
                                                                      0xFF8F9BB3,
                                                                    ),
                                                                  ),
                                                                ),
                                                              ),
                                                              IconButton(
                                                                padding:
                                                                    EdgeInsets
                                                                        .zero,
                                                                constraints:
                                                                    const BoxConstraints(),
                                                                icon: const Icon(
                                                                  Icons.flag,
                                                                  size: 16,
                                                                  color: Color(
                                                                    0xFF8F9BB3,
                                                                  ),
                                                                ),
                                                                onPressed:
                                                                    () => _reportComment(
                                                                      (ra['idcomentario'] ??
                                                                              ra['id'])
                                                                          as int,
                                                                    ),
                                                              ),
                                                              if (_isOwner(ra))
                                                                IconButton(
                                                                  padding:
                                                                      EdgeInsets
                                                                          .zero,
                                                                  constraints:
                                                                      const BoxConstraints(),
                                                                  icon: const Icon(
                                                                    Icons
                                                                        .delete_outline,
                                                                    size: 16,
                                                                    color: Color(
                                                                      0xFF8F9BB3,
                                                                    ),
                                                                  ),
                                                                  onPressed: () {
                                                                    ScaffoldMessenger.of(
                                                                      context,
                                                                    ).showSnackBar(
                                                                      const SnackBar(
                                                                        content:
                                                                            Text(
                                                                              'Eliminar resposta não suportado.',
                                                                            ),
                                                                      ),
                                                                    );
                                                                  },
                                                                ),
                                                            ],
                                                          ),
                                                          const SizedBox(
                                                            height: 4,
                                                          ),
                                                          Text(
                                                            (ra['conteudo'] ??
                                                                    ra['content'] ??
                                                                    '')
                                                                .toString(),
                                                            style:
                                                                const TextStyle(
                                                                  fontSize: 14,
                                                                  color: Color(
                                                                    0xFF49454F,
                                                                  ),
                                                                ),
                                                          ),
                                                        ],
                                                      ),
                                                    );
                                                  }).toList(),
                                            ),
                                  ),
                              ],
                            ),
                          );
                        },
                      ),
                  ],
                ),
              ),
    );
  }
}
