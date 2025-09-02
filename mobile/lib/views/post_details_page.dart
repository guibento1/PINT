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
  // Report types cache
  List<dynamic> _reportTypes = [];

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
    // Preload report types for modal dropdown
    try {
      _reportTypes = await _server.fetchReportTypes();
    } catch (_) {}
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
      final int score = _asInt(current['pontuacao']) ?? 0;
      final bool? cur = _asVote(currentVote);
      bool? newVote = cur;
      int delta = 0;
      if (voteType == 'upvote') {
        if (cur == true) {
          newVote = null;
          delta = -1;
        } else if (cur == false) {
          newVote = true;
          delta = 2;
        } else {
          newVote = true;
          delta = 1;
        }
      } else {
        if (cur == false) {
          newVote = null;
          delta = -1;
        } else if (cur == true) {
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
        if (cur == true) {
          await _server.deleteData('forum/post/$postId/unvote');
        } else if (cur == false) {
          await _server.deleteData('forum/post/$postId/unvote');
          await _server.postData('forum/post/$postId/upvote', {});
        } else {
          await _server.postData('forum/post/$postId/upvote', {});
        }
      } else {
        if (cur == false) {
          await _server.deleteData('forum/post/$postId/unvote');
        } else if (cur == true) {
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
        if (v != null && v.toString().isNotEmpty) {
          final s = v.toString();
          return s.startsWith('http') ? s : '${_server.urlAPI}$s';
        }
      }
    }
    final rootKeys = ['avatar', 'foto', 'avatarUrl'];
    for (final k in rootKeys) {
      final v = p[k];
      if (v != null && v.toString().isNotEmpty) {
        final s = v.toString();
        return s.startsWith('http') ? s : '${_server.urlAPI}$s';
      }
    }
    return null;
  }

  int? _asInt(dynamic v) {
    if (v == null) return null;
    if (v is int) return v;
    if (v is String) return int.tryParse(v);
    if (v is double) return v.toInt();
    return null;
  }

  bool? _asVote(dynamic v) {
    if (v == null) return null;
    if (v is bool) return v;
    if (v is int) {
      if (v > 0) return true;
      if (v < 0) return false;
      return null;
    }
    if (v is String) {
      final s = v.toLowerCase();
      if (s == 'true' || s == '1' || s == 'up' || s == 'upvote') return true;
      if (s == 'false' || s == '-1' || s == 'down' || s == 'downvote') {
        return false;
      }
      return null;
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

  // Helper to derive reply count from comment data or loaded replies
  int _replyCountFor(int cid, Map<String, dynamic> comment) {
    final fromLoaded = _replies[cid]?.length;
    if (fromLoaded != null) return fromLoaded;
    final keys = ['numRespostas', 'repliesCount', 'respostas', 'qtdRespostas'];
    for (final k in keys) {
      final v = _asInt(comment[k]);
      if (v != null) return v;
    }
    return 0;
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

  // Open report bottom sheet for post or comment
  void _openReport({required String kind, required int id}) async {
    int? selectedTipo;
    final TextEditingController descCtrl = TextEditingController();
    if (_reportTypes.isEmpty) {
      try {
        _reportTypes = await _server.fetchReportTypes();
      } catch (_) {}
    }
    // ignore: use_build_context_synchronously
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 16,
            left: 16,
            right: 16,
            top: 16,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                kind == 'post' ? 'Denunciar Post' : 'Denunciar Comentário',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1D1B20),
                ),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<int>(
                decoration: const InputDecoration(
                  labelText: 'Tipo de denúncia',
                  border: OutlineInputBorder(),
                ),
                items:
                    _reportTypes
                        .map(
                          (t) => DropdownMenuItem<int>(
                            value:
                                _asInt(t['idtipodenuncia']) ??
                                _asInt(t['id']) ??
                                0,
                            child: Text(
                              (t['designacao'] ?? t['nome'] ?? 'Tipo')
                                  .toString(),
                            ),
                          ),
                        )
                        .toList(),
                onChanged: (v) => selectedTipo = v,
              ),
              const SizedBox(height: 12),
              TextField(
                controller: descCtrl,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'Descrição (opcional) ',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton(
                    onPressed: () => Navigator.of(ctx).pop(),
                    child: const Text('Cancelar'),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton(
                    onPressed: () async {
                      if (selectedTipo == null) return;
                      Navigator.of(ctx).pop();
                      bool ok = false;
                      if (kind == 'post') {
                        ok = await _server.reportPost(
                          id,
                          tipo: selectedTipo!,
                          descricao: descCtrl.text.trim(),
                        );
                      } else {
                        ok = await _server.reportComment(
                          id,
                          tipo: selectedTipo!,
                          descricao: descCtrl.text.trim(),
                        );
                      }
                      if (!mounted) return;
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(
                            ok ? 'Denúncia submetida.' : 'Falha ao denunciar.',
                          ),
                        ),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF00B0DA),
                      foregroundColor: Colors.white,
                    ),
                    child: const Text('Denunciar'),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  // Confirm deletions
  Future<void> _confirmDeletePost() async {
    final bool? go = await showDialog<bool>(
      context: context,
      builder:
          (ctx) => AlertDialog(
            title: const Text('Eliminar Post'),
            content: const Text('Tem a certeza que quer eliminar este post?'),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(ctx).pop(false),
                child: const Text('Não'),
              ),
              TextButton(
                onPressed: () => Navigator.of(ctx).pop(true),
                child: const Text('Sim'),
              ),
            ],
          ),
    );
    if (go == true) {
      final ok = await _server.deleteData('forum/post/${widget.id}');
      if (!mounted) return;
      if (ok) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Post eliminado.')));
        context.go('/forums');
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Falha ao eliminar post.')),
        );
      }
    }
  }

  Future<void> _confirmDeleteComment(int id, {int? parentId}) async {
    final bool? go = await showDialog<bool>(
      context: context,
      builder:
          (ctx) => AlertDialog(
            title: const Text('Eliminar Comentário'),
            content: const Text('Tem a certeza que quer eliminar?'),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(ctx).pop(false),
                child: const Text('Não'),
              ),
              TextButton(
                onPressed: () => Navigator.of(ctx).pop(true),
                child: const Text('Sim'),
              ),
            ],
          ),
    );
    if (go == true) {
      final ok = await _server.deleteData('forum/comment/$id');
      if (!mounted) return;
      if (ok) {
        if (parentId == null) {
          // remove from root comments
          setState(() {
            comments =
                comments.where((c) {
                  final cid = _asInt((c as Map)['idcomentario'] ?? (c)['id']);
                  return cid != id;
                }).toList();
          });
        } else {
          // refresh replies for parent
          if (_expanded.contains(parentId)) {
            await _toggleReplies(parentId);
            await _toggleReplies(parentId);
          }
        }
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Eliminado.')));
      } else {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Falha ao eliminar.')));
      }
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
                                  _asVote(post?['iteracao']) == true
                                      ? Icons.thumb_up_alt
                                      : Icons.thumb_up_alt_outlined,
                                  color:
                                      _asVote(post?['iteracao']) == true
                                          ? Colors.green
                                          : Colors.grey,
                                  size: 26,
                                ),
                              ),
                              Padding(
                                padding: const EdgeInsets.symmetric(
                                  vertical: 4,
                                ),
                                child: Text(
                                  '${_asInt(post?['pontuacao']) ?? 0}',
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
                                  _asVote(post?['iteracao']) == false
                                      ? Icons.thumb_down_alt
                                      : Icons.thumb_down_alt_outlined,
                                  color:
                                      _asVote(post?['iteracao']) == false
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
                                      onPressed:
                                          () => _openReport(
                                            kind: 'post',
                                            id: widget.id,
                                          ),
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
                                        onPressed: _confirmDeletePost,
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
                          final cid = _asInt(m['idcomentario'] ?? m['id']);
                          if (cid == null) {
                            return const SizedBox.shrink();
                          }
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
                                      onPressed:
                                          () => _openReport(
                                            kind: 'comment',
                                            id: cid,
                                          ),
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
                                        onPressed:
                                            () => _confirmDeleteComment(cid),
                                        tooltip: 'Eliminar',
                                      ),
                                    TextButton.icon(
                                      style: TextButton.styleFrom(
                                        padding: EdgeInsets.zero,
                                        foregroundColor: const Color(
                                          0xFF8F9BB3,
                                        ),
                                      ),
                                      onPressed: () => _toggleReplies(cid),
                                      icon: Icon(
                                        expanded
                                            ? Icons.remove_circle_outline
                                            : Icons.add_circle_outline,
                                        size: 18,
                                      ),
                                      label: Text(
                                        'Respostas (${_replyCountFor(cid, m)})',
                                        style: const TextStyle(fontSize: 12),
                                      ),
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
                                    padding: const EdgeInsets.only(top: 8.0),
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
                                            : Row(
                                              crossAxisAlignment:
                                                  CrossAxisAlignment.start,
                                              children: [
                                                // Thread guide line
                                                Container(
                                                  width: 3,
                                                  margin: const EdgeInsets.only(
                                                    left: 2,
                                                    right: 8,
                                                  ),
                                                  decoration: BoxDecoration(
                                                    color: const Color(
                                                      0xFFE5E7EB,
                                                    ),
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                          2,
                                                        ),
                                                  ),
                                                  height:
                                                      (replies.length * 88)
                                                          .clamp(40, 10000)
                                                          .toDouble(),
                                                ),
                                                Expanded(
                                                  child: Column(
                                                    children:
                                                        replies.map((r) {
                                                          final ra =
                                                              r
                                                                  as Map<
                                                                    String,
                                                                    dynamic
                                                                  >;
                                                          final rname =
                                                              _authorName(ra);
                                                          final rav =
                                                              _authorAvatar(ra);
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
                                                              color:
                                                                  const Color(
                                                                    0xFFF9FAFB,
                                                                  ),
                                                              borderRadius:
                                                                  BorderRadius.circular(
                                                                    10,
                                                                  ),
                                                              border: Border.all(
                                                                color:
                                                                    const Color(
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
                                                                    if (rav !=
                                                                            null &&
                                                                        rav.isNotEmpty)
                                                                      CircleAvatar(
                                                                        radius:
                                                                            9,
                                                                        backgroundImage:
                                                                            NetworkImage(
                                                                              rav,
                                                                            ),
                                                                      )
                                                                    else
                                                                      const CircleAvatar(
                                                                        radius:
                                                                            9,
                                                                        backgroundColor:
                                                                            Color(
                                                                              0xFF00B0DA,
                                                                            ),
                                                                        child: Icon(
                                                                          Icons
                                                                              .person,
                                                                          size:
                                                                              11,
                                                                          color:
                                                                              Colors.white,
                                                                        ),
                                                                      ),
                                                                    const SizedBox(
                                                                      width: 6,
                                                                    ),
                                                                    Expanded(
                                                                      child: Text(
                                                                        rname,
                                                                        maxLines:
                                                                            1,
                                                                        overflow:
                                                                            TextOverflow.ellipsis,
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
                                                                        Icons
                                                                            .flag,
                                                                        size:
                                                                            16,
                                                                        color: Color(
                                                                          0xFF8F9BB3,
                                                                        ),
                                                                      ),
                                                                      onPressed: () {
                                                                        final rid = _asInt(
                                                                          ra['idcomentario'] ??
                                                                              ra['id'],
                                                                        );
                                                                        if (rid !=
                                                                            null) {
                                                                          _openReport(
                                                                            kind:
                                                                                'comment',
                                                                            id:
                                                                                rid,
                                                                          );
                                                                        }
                                                                      },
                                                                    ),
                                                                    if (_isOwner(
                                                                      ra,
                                                                    ))
                                                                      IconButton(
                                                                        padding:
                                                                            EdgeInsets.zero,
                                                                        constraints:
                                                                            const BoxConstraints(),
                                                                        icon: const Icon(
                                                                          Icons
                                                                              .delete_outline,
                                                                          size:
                                                                              16,
                                                                          color: Color(
                                                                            0xFF8F9BB3,
                                                                          ),
                                                                        ),
                                                                        onPressed: () {
                                                                          final rid = _asInt(
                                                                            ra['idcomentario'] ??
                                                                                ra['id'],
                                                                          );
                                                                          if (rid !=
                                                                              null) {
                                                                            _confirmDeleteComment(
                                                                              rid,
                                                                              parentId:
                                                                                  cid,
                                                                            );
                                                                          }
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
                                                                  style: const TextStyle(
                                                                    fontSize:
                                                                        14,
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
