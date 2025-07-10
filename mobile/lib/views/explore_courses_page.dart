// lib/views/explore_courses_page.dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../backend/server.dart';
import '../components/course_filter.dart';
import '../components/course_card.dart';
import '../backend/shared_preferences.dart' as my_prefs;

class ExploreCoursesPage extends StatefulWidget {
  const ExploreCoursesPage({super.key});

  @override
  State<ExploreCoursesPage> createState() => _ExploreCoursesPageState();
}

class _ExploreCoursesPageState extends State<ExploreCoursesPage> {
  final Servidor _servidor = Servidor();
  List<Map<String, dynamic>> _allCourses = [];
  List<Map<String, dynamic>> _filteredCourses = [];
  bool _isLoading = true;
  String? _errorMessage;
  Map<String, dynamic> _currentFilters = {};
  Set<int> _subscribedCourseIds = {};

  @override
  void initState() {
    super.initState();
    _loadSubscribedCoursesAndAllCourses();
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

      // Fetch subscribed courses first to populate _subscribedCourseIds
      final dynamic subscribedCoursesResp = await _servidor.getData('curso/inscricoes/utilizador/$userId');
      if (subscribedCoursesResp is List) {
        _subscribedCourseIds = subscribedCoursesResp
            .whereType<Map<String, dynamic>>()
            .map((course) {
              final dynamic rawIdcurso = course['idcurso'];
              int? idcurso;
              if (rawIdcurso is int) {
                idcurso = rawIdcurso;
              } else if (rawIdcurso is double) { // Handle doubles if they come from API
                idcurso = rawIdcurso.toInt();
              } else if (rawIdcurso is String) {
                idcurso = int.tryParse(rawIdcurso);
              }
              return idcurso;
            })
            .where((id) => id != null) // Filter out nulls from failed parses
            .cast<int>() // Ensure all elements are int before converting to Set
            .toSet();
      } else {
        _subscribedCourseIds = {};
      }

      await _fetchCourses(_currentFilters);
    } catch (e) {
      setState(() {
        _errorMessage = 'Erro ao carregar dados iniciais: ${e.toString()}';
      });
      print('Error during initial data load: $e');
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }


  Future<void> _fetchCourses(Map<String, dynamic> filters) async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final Map<String, dynamic> apiParams = {
        'sincrono': false,
      };

      if (filters['search'] != null && filters['search'].isNotEmpty) {
        apiParams['search'] = filters['search'];
      }
      if (filters['categoria'] != null && filters['categoria'].isNotEmpty) {
        apiParams['categoria'] = filters['categoria'];
      }
      if (filters['area'] != null && filters['area'].isNotEmpty) {
        apiParams['area'] = filters['area'];
      }
      if (filters['topico'] != null && filters['topico'].isNotEmpty) {
        apiParams['topico'] = filters['topico'];
      }

      final dynamic coursesResp = await _servidor.getData('curso/list', queryParameters: apiParams);

      if (coursesResp is List) {
        setState(() {
          _allCourses = List<Map<String, dynamic>>.from(coursesResp.whereType<Map<String, dynamic>>());
          _applyLocalFiltersAndSort();
        });
      } else {
        setState(() {
          _errorMessage = 'Formato de dados de cursos inválido.';
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Erro ao carregar cursos: ${e.toString()}';
      });
      print('Error fetching courses with filters: $e');
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _applyLocalFiltersAndSort() {
    _filteredCourses = List.from(_allCourses);
  }

  void _handleApplyFilters(Map<String, dynamic> newFilters) {
    setState(() {
      _currentFilters = newFilters;
    });
    _fetchCourses(newFilters);
  }

  void _handleClearFilters() {
    setState(() {
      _currentFilters = {};
    });
    _fetchCourses({});
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
        onRefresh: () => _fetchCourses(_currentFilters),
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
