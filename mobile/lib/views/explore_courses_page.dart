// lib/views/explore_courses_page.dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../middleware.dart'; // Changed from server.dart to middleware.dart
import '../components/course_filter.dart';
import '../components/course_card.dart';
import '../backend/shared_preferences.dart' as my_prefs;

class ExploreCoursesPage extends StatefulWidget {
  const ExploreCoursesPage({super.key});

  @override
  State<ExploreCoursesPage> createState() => _ExploreCoursesPageState();
}

class _ExploreCoursesPageState extends State<ExploreCoursesPage> {
  // Use AppMiddleware instead of Servidor directly
  final AppMiddleware _middleware = AppMiddleware();
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

      // Fetch subscribed courses using middleware
      // Assuming fetchUserCourses will handle the userId correctly and return a list
      final List<Map<String, dynamic>> subscribedCourses = await _middleware.fetchUserCourses(userId: userId);

      _subscribedCourseIds = subscribedCourses
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

      // Fetch all courses with current filters using middleware
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
      // Extract filter parameters safely, defaulting to null if not present or empty
      final String? searchTerm = filters['search'] as String?;
      final String? categoriaId = filters['categoria'] as String?;
      final String? areaId = filters['area'] as String?;
      final String? topicoId = filters['topico'] as String?;

      // Call the middleware's fetchAllCourses method with the extracted filters
      final List<Map<String, dynamic>> courses = await _middleware.fetchAllCourses(
        searchTerm: searchTerm?.isNotEmpty == true ? searchTerm : null,
        categoriaId: categoriaId?.isNotEmpty == true ? categoriaId : null,
        areaId: areaId?.isNotEmpty == true ? areaId : null,
        topicoId: topicoId?.isNotEmpty == true ? topicoId : null,
      );

      setState(() {
        _allCourses = courses;
        _applyLocalFiltersAndSort(); // This will just assign _allCourses to _filteredCourses
      });
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
    // With fetchAllCourses in middleware, filtering is done on the server.
    // So _allCourses already contains the filtered results.
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
    _fetchCourses({}); // Fetch all courses again without any filters
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
