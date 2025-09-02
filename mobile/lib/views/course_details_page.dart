import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../backend/notifications_service.dart';
import '../middleware.dart';
import '../components/confirmation_dialog.dart';
import '../backend/shared_preferences.dart' as my_prefs;

class CourseDetailsPage extends StatefulWidget {
  final int id;
  const CourseDetailsPage({super.key, required this.id});

  @override
  State<CourseDetailsPage> createState() => _CourseDetailsPageState();
}

class _CourseDetailsPageState extends State<CourseDetailsPage> {
  bool _isLoading = true;
  String? _errorMessage;
  Map<String, dynamic>? _courseData;
  bool _isInscrito = false;
  bool _isSubmittingAction = false;

  final AppMiddleware _middleware = AppMiddleware();
  final NotificationService _notificationService = NotificationService();

  @override
  void initState() {
    super.initState();
    _fetchCourseDetails();
  }

  Future<void> _fetchCourseDetails() async {
    if (!_isLoading && mounted) {
      setState(() => _isLoading = true);
    }
    try {
      final data = await _middleware.fetchCourseDetails(widget.id);
      if (mounted) {
        setState(() {
          _courseData = data;
          _isInscrito = data['inscrito'] == true;
          _errorMessage = null;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Erro ao carregar detalhes do curso.';
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _subscribeToCourse() async {
    if (_courseData == null || _courseData!['canal'] == null) {
      _showSnackBar('Não foi possível obter o canal do curso.', Colors.red);
      return;
    }

    final bool confirmou =
        await mostrarDialogoDeConfirmacao(
          context: context,
          titulo: 'Confirmação',
          conteudo: 'Tem certeza que deseja inscrever-se neste curso?',
          textoBotaoConfirmar: 'Inscrever-me no Curso',
          textoBotaoCancelar: 'Cancelar',
          confirmButtonColor: Colors.lightGreenAccent.shade700,
        ) ??
        false;

    if (confirmou) {
      setState(() => _isSubmittingAction = true);
      try {
        final userId = await my_prefs.getUserId();
        if (userId == null) {
          _showSnackBar('Erro: Utilizador não autenticado.', Colors.red);
          if (mounted) setState(() => _isSubmittingAction = false);
          return;
        }
        final response = await _middleware.subscribeToCourse(
          widget.id,
          int.parse(userId),
        );
        if (response['success'] == true ||
            (response['message'] as String?)?.contains('sucesso') == true) {
          final int? canalId = int.tryParse(_courseData!['canal'].toString());
          if (canalId != null) {
            await _notificationService.subscribeToCourseTopic(canalId);
          }
          _showSnackBar('Inscrição realizada com sucesso!', Colors.green);
          if (mounted) await _fetchCourseDetails();
        } else {
          _showSnackBar(
            response['message'] ?? 'Erro na inscrição.',
            Colors.red,
          );
        }
      } catch (e) {
        _showSnackBar('Ocorreu um erro ao inscrever-se.', Colors.red);
      } finally {
        if (mounted) setState(() => _isSubmittingAction = false);
      }
    }
  }

  Future<void> _unsubscribeFromCourse() async {
    if (_courseData == null || _courseData!['canal'] == null) {
      _showSnackBar('Não foi possível obter o canal do curso.', Colors.red);
      return;
    }

    final bool confirmou =
        await mostrarDialogoDeConfirmacao(
          context: context,
          titulo: 'Confirmação',
          conteudo: 'Tem certeza que deseja sair deste curso?',
          textoBotaoConfirmar: 'Sair do Curso',
          textoBotaoCancelar: 'Cancelar',
          confirmButtonColor: const Color(0xFFFF0004),
        ) ??
        false;

    if (confirmou) {
      setState(() => _isSubmittingAction = true);
      try {
        final userId = await my_prefs.getUserId();
        if (userId == null) {
          _showSnackBar('Erro: Utilizador não autenticado.', Colors.red);
          if (mounted) setState(() => _isSubmittingAction = false);
          return;
        }
        final response = await _middleware.unsubscribeFromCourse(
          widget.id,
          int.parse(userId),
        );
        if (response['success'] == true ||
            (response['message'] as String?)?.contains('sucesso') == true) {
          final int? canalId = int.tryParse(_courseData!['canal'].toString());
          if (canalId != null) {
            await _notificationService.unsubscribeFromCourseTopic(canalId);
          }
          _showSnackBar('Saída do curso realizada com sucesso!', Colors.green);
          if (mounted) await _fetchCourseDetails();
        } else {
          _showSnackBar(
            response['message'] ?? 'Erro ao sair do curso.',
            Colors.red,
          );
        }
      } catch (e) {
        _showSnackBar('Ocorreu um erro ao sair do curso.', Colors.red);
      } finally {
        if (mounted) setState(() => _isSubmittingAction = false);
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
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
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

  String _formatDateTime(String? dateTimeString) {
    if (dateTimeString == null || dateTimeString.isEmpty) return '-';
    try {
      final dt = DateTime.parse(dateTimeString);
      String two(int n) => n.toString().padLeft(2, '0');
      return '${two(dt.day)}/${two(dt.month)}/${dt.year} ${two(dt.hour)}:${two(dt.minute)}';
    } catch (_) {
      return _formatDate(dateTimeString);
    }
  }

  bool _isSincrono(Map<String, dynamic> d) {
    final tipo = (d['tipo'] ?? d['tipocurso'] ?? '').toString().toLowerCase();
    if (tipo.contains('sinc') || tipo == 'sincrono' || tipo == 'síncrono')
      return true;
    if (d['sincrono'] == true) return true;
    final sessoes = d['sessoes'];
    if (sessoes is List && sessoes.isNotEmpty) return true;
    return false;
  }

  String _tipoLabel(Map<String, dynamic> d) =>
      _isSincrono(d) ? 'Síncrono' : 'Assíncrono';

  String _horasText(Map<String, dynamic> d) {
    final h = d['numerohoras'] ?? d['horas'] ?? d['duracao'];
    if (h == null) return '-';
    final s = h.toString();
    return s.isEmpty ? '-' : '$s h';
  }

  int _numSessoes(Map<String, dynamic> d) {
    final s = d['sessoes'];
    if (s is List) return s.length;
    final n = d['numsessoes'] ?? d['numerosessoes'];
    return int.tryParse(n?.toString() ?? '') ?? 0;
  }

  int _numLicoes(Map<String, dynamic> d) {
    final l = d['licoes'];
    if (l is List) return l.length;
    return int.tryParse((d['numlicoes'] ?? '').toString()) ?? 0;
  }

  String _periodoCurso(Map<String, dynamic> d) {
    final ini = d['datainicio'] ?? d['iniciocurso'] ?? d['inicio'];
    final fim = d['datafim'] ?? d['fimcurso'] ?? d['fim'];
    final si = _formatDate(ini?.toString());
    final sf = _formatDate(fim?.toString());
    if (si == '-' && sf == '-') return '-';
    if (sf == '-') return si;
    if (si == '-') return sf;
    return '$si — $sf';
  }

  String _inscricoesPeriodoDT(Map<String, dynamic> d) {
    final ini =
        d['iniciodeinscricoes'] ??
        d['inicioinscricoes'] ??
        d['inscricoesinicio'];
    final fim =
        d['fimdeinscricoes'] ?? d['fiminscricoes'] ?? d['inscricoestermo'];
    final si = _formatDateTime(ini?.toString());
    final sf = _formatDateTime(fim?.toString());
    if (si == '-' && sf == '-') return '-';
    if (sf == '-') return si;
    if (si == '-') return sf;
    return '$si até $sf';
  }

  String _cursoPeriodoDT(Map<String, dynamic> d) {
    final ini = d['datainicio'] ?? d['iniciocurso'] ?? d['inicio'];
    final fim = d['datafim'] ?? d['fimcurso'] ?? d['fim'];
    final si = _formatDateTime(ini?.toString());
    final sf = _formatDateTime(fim?.toString());
    if (si == '-' && sf == '-') return '-';
    if (sf == '-') return si;
    if (si == '-') return sf;
    return '$si até $sf';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF6F9FB),
      appBar: AppBar(
        backgroundColor: const Color(0xFFF6F9FB),
        elevation: 0,
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
        title: const Text(
          'Detalhes do Curso',
          style: TextStyle(
            color: Color(0xFF007BFF),
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: _buildBodyContent(),
    );
  }

  Widget _buildBodyContent() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_errorMessage != null) {
      return Center(child: Text(_errorMessage!));
    }

    if (_courseData == null) {
      return const Center(child: Text('Curso não encontrado.'));
    }

    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 24.0),
      children: [
        if (_courseData!['thumbnail'] != null &&
            (_courseData!['thumbnail'] as String).isNotEmpty)
          Center(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(18),
              child: Image.network(
                _courseData!['thumbnail'],
                width: 200,
                height: 200,
                fit: BoxFit.cover,
                errorBuilder:
                    (context, error, stackTrace) => const Icon(
                      Icons.code,
                      color: Color(0xFFFD7E14),
                      size: 80,
                    ),
              ),
            ),
          ),
        const SizedBox(height: 28),
        // Header and primary facts
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
                _courseData!['nome'] ?? 'Sem nome',
                style: const TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF007BFF),
                ),
              ),
              const SizedBox(height: 10),
              // Tipo chip + disponibilidade
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color:
                          _isSincrono(_courseData!)
                              ? const Color(0xFFE8F5E9)
                              : const Color(0xFFEDE7F6),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          _isSincrono(_courseData!)
                              ? Icons.videocam
                              : Icons.cloud_queue,
                          size: 16,
                          color:
                              _isSincrono(_courseData!)
                                  ? const Color(0xFF2E7D32)
                                  : const Color(0xFF5E35B1),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          _tipoLabel(_courseData!),
                          style: TextStyle(
                            color:
                                _isSincrono(_courseData!)
                                    ? const Color(0xFF2E7D32)
                                    : const Color(0xFF5E35B1),
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Row(
                    children: [
                      Icon(
                        _courseData!['disponivel'] == true
                            ? Icons.check_circle
                            : Icons.cancel,
                        color:
                            _courseData!['disponivel'] == true
                                ? Colors.lightGreenAccent.shade700
                                : Colors.deepOrange.shade800,
                        size: 22,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        _courseData!['disponivel'] == true
                            ? 'Disponível'
                            : 'Indisponível',
                        style: TextStyle(
                          color:
                              _courseData!['disponivel'] == true
                                  ? Colors.lightGreenAccent.shade700
                                  : Colors.deepOrange.shade800,
                          fontWeight: FontWeight.w600,
                          fontSize: 16,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 14),
              // Facts chips
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: [
                  _FactChip(
                    icon: Icons.access_time,
                    label: 'Duração',
                    value: _horasText(_courseData!),
                  ),
                  if (_isSincrono(_courseData!))
                    _FactChip(
                      icon: Icons.event,
                      label: 'Período',
                      value: _periodoCurso(_courseData!),
                    ),
                  if (_isSincrono(_courseData!))
                    _FactChip(
                      icon: Icons.video_camera_front,
                      label: 'Sessões',
                      value: _numSessoes(_courseData!).toString(),
                    )
                  else
                    _FactChip(
                      icon: Icons.menu_book,
                      label: 'Lições',
                      value: _numLicoes(_courseData!).toString(),
                    ),
                ],
              ),
              const SizedBox(height: 16),
              // Detailed info per type (exactly as requested)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFF9FBFE),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE6ECF2)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _DetailRow(
                      label: 'Tipo de curso',
                      value: _tipoLabel(_courseData!),
                    ),
                    const SizedBox(height: 6),
                    _DetailRow(
                      label: 'Estado',
                      value:
                          _courseData!['disponivel'] == true
                              ? 'Disponível'
                              : 'Indisponível',
                    ),
                    const SizedBox(height: 6),
                    _DetailRow(
                      label: 'Inscrições',
                      value: _inscricoesPeriodoDT(_courseData!),
                    ),
                    if (_isSincrono(_courseData!)) ...[
                      const SizedBox(height: 6),
                      _DetailRow(
                        label: 'Duração do Curso',
                        value: _cursoPeriodoDT(_courseData!),
                      ),
                      const SizedBox(height: 6),
                      _DetailRow(
                        label: 'Nº de horas',
                        value:
                            (_courseData!['numerohoras'] ??
                                    _courseData!['horas'] ??
                                    '-')
                                .toString(),
                      ),
                      const SizedBox(height: 6),
                      _DetailRow(
                        label: 'Inscritos',
                        value:
                            (() {
                              if (_courseData!['inscritosCount'] != null)
                                return _courseData!['inscritosCount']
                                    .toString();
                              if (_courseData!['inscritos'] is List)
                                return (_courseData!['inscritos'] as List)
                                    .length
                                    .toString();
                              return '-';
                            })(),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 12),
              if (!_isInscrito)
                ElevatedButton(
                  onPressed: _isSubmittingAction ? null : _subscribeToCourse,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF007BFF),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 24,
                      vertical: 12,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  child:
                      _isSubmittingAction
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
                )
              else ...[
                ElevatedButton(
                  onPressed:
                      _isSubmittingAction ? null : _unsubscribeFromCourse,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.red,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 24,
                      vertical: 12,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  child:
                      _isSubmittingAction
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
                  _courseData!['planocurricular'] ?? 'Sem plano curricular.',
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w500,
                    color: Color(0xFF007BFF),
                  ),
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: 16),
        // Descrição / Plano Curricular
        if ((_courseData!['descricao'] ?? '').toString().isNotEmpty ||
            (_courseData!['planocurricular'] ?? '').toString().isNotEmpty)
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
                const Text(
                  'Sobre o Curso',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF007BFF),
                  ),
                ),
                const SizedBox(height: 8),
                if ((_courseData!['descricao'] ?? '').toString().isNotEmpty)
                  Text(
                    _courseData!['descricao'],
                    style: const TextStyle(
                      fontSize: 15,
                      color: Color(0xFF1D1B20),
                    ),
                  ),
                if ((_courseData!['descricao'] ?? '').toString().isNotEmpty)
                  const SizedBox(height: 10),
                if ((_courseData!['planocurricular'] ?? '')
                    .toString()
                    .isNotEmpty)
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Plano Curricular',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        _courseData!['planocurricular'],
                        style: const TextStyle(
                          fontSize: 14,
                          color: Color(0xFF49454F),
                        ),
                      ),
                    ],
                  ),
              ],
            ),
          ),
        const SizedBox(height: 24),
        if (_courseData!['topicos'] != null &&
            (_courseData!['topicos'] as List).isNotEmpty)
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
                const Text(
                  'Tópicos',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF007BFF),
                  ),
                ),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 8.0,
                  runSpacing: 8.0,
                  children: List<Widget>.from(
                    (_courseData!['topicos'] as List).map(
                      (topico) => Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFF007BFF).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          topico['designacao'] ?? '',
                          style: const TextStyle(
                            fontSize: 14,
                            color: Color(0xFF007BFF),
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        const SizedBox(height: 16),
        // Sessões (apenas para cursos síncronos)
        if (_isSincrono(_courseData!) &&
            _courseData!['sessoes'] is List &&
            (_courseData!['sessoes'] as List).isNotEmpty)
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
                const Text(
                  'Sessões ao vivo',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF007BFF),
                  ),
                ),
                const SizedBox(height: 10),
                ...List<Widget>.from(
                  ((_courseData!['sessoes'] as List)).map((s) {
                    final Map<String, dynamic> sessao =
                        Map<String, dynamic>.from(s as Map);
                    final titulo = sessao['titulo'] ?? 'Sessão';
                    final inicio = _formatDateTime(
                      sessao['inicio']?.toString() ??
                          sessao['datainicio']?.toString(),
                    );
                    final fim = _formatDateTime(
                      sessao['fim']?.toString() ??
                          sessao['datafim']?.toString(),
                    );
                    final local = sessao['local'] ?? sessao['sala'] ?? '';
                    final link = sessao['link'] ?? sessao['url'] ?? null;
                    return ListTile(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 8),
                      leading: const Icon(
                        Icons.video_call,
                        color: Color(0xFF007BFF),
                      ),
                      title: Text(
                        titulo.toString(),
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                      subtitle: Text(
                        [
                          inicio,
                          fim != '-' ? 'até $fim' : null,
                          local.toString().isNotEmpty ? ' • $local' : null,
                        ].whereType<String>().join('  '),
                      ),
                      trailing:
                          link != null
                              ? IconButton(
                                icon: const Icon(
                                  Icons.open_in_new,
                                  color: Color(0xFF007BFF),
                                ),
                                onPressed: () => _launchURL(link.toString()),
                              )
                              : null,
                    );
                  }),
                ),
              ],
            ),
          ),
        if (_isInscrito &&
            _courseData!['licoes'] != null &&
            (_courseData!['licoes'] as List).isNotEmpty)
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
                const Text(
                  'Lições',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF007BFF),
                  ),
                ),
                const SizedBox(height: 10),
                ...List<Widget>.from(
                  (_courseData!['licoes'] as List).map((licao) {
                    final List<dynamic> materiais =
                        licao['materiais'] as List<dynamic>? ?? [];
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
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 16,
                          ),
                        ),
                        subtitle:
                            licao['descricao'] != null
                                ? Text(
                                  licao['descricao'],
                                  style: const TextStyle(
                                    fontSize: 14,
                                    color: Colors.black54,
                                  ),
                                )
                                : null,
                        childrenPadding: const EdgeInsets.symmetric(
                          horizontal: 16.0,
                          vertical: 8.0,
                        ),
                        children: [
                          if (materiais.isNotEmpty)
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Materiais:',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 15,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                ...materiais.map(
                                  (material) => Padding(
                                    padding: const EdgeInsets.symmetric(
                                      vertical: 4,
                                    ),
                                    child: InkWell(
                                      onTap:
                                          () => _launchURL(
                                            material['referencia'] ?? '',
                                          ),
                                      child: Row(
                                        children: [
                                          Icon(
                                            _getMaterialIcon(material['tipo']),
                                            size: 20,
                                            color: const Color(0xFF007BFF),
                                          ),
                                          const SizedBox(width: 8),
                                          Expanded(
                                            child: Text(
                                              material['titulo'] ?? '',
                                              style: const TextStyle(
                                                fontSize: 15,
                                                color: Color(0xFF007BFF),
                                                decoration:
                                                    TextDecoration.underline,
                                              ),
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            )
                          else
                            const Text(
                              'Nenhum material disponível para esta lição.',
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.black54,
                              ),
                            ),
                        ],
                      ),
                    );
                  }),
                ),
              ],
            ),
          ),
      ],
    );
  }
}

class _FactChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _FactChip({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFFF5F7FA),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE6ECF2)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: const Color(0xFF007BFF)),
          const SizedBox(width: 6),
          Text(
            '$label: ',
            style: const TextStyle(
              fontWeight: FontWeight.w600,
              color: Color(0xFF222B45),
            ),
          ),
          Text(value, style: const TextStyle(color: Color(0xFF49454F))),
        ],
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;

  const _DetailRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 160,
          child: Text(
            '$label:',
            style: const TextStyle(
              fontWeight: FontWeight.w600,
              color: Color(0xFF222B45),
            ),
          ),
        ),
        Expanded(
          child: Text(value, style: const TextStyle(color: Color(0xFF49454F))),
        ),
      ],
    );
  }
}
