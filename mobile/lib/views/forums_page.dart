import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/backend/server.dart';
import '../middleware.dart';

class ForumsPage extends StatefulWidget {
  const ForumsPage({super.key});

  @override
  State<ForumsPage> createState() => _ForumsPageState();
}

class _ForumsPageState extends State<ForumsPage> {
  final Servidor _server = Servidor();
  final AppMiddleware _middleware = AppMiddleware();

  List<Map<String, dynamic>> categorias = [];
  List<Map<String, dynamic>> areas = [];
  List<Map<String, dynamic>> topicos = [];
  List<dynamic> posts = [];

  String? selectedCategoria;
  String? selectedArea;
  String? selectedTopico;
  String sortBy = 'recent';
  String topicSearch = '';

  bool loading = true;
  String? error;

  // Loading/error states for filters (consistent with course_filter.dart)
  bool _loadingCategorias = false;
  bool _loadingAreas = false;
  bool _loadingTopicos = false;
  String? _errorCategorias;
  String? _errorAreas;
  String? _errorTopicos;

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    await _fetchCategories();
    // Carregar posts iniciais (sem filtro de tópico) para mostrar conteúdo logo
    await _fetchPosts();
  }

  Future<void> _fetchCategories() async {
    setState(() {
      _loadingCategorias = true;
      _errorCategorias = null;
    });
    try {
      final data = await _middleware.fetchAllCategories();
      if (!mounted) return;
      setState(() {
        categorias = data;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorCategorias = 'Erro ao carregar categorias.';
      });
    } finally {
      if (mounted) setState(() => _loadingCategorias = false);
    }
  }

  Future<void> _fetchAreas() async {
    setState(() {
      _loadingAreas = true;
      _errorAreas = null;
      areas = [];
      topicos = [];
      posts = [];
      selectedArea = null;
      selectedTopico = null;
    });
    if (selectedCategoria == null || selectedCategoria!.isEmpty) {
      if (mounted) setState(() => _loadingAreas = false);
      return;
    }
    try {
      final data = await _middleware.fetchAreas(selectedCategoria!);
      if (!mounted) return;
      setState(() {
        areas = data;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorAreas = 'Erro ao carregar áreas.';
      });
    } finally {
      if (mounted) setState(() => _loadingAreas = false);
    }
    // Atualizar listagem de posts com o novo contexto de filtros
    await _fetchPosts();
  }

  Future<void> _fetchTopicos() async {
    setState(() {
      _loadingTopicos = true;
      _errorTopicos = null;
      topicos = [];
      posts = [];
      selectedTopico = null;
    });
    if (selectedArea == null || selectedArea!.isEmpty) {
      if (mounted) setState(() => _loadingTopicos = false);
      return;
    }
    try {
      final data = await _middleware.fetchTopics(selectedArea!);
      if (!mounted) return;
      setState(() {
        topicos = data;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorTopicos = 'Erro ao carregar tópicos.';
      });
    } finally {
      if (mounted) setState(() => _loadingTopicos = false);
    }
    // Atualizar listagem de posts com o novo contexto de filtros
    await _fetchPosts();
  }

  Future<void> _fetchPosts() async {
    setState(() {
      loading = true;
      error = null;
    });
    try {
      String url = 'forum/posts';
      if (selectedTopico != null && selectedTopico!.isNotEmpty) {
        url = 'forum/posts/topico/$selectedTopico';
      }
      final res = await _server.getData(
        url,
        queryParameters: {'order': sortBy == 'recent' ? 'recent' : 'top'},
      );
      posts = (res is List) ? res : [];
    } catch (e) {
      error = 'Erro ao carregar posts.';
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  // legacy signature kept previously is no longer used

  // Optimistic voting: update local state immediately, then call API; fallback to refetch on error
  Future<void> _votePostAtIndex(int index, String voteType) async {
    if (index < 0 || index >= posts.length) return;
    final Map<String, dynamic> p = Map<String, dynamic>.from(
      posts[index] as Map,
    );
    final int idpost = (p['idpost'] ?? p['id']) as int;
    final dynamic currentVote = p['iteracao']; // true, false or null
    int score = (p['pontuacao'] ?? 0) as int;

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

    // Apply optimistic update
    final updated =
        Map<String, dynamic>.from(p)
          ..['iteracao'] = newVote
          ..['pontuacao'] = score + delta;
    setState(() {
      posts[index] = updated;
    });

    // Call server; if it fails, refetch to realign
    final success = await _votePostById(
      idpost,
      voteType,
      currentVote,
      silent: true,
    );
    if (!success) {
      await _fetchPosts();
    }
  }

  Future<bool> _votePostById(
    int postId,
    String voteType,
    dynamic currentVote, {
    bool silent = false,
  }) async {
    try {
      if (voteType == 'upvote') {
        if (currentVote == true) {
          await _server.deleteData('forum/post/$postId/unvote');
        } else if (currentVote == false) {
          await _server.deleteData('forum/post/$postId/unvote');
          await _server.postData('forum/post/$postId/upvote', {});
        } else {
          await _server.postData('forum/post/$postId/upvote', {});
        }
      } else if (voteType == 'downvote') {
        if (currentVote == false) {
          await _server.deleteData('forum/post/$postId/unvote');
        } else if (currentVote == true) {
          await _server.deleteData('forum/post/$postId/unvote');
          await _server.postData('forum/post/$postId/downvote', {});
        } else {
          await _server.postData('forum/post/$postId/downvote', {});
        }
      }
      return true;
    } catch (e) {
      if (!silent && mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Erro ao votar')));
      }
      return false;
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
    // sometimes avatar may be at root
    final rootKeys = ['avatar', 'foto', 'avatarUrl'];
    for (final k in rootKeys) {
      final v = p[k];
      if (v != null && v.toString().isNotEmpty) return v.toString();
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF6F9FB),
      body: RefreshIndicator(
        onRefresh: _fetchPosts,
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 20.0),
          children: [
            // Título da página
            const Text(
              'Fóruns',
              style: TextStyle(
                fontSize: 25,
                fontWeight: FontWeight.bold,
                color: Color(0xFF007BFF),
              ),
            ),
            const SizedBox(height: 16),

            // Filtros (cartão) — alinhado com course_filter.dart
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
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Optional search within topics
                  TextField(
                    decoration: InputDecoration(
                      hintText: 'Pesquisar tópico...',
                      hintStyle: const TextStyle(color: Color(0xFF8F9BB3)),
                      filled: true,
                      fillColor: Colors.white,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10.0),
                        borderSide: const BorderSide(color: Color(0xFFD3DCE6)),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10.0),
                        borderSide: const BorderSide(color: Color(0xFFD3DCE6)),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10.0),
                        borderSide: const BorderSide(color: Color(0xFF007BFF)),
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        vertical: 12,
                        horizontal: 15,
                      ),
                    ),
                    onChanged: (val) {
                      topicSearch = val;
                      setState(() {});
                    },
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      // Categoria
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          value: selectedCategoria,
                          isExpanded: true,
                          decoration: InputDecoration(
                            filled: true,
                            fillColor: Colors.white,
                            labelText: 'Categoria',
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(10.0),
                              borderSide: const BorderSide(
                                color: Color(0xFFD3DCE6),
                              ),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(10.0),
                              borderSide: const BorderSide(
                                color: Color(0xFFD3DCE6),
                              ),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(10.0),
                              borderSide: const BorderSide(
                                color: Color(0xFF007BFF),
                              ),
                            ),
                            contentPadding: const EdgeInsets.symmetric(
                              vertical: 12,
                              horizontal: 15,
                            ),
                          ),
                          hint: Text(
                            _loadingCategorias
                                ? 'A carregar...'
                                : 'Todas as Categorias',
                          ),
                          items: [
                            const DropdownMenuItem(
                              value: null,
                              child: Text('Todas as Categorias'),
                            ),
                            ...categorias.map(
                              (c) => DropdownMenuItem(
                                value: c['idcategoria']?.toString(),
                                child: Text(c['designacao']?.toString() ?? ''),
                              ),
                            ),
                          ],
                          onChanged:
                              _loadingCategorias
                                  ? null
                                  : (val) async {
                                    setState(() {
                                      selectedCategoria = val;
                                      selectedArea = null;
                                      selectedTopico = null;
                                      areas = [];
                                      topicos = [];
                                    });
                                    if (val != null) {
                                      await _fetchAreas();
                                    } else {
                                      await _fetchPosts();
                                    }
                                  },
                          validator: (_) => _errorCategorias,
                        ),
                      ),
                      const SizedBox(width: 12),
                      // Área
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          value: selectedArea,
                          isExpanded: true,
                          decoration: InputDecoration(
                            filled: true,
                            fillColor: Colors.white,
                            labelText: 'Área',
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(10.0),
                              borderSide: const BorderSide(
                                color: Color(0xFFD3DCE6),
                              ),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(10.0),
                              borderSide: const BorderSide(
                                color: Color(0xFFD3DCE6),
                              ),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(10.0),
                              borderSide: const BorderSide(
                                color: Color(0xFF007BFF),
                              ),
                            ),
                            contentPadding: const EdgeInsets.symmetric(
                              vertical: 12,
                              horizontal: 15,
                            ),
                          ),
                          hint: Text(
                            _loadingAreas ? 'A carregar...' : 'Todas as Áreas',
                          ),
                          items: [
                            const DropdownMenuItem(
                              value: null,
                              child: Text('Todas as Áreas'),
                            ),
                            ...areas.map(
                              (a) => DropdownMenuItem(
                                value: a['idarea']?.toString(),
                                child: Text(a['designacao']?.toString() ?? ''),
                              ),
                            ),
                          ],
                          onChanged:
                              (selectedCategoria == null ||
                                      _loadingAreas ||
                                      areas.isEmpty)
                                  ? null
                                  : (val) async {
                                    setState(() {
                                      selectedArea = val;
                                      selectedTopico = null;
                                      topicos = [];
                                    });
                                    if (val != null) {
                                      await _fetchTopicos();
                                    } else {
                                      await _fetchPosts();
                                    }
                                  },
                          validator: (_) => _errorAreas,
                        ),
                      ),
                      const SizedBox(width: 12),
                      // Tópico
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          value: selectedTopico,
                          isExpanded: true,
                          decoration: InputDecoration(
                            filled: true,
                            fillColor: Colors.white,
                            labelText: 'Tópico',
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(10.0),
                              borderSide: const BorderSide(
                                color: Color(0xFFD3DCE6),
                              ),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(10.0),
                              borderSide: const BorderSide(
                                color: Color(0xFFD3DCE6),
                              ),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(10.0),
                              borderSide: const BorderSide(
                                color: Color(0xFF007BFF),
                              ),
                            ),
                            contentPadding: const EdgeInsets.symmetric(
                              vertical: 12,
                              horizontal: 15,
                            ),
                          ),
                          hint: Text(
                            _loadingTopicos
                                ? 'A carregar...'
                                : 'Todos os Tópicos',
                          ),
                          items: [
                            const DropdownMenuItem(
                              value: null,
                              child: Text('Todos os Tópicos'),
                            ),
                            ...topicos
                                .where((t) {
                                  final d =
                                      t['designacao']
                                          ?.toString()
                                          .toLowerCase() ??
                                      '';
                                  return topicSearch.isEmpty ||
                                      d.contains(topicSearch.toLowerCase());
                                })
                                .map(
                                  (t) => DropdownMenuItem(
                                    value: t['idtopico']?.toString(),
                                    child: Text(
                                      t['designacao']?.toString() ?? '',
                                    ),
                                  ),
                                ),
                          ],
                          onChanged:
                              (selectedArea == null ||
                                      _loadingTopicos ||
                                      topicos.isEmpty)
                                  ? null
                                  : (val) async {
                                    setState(() {
                                      selectedTopico = val;
                                    });
                                    await _fetchPosts();
                                  },
                          validator: (_) => _errorTopicos,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      ConstrainedBox(
                        constraints: const BoxConstraints(
                          minWidth: 180,
                          maxWidth: 480,
                        ),
                        child: DropdownButtonFormField<String>(
                          decoration: const InputDecoration(
                            labelText: 'Ordenar por',
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.all(
                                Radius.circular(12),
                              ),
                            ),
                          ),
                          isExpanded: true,
                          value: sortBy,
                          items: const [
                            DropdownMenuItem(
                              value: 'recent',
                              child: Text('Mais recentes'),
                            ),
                            DropdownMenuItem(
                              value: 'top',
                              child: Text('Mais votados'),
                            ),
                          ],
                          onChanged: (v) async {
                            sortBy = v ?? 'recent';
                            await _fetchPosts();
                          },
                        ),
                      ),
                      OutlinedButton(
                        onPressed: () async {
                          setState(() {
                            selectedCategoria = null;
                            selectedArea = null;
                            selectedTopico = null;
                            topicSearch = '';
                            areas = [];
                            topicos = [];
                          });
                          await _fetchPosts();
                        },
                        style: OutlinedButton.styleFrom(
                          foregroundColor: const Color(0xFF6B778C),
                          side: const BorderSide(color: Color(0xFFD3DCE6)),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 20,
                            vertical: 12,
                          ),
                        ),
                        child: const Text('Limpar filtros'),
                      ),
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF00B0DA),
                          foregroundColor: Colors.white,
                        ),
                        onPressed:
                            (selectedTopico == null || selectedTopico!.isEmpty)
                                ? null
                                : () => context
                                    .push(
                                      '/forum/create',
                                      extra: {
                                        'idtopico': selectedTopico,
                                        'topicos': topicos,
                                      },
                                    )
                                    .then((_) => _fetchPosts()),
                        icon: const Icon(Icons.add),
                        label: const Text('Criar Post'),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Lista de posts
            if (loading)
              const Center(
                child: Padding(
                  padding: EdgeInsets.symmetric(vertical: 40),
                  child: CircularProgressIndicator(),
                ),
              )
            else if (error != null)
              Padding(
                padding: const EdgeInsets.all(12.0),
                child: Center(
                  child: Text(
                    error!,
                    style: const TextStyle(color: Colors.red),
                  ),
                ),
              )
            else if (posts.isEmpty)
              const Padding(
                padding: EdgeInsets.all(24.0),
                child: Center(child: Text('Sem posts para mostrar.')),
              )
            else
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: posts.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (context, idx) {
                  final p = posts[idx] as Map<String, dynamic>;
                  final idpost = p['idpost'] ?? p['id'];
                  // iteracao handled directly from posts[idx]
                  final score = p['pontuacao'] ?? 0;
                  final titulo = p['titulo'] ?? p['title'] ?? '—';
                  final conteudo = p['conteudo'] ?? p['content'] ?? '';
                  final preview =
                      conteudo.toString().length > 150
                          ? '${conteudo.toString().substring(0, 150)}...'
                          : conteudo.toString();
                  // author is now derived on render via _authorName(p)
                  final dynamic rawComments =
                      p['ncomentarios'] ??
                      p['comentarios'] ??
                      p['comments'] ??
                      0;
                  final String commentsCount = rawComments.toString();

                  return GestureDetector(
                    onTap: () => context.push('/forum_post/$idpost'),
                    child: Container(
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
                          // Voting column
                          Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              IconButton(
                                onPressed:
                                    () => _votePostAtIndex(idx, 'upvote'),
                                icon: Icon(
                                  (posts[idx] as Map)['iteracao'] == true
                                      ? Icons.thumb_up_alt
                                      : Icons.thumb_up_alt_outlined,
                                  color:
                                      (posts[idx] as Map)['iteracao'] == true
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
                                  '${(posts[idx] as Map)['pontuacao'] ?? score}',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                              IconButton(
                                onPressed:
                                    () => _votePostAtIndex(idx, 'downvote'),
                                icon: Icon(
                                  (posts[idx] as Map)['iteracao'] == false
                                      ? Icons.thumb_down_alt
                                      : Icons.thumb_down_alt_outlined,
                                  color:
                                      (posts[idx] as Map)['iteracao'] == false
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
                                // Header: avatar + author name
                                Row(
                                  children: [
                                    Builder(
                                      builder: (_) {
                                        final avatar = _authorAvatar(p);
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
                                        _authorName(p),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(
                                          fontSize: 12,
                                          color: Color(0xFF8F9BB3),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  titulo.toString(),
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16,
                                    color: Color(0xFF222B45),
                                  ),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  preview,
                                  maxLines: 3,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    fontSize: 14,
                                    color: Color(0xFF49454F),
                                  ),
                                ),
                                const SizedBox(height: 8),
                                // Footer meta: comments count
                                Row(
                                  children: [
                                    const Icon(
                                      Icons.comment,
                                      size: 14,
                                      color: Color(0xFF8F9BB3),
                                    ),
                                    const SizedBox(width: 4),
                                    Text(
                                      commentsCount,
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
                  );
                },
              ),
          ],
        ),
      ),
    );
  }
}
