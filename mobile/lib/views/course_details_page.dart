import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../backend/server.dart';

class CourseDetailsPage extends StatefulWidget {
  final int id;
  const CourseDetailsPage({super.key, required this.id});

  @override
  State<CourseDetailsPage> createState() => _CourseDetailsPageState();
}

class _CourseDetailsPageState extends State<CourseDetailsPage> {
  late Future<Map<String, dynamic>?> _courseFuture;
  final Servidor servidor = Servidor();

  @override
  void initState() {
    super.initState();
    _courseFuture = _fetchCourseDetails();
  }

  Future<Map<String, dynamic>?> _fetchCourseDetails() async {
    final id = widget.id;
    final data = await servidor.getData('curso/$id');
    print('Resposta da API para curso/$id:');
    print(data);
    if (data is Map<String, dynamic>) {
      return data;
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF6F9FB), // fundo igual ao scaffoldBackgroundColor do main
      appBar: AppBar(
        backgroundColor: const Color(0xFFF6F9FB), // cor do texto e ícones quando AppBar está sombreado
        elevation: 0,
        shadowColor: Colors.blue.shade300.withOpacity(0.5),
        scrolledUnderElevation: 4.0,
        leading: Container(
          margin: const EdgeInsets.only(left: 8, top: 6, bottom: 6),
          decoration: const BoxDecoration(
            color: Color(0xFF007BFF),
            shape: BoxShape.circle,
          ),
          child: IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.white), // seta branca
            onPressed: () => context.go('/home'),
          ),
        ),
        title: const Text('Detalhes do Curso', style: TextStyle(color: Color(0xFF007BFF), fontWeight: FontWeight.bold)),
      ),
      body: FutureBuilder<Map<String, dynamic>?>(
        future: _courseFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          } else if (snapshot.hasError) {
            return Center(child: Text('Erro ao carregar detalhes do curso.'));
          } else if (!snapshot.hasData || snapshot.data == null) {
            return const Center(child: Text('Curso não encontrado.'));
          }
          final curso = snapshot.data!;
          return ListView(
            padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 24.0),
            children: [
              if (curso['thumbnail'] != null && (curso['thumbnail'] as String).isNotEmpty)
                Center(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(18),
                    child: Image.network(
                      curso['thumbnail'],
                      width: 200,
                      height: 200,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) =>
                          const Icon(Icons.code, color: Color(0xFFFD7E14), size: 80),
                    ),
                  ),
                ),
              const SizedBox(height: 28),
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: Colors.white, // fundo igual ao geral
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.grey.withOpacity(0.15),
                      blurRadius: 8,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      curso['nome'] ?? 'Sem nome',
                      style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Color(0xFF007BFF)),
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Icon(
                          curso['disponivel'] == true ? Icons.check_circle : Icons.cancel,
                          color: curso['disponivel'] == true ? Colors.lightGreenAccent.shade700 : Colors.deepOrange.shade800,
                          size: 22,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          curso['disponivel'] == true ? 'Disponível' : 'Indisponível',
                          style: TextStyle(
                            color: curso['disponivel'] == true ? Colors.lightGreenAccent.shade700 : Colors.deepOrange.shade800,
                            fontWeight: FontWeight.w600,
                            fontSize: 16,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    Text(
                      'Início das inscrições: ' + (curso['iniciodeinscricoes']?.toString().split('T').first ?? '-'),
                      style: const TextStyle(fontSize: 16, color: Color(0xFF222B45)),
                    ),
                    Text(
                      'Fim das inscrições: ' + (curso['fimdeinscricoes']?.toString().split('T').first ?? '-'),
                      style: const TextStyle(fontSize: 16, color: Color(0xFF222B45)),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      'Máx. inscrições: ${curso['maxinscricoes'] ?? '-'}',
                      style: const TextStyle(fontSize: 16, color: Color(0xFF222B45)),
                    ),
                    const SizedBox(height: 14),
                    Text(
                      curso['planocurricular'] ?? 'Sem plano curricular.',
                      style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w500, color: Color(0xFF007BFF)),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              if (curso['topicos'] != null && curso['topicos'] is List && (curso['topicos'] as List).isNotEmpty)
                Container(
                  margin: const EdgeInsets.only(bottom: 18),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(18),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.grey.withOpacity(0.10),
                        blurRadius: 6,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Tópicos', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF007BFF))),
                      const SizedBox(height: 10),
                      ...List<Widget>.from((curso['topicos'] as List).map((topico) => Padding(
                        padding: const EdgeInsets.symmetric(vertical: 3),
                        child: Row(
                          children: [
                            const Icon(Icons.arrow_right, size: 20, color: Color(0xFF007BFF)),
                            const SizedBox(width: 6),
                            Text(topico['designacao'] ?? '', style: const TextStyle(fontSize: 16)),
                          ],
                        ),
                      ))),
                    ],
                  ),
                ),
              if (curso['licoes'] != null && curso['licoes'] is List && (curso['licoes'] as List).isNotEmpty)
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(18),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.grey.withOpacity(0.10),
                        blurRadius: 6,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Lições', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF007BFF))),
                      const SizedBox(height: 10),
                      ...List<Widget>.from((curso['licoes'] as List).map((licao) => Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(licao['titulo'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
                            if (licao['descricao'] != null)
                              Padding(
                                padding: const EdgeInsets.only(left: 8.0, top: 2, bottom: 4),
                                child: Text(licao['descricao'], style: const TextStyle(fontSize: 15, color: Colors.black54)),
                              ),
                          ],
                        ),
                      ))),
                    ],
                  ),
                ),
            ],
          );
        },
      ),
    );
  }
}
