import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../backend/server.dart';
import '../backend/database_helper.dart'; 
import '../backend/shared_preferences.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final Servidor servidor = Servidor();
  final DatabaseHelper dbHelper = DatabaseHelper();
  int _selectedIndex = 0;

  late Future<Map<String, dynamic>> _dataFuture;

  @override
  void initState() {
    super.initState();
    _dataFuture = _loadData();
  }

  Future<Map<String, dynamic>> _loadData() async {
    final user = await getUser();
    final userId = user?['idutilizador']?.toString();
    if (userId == null) {
      throw Exception('Utilizador não encontrado');
    }

    final dynamic perfilResp = await servidor.getData('utilizador/id/$userId');
    final Map<String, dynamic> perfil = (perfilResp is Map<String, dynamic>)
        ? perfilResp
        : {}; 

    final dynamic cursosResp =
        await servidor.getData('curso/inscricoes/utilizador/$userId');
    print('curso/inscricoes/utilizador/$userId');
    print(cursosResp);

    final List<Map<String, dynamic>> cursos = (cursosResp is List)
        ? List<Map<String, dynamic>>.from(
            cursosResp.whereType<Map<String, dynamic>>()) 
        : <Map<String, dynamic>>[]; 

    return {'perfil': perfil, 'cursos': cursos};
  }

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
    switch (index) {
      case 0:
        context.go('/home');
        break;
      case 1:
        context.go('/groups');
        break;
      case 2:
        context.go('/notifications');
        break;
      case 3:
        context.go('/profile');
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF0F4FD),
      body: SafeArea(
        child: RefreshIndicator(
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
              final avatarUrl =
                  (perfil['foto'] != null && perfil['foto'].toString().isNotEmpty)
                      ? perfil['foto']
                      : 'https://i.pravatar.cc/150?img=32';
              return ListView(
                padding:
                    const EdgeInsets.symmetric(horizontal: 20.0, vertical: 20.0),
                children: [
                  // Top Bar
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      CircleAvatar(
                          radius: 24, backgroundImage: NetworkImage(avatarUrl)),
                      const Text('THE SOFTSKILLS',
                          style: TextStyle(
                              color: Color(0xFF007BFF),
                              fontWeight: FontWeight.bold,
                              fontSize: 16)),
                      IconButton(
                        icon: const Icon(Icons.settings,
                            color: Color(0xFF6C757D), size: 28),
                        onPressed: () => context.go('/profile'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 30),
                  // Search Bar
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
                  // Section Title
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Cursos Inscritos',
                          style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF007BFF))),
                      IconButton(
                        icon: const Icon(Icons.arrow_forward,
                            color: Color(0xFF007BFF)),
                        onPressed: () => context.go('/courses'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 15),
                  // Courses List
                  if (cursos.isEmpty)
                    const Center(child: Text('Nenhum curso inscrito.'))
                  else
                    ...cursos.map<Widget>((curso) {
                      final hasThumbnail = curso['thumbnail'] != null &&
                          (curso['thumbnail'] as String).isNotEmpty;
                      return GestureDetector(
                        onTap: () =>
                            context.go('/course_details', extra: curso['idcurso']),
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
                                        errorBuilder: (context, error, stackTrace) =>
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
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: _onItemTapped,
        selectedItemColor: Colors.blue,
        unselectedItemColor: Colors.grey,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home),
            label: 'Início',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.groups),
            label: 'Grupos',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.notifications),
            label: 'Notificações',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: 'Perfil',
          ),
        ],
      ),
    );
  }
}
