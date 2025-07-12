import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../backend/server.dart';
import '../backend/database_helper.dart'; // Ensure this is needed, or remove if not
import '../backend/shared_preferences.dart' as my_prefs;
import '../components/course_card.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final Servidor servidor = Servidor();
  final DatabaseHelper dbHelper = DatabaseHelper(); // Keep if actively used
  late Future<Map<String, dynamic>> _dataFuture;

  String _termoPesquisa = '';
  List<Map<String, dynamic>> _todasCategorias = [];
  List<int> _categoriasAtivasIds = []; // Stores only the IDs of active categories

  final TextEditingController _searchController = TextEditingController();

  static const String _lastInscricoesSyncKey = 'last_inscricoes_sync';
  static const Duration _syncInterval = Duration(minutes: 10);

  @override
  void initState() {
    super.initState();
    _loadAllCategories();
    _dataFuture = _loadDataWithCache();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  // Fetches all categories from the local database
  Future<void> _loadAllCategories() async {
    try {
      final categoriasResp = await dbHelper.listarCategorias();
      setState(() {
        _todasCategorias = categoriasResp;
      });
    } catch (e) {
      _showSnackBar('Erro ao carregar categorias: $e', isError: true);
    }
  }

  // Fetch user profile from local database
  Future<Map<String, dynamic>?> _loadUserProfile() async {
    final user = await my_prefs.getUser();
    final userId = user?['idutilizador'];
    if (userId != null) {
      return await dbHelper.obterPerfil(int.parse(userId.toString()));
    }
    return null;
  }

  // Novo método para filtrar cursos inscritos localmente
  Future<List<Map<String, dynamic>>> _filtrarCursosInscritosLocalmente() async {
    final todosCursos = await dbHelper.listarCursosInscritos();
    return todosCursos.map((curso) => {
      ...curso,
      'disponivel': curso['disponivel'] == 1 || curso['disponivel'] == true,
    }).where((curso) {
      final nome = (curso['nome'] ?? '').toString().toLowerCase();
      final plano = (curso['planocurricular'] ?? '').toString().toLowerCase();
      final searchOk = _termoPesquisa.isEmpty ||
          nome.contains(_termoPesquisa.toLowerCase()) ||
          plano.contains(_termoPesquisa.toLowerCase());
      final categoriaOk = _categoriasAtivasIds.isEmpty ||
          _categoriasAtivasIds.contains(curso['idcategoria']) ||
          _categoriasAtivasIds.any((catId) => (curso['categorias']?.toString() ?? '').contains(catId.toString()));
      return searchOk && categoriaOk;
    }).toList();
  }

  Future<Map<String, dynamic>> _loadDataWithCache() async {
    try {
      final user = await my_prefs.getUser();
      final userId = user?['idutilizador']?.toString();
      if (userId == null) {
        if (mounted) {
          context.go('/login');
        }
        throw Exception('Utilizador não encontrado');
      }

      // Sincronização de inscrições (cache local)
      final prefs = await SharedPreferences.getInstance();
      final lastSyncMillis = prefs.getInt(_lastInscricoesSyncKey);
      final now = DateTime.now().millisecondsSinceEpoch;
      bool shouldSync = false;
      if (lastSyncMillis == null) {
        shouldSync = true;
      } else {
        final lastSync = DateTime.fromMillisecondsSinceEpoch(lastSyncMillis);
        if (DateTime.now().difference(lastSync) > _syncInterval) {
          shouldSync = true;
        }
      }
      if (shouldSync) {
        final dynamic inscricoesResp = await servidor.getData('curso/inscricoes/utilizador/$userId');
        if (inscricoesResp is List) {
          await dbHelper.syncInscricoesFromApi(List<Map<String, dynamic>>.from(inscricoesResp.whereType<Map<String, dynamic>>()));
        }
        await prefs.setInt(_lastInscricoesSyncKey, now);
      }

      // Perfil (mantém igual)
      final dynamic perfilResp = await servidor.getData('utilizador/id/$userId');
      final Map<String, dynamic> perfil = (perfilResp is Map<String, dynamic>) ? perfilResp : {};
      if (user != null) {
        final Map<String, dynamic> updatedUser = Map<String, dynamic>.from(user);
        updatedUser['perfil'] = perfil;
        await my_prefs.saveUser(updatedUser);
      } else {
        await my_prefs.saveUser({'idutilizador': userId, 'perfil': perfil});
      }

      // Cursos inscritos filtrados localmente
      final cursos = await _filtrarCursosInscritosLocalmente();
      return {'perfil': perfil, 'cursos': cursos};
    } catch (e, st) {
      print('Erro em _loadDataWithCache: $e\n$st');
      return {'perfil': {}, 'cursos': []};
    }
  }

  // Triggers a reload of courses based on current filters
  void _filterCourses() {
    setState(() {
      _dataFuture = _loadDataWithCache();
    });
  }

  // Toggles the active state of a category
  void _toggleCategory(int categoryId) {
    setState(() {
      if (_categoriasAtivasIds.contains(categoryId)) {
        _categoriasAtivasIds.remove(categoryId);
      } else {
        _categoriasAtivasIds.add(categoryId);
      }
      _filterCourses(); // Categories still filter immediately
    });
  }

  void _showSnackBar(String message, {bool isError = false}) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(message),
          backgroundColor: isError ? Colors.red : Colors.green,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(30.0),
      ),
      child: RefreshIndicator(
        color: const Color(0xFF007BFF),
        backgroundColor: Colors.white,
        onRefresh: () async {
          setState(() {
            _termoPesquisa = '';
            _searchController.clear();
            _categoriasAtivasIds = [];
            _dataFuture = _loadDataWithCache(); // Reload without filters
          });
          await _dataFuture;
        },
        child: FutureBuilder<Map<String, dynamic>>(
          future: _dataFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator());
            } else if (snapshot.hasError) {
              return Center(child: Text('Erro: ${snapshot.error}'));
            }
            final cursos = snapshot.data?['cursos'] ?? [];

            return ListView(
              padding:
                  const EdgeInsets.symmetric(horizontal: 20.0, vertical: 0.0),
              children: [
                const SizedBox(height: 30),
                Container(
                  decoration: BoxDecoration(
                    boxShadow: [
                      BoxShadow(
                        color: Colors.grey.withOpacity(0.3),
                        spreadRadius: 1,
                        blurRadius: 1,
                        offset: const Offset(1, 3),
                      ),
                    ],
                    borderRadius: BorderRadius.circular(30.1),
                  ),
                  child: TextField(
                    controller: _searchController,
                    decoration: InputDecoration(
                      hintText: 'Procurar cursos em que estás inscrito ',
                      hintStyle: const TextStyle(color: Color(0xFF8F9BB3)),
                      suffixIcon: Padding(
                        padding: const EdgeInsets.only(right: 10),
                        child: SizedBox(
                          width: 50,
                          height: 50,
                          child: GestureDetector( // Use GestureDetector for tap event
                            onTap: () {
                              _filterCourses(); // Trigger search on icon tap
                            },
                            child: Container(
                              margin: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: const Color(0xFF00B0DA),
                                borderRadius: BorderRadius.circular(13),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.grey.withOpacity(0.3),
                                    spreadRadius: 1,
                                    blurRadius: 1,
                                    offset: const Offset(1, 3),
                                  ),
                                ],
                              ),
                              child:
                                  const Icon(Icons.search, color: Colors.white, size: 25),
                            ),
                          ),
                        ),
                      ),
                      filled: true,
                      fillColor: Colors.white,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(30.0),
                        borderSide: BorderSide.none,
                      ),
                      contentPadding:
                          const EdgeInsets.symmetric(vertical: 16, horizontal: 25),
                    ),
                    onChanged: (value) {
                      // Only update the search term, do not trigger filtering yet
                      _termoPesquisa = value;
                    },
                    onSubmitted: (value) {
                      // Optionally, also trigger search when user presses 'Done'/'Enter' on keyboard
                      _filterCourses();
                    },
                  ),
                ),
                const SizedBox(height: 20),
                // Category buttons
                if (_todasCategorias.isNotEmpty)
                  Wrap(
                    spacing: 8.0, // Space between buttons
                    runSpacing: 4.0, // Space between rows of buttons
                    children: _todasCategorias.map((categoria) {
                      final int? categoryId = int.tryParse(categoria['idcategoria'].toString());
                      final String categoryName =
                          categoria['designacao'] as String? ?? 'Desconhecida';

                      if (categoryId == null) {
                        return const SizedBox.shrink();
                      }

                      final bool isActive =
                          _categoriasAtivasIds.contains(categoryId);
                      return ChoiceChip(
                        label: Text(categoryName),
                        selected: isActive,
                        selectedColor: const Color(0xFF007BFF),
                        onSelected: (selected) {
                          _toggleCategory(categoryId); // Categories still filter immediately
                        },
                        labelStyle: TextStyle(
                          color: isActive ? Colors.white : Colors.black87,
                        ),
                        side: BorderSide(
                          color: isActive ? const Color(0xFF007BFF) : Colors.grey,
                        ),
                      );
                    }).toList(),
                  ),
                const SizedBox(height: 20),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Cursos Inscritos',
                        style: TextStyle(
                            fontSize: 25,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF00B0DA))),
                  ],
                ),
                const SizedBox(height: 15),
                if (cursos.isEmpty)
                  Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Text(
                            'Nenhum curso encontrado...',
                            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 8),
                          GestureDetector(
                            onTap: () {
                              context.go('/cursos');
                            },
                            child: const Text(
                              'Explora a página de cursos para te inscreveres.',
                              style: TextStyle(
                                fontSize: 16,
                                color: Color(0xFF007BFF),
                                decoration: TextDecoration.underline,
                              ),
                              textAlign: TextAlign.center,
                            ),
                          ),
                        ],
                      ),
                    ),
                  )
                else
                  ...cursos.map<Widget>((curso) {
                    final dynamic rawIdcurso = curso['idcurso'];
                    int? idcurso;
                    if (rawIdcurso is int) {
                      idcurso = rawIdcurso;
                    } else if (rawIdcurso is double) {
                      idcurso = rawIdcurso.toInt();
                    } else if (rawIdcurso is String) {
                      idcurso = int.tryParse(rawIdcurso);
                    }
                    return CourseCard(
                      curso: curso,
                      isSubscribed: true,
                      onTap: () {
                        if (idcurso != null) {
                          context.go('/course_details/$idcurso');
                        } else {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Erro: ID do curso inválido.'),
                            ),
                          );
                        }
                      },
                    );
                  }).toList(),
                const SizedBox(height: 20),
              ],
            );
          },
        ),
      ),
    );
  }
}
