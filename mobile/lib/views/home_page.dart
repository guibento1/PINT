// lib/views/home_page.dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../backend/server.dart';
import '../backend/database_helper.dart';
import '../backend/shared_preferences.dart' as my_prefs; // Alias para evitar conflitos

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final Servidor servidor = Servidor();
  final DatabaseHelper dbHelper = DatabaseHelper();
  late Future<Map<String, dynamic>> _dataFuture;

  @override
  void initState() {
    super.initState();
    _dataFuture = _loadData();
  }

  Future<Map<String, dynamic>> _loadData() async {
    final user = await my_prefs.getUser();
    final userId = user?['idutilizador']?.toString();
    if (userId == null) {
      throw Exception('Utilizador não encontrado');
    }

    final dynamic perfilResp = await servidor.getData('utilizador/id/$userId');
    final Map<String, dynamic> perfil = (perfilResp is Map<String, dynamic>)
        ? perfilResp
        : {};

    if (user != null) {
      final Map<String, dynamic> updatedUser = Map<String, dynamic>.from(user); updatedUser['perfil'] = perfil;
      await my_prefs.saveUser(updatedUser); // CORRIGIDO: de setUser para saveUser
    } else {
      await my_prefs.saveUser({'idutilizador': userId, 'perfil': perfil}); // CORRIGIDO: de setUser para saveUser
    }

    final dynamic cursosResp =
        await servidor.getData('curso/inscricoes/utilizador/$userId');

    final List<Map<String, dynamic>> cursos = (cursosResp is List)
        ? List<Map<String, dynamic>>.from(
            cursosResp.whereType<Map<String, dynamic>>())
        : <Map<String, dynamic>>[];

    return {'perfil': perfil, 'cursos': cursos};
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: () async {
        setState(() {
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
          final perfil = snapshot.data?['perfil'] ?? {};
          final cursos = snapshot.data?['cursos'] ?? [];

          return ListView(
            padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 0.0),
            children: [
              const SizedBox(height: 30),
              TextField(
                decoration: InputDecoration(
                  hintText: 'Procurar curso',
                  hintStyle: TextStyle(color: Colors.grey[500]),
                  suffixIcon: Container(
                    margin: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: const Color(0xFF00C4B4),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Icon(Icons.search,
                        color: Colors.white, size: 24),
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
              ),
              const SizedBox(height: 30),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Cursos Inscritos',
                      style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF007BFF))),
                ],
              ),
              const SizedBox(height: 15),
              if (cursos.isEmpty)
                const Center(child: Text('Nenhum curso inscrito.'))
              else
                ...cursos.map<Widget>((curso) {
                  final hasThumbnail = curso['thumbnail'] != null &&
                      (curso['thumbnail'] as String).isNotEmpty;
                  return GestureDetector(
                    onTap: () {
                      final dynamic rawIdcurso = curso['idcurso'];
                      int? idcurso;
                      if (rawIdcurso is int) {
                        idcurso = rawIdcurso;
                      } else if (rawIdcurso is double) {
                        idcurso = rawIdcurso.toInt();
                      } else if (rawIdcurso is String) {
                        idcurso = int.tryParse(rawIdcurso);
                      }

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
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 15),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: const Color(0xFFE0F7FA),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(15),
                            ),
                            child: hasThumbnail
                                ? Image.network(
                                    curso['thumbnail'],
                                    width: 32,
                                    height: 32,
                                    fit: BoxFit.cover,
                                    errorBuilder:
                                        (context, error, stackTrace) =>
                                            const Icon(Icons.code,
                                                color: Color(0xFFFD7E14),
                                                size: 32),
                                  )
                                : const Icon(Icons.code,
                                    color: Color(0xFFFD7E14), size: 32),
                          ),
                          const SizedBox(width: 15),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  curso['nome'] ?? '',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16,
                                    color: Color(0xFF0D47A1),
                                  ),
                                ),
                                const SizedBox(height: 5),
                                Text(
                                  'Toque para ver os detalhes do curso.',
                                  style: TextStyle(
                                    fontSize: 14,
                                    color: Colors.grey[700],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }).toList(),
            ],
          );
        },
      ),
    );
  }
}
