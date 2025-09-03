import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/backend/server.dart';
import 'package:mobile/backend/shared_preferences.dart' as prefs;
import 'package:mobile/components/submission_file_preview.dart';

class PostDetailsPage extends StatefulWidget {
  final int id;
  const PostDetailsPage({super.key, required this.id});

  @override
  State<PostDetailsPage> createState() => _PostDetailsPageState();
}

class _PostDetailsPageState extends State<PostDetailsPage> {
  final _server = Servidor();
  bool loading = true;
  String? error;
  Map<String, dynamic>? post;
  List<dynamic> comments = [];

  // Tipos de denúncia (cache)
  List<dynamic> _reportTypes = [];

  // Estado de respostas/interações
  final Map<int, List<dynamic>> _replies = {};
  final Set<int> _expanded = {};
  final Set<int> _loadingReplies = {};
  final Set<int> _replyBoxOpen = {};
  // Se o comentário tem filhos (true/false); null = desconhecido
  final Map<int, bool> _hasChildren = {};
  // Cache de nomes de tópicos (id -> designação)
  Map<int, String> _topicMap = {};

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
    try {
      _reportTypes = await _server.fetchReportTypes();
    } catch (_) {}
    // Pré-carregar nomes dos tópicos
    await _loadTopicMap();
    await _fetch();
  }

  Future<void> _loadTopicMap() async {
    try {
      final res = await _server.getData('topico/list');
      if (res is List) {
        final map = <int, String>{};
        for (final it in res) {
          if (it is Map) {
            final id = _asInt(it['idtopico'] ?? it['id']);
            final name = (it['designacao'] ?? it['nome'])?.toString();
            if (id != null && name != null && name.trim().isNotEmpty) {
              map[id] = name.trim();
            }
          }
        }
        if (mounted) setState(() => _topicMap = map);
      }
    } catch (_) {
      // ignorar; melhor esforço
    }
  }

  Future<void> _fetch() async {
    setState(() {
      loading = true;
      error = null;
    });
    try {
      final p = await _server.getData('forum/post/${widget.id}');
      if (p is Map<String, dynamic>) post = p;

      final c = await _server.getData('forum/post/${widget.id}/comment');
      comments =
          (c is List)
              ? c
              : (c is Map && c['data'] is List)
              ? List.from(c['data'] as List)
              : [];
      // Pré-popular _hasChildren com pistas existentes
      for (final e in comments) {
        if (e is Map<String, dynamic>) {
          final id = _asInt(e['idcomentario'] ?? e['id']);
          if (id != null) {
            final inf = _inferHasChildren(e);
            if (inf != null) {
              _hasChildren[id] = inf;
            }
          }
        }
      }
    } catch (e) {
      error = 'Erro a carregar post.';
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  int? _asInt(dynamic v) {
    if (v == null) return null;
    if (v is int) return v;
    if (v is String) return int.tryParse(v);
    if (v is double) return v.toInt();
    return null;
  }

  // Indentação à esquerda por nível de profundidade (mantém a margem direita alinhada)
  double _leftIndentForDepth(int depth) {
    final d = depth < 0 ? 0 : depth;
    final v = d * 16.0; // 16 logical px per level for clearer step
    return v.clamp(0.0, 160.0); // cap at 160px
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
      if (s == 'false' || s == '-1' || s == 'down' || s == 'downvote')
        return false;
      return null;
    }
    return null;
  }

  bool? _inferHasChildren(Map<String, dynamic> m) {
    // Procura chaves comuns que indiquem filhos/respostas
    final candidatesList = [
      m['replies'],
      m['respostas'],
      m['children'],
      m['filhos'],
    ];
    for (final c in candidatesList) {
      if (c is List) return c.isNotEmpty ? true : false;
    }
    final candidatesCount = [
      m['repliesCount'],
      m['replyCount'],
      m['numRespostas'],
      m['qtdRespostas'],
      m['countRespostas'],
      m['childrenCount'],
      m['numeroRespostas'],
      m['temRespostas'],
      m['temFilhos'],
    ];
    for (final c in candidatesCount) {
      if (c is int) return c > 0;
      if (c is bool) return c;
      if (c is String) {
        final n = int.tryParse(c);
        if (n != null) return n > 0;
        final s = c.toLowerCase();
        if (s == 'true' || s == 'yes' || s == 'sim') return true;
        if (s == 'false' || s == 'no' || s == 'nao' || s == 'não') {
          return false;
        }
      }
    }
    return null; // desconhecido
  }

  // Evidência explícita de não ter filhos
  bool _explicitlyNoChildren(Map<String, dynamic> m) {
    // pistas booleanas
    final b = m['temRespostas'] ?? m['temFilhos'];
    if (b is bool && b == false) return true;
    if (b is String) {
      final s = b.toLowerCase();
      if (s == 'false' || s == 'no' || s == 'nao' || s == 'não') return true;
    }
    // pistas por contagem
    final countKeys = [
      'repliesCount',
      'replyCount',
      'numRespostas',
      'qtdRespostas',
      'countRespostas',
      'childrenCount',
      'numeroRespostas',
    ];
    for (final k in countKeys) {
      final v = m[k];
      if (v is int && v == 0) return true;
      if (v is String) {
        final n = int.tryParse(v);
        if (n != null && n == 0) return true;
      }
    }
    return false;
  }

  bool _shouldShowToggle(Map<String, dynamic> item, int id) {
    // Se já expandido, mostrar para permitir recolher
    if (_expanded.contains(id)) return true;
    // Se já carregámos este ramo, só mostrar se houver filhos
    if (_replies.containsKey(id)) {
      final list = _replies[id];
      return (list != null && list.isNotEmpty);
    }
    // Cache indica que tem filhos
    if (_hasChildren[id] == true) return true;
    // Evidência explícita que não tem filhos
    if (_explicitlyNoChildren(item)) return false;
    // Desconhecido: mostrar para permitir carregar
    return true;
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

  // Contagens de respostas removidas do UI

  String? _topicNameOf(Map<String, dynamic> p) {
    final t = p['topico'];
    if (t is Map) {
      final n = (t['designacao'] ?? t['nome'] ?? t['title'])?.toString();
      if (n != null && n.trim().isNotEmpty) return n.trim();
    }
    final flat =
        (p['topicoNome'] ??
            p['nomeTopico'] ??
            p['designacaoTopico'] ??
            p['topic'] ??
            p['topicName']);
    if (flat is String && flat.trim().isNotEmpty) return flat.trim();
    int? idtopico = _asInt(
      p['idtopico'] ??
          p['idTopico'] ??
          p['topicoId'] ??
          p['id_topico'] ??
          p['id_topic'],
    );
    if (idtopico == null) {
      if (t is int) idtopico = t;
      if (t is String) idtopico = int.tryParse(t);
      if (t is Map) {
        idtopico = _asInt(t['idtopico'] ?? t['idTopico'] ?? t['id']);
      }
    }
    if (idtopico != null) {
      final cached = _topicMap[idtopico];
      if (cached != null && cached.trim().isNotEmpty) return cached.trim();
    }
    return null;
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
        _hasChildren[commentId] = list.isNotEmpty;
        if (list.isEmpty) {
          _expanded.remove(commentId);
        }
      });
    } catch (_) {
    } finally {
      setState(() => _loadingReplies.remove(commentId));
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
        await _toggleReplies(commentId);
        await _toggleReplies(commentId);
      }
    } catch (_) {}
  }

  Future<void> _handleVote(
    int postId,
    String voteType,
    dynamic currentVote,
  ) async {
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
          delta = 1; // correção: remover downvote soma 1
        } else if (cur == true) {
          newVote = false;
          delta = -2;
        } else {
          newVote = false;
          delta = -1;
        }
      }

      setState(
        () =>
            post = {
              ...current,
              'iteracao': newVote,
              'pontuacao': score + delta,
            },
      );

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
    } catch (_) {
      await _fetch();
    }
  }

  // Votação optimista (respostas)
  Future<void> _voteReply({
    required int parentId,
    required int commentId,
    required String voteType,
    required dynamic currentVote,
  }) async {
    final list = _replies[parentId];
    if (list == null) return;
    final idx = list.indexWhere((e) {
      final m = e as Map<String, dynamic>;
      final id = _asInt(m['idcomentario'] ?? m['id']);
      return id == commentId;
    });
    if (idx < 0) return;

    final Map<String, dynamic> item = Map<String, dynamic>.from(
      list[idx] as Map,
    );
    final int score = _asInt(item['pontuacao']) ?? 0;
    final bool? cur = _asVote(item['iteracao']);

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
        delta = 1; // lógica simétrica
      } else if (cur == true) {
        newVote = false;
        delta = -2;
      } else {
        newVote = false;
        delta = -1;
      }
    }

    final updated =
        Map<String, dynamic>.from(item)
          ..['iteracao'] = newVote
          ..['pontuacao'] = score + delta;
    setState(() {
      _replies[parentId]![idx] = updated;
    });

    try {
      if (voteType == 'upvote') {
        if (cur == true) {
          await _server.deleteData('forum/comment/$commentId/unvote');
        } else if (cur == false) {
          await _server.deleteData('forum/comment/$commentId/unvote');
          await _server.postData('forum/comment/$commentId/upvote', {});
        } else {
          await _server.postData('forum/comment/$commentId/upvote', {});
        }
      } else {
        if (cur == false) {
          await _server.deleteData('forum/comment/$commentId/unvote');
        } else if (cur == true) {
          await _server.deleteData('forum/comment/$commentId/unvote');
          await _server.postData('forum/comment/$commentId/downvote', {});
        } else {
          await _server.postData('forum/comment/$commentId/downvote', {});
        }
      }
    } catch (_) {
      if (_expanded.contains(parentId)) {
        await _toggleReplies(parentId);
        await _toggleReplies(parentId);
      }
    }
  }

  // Votação optimista (comentários de topo)
  Future<void> _voteComment({
    required int commentId,
    required String voteType,
    required dynamic currentVote,
  }) async {
    final idx = comments.indexWhere((e) {
      final m = e as Map<String, dynamic>;
      final id = _asInt(m['idcomentario'] ?? m['id']);
      return id == commentId;
    });
    if (idx < 0) return;

    final Map<String, dynamic> item = Map<String, dynamic>.from(
      comments[idx] as Map,
    );
    final int score = _asInt(item['pontuacao']) ?? 0;
    final bool? cur = _asVote(item['iteracao']);

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
        delta = 1; // lógica simétrica
      } else if (cur == true) {
        newVote = false;
        delta = -2;
      } else {
        newVote = false;
        delta = -1;
      }
    }

    final updated =
        Map<String, dynamic>.from(item)
          ..['iteracao'] = newVote
          ..['pontuacao'] = score + delta;
    setState(() {
      comments[idx] = updated;
    });

    try {
      if (voteType == 'upvote') {
        if (cur == true) {
          await _server.deleteData('forum/comment/$commentId/unvote');
        } else if (cur == false) {
          await _server.deleteData('forum/comment/$commentId/unvote');
          await _server.postData('forum/comment/$commentId/upvote', {});
        } else {
          await _server.postData('forum/comment/$commentId/upvote', {});
        }
      } else {
        if (cur == false) {
          await _server.deleteData('forum/comment/$commentId/unvote');
        } else if (cur == true) {
          await _server.deleteData('forum/comment/$commentId/unvote');
          await _server.postData('forum/comment/$commentId/downvote', {});
        } else {
          await _server.postData('forum/comment/$commentId/downvote', {});
        }
      }
    } catch (_) {
      await _fetch();
    }
  }

  void _openReport({required String kind, required int id}) async {
    int? selectedTipo;
    final TextEditingController descCtrl = TextEditingController();

    if (_reportTypes.isEmpty) {
      try {
        _reportTypes = await _server.fetchReportTypes();
      } catch (_) {}
    }

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
                isExpanded: true,
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
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
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
          // comentário de topo removido localmente
          setState(() {
            comments =
                comments.where((c) {
                  final cid = _asInt((c as Map)['idcomentario'] ?? (c)['id']);
                  return cid != id;
                }).toList();
          });
        } else {
          // resposta filha removida; refrescar o ramo se expandido
          if (_expanded.contains(parentId)) {
            await _toggleReplies(parentId); // collapse
            await _toggleReplies(parentId); // expand reload
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

  Widget _buildReplyThread(int parentId, {int depth = 1}) {
    final items = _replies[parentId] ?? const <dynamic>[];
    if (items.isEmpty) return const SizedBox.shrink();

    return Column(
      children:
          items.map((r) {
            final ra = r as Map<String, dynamic>;
            final rid = _asInt(ra['idcomentario'] ?? ra['id']);
            if (rid == null) return const SizedBox.shrink();
            final rname = _authorName(ra);
            final rav = _authorAvatar(ra);
            final expanded = _expanded.contains(rid);
            final loading = _loadingReplies.contains(rid);
            // Guardar em cache se tem filhos (se houver pista)
            final inferredChild = _inferHasChildren(ra);
            if (inferredChild != null) {
              _hasChildren[rid] = inferredChild;
            }
            final replyCtrl = _replyCtrls.putIfAbsent(
              rid,
              () => TextEditingController(),
            );
            // Mantém a margem direita alinhada; reduz da esquerda por nível
            final double leftIndent = _leftIndentForDepth(depth);

            return Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Estrutura do bloco da resposta
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (leftIndent > 0) SizedBox(width: leftIndent),
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.fromLTRB(10, 10, 10, 10),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF9FAFB),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: const Color(0xFFE5E7EB)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  if (rav != null && rav.isNotEmpty)
                                    CircleAvatar(
                                      radius: 9,
                                      backgroundImage: NetworkImage(rav),
                                    )
                                  else
                                    const CircleAvatar(
                                      radius: 9,
                                      backgroundColor: Color(0xFF00B0DA),
                                      child: Icon(
                                        Icons.person,
                                        size: 11,
                                        color: Colors.white,
                                      ),
                                    ),
                                  const SizedBox(width: 6),
                                  Expanded(
                                    child: Text(
                                      rname,
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
                                    visualDensity: const VisualDensity(
                                      horizontal: -4,
                                      vertical: -4,
                                    ),
                                    splashRadius: 14,
                                    icon: const Icon(
                                      Icons.flag,
                                      size: 14,
                                      color: Color(0xFF8F9BB3),
                                    ),
                                    onPressed:
                                        () => _openReport(
                                          kind: 'comment',
                                          id: rid,
                                        ),
                                  ),
                                  if (_isOwner(ra))
                                    IconButton(
                                      padding: EdgeInsets.zero,
                                      constraints: const BoxConstraints(),
                                      visualDensity: const VisualDensity(
                                        horizontal: -4,
                                        vertical: -4,
                                      ),
                                      splashRadius: 14,
                                      icon: const Icon(
                                        Icons.delete_outline,
                                        size: 14,
                                        color: Color(0xFF8F9BB3),
                                      ),
                                      onPressed:
                                          () => _confirmDeleteComment(
                                            rid,
                                            parentId: parentId,
                                          ),
                                    ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text(
                                (ra['conteudo'] ?? ra['content'] ?? '')
                                    .toString(),
                                style: const TextStyle(
                                  fontSize: 14,
                                  color: Color(0xFF49454F),
                                ),
                              ),
                              const SizedBox(height: 6),
                              Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  IconButton(
                                    padding: EdgeInsets.zero,
                                    constraints: const BoxConstraints(),
                                    visualDensity: const VisualDensity(
                                      horizontal: -2,
                                      vertical: -2,
                                    ),
                                    splashRadius: 18,
                                    icon: const Icon(Icons.reply, size: 18),
                                    tooltip: 'Responder',
                                    onPressed: () {
                                      setState(() {
                                        if (_replyBoxOpen.contains(rid)) {
                                          _replyBoxOpen.remove(rid);
                                        } else {
                                          _replyBoxOpen.add(rid);
                                        }
                                      });
                                    },
                                  ),
                                  const SizedBox(width: 1),
                                  // Voting for replies
                                  IconButton(
                                    padding: EdgeInsets.zero,
                                    constraints: const BoxConstraints(),
                                    visualDensity: const VisualDensity(
                                      horizontal: -2,
                                      vertical: -2,
                                    ),
                                    splashRadius: 18,
                                    icon: Icon(
                                      _asVote(ra['iteracao']) == true
                                          ? Icons.thumb_up_alt
                                          : Icons.thumb_up_alt_outlined,
                                      size: 18,
                                      color:
                                          _asVote(ra['iteracao']) == true
                                              ? Colors.green
                                              : const Color(0xFF8F9BB3),
                                    ),
                                    tooltip: 'Gostei',
                                    onPressed:
                                        () => _voteReply(
                                          parentId: parentId,
                                          commentId: rid,
                                          voteType: 'upvote',
                                          currentVote: ra['iteracao'],
                                        ),
                                  ),
                                  Text(
                                    '${_asInt(ra['pontuacao']) ?? 0}',
                                    style: const TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.bold,
                                      color: Color(0xFF8F9BB3),
                                    ),
                                  ),
                                  IconButton(
                                    padding: EdgeInsets.zero,
                                    constraints: const BoxConstraints(),
                                    visualDensity: const VisualDensity(
                                      horizontal: -2,
                                      vertical: -2,
                                    ),
                                    splashRadius: 18,
                                    icon: Icon(
                                      _asVote(ra['iteracao']) == false
                                          ? Icons.thumb_down_alt
                                          : Icons.thumb_down_alt_outlined,
                                      size: 18,
                                      color:
                                          _asVote(ra['iteracao']) == false
                                              ? Colors.red
                                              : const Color(0xFF8F9BB3),
                                    ),
                                    tooltip: 'Não gostei',
                                    onPressed:
                                        () => _voteReply(
                                          parentId: parentId,
                                          commentId: rid,
                                          voteType: 'downvote',
                                          currentVote: ra['iteracao'],
                                        ),
                                  ),
                                  const SizedBox(width: 1),
                                  Builder(
                                    builder: (_) {
                                      final bool show = _shouldShowToggle(
                                        ra,
                                        rid,
                                      );
                                      if (!show) return const SizedBox();
                                      return IconButton(
                                        padding: EdgeInsets.zero,
                                        constraints: const BoxConstraints(),
                                        onPressed: () => _toggleReplies(rid),
                                        icon: Icon(
                                          expanded
                                              ? Icons.remove_circle_outline
                                              : Icons.add_circle_outline,
                                          size: 18,
                                          color: const Color(0xFF8F9BB3),
                                        ),
                                        visualDensity: const VisualDensity(
                                          horizontal: -2,
                                          vertical: -2,
                                        ),
                                        splashRadius: 18,
                                        tooltip: 'Respostas',
                                      );
                                    },
                                  ),
                                ],
                              ),
                              if (_replyBoxOpen.contains(rid))
                                Padding(
                                  padding: const EdgeInsets.only(top: 6.0),
                                  child: Row(
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
                                        onPressed: () => _submitReply(rid),
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
                                ),
                              // Sub-thread renderizada abaixo
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  if (expanded)
                    Padding(
                      padding: const EdgeInsets.only(top: 6.0),
                      child:
                          loading
                              ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                ),
                              )
                              : _buildReplyThread(rid, depth: depth + 1),
                    ),
                ],
              ),
            );
          }).toList(),
    );
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
                          // Coluna de votação
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
                          const SizedBox(height: 8),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
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
                                      visualDensity: const VisualDensity(
                                        horizontal: -4,
                                        vertical: -4,
                                      ),
                                      splashRadius: 16,
                                      icon: const Icon(
                                        Icons.flag,
                                        size: 16,
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
                                        visualDensity: const VisualDensity(
                                          horizontal: -4,
                                          vertical: -4,
                                        ),
                                        splashRadius: 16,
                                        icon: const Icon(
                                          Icons.delete_outline,
                                          size: 16,
                                          color: Color(0xFF8F9BB3),
                                        ),
                                        onPressed: _confirmDeletePost,
                                        tooltip: 'Eliminar',
                                      ),
                                  ],
                                ),
                                // Nome do tópico (quando disponível)
                                Builder(
                                  builder: (_) {
                                    final topic = _topicNameOf(post!);
                                    if (topic == null || topic.isEmpty) {
                                      return const SizedBox.shrink();
                                    }
                                    return Padding(
                                      padding: const EdgeInsets.only(top: 6.0),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          const Icon(
                                            Icons.label_important_outline,
                                            size: 14,
                                            color: Color(0xFF6C757D),
                                          ),
                                          const SizedBox(width: 6),
                                          Flexible(
                                            child: Text(
                                              'Tópico: $topic',
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                              style: const TextStyle(
                                                fontSize: 12,
                                                color: Color(0xFF6C757D),
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    );
                                  },
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
                                // Pré-visualização de anexo (se existir)
                                Builder(
                                  builder: (_) {
                                    final raw =
                                        post!['anexo'] ??
                                        post!['anexoUrl'] ??
                                        post!['attachment'] ??
                                        post!['ficheiro'];
                                    final url = raw?.toString();
                                    if (url == null || url.isEmpty) {
                                      return const SizedBox.shrink();
                                    }
                                    final resolved =
                                        url.startsWith('http')
                                            ? url
                                            : '${_server.urlAPI}$url';
                                    return Padding(
                                      padding: const EdgeInsets.only(top: 8.0),
                                      child: SubmissionFilePreview(
                                        url: resolved,
                                      ),
                                    );
                                  },
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
                    // Caixa para novo comentário
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
                          if (cid == null) return const SizedBox.shrink();
                          final authorName = _authorName(m);
                          final avatar = _authorAvatar(m);
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
                                      visualDensity: const VisualDensity(
                                        horizontal: -4,
                                        vertical: -4,
                                      ),
                                      splashRadius: 14,
                                      icon: const Icon(
                                        Icons.flag,
                                        size: 14,
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
                                        visualDensity: const VisualDensity(
                                          horizontal: -4,
                                          vertical: -4,
                                        ),
                                        splashRadius: 14,
                                        icon: const Icon(
                                          Icons.delete_outline,
                                          size: 14,
                                          color: Color(0xFF8F9BB3),
                                        ),
                                        onPressed:
                                            () => _confirmDeleteComment(cid),
                                        tooltip: 'Eliminar',
                                      ),
                                    if (_shouldShowToggle(m, cid))
                                      IconButton(
                                        padding: EdgeInsets.zero,
                                        constraints: const BoxConstraints(),
                                        visualDensity: const VisualDensity(
                                          horizontal: -2,
                                          vertical: -2,
                                        ),
                                        splashRadius: 18,
                                        onPressed: () => _toggleReplies(cid),
                                        icon: Icon(
                                          expanded
                                              ? Icons.remove_circle_outline
                                              : Icons.add_circle_outline,
                                          size: 18,
                                          color: const Color(0xFF8F9BB3),
                                        ),
                                        tooltip: 'Respostas',
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
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    IconButton(
                                      padding: EdgeInsets.zero,
                                      constraints: const BoxConstraints(),
                                      visualDensity: const VisualDensity(
                                        horizontal: -2,
                                        vertical: -2,
                                      ),
                                      splashRadius: 18,
                                      icon: const Icon(Icons.reply, size: 18),
                                      tooltip: 'Responder',
                                      onPressed: () {
                                        setState(() {
                                          if (_replyBoxOpen.contains(cid)) {
                                            _replyBoxOpen.remove(cid);
                                          } else {
                                            _replyBoxOpen.add(cid);
                                          }
                                        });
                                      },
                                    ),
                                    const SizedBox(width: 2),
                                    // Votação em comentários de topo
                                    IconButton(
                                      padding: EdgeInsets.zero,
                                      constraints: const BoxConstraints(),
                                      visualDensity: const VisualDensity(
                                        horizontal: -2,
                                        vertical: -2,
                                      ),
                                      splashRadius: 18,
                                      icon: Icon(
                                        _asVote(m['iteracao']) == true
                                            ? Icons.thumb_up_alt
                                            : Icons.thumb_up_alt_outlined,
                                        size: 18,
                                        color:
                                            _asVote(m['iteracao']) == true
                                                ? Colors.green
                                                : const Color(0xFF8F9BB3),
                                      ),
                                      tooltip: 'Gostei',
                                      onPressed:
                                          () => _voteComment(
                                            commentId: cid,
                                            voteType: 'upvote',
                                            currentVote: m['iteracao'],
                                          ),
                                    ),
                                    Text(
                                      '${_asInt(m['pontuacao']) ?? 0}',
                                      style: const TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.bold,
                                        color: Color(0xFF8F9BB3),
                                      ),
                                    ),
                                    IconButton(
                                      padding: EdgeInsets.zero,
                                      constraints: const BoxConstraints(),
                                      visualDensity: const VisualDensity(
                                        horizontal: -2,
                                        vertical: -2,
                                      ),
                                      splashRadius: 18,
                                      icon: Icon(
                                        _asVote(m['iteracao']) == false
                                            ? Icons.thumb_down_alt
                                            : Icons.thumb_down_alt_outlined,
                                        size: 18,
                                        color:
                                            _asVote(m['iteracao']) == false
                                                ? Colors.red
                                                : const Color(0xFF8F9BB3),
                                      ),
                                      tooltip: 'Não gostei',
                                      onPressed:
                                          () => _voteComment(
                                            commentId: cid,
                                            voteType: 'downvote',
                                            currentVote: m['iteracao'],
                                          ),
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
                                            : _buildReplyThread(cid, depth: 1),
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
