import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/backend/server.dart';
import '../middleware.dart';
import 'package:mobile/components/submission_file_preview.dart';

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
  // Cache de nomes de tópicos (id -> designação)
  Map<int, String> _topicMap = {};

  String? selectedCategoria;
  String? selectedArea;
  String? selectedTopico;
  String sortBy = 'top';
  String topicSearch = '';

  bool loading = true;
  String? error;

  // Estados de carregamento/erro dos filtros
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
    // Arranque: mapa de tópicos e posts
    await _loadTopicMap();
    await _fetchPosts();
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
    } catch (_) {}
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

  // Pesquisa por tópico (texto -> id) e aplica filtro
  Future<void> _applyTopicSearch() async {
    final term = topicSearch.trim().toLowerCase();
    if (term.isEmpty) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Escreva um tópico para procurar.')),
        );
      }
      return;
    }

    // Tentar na lista atual
    int? matchId;
    for (final Map<String, dynamic> t in topicos) {
      final name = (t['designacao'] ?? t['nome'])?.toString().toLowerCase();
      if (name != null && name.contains(term)) {
        matchId = _asInt(t['idtopico'] ?? t['idTopico'] ?? t['id']);
        break;
      }
    }
    // Recurso ao cache global
    if (matchId == null && _topicMap.isNotEmpty) {
      try {
        matchId =
            _topicMap.entries
                .firstWhere(
                  (e) => e.value.toLowerCase().contains(term),
                  orElse: () => const MapEntry(-1, ''),
                )
                .key;
        if (matchId == -1) matchId = null;
      } catch (_) {}
    }

    if (matchId == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Nenhum tópico encontrado para '$term'.")),
        );
      }
      return;
    }

    setState(() {
      selectedTopico = matchId!.toString();
    });
    await _fetchPosts();
  }

  // Votação otimista: atualiza localmente e sincroniza com a API (reverte em falha)
  Future<void> _votePostAtIndex(int index, String voteType) async {
    if (index < 0 || index >= posts.length) return;
    final Map<String, dynamic> p = Map<String, dynamic>.from(
      posts[index] as Map,
    );
    final int? idpost = _asInt(p['idpost'] ?? p['id']);
    final bool? currentVote = _asVote(p['iteracao']); // normalize types
    int score = _asInt(p['pontuacao']) ?? 0;

    bool? newVote = currentVote;
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
        delta = 1; // fix: removing a downvote should increase by 1
      } else if (currentVote == true) {
        newVote = false;
        delta = -2;
      } else {
        newVote = false;
        delta = -1;
      }
    }

    final updated =
        Map<String, dynamic>.from(p)
          ..['iteracao'] = newVote
          ..['pontuacao'] = score + delta;
    setState(() {
      posts[index] = updated;
    });

    if (idpost != null) {
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
        if (v != null && v.toString().isNotEmpty) {
          final s = v.toString();
          return s.startsWith('http') ? s : '${_server.urlAPI}$s';
        }
      }
    }
    // Avatar pode vir no objeto raiz (fallback)
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

    // Try resolve by id using the loaded topics list
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
      final dynamic found = topicos.firstWhere((e) {
        final mid = _asInt(e['idtopico'] ?? e['idTopico'] ?? e['id']);
        return mid == idtopico;
      }, orElse: () => <String, dynamic>{});
      if (found is Map && found.isNotEmpty) {
        final name = (found['designacao'] ?? found['nome'])?.toString();
        if (name != null && name.trim().isNotEmpty) return name.trim();
      }
      // As a last resort, if we're filtered by a specific topic, use that selection's name
      if (selectedTopico != null && selectedTopico!.isNotEmpty) {
        final selId = int.tryParse(selectedTopico!);
        if (selId != null && selId == idtopico) {
          final dynSel = topicos.firstWhere((e) {
            final mid = _asInt(e['idtopico'] ?? e['idTopico'] ?? e['id']);
            return mid == selId;
          }, orElse: () => <String, dynamic>{});
          if (dynSel.isNotEmpty) {
            final name = (dynSel['designacao'] ?? dynSel['nome'])?.toString();
            if (name != null && name.trim().isNotEmpty) return name.trim();
          }
        }
      }
      // Global cache fallback
      final cached = _topicMap[idtopico];
      if (cached != null && cached.trim().isNotEmpty) return cached.trim();
    }
    return null;
  }

  // Opções do dropdown de tópicos (garante seleção presente)
  List<DropdownMenuItem<String?>> _topicDropdownItems() {
    final List<DropdownMenuItem<String?>> items = [
      const DropdownMenuItem<String?>(
        value: null,
        child: Text('Todos os Tópicos'),
      ),
    ];

    final seen = <String>{};
    for (final t in topicos) {
      final name = t['designacao']?.toString() ?? '';
      if (topicSearch.isNotEmpty &&
          !name.toLowerCase().contains(topicSearch.toLowerCase())) {
        continue;
      }
      final id = t['idtopico']?.toString();
      if (id == null || id.isEmpty) continue;
      if (seen.add(id)) {
        items.add(DropdownMenuItem<String?>(value: id, child: Text(name)));
      }
    }

    if (selectedTopico != null && selectedTopico!.isNotEmpty) {
      final alreadyIn = items.any((i) => i.value == selectedTopico);
      if (!alreadyIn) {
        final idInt = int.tryParse(selectedTopico!);
        final fallbackName = idInt != null ? _topicMap[idInt] : null;
        items.add(
          DropdownMenuItem<String?>(
            value: selectedTopico,
            child: Text(
              (fallbackName != null && fallbackName.isNotEmpty)
                  ? fallbackName
                  : 'Tópico #${selectedTopico!}',
            ),
          ),
        );
      }
    }

    return items;
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
            // Título
            const Text(
              'Fóruns',
              style: TextStyle(
                fontSize: 25,
                fontWeight: FontWeight.bold,
                color: Color(0xFF007BFF),
              ),
            ),
            const SizedBox(height: 16),
            // Filtros
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
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
                  const Text(
                    'Filtrar Posts',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF007BFF),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    'Pesquisar por Tópico:',
                    style: TextStyle(color: Color(0xFF222B45)),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    decoration: InputDecoration(
                      hintText: 'Ex: JavaScript, Gestão...',
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
                  const SizedBox(height: 20),
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Categoria:',
                              style: TextStyle(color: Color(0xFF222B45)),
                            ),
                            const SizedBox(height: 8),
                            DropdownButtonFormField<String?>(
                              value: selectedCategoria,
                              isExpanded: true,
                              decoration: InputDecoration(
                                filled: true,
                                fillColor: Colors.white,
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
                                const DropdownMenuItem<String?>(
                                  value: null,
                                  child: Text('Todas as Categorias'),
                                ),
                                ...categorias.map(
                                  (c) => DropdownMenuItem<String?>(
                                    value: c['idcategoria']?.toString(),
                                    child: Text(
                                      c['designacao']?.toString() ?? '',
                                    ),
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
                          ],
                        ),
                      ),
                      const SizedBox(width: 15),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Área:',
                              style: TextStyle(color: Color(0xFF222B45)),
                            ),
                            const SizedBox(height: 8),
                            DropdownButtonFormField<String?>(
                              value: selectedArea,
                              isExpanded: true,
                              decoration: InputDecoration(
                                filled: true,
                                fillColor: Colors.white,
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
                                _loadingAreas
                                    ? 'A carregar...'
                                    : 'Todas as Áreas',
                              ),
                              items: [
                                const DropdownMenuItem<String?>(
                                  value: null,
                                  child: Text('Todas as Áreas'),
                                ),
                                ...areas.map(
                                  (a) => DropdownMenuItem<String?>(
                                    value: a['idarea']?.toString(),
                                    child: Text(
                                      a['designacao']?.toString() ?? '',
                                    ),
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
                          ],
                        ),
                      ),
                      const SizedBox(width: 15),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Tópico:',
                              style: TextStyle(color: Color(0xFF222B45)),
                            ),
                            const SizedBox(height: 8),
                            Builder(
                              builder: (context) {
                                final items = _topicDropdownItems();
                                final String? safeValue =
                                    (selectedTopico != null &&
                                            items.any(
                                              (i) => i.value == selectedTopico,
                                            ))
                                        ? selectedTopico
                                        : null;
                                return DropdownButtonFormField<String?>(
                                  value: safeValue,
                                  isExpanded: true,
                                  decoration: InputDecoration(
                                    filled: true,
                                    fillColor: Colors.white,
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
                                  items: items,
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
                                );
                              },
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  Text(
                    'Ordenar por:',
                    style: TextStyle(color: Color(0xFF222B45)),
                  ),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    value: sortBy,
                    decoration: InputDecoration(
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
                    isExpanded: true,
                  ),
                  const SizedBox(height: 30),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
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
                        child: const Text('Limpar Filtros'),
                      ),
                      const SizedBox(width: 10),
                      ElevatedButton(
                        onPressed: _applyTopicSearch,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF00B0DA),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 20,
                            vertical: 12,
                          ),
                        ),
                        child: const Text(
                          'Aplicar Filtros',
                          style: TextStyle(color: Colors.white),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            // Ação: criar post
            Align(
              alignment: Alignment.centerRight,
              child: Padding(
                padding: const EdgeInsets.only(top: 8.0),
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF00B0DA),
                    foregroundColor: Colors.white,
                  ),
                  onPressed:
                      (selectedTopico == null || selectedTopico!.isEmpty)
                          ? null
                          : () => context
                              .push(
                                '/forum_create',
                                extra: {'idtopico': selectedTopico},
                              )
                              .then((_) => _fetchPosts()),
                  icon: const Icon(Icons.add),
                  label: const Text('Criar Post'),
                ),
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
                  final idpost = _asInt(p['idpost'] ?? p['id']);
                  final score = p['pontuacao'] ?? 0;
                  final titulo = p['titulo'] ?? p['title'] ?? '—';
                  final conteudo = p['conteudo'] ?? p['content'] ?? '';
                  final preview =
                      conteudo.toString().length > 150
                          ? '${conteudo.toString().substring(0, 150)}...'
                          : conteudo.toString();
                  final dynamic rawComments =
                      p['ncomentarios'] ??
                      p['comentarios'] ??
                      p['comments'] ??
                      0;
                  final String commentsCount = rawComments.toString();

                  return GestureDetector(
                    onTap: () {
                      if (idpost != null) {
                        context.push('/forum_post/$idpost');
                      }
                    },
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
                          // Coluna de votos
                          Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              IconButton(
                                onPressed:
                                    () => _votePostAtIndex(idx, 'upvote'),
                                icon: Icon(
                                  _asVote((posts[idx] as Map)['iteracao']) ==
                                          true
                                      ? Icons.thumb_up_alt
                                      : Icons.thumb_up_alt_outlined,
                                  color:
                                      _asVote(
                                                (posts[idx] as Map)['iteracao'],
                                              ) ==
                                              true
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
                                  '${_asInt((posts[idx] as Map)['pontuacao']) ?? _asInt(score) ?? 0}',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                              IconButton(
                                onPressed:
                                    () => _votePostAtIndex(idx, 'downvote'),
                                icon: Icon(
                                  _asVote((posts[idx] as Map)['iteracao']) ==
                                          false
                                      ? Icons.thumb_down_alt
                                      : Icons.thumb_down_alt_outlined,
                                  color:
                                      _asVote(
                                                (posts[idx] as Map)['iteracao'],
                                              ) ==
                                              false
                                          ? Colors.red
                                          : Colors.grey,
                                  size: 26,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(width: 12),
                          // Conteúdo
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Cabeçalho: avatar + autor
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
                                // Tópico (se existir)
                                Builder(
                                  builder: (_) {
                                    final topic = _topicNameOf(p);
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
                                // Anexo (se existir)
                                Builder(
                                  builder: (_) {
                                    // Extrai URL e nome do anexo
                                    String? fileUrl;
                                    String? fileName;

                                    final anexo = p['anexo'];
                                    if (anexo is Map) {
                                      for (final k in const [
                                        'url',
                                        'ficheiro',
                                        'path',
                                        'caminho',
                                        'href',
                                        'link',
                                      ]) {
                                        final v = anexo[k];
                                        if (v is String &&
                                            v.trim().isNotEmpty) {
                                          fileUrl = v.trim();
                                          break;
                                        }
                                      }
                                      for (final k in const [
                                        'filename',
                                        'nome',
                                        'name',
                                      ]) {
                                        final v = anexo[k];
                                        if (v is String &&
                                            v.trim().isNotEmpty) {
                                          fileName = v.trim();
                                          break;
                                        }
                                      }
                                    } else if (anexo is String &&
                                        anexo.trim().isNotEmpty) {
                                      fileUrl = anexo.trim();
                                    }

                                    if (fileUrl == null || fileUrl.isEmpty) {
                                      for (final k in const [
                                        'anexoUrl',
                                        'attachment',
                                        'ficheiro',
                                        'fileUrl',
                                        'file',
                                      ]) {
                                        final v = p[k];
                                        if (v is String &&
                                            v.trim().isNotEmpty) {
                                          fileUrl = v.trim();
                                          break;
                                        }
                                      }
                                    }

                                    if (fileName == null || fileName.isEmpty) {
                                      for (final k in const [
                                        'anexoNome',
                                        'nomeAnexo',
                                        'nomeFicheiro',
                                        'ficheiroNome',
                                        'filename',
                                        'anexoFilename',
                                        'anexo_name',
                                      ]) {
                                        final v = p[k];
                                        if (v is String &&
                                            v.trim().isNotEmpty) {
                                          fileName = v.trim();
                                          break;
                                        }
                                      }
                                    }

                                    if (fileUrl == null || fileUrl.isEmpty) {
                                      return const SizedBox.shrink();
                                    }
                                    final resolved =
                                        fileUrl.startsWith('http')
                                            ? fileUrl
                                            : '${_server.urlAPI}${fileUrl.startsWith('/') ? '' : '/'}$fileUrl';

                                    return Padding(
                                      padding: const EdgeInsets.only(top: 8.0),
                                      child: SubmissionFilePreview(
                                        url: resolved,
                                        filename: fileName,
                                      ),
                                    );
                                  },
                                ),
                                const SizedBox(height: 8),
                                // Meta: nº de comentários
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
