import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../backend/server.dart';
import '../middleware.dart';
import '../backend/shared_preferences.dart' as my_prefs;
import '../components/course_card.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final Servidor _servidor = Servidor();
  late final AppMiddleware _middleware;

  late Future<Map<String, dynamic>> _dataFuture;

  String _termoPesquisa = '';
  List<Map<String, dynamic>> _todasCategorias = [];
  List<int> _categoriasAtivasIds = [];

  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _middleware = AppMiddleware();
    _loadAllCategories();
    _dataFuture = _loadData();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadAllCategories() async {
    try {
      final List<Map<String, dynamic>> categoriasResp =
          await _middleware.fetchAllCategories();
      setState(() {
        _todasCategorias = categoriasResp;
      });
    } catch (e) {
      _showSnackBar('Erro ao carregar categorias: $e', isError: true);
    }
  }

  Future<Map<String, dynamic>> _loadData({
    String? searchTerm,
    List<int>? categoryIds,
  }) async {
    final user = await my_prefs.getUser();
    final userId = user?['idutilizador']?.toString();
    if (userId == null) {
      if (mounted) {
        context.go('/login');
      }
      throw Exception('Utilizador não encontrado');
    }

    final Map<String, dynamic> perfil = await _middleware.fetchUserProfile(userId);

    if (user != null) {
      final Map<String, dynamic> updatedUser = Map<String, dynamic>.from(user);
      updatedUser['perfil'] = perfil;
      await my_prefs.saveUser(updatedUser);
    } else {
      await my_prefs.saveUser({'idutilizador': userId, 'perfil': perfil});
    }

    final List<Map<String, dynamic>> cursos = await _middleware.fetchUserCourses(
      userId: userId,
      searchTerm: searchTerm,
      categoryIds: categoryIds,
    );

    return {'perfil': perfil, 'cursos': cursos};
  }

  void _filterCourses() {
    setState(() {
      _dataFuture = _loadData(
        searchTerm: _termoPesquisa,
        categoryIds: _categoriasAtivasIds,
      );
    });
  }

  void _toggleCategory(int categoryId) {
    setState(() {
      if (_categoriasAtivasIds.contains(categoryId)) {
        _categoriasAtivasIds.remove(categoryId);
      } else {
        _categoriasAtivasIds.add(categoryId);
      }
      _filterCourses();
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
            _dataFuture = _loadData();
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
                          child: GestureDetector(
                            onTap: () {
                              _filterCourses();
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
                      _termoPesquisa = value;
                    },
                    onSubmitted: (value) {
                      _filterCourses();
                    },
                  ),
                ),
                const SizedBox(height: 20),
                if (_todasCategorias.isNotEmpty)
                  Wrap(
                    spacing: 8.0,
                    runSpacing: 4.0,
                    children: _todasCategorias.map((categoria) {
                      final int? categoryId =
                          int.tryParse(categoria['idcategoria'].toString());
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
                          _toggleCategory(categoryId);
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
