import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../backend/server.dart';
import '../backend/database_helper.dart';
import '../backend/shared_preferences.dart' as my_prefs;
import '../components/course_card.dart'; // Updated import path to components

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
      final Map<String, dynamic> updatedUser = Map<String, dynamic>.from(user);
      updatedUser['perfil'] = perfil;
      await my_prefs.saveUser(updatedUser);
    } else {
      await my_prefs.saveUser({'idutilizador': userId, 'perfil': perfil});
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
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(30.0),
      ),
      child: RefreshIndicator(
        color: const Color(0xFF007BFF),
        backgroundColor: Colors.white,
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
                // Your search text field remains the same
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
                    decoration: InputDecoration(
                      hintText: 'Procurar cursos em que estás inscrito ',
                      hintStyle: TextStyle(color: Color(0xFF8F9BB3)),
                      suffixIcon: Padding(
                        padding: const EdgeInsets.only(right: 10),
                        child: SizedBox(
                          width: 50,
                          height: 50,
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
                            child: const Icon(Icons.search, color: Colors.white, size: 25),
                          ),
                        ),
                      ),
                      filled: true,
                      fillColor: Colors.white,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(30.0),
                        borderSide: BorderSide.none,
                      ),
                      contentPadding: const EdgeInsets.symmetric(vertical: 16, horizontal: 25),
                    ),
                  ),
                ),
                const SizedBox(height: 30),
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
                  const Center(child: Text('Nenhum curso inscrito.'))
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
                    return CourseCard( // CourseCard now handles its own styling
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
