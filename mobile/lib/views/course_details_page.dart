import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
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

  bool _isInscrito = false;
  bool _isSubmittingAction = false;

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
      setState(() {
        _isInscrito = data['inscrito'] == true;
      });
      return data;
    }
    return null;
  }

  Future<void> _subscribeToCourse() async {
    setState(() {
      _isSubmittingAction = true;
    });
    try {
      final response = await servidor.postData('curso/${widget.id}/inscrever', {});
      if (response != null && response['success'] == true) {
        _showSnackBar('Inscrição realizada com sucesso!', Colors.green);
        if (mounted) { 
          context.go('/home');
        }
      } else {
        _showSnackBar(response?['message'] ?? 'Erro na inscrição.', Colors.red);
      }
    } catch (e) {
      print('Error subscribing: $e');
      _showSnackBar('Ocorreu um erro ao inscrever-se.', Colors.red);
    } finally {
      setState(() {
        _isSubmittingAction = false;
      });
    }
  }

  Future<void> _unsubscribeFromCourse() async {
    final bool? confirm = await showDialog<bool>(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Confirmação'),
          content: const Text('Tem certeza que deseja sair deste curso?'),
          actions: <Widget>[
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('Cancelar'),
            ),
            TextButton(
              onPressed: () => Navigator.of(context).pop(true),
              style: TextButton.styleFrom(foregroundColor: Colors.red),
              child: const Text('Sim, Sair do Curso'),
            ),
          ],
        );
      },
    );

    if (confirm == true) {
      setState(() {
        _isSubmittingAction = true;
      });
      try {
        final response = await servidor.postData('curso/${widget.id}/sair', {});
        if (response != null && response['success'] == true) {

          _showSnackBar('Saída do curso realizada com sucesso!', Colors.green);
          if (mounted) { 
            context.go('/home');
          }

        } else {
          _showSnackBar(response?['message'] ?? 'Erro ao sair do curso.', Colors.red);
        }
      } catch (e) {
        print('Error unsubscribing: $e');
        _showSnackBar('Ocorreu um erro ao sair do curso.', Colors.red);
      } finally {
        setState(() {
          _isSubmittingAction = false;
        });
      }
    }
  }

  void _showSnackBar(String message, Color color) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: color,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  IconData _getMaterialIcon(String? tipo) {
    switch (tipo) {
      case '1':
        return Icons.slideshow;
      case '2':
        return Icons.insert_drive_file;
      case '3':
        return Icons.link;
      case '4':
        return Icons.insert_chart;
      default:
        return Icons.folder_open;
    }
  }

  Future<void> _launchURL(String url) async {
    if (await canLaunchUrl(Uri.parse(url))) {
      await launchUrl(Uri.parse(url));
    } else {
      _showSnackBar('Não foi possível abrir: $url', Colors.red);
    }
  }

  String _formatDate(String? dateString) {
    if (dateString == null || dateString.isEmpty) return '-';
    try {
      final dateTime = DateTime.parse(dateString);
      return '${dateTime.day}/${dateTime.month}/${dateTime.year}';
    } catch (e) {
      return '-';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF6F9FB),
      appBar: AppBar(
        backgroundColor: const Color(0xFFF6F9FB),
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
            icon: const Icon(Icons.arrow_back, color: Colors.white),
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
            return const Center(child: Text('Erro ao carregar detalhes do curso.'));
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
                  color: Colors.white,
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

                    if (!_isInscrito) ...[
                      Text(
                        'Início das inscrições: ' + _formatDate(curso['iniciodeinscricoes']),
                        style: const TextStyle(fontSize: 16, color: Color(0xFF222B45)),
                      ),
                      Text(
                        'Fim das inscrições: ' + _formatDate(curso['fimdeinscricoes']),
                        style: const TextStyle(fontSize: 16, color: Color(0xFF222B45)),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        'Máx. inscrições: ${curso['maxinscricoes'] ?? '-'}',
                        style: const TextStyle(fontSize: 16, color: Color(0xFF222B45)),
                      ),
                      const SizedBox(height: 14),
                      ElevatedButton(
                        onPressed: _isSubmittingAction ? null : _subscribeToCourse,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF007BFF),
                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        child: _isSubmittingAction
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  color: Colors.white,
                                  strokeWidth: 2,
                                ),
                              )
                            : const Text(
                                'Inscrever',
                                style: TextStyle(fontSize: 16, color: Colors.white),
                              ),
                      ),
                    ] else ...[
                      ElevatedButton(
                        onPressed: _isSubmittingAction ? null : _unsubscribeFromCourse,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.red,
                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        child: _isSubmittingAction
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  color: Colors.white,
                                  strokeWidth: 2,
                                ),
                              )
                            : const Text(
                                'Sair do Curso',
                                style: TextStyle(fontSize: 16, color: Colors.white),
                              ),
                      ),
                      const SizedBox(height: 14),
                      Text(
                        curso['planocurricular'] ?? 'Sem plano curricular.',
                        style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w500, color: Color(0xFF007BFF)),
                      ),
                    ],
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
                      Wrap(
                        spacing: 8.0,
                        runSpacing: 8.0,
                        children: List<Widget>.from((curso['topicos'] as List).map((topico) => Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: const Color(0xFF007BFF).withOpacity(0.1),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            topico['designacao'] ?? '',
                            style: const TextStyle(fontSize: 14, color: Color(0xFF007BFF), fontWeight: FontWeight.w500),
                          ),
                        ))),
                      ),
                    ],
                  ),
                ),

              if (_isInscrito && curso['licoes'] != null && curso['licoes'] is List && (curso['licoes'] as List).isNotEmpty)
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
                      ...List<Widget>.from((curso['licoes'] as List).map((licao) {
                        final List<dynamic> materiais = licao['materiais'] as List<dynamic>? ?? [];
                        return Card(
                          margin: const EdgeInsets.only(bottom: 8),
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                            side: BorderSide(color: Colors.grey.shade200, width: 1),
                          ),
                          child: ExpansionTile(
                            title: Text(
                              licao['titulo'] ?? '',
                              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
                            ),
                            subtitle: licao['descricao'] != null
                                ? Text(licao['descricao'], style: const TextStyle(fontSize: 14, color: Colors.black54))
                                : null,
                            childrenPadding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                            children: [
                              if (materiais.isNotEmpty)
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text(
                                      'Materiais:',
                                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                    ),
                                    const SizedBox(height: 8),
                                    ...materiais.map((material) => Padding(
                                          padding: const EdgeInsets.symmetric(vertical: 4),
                                          child: InkWell(
                                            onTap: () => _launchURL(material['referencia'] ?? ''),
                                            child: Row(
                                              children: [
                                                Icon(_getMaterialIcon(material['tipo']), size: 20, color: const Color(0xFF007BFF)),
                                                const SizedBox(width: 8),
                                                Expanded(
                                                  child: Text(
                                                    material['titulo'] ?? '',
                                                    style: const TextStyle(
                                                      fontSize: 15,
                                                      color: Color(0xFF007BFF),
                                                      decoration: TextDecoration.underline,
                                                    ),
                                                    overflow: TextOverflow.ellipsis,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        )),
                                  ],
                                )
                              else
                                const Text(
                                  'Nenhum material disponível para esta lição.',
                                  style: TextStyle(fontSize: 14, color: Colors.black54),
                                ),
                            ],
                          ),
                        );
                      })),
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
