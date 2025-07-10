import 'package:flutter/material.dart';
import '../backend/server.dart'; 

class CourseFilterWidget extends StatefulWidget {
  final Function(Map<String, dynamic>) onApplyFilters;
  final VoidCallback onClearFilters;

  const CourseFilterWidget({
    super.key,
    required this.onApplyFilters,
    required this.onClearFilters,
  });

  @override
  State<CourseFilterWidget> createState() => _CourseFilterWidgetState();
}

class _CourseFilterWidgetState extends State<CourseFilterWidget> {
  final Servidor _servidor = Servidor();
  final TextEditingController _searchController = TextEditingController();

  String? _selectedCategoriaId;
  String? _selectedAreaId;
  String? _selectedTopicoId;

  List<Map<String, dynamic>> _categorias = [];
  List<Map<String, dynamic>> _areas = [];
  List<Map<String, dynamic>> _topicos = [];

  bool _loadingCategorias = false;
  bool _loadingAreas = false;
  bool _loadingTopicos = false;

  String? _errorCategorias;
  String? _errorAreas;
  String? _errorTopicos;

  @override
  void initState() {
    super.initState();
    _fetchCategories();
  }

  Future<void> _fetchCategories() async {
    setState(() {
      _loadingCategorias = true;
      _errorCategorias = null;
    });
    try {
      final dynamic data = await _servidor.getData('categoria/list');
      if (data is List) {
        setState(() {
          _categorias = List<Map<String, dynamic>>.from(data.whereType<Map<String, dynamic>>());
        });
      } else {
        setState(() {
          _errorCategorias = 'Formato de dados de categorias inválido.';
        });
      }
    } catch (e) {
      setState(() {
        _errorCategorias = 'Erro ao carregar categorias.';
      });
      print('Error fetching categories: $e');
    } finally {
      setState(() {
        _loadingCategorias = false;
      });
    }
  }

  Future<void> _fetchAreas(String categoriaId) async {
    setState(() {
      _loadingAreas = true;
      _errorAreas = null;
      _areas = []; // Clear previous areas
      _topicos = []; // Clear previous topics
      _selectedAreaId = null; // Reset selected area
      _selectedTopicoId = null; // Reset selected topic
    });
    try {
      final dynamic data = await _servidor.getData('categoria/id/$categoriaId/list');
      if (data is List) {
        setState(() {
          _areas = List<Map<String, dynamic>>.from(data.whereType<Map<String, dynamic>>());
        });
      } else {
        setState(() {
          _errorAreas = 'Formato de dados de áreas inválido.';
        });
      }
    } catch (e) {
      setState(() {
        _errorAreas = 'Erro ao carregar áreas.';
      });
      print('Error fetching areas: $e');
    } finally {
      setState(() {
        _loadingAreas = false;
      });
    }
  }

  Future<void> _fetchTopics(String areaId) async {
    setState(() {
      _loadingTopicos = true;
      _errorTopicos = null;
      _topicos = []; // Clear previous topics
      _selectedTopicoId = null; // Reset selected topic
    });
    try {
      final dynamic data = await _servidor.getData('area/id/$areaId/list');
      if (data is List) {
        setState(() {
          _topicos = List<Map<String, dynamic>>.from(data.whereType<Map<String, dynamic>>());
        });
      } else {
        setState(() {
          _errorTopicos = 'Formato de dados de tópicos inválido.';
        });
      }
    } catch (e) {
      setState(() {
        _errorTopicos = 'Erro ao carregar tópicos.';
      });
      print('Error fetching topics: $e');
    } finally {
      setState(() {
        _loadingTopicos = false;
      });
    }
  }

  void _applyFilters() {
    widget.onApplyFilters({
      'search': _searchController.text,
      'categoria': _selectedCategoriaId,
      'area': _selectedAreaId,
      'topico': _selectedTopicoId,
    });
  }

  void _clearFilters() {
    setState(() {
      _searchController.clear();
      _selectedCategoriaId = null;
      _selectedAreaId = null;
      _selectedTopicoId = null;
      _areas = [];
      _topicos = [];
    });
    widget.onClearFilters();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
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
      padding: const EdgeInsets.all(20),
      margin: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Filtrar Cursos',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Color(0xFF007BFF),
            ),
          ),
          const SizedBox(height: 20),
          Text(
            'Pesquisar por Título/Descrição:',
            style: TextStyle(color: Color(0xFF222B45)),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _searchController,
            decoration: InputDecoration(
              hintText: 'Ex: JavaScript, Gestão...',
              hintStyle: TextStyle(color: Color(0xFF8F9BB3)),
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10.0),
                borderSide: BorderSide(color: Color(0xFFD3DCE6)), // subtle border
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10.0),
                borderSide: BorderSide(color: Color(0xFFD3DCE6)),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10.0),
                borderSide: BorderSide(color: Color(0xFF007BFF)), // focus color
              ),
              contentPadding: const EdgeInsets.symmetric(vertical: 12, horizontal: 15),
            ),
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
                    DropdownButtonFormField<String>(
                      value: _selectedCategoriaId,
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: Colors.white,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10.0),
                          borderSide: BorderSide(color: Color(0xFFD3DCE6)),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10.0),
                          borderSide: BorderSide(color: Color(0xFFD3DCE6)),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10.0),
                          borderSide: BorderSide(color: Color(0xFF007BFF)),
                        ),
                        contentPadding: const EdgeInsets.symmetric(vertical: 12, horizontal: 15),
                      ),
                      hint: Text(_loadingCategorias ? 'A carregar...' : 'Todas as Categorias'),
                      items: [
                        const DropdownMenuItem(value: null, child: Text('Todas as Categorias')),
                        ..._categorias.map((cat) {
                          return DropdownMenuItem(
                            value: cat['idcategoria']?.toString(),
                            child: Text(cat['designacao'] ?? ''),
                          );
                        }).toList(),
                      ],
                      onChanged: _loadingCategorias
                          ? null
                          : (String? newValue) {
                              setState(() {
                                _selectedCategoriaId = newValue;
                                _selectedAreaId = null; // Reset Area when Category changes
                                _selectedTopicoId = null; // Reset Topic when Category changes
                                _areas = []; // Clear areas list
                                _topicos = []; // Clear topics list
                              });
                              if (newValue != null) {
                                _fetchAreas(newValue);
                              }
                            },
                      // Error message below dropdown if any
                      validator: (_) => _errorCategorias,
                      isExpanded: true,
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
                    DropdownButtonFormField<String>(
                      value: _selectedAreaId,
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: Colors.white,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10.0),
                          borderSide: BorderSide(color: Color(0xFFD3DCE6)),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10.0),
                          borderSide: BorderSide(color: Color(0xFFD3DCE6)),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10.0),
                          borderSide: BorderSide(color: Color(0xFF007BFF)),
                        ),
                        contentPadding: const EdgeInsets.symmetric(vertical: 12, horizontal: 15),
                      ),
                      hint: Text(_loadingAreas ? 'A carregar...' : 'Todas as Áreas'),
                      items: [
                        const DropdownMenuItem(value: null, child: Text('Todas as Áreas')),
                        ..._areas.map((area) {
                          return DropdownMenuItem(
                            value: area['idarea']?.toString(),
                            child: Text(area['designacao'] ?? ''),
                          );
                        }).toList(),
                      ],
                      onChanged: (_selectedCategoriaId == null || _loadingAreas || _areas.isEmpty)
                          ? null
                          : (String? newValue) {
                              setState(() {
                                _selectedAreaId = newValue;
                                _selectedTopicoId = null; // Reset Topic when Area changes
                                _topicos = []; // Clear topics list
                              });
                              if (newValue != null) {
                                _fetchTopics(newValue);
                              }
                            },
                      validator: (_) => _errorAreas,
                      isExpanded: true,
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
                    DropdownButtonFormField<String>(
                      value: _selectedTopicoId,
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: Colors.white,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10.0),
                          borderSide: BorderSide(color: Color(0xFFD3DCE6)),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10.0),
                          borderSide: BorderSide(color: Color(0xFFD3DCE6)),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10.0),
                          borderSide: BorderSide(color: Color(0xFF007BFF)),
                        ),
                        contentPadding: const EdgeInsets.symmetric(vertical: 12, horizontal: 15),
                      ),
                      hint: Text(_loadingTopicos ? 'A carregar...' : 'Todos os Tópicos'),
                      items: [
                        const DropdownMenuItem(value: null, child: Text('Todos os Tópicos')),
                        ..._topicos.map((topico) {
                          return DropdownMenuItem(
                            value: topico['idtopico']?.toString(),
                            child: Text(topico['designacao'] ?? ''),
                          );
                        }).toList(),
                      ],
                      onChanged: (_selectedAreaId == null || _loadingTopicos || _topicos.isEmpty)
                          ? null
                          : (String? newValue) {
                              setState(() {
                                _selectedTopicoId = newValue;
                              });
                            },
                      validator: (_) => _errorTopicos,
                      isExpanded: true,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 30),
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              OutlinedButton(
                onPressed: _clearFilters,
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFF6B778C),
                  side: const BorderSide(color: Color(0xFFD3DCE6)),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                ),
                child: const Text('Limpar Filtros'),
              ),
              const SizedBox(width: 10),
              ElevatedButton(
                onPressed: _applyFilters,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF00B0DA),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
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
    );
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }
}
