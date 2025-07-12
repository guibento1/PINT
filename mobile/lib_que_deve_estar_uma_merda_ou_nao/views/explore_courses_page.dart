// lib/views/explore_courses_page.dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../backend/server.dart';
import '../components/course_filter.dart';
import '../components/course_card.dart';
import '../backend/shared_preferences.dart' as my_prefs;
import '../backend/database_helper.dart';

class ExploreCoursesPage extends StatefulWidget {
  const ExploreCoursesPage({super.key});

  @override
  State<ExploreCoursesPage> createState() => _ExploreCoursesPageState();
}

class _ExploreCoursesPageState extends State<ExploreCoursesPage> {
  final Servidor _servidor = Servidor();
  final DatabaseHelper _dbHelper = DatabaseHelper();
  List<Map<String, dynamic>> _allCourses = [];
  List<Map<String, dynamic>> _filteredCourses = [];
  bool _isLoading = true;
  String? _errorMessage;
  Map<String, dynamic> _currentFilters = {};
  Set<int> _subscribedCourseIds = {};

  List<Map<String, dynamic>> _allCategorias = [];
  List<Map<String, dynamic>> _allAreas = [];
  List<Map<String, dynamic>> _allTopicos = [];

  static const String _lastSyncKey = 'last_courses_sync';
  static const Duration _syncInterval = Duration(minutes: 10); // Exemplo: 10 minutos

  @override
  void initState() {
    super.initState();
    _loadAllLocalData();
  }

  Future<void> _loadAllLocalData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      // Load all categories, areas, topics from local DB
      _allCategorias = await _dbHelper.listarCategorias();
      _allAreas = await _dbHelper.listarAreas();
      _allTopicos = await _dbHelper.listarTopicosGlobais();
      await _loadSubscribedCoursesAndAllCourses();
    } catch (e) {
      setState(() {
        _errorMessage = 'Erro ao carregar dados locais: ${e.toString()}';
      });
    }
  }

  Future<void> _loadSubscribedCoursesAndAllCourses() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final user = await my_prefs.getUser();
      final userId = user?['idutilizador']?.toString();

      if (userId == null) {
        throw Exception('Utilizador não encontrado. Não é possível verificar inscrições.');
      }

      // Buscar cursos inscritos para popular _subscribedCourseIds
      final dynamic subscribedCoursesResp = await _servidor.getData('curso/inscricoes/utilizador/$userId');
      if (subscribedCoursesResp is List) {
        _subscribedCourseIds = subscribedCoursesResp
            .whereType<Map<String, dynamic>>()
            .map((course) {
              final dynamic rawIdcurso = course['idcurso'];
              int? idcurso;
              if (rawIdcurso is int) {
                idcurso = rawIdcurso;
              } else if (rawIdcurso is double) {
                idcurso = rawIdcurso.toInt();
              } else if (rawIdcurso is String) {
                idcurso = int.tryParse(rawIdcurso);
              }
              return idcurso;
            })
            .where((id) => id != null)
            .cast<int>()
            .toSet();
      } else {
        _subscribedCourseIds = {};
      }

      // Verifica se precisa de sincronizar cursos
      final prefs = await SharedPreferences.getInstance();
      final lastSyncMillis = prefs.getInt(_lastSyncKey);
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
        final dynamic coursesResp = await _servidor.getData('curso/list');
        if (coursesResp is List) {
          await _dbHelper.syncCursosFromApi(List<Map<String, dynamic>>.from(coursesResp.whereType<Map<String, dynamic>>()));
        }
        await prefs.setInt(_lastSyncKey, now);
      }

      await _fetchCoursesLocal(_currentFilters);
    } catch (e) {
      setState(() {
        _errorMessage = 'Erro ao carregar dados iniciais:  ${e.toString()}';
      });
      print('Error during initial data load: $e');
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _fetchCoursesLocal(Map<String, dynamic> filters) async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      final cursos = await _dbHelper.listarCursosFiltrado(
        search: filters['search'],
        categoria: filters['categoria'],
        area: filters['area'],
        topico: filters['topico'],
      );
      setState(() {
        _allCourses = cursos.map((curso) => {
          ...curso,
          'disponivel': curso['disponivel'] == 1 || curso['disponivel'] == true,
        }).toList();
        _filteredCourses = List.from(_allCourses);
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'Erro ao carregar cursos: ${e.toString()}';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _handleApplyFilters(Map<String, dynamic> newFilters) {
    setState(() {
      _currentFilters = newFilters;
    });
    _fetchCoursesLocal(newFilters);
  }

  void _handleClearFilters() {
    setState(() {
      _currentFilters = {};
    });
    _fetchCoursesLocal({});
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Explorar Cursos', style: TextStyle(color: Color(0xFF007BFF))),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: RefreshIndicator(
        color: const Color(0xFF007BFF),
        backgroundColor: Colors.white,
        onRefresh: () => _fetchCoursesLocal(_currentFilters),
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 0.0),
          children: [
            const SizedBox(height: 20),
            CourseFilterWidget(
              onApplyFilters: _handleApplyFilters,
              onClearFilters: _handleClearFilters,
            ),
            const SizedBox(height: 20),
            if (_isLoading)
              const Center(child: CircularProgressIndicator())
            else if (_errorMessage != null)
              Center(
                child: Padding(
                  padding: const EdgeInsets.all(20.0),
                  child: Text(
                    _errorMessage!,
                    style: const TextStyle(color: Colors.red, fontSize: 16),
                    textAlign: TextAlign.center,
                  ),
                ),
              )
            else if (_filteredCourses.isEmpty)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(20.0),
                  child: Text(
                    'Nenhum curso encontrado com os filtros aplicados.',
                    style: TextStyle(fontSize: 16, color: Color(0xFF8F9BB3)),
                    textAlign: TextAlign.center,
                  ),
                ),
              )
            else
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _filteredCourses.length,
                itemBuilder: (context, index) {
                  final curso = _filteredCourses[index];
                  final int? courseId = curso['idcurso'] is int
                      ? curso['idcurso']
                      : int.tryParse(curso['idcurso']?.toString() ?? '');
                  final bool isSubscribed = courseId != null && _subscribedCourseIds.contains(courseId);

                  return CourseCard(
                    curso: curso,
                    isSubscribed: isSubscribed,
                    onTap: () {
                      if (courseId != null) {
                        context.go('/course_details/$courseId');
                      } else {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Erro: ID do curso inválido.'),
                          ),
                        );
                      }
                    },
                  );
                },
              ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}
