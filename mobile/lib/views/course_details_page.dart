import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../backend/notifications_service.dart';
import '../middleware.dart';
import '../components/confirmation_dialog.dart';
import '../backend/shared_preferences.dart' as my_prefs;
import '../components/submission_file_preview.dart';

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
  int? _inscritosCountRemote;
  bool _loadingInscritosCount = false;
  String? _currentUserId;
  String? _currentUserEmail;

  final AppMiddleware _middleware = AppMiddleware();
  final NotificationService _notificationService = NotificationService();

  @override
  void initState() {
    super.initState();
    _fetchCourseDetails();
    _loadIdentity();
  }

  Future<void> _loadIdentity() async {
    try {
      final user = await my_prefs.getUser();
      if (!mounted) return;
      setState(() {
        _currentUserId =
            (user?['idutilizador'] ?? user?['utilizador'] ?? user?['id'])
                ?.toString();
        _currentUserEmail = user?['email']?.toString();
      });
    } catch (_) {}
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
        _ensureInscritosCount();
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

  Future<void> _ensureInscritosCount() async {
    if (!mounted || _courseData == null) return;
    if (!_isSincrono(_courseData!)) return;
    final local = _resolveInscritosCount(_courseData!);
    if (local != '-' && int.tryParse(local) != null) return;
    if (_loadingInscritosCount) return;
    setState(() => _loadingInscritosCount = true);
    try {
      final v = await _middleware.fetchCourseInscritosCount(widget.id);
      if (!mounted) return;
      if (v != null) {
        setState(() => _inscritosCountRemote = v);
      }
    } catch (_) {
    } finally {
      if (mounted) setState(() => _loadingInscritosCount = false);
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

  String _resolveEstado(Map<String, dynamic> d) {
    try {
      final nested = (d['cursosincrono'] ?? d['cursoSincrono']) as Map?;
      final startRaw =
          d['inicio'] ??
          d['datainicio'] ??
          (nested is Map ? (nested['inicio'] ?? nested['datainicio']) : null);
      final endRaw =
          d['fim'] ??
          d['datafim'] ??
          (nested is Map ? (nested['fim'] ?? nested['datafim']) : null);
      DateTime? start;
      DateTime? end;
      if (startRaw != null) {
        try {
          start = DateTime.parse(startRaw.toString());
        } catch (_) {}
      }
      if (endRaw != null) {
        try {
          end = DateTime.parse(endRaw.toString());
        } catch (_) {}
      }
      final now = DateTime.now();
      if (end != null && now.isAfter(end)) return 'Terminado';
      if (start != null && now.isBefore(start)) return 'Pendente';
      if (start != null && (end == null || !now.isAfter(end)))
        return 'Em curso';
      if (d['disponivel'] == false) return 'Pendente';
      return 'Em curso';
    } catch (_) {
      return 'Em curso';
    }
  }

  String _resolveNumeroHoras(Map<String, dynamic> d) {
    final nested = (d['cursosincrono'] ?? d['cursoSincrono']) as Map?;
    final raw =
        d['numerohoras'] ??
        d['nhoras'] ??
        d['nHoras'] ??
        d['horas'] ??
        d['duracaohoras'] ??
        d['duracao_horas'] ??
        d['duracao'] ??
        (nested is Map
            ? (nested['numerohoras'] ??
                nested['nhoras'] ??
                nested['nHoras'] ??
                nested['horas'] ??
                nested['duracaohoras'] ??
                nested['duracao_horas'] ??
                nested['duracao'])
            : null);
    if (raw != null) {
      final s = raw.toString();
      if (s.isEmpty) return '-';
      final match = RegExp(r"(\d+(?:[\.,]\d+)?)").firstMatch(s);
      if (match != null) return match.group(1)!.replaceAll(',', '.');
      return s;
    }
    final sessoes = d['sessoes'];
    if (sessoes is List && sessoes.isNotEmpty) {
      double totalHours = 0;
      for (final s in sessoes) {
        try {
          final m = Map<String, dynamic>.from(s as Map);
          final siStr = (m['inicio'] ?? m['datainicio'])?.toString();
          final sfStr = (m['fim'] ?? m['datafim'])?.toString();
          if (siStr != null && sfStr != null) {
            final si = DateTime.parse(siStr);
            final sf = DateTime.parse(sfStr);
            final diff = sf.difference(si).inMinutes / 60.0;
            if (diff > 0) totalHours += diff;
          }
        } catch (_) {}
      }
      if (totalHours > 0) {
        final rounded1 = double.parse(totalHours.toStringAsFixed(1));
        final rounded0 = totalHours.round();
        return (rounded1 - rounded0).abs() < 0.05
            ? rounded0.toString()
            : rounded1.toString();
      }
    }
    return '-';
  }

  String _resolveInscritosCount(Map<String, dynamic> d) {
    const intKeys = [
      'inscritosCount',
      'inscricoesCount',
      'numeroinscritos',
      'inscritos_numero',
      'inscritoscount',
      'inscritos_total',
      'totalInscritos',
      'ninscritos',
      'numinscritos',
      'inscricoes',
    ];
    for (final k in intKeys) {
      final v = d[k];
      if (v != null && v.toString().isNotEmpty) {
        final n = int.tryParse(v.toString());
        if (n != null) return n.toString();
      }
    }
    const listKeys = [
      'inscritos',
      'inscricoes',
      'participantes',
      'alunos',
      'formandos',
    ];
    for (final k in listKeys) {
      final v = d[k];
      if (v is List) return v.length.toString();
    }
    return '-';
  }

  String _resolveMaxInscricoes(Map<String, dynamic> d) {
    final nested = (d['cursosincrono'] ?? d['cursoSincrono']) as Map?;
    const keys = [
      'maxinscricoes',
      'maxincricoes',
      'maxInscricoes',
      'maxIncricoes',
      'maximoinscricoes',
      'maximoInscricoes',
      'limite',
      'lotacao',
      'vagas',
      'capacidade',
      'capMax',
      'inscricoesmaximas',
      'inscricoesMaximas',
    ];
    for (final k in keys) {
      final v = d[k];
      if (v != null && v.toString().isNotEmpty) {
        final n = int.tryParse(v.toString());
        return (n != null) ? n.toString() : v.toString();
      }
    }
    if (nested is Map) {
      for (final k in keys) {
        final v = nested[k];
        if (v != null && v.toString().isNotEmpty) {
          final n = int.tryParse(v.toString());
          return (n != null) ? n.toString() : v.toString();
        }
      }
    }
    if (d['regras'] is Map) {
      final m = Map<String, dynamic>.from(d['regras']);
      for (final k in [
        'maxinscricoes',
        'maxincricoes',
        'limite',
        'lotacao',
        'vagas',
      ]) {
        final v = m[k];
        if (v != null) return v.toString();
      }
    }
    return '-';
  }

  double? _resolveProgresso(Map<String, dynamic> d) {
    final nested = (d['cursosincrono'] ?? d['cursoSincrono']) as Map?;
    final candidates = [
      d['progresso'],
      d['progress'],
      d['percent'],
      d['percentagem'],
      d['percentage'],
      if (nested is Map) nested['progresso'],
      if (nested is Map) nested['progress'],
      if (nested is Map) nested['percent'],
      if (nested is Map) nested['percentagem'],
      if (nested is Map) nested['percentage'],
    ];
    for (final v in candidates) {
      if (v == null) continue;
      final s = v.toString().trim();
      if (s.isEmpty) continue;
      final n = double.tryParse(s);
      if (n == null) continue;
      final pct = n <= 1.0 ? (n * 100.0) : n;
      final clamped = pct.clamp(0.0, 100.0);
      return clamped.toDouble();
    }
    return null;
  }

  String? _resolveStudentFinalNota(Map<String, dynamic> d) {
    try {
      final mine = d['minhaAvaliacaoFinal'] ?? d['minhaavaliacaofinal'];
      if (mine != null) {
        if (mine is Map) {
          final n = mine['nota'] ?? mine['classificacao'];
          if (n != null && n.toString().isNotEmpty) return n.toString();
        } else if (mine is num || mine is String) {
          final s = mine.toString();
          if (s.isNotEmpty) return s;
        }
      }
      final directFinalRaw = d['avaliacaofinal'] ?? d['avaliacaoFinal'];
      if (directFinalRaw is num ||
          (directFinalRaw is String && directFinalRaw.trim().isNotEmpty)) {
        final s = directFinalRaw.toString();
        final isNumeric = num.tryParse(s) != null;
        if (isNumeric) return s;
      }

      final top = d['notaFinal'] ?? d['classificacaoFinal'];
      if (top != null && top.toString().isNotEmpty) return top.toString();

      final String? uid = _currentUserId;
      final String? email = _currentUserEmail?.toLowerCase();

      String? formingId;
      for (final listKey in const [
        'inscritos',
        'inscricoes',
        'participantes',
        'alunos',
        'formandos',
      ]) {
        final v = d[listKey];
        if (v is List) {
          for (final it in v) {
            if (it is Map) {
              final ids = [
                it['idutilizador'],
                it['utilizador'],
                it['userId'],
                it['id'],
              ];
              final em = it['email']?.toString().toLowerCase();
              if ((uid != null && ids.any((x) => x?.toString() == uid)) ||
                  (email != null && em == email)) {
                formingId =
                    (it['idformando'] ?? it['formando'] ?? it['id'])
                        ?.toString();
                break;
              }
            }
          }
        }
        if (formingId != null) break;
      }

      bool _matchesUid(dynamic v) {
        if ((uid == null || uid.isEmpty) &&
            (formingId == null || formingId.isEmpty))
          return false;
        try {
          final s = v?.toString();
          if (s == null || s.isEmpty) return false;
          return (uid != null && s == uid) ||
              (formingId != null && s == formingId);
        } catch (_) {
          return false;
        }
      }

      bool _matchesEmail(dynamic v) {
        if (email == null || email.isEmpty) return false;
        try {
          final s = v?.toString().toLowerCase();
          return s != null && s.isNotEmpty && s == email;
        } catch (_) {
          return false;
        }
      }

      String? _notaFromObj(Map obj) {
        final n = obj['nota'] ?? obj['classificacao'] ?? obj['valor'];
        return (n != null && n.toString().isNotEmpty) ? n.toString() : null;
      }

      final af = d['avaliacaofinal'] ?? d['avaliacaoFinal'] ?? d['final'];
      if (af is Map) {
        final n0 = _notaFromObj(af);
        if (n0 != null) return n0;
        if (uid != null && af.containsKey(uid)) {
          final v = af[uid];
          if (v is Map) {
            final n = _notaFromObj(v);
            if (n != null) return n;
          } else if (v != null) {
            final s = v.toString();
            if (s.isNotEmpty) return s;
          }
        }
        for (final e in af.entries) {
          final val = e.value;
          if (val is Map) {
            final candidateIds = [
              val['idformando'],
              val['formando'],
              val['idutilizador'],
              val['utilizador'],
              val['userId'],
              val['id'],
            ];
            if (candidateIds.any(_matchesUid)) {
              final n = _notaFromObj(val);
              if (n != null) return n;
            }
          }
        }
      }
      for (final k in const [
        'avaliacoesFinais',
        'avaliacoesfinal',
        'finais',
        'final',
      ]) {
        final v = d[k];
        if (v is List && v.isNotEmpty) {
          Map? mineObj;
          for (final it in v) {
            if (it is Map) {
              final candidateIds = [
                it['idformando'],
                it['formando'],
                it['idutilizador'],
                it['utilizador'],
                it['userId'],
                it['id'],
              ];
              if (candidateIds.any(_matchesUid) ||
                  _matchesEmail(it['email']) ||
                  it['mine'] == true) {
                mineObj = it;
                break;
              }
            }
          }
          if (mineObj != null) {
            final n = _notaFromObj(mineObj);
            if (n != null) return n;
          }
          for (final it in v) {
            if (it is Map) {
              final n = _notaFromObj(it);
              if (n != null) return n;
            }
          }
        }
      }
      Map<String, dynamic>? candidate;
      for (final listKey in const [
        'inscritos',
        'inscricoes',
        'participantes',
        'alunos',
        'formandos',
      ]) {
        final v = d[listKey];
        if (v is List) {
          for (final it in v) {
            if (it is Map) {
              final ids = [
                it['idutilizador'],
                it['utilizador'],
                it['userId'],
                it['id'],
              ];
              if (ids.any(_matchesUid)) {
                candidate = it.cast<String, dynamic>();
                break;
              }
            }
          }
        }
        if (candidate != null) break;
      }
      if (candidate != null) {
        final direct =
            candidate['notaFinal'] ??
            candidate['nota'] ??
            candidate['classificacaoFinal'] ??
            candidate['classificacao'];
        if (direct != null && direct.toString().isNotEmpty) {
          return direct.toString();
        }
        final nestedObj =
            candidate['avaliacaofinal'] ??
            candidate['avaliacaoFinal'] ??
            candidate['final'];
        if (nestedObj is Map) {
          final n = _notaFromObj(nestedObj);
          if (n != null) return n;
        }
        final base =
            candidate['formando'] ??
            candidate['user'] ??
            candidate['utilizador'];
        if (base is Map) {
          final n =
              base['notaFinal'] ??
              base['classificacaoFinal'] ??
              base['classificacao'] ??
              base['nota'];
          if (n != null && n.toString().isNotEmpty) return n.toString();
        }
      }
    } catch (_) {}
    return null;
  }

  List<Map<String, dynamic>> _extractSessoes(Map<String, dynamic> d) {
    final raw = d['sessoes'];
    if (raw is List)
      return raw.whereType<Map>().cast<Map<String, dynamic>>().toList();
    final nested = d['cursosincrono'] ?? d['cursoSincrono'];
    if (nested is Map) {
      final r = nested['sessoes'];
      if (r is List)
        return r.whereType<Map>().cast<Map<String, dynamic>>().toList();
    }
    return const [];
  }

  List<Map<String, dynamic>> _extractAvaliacoesContinuas(
    Map<String, dynamic> d,
  ) {
    const keys = [
      'avaliacoescontinuas',
      'avaliacoesContinuas',
      'avaliacoes',
      'avaliacoes_continuas',
      'avaliacaocontinua',
    ];
    for (final k in keys) {
      final v = d[k];
      if (v is List)
        return v.whereType<Map>().cast<Map<String, dynamic>>().toList();
    }
    final nested = d['cursosincrono'] ?? d['cursoSincrono'];
    if (nested is Map) {
      for (final k in keys) {
        final v = nested[k];
        if (v is List)
          return v.whereType<Map>().cast<Map<String, dynamic>>().toList();
      }
    }
    return const [];
  }

  Map<String, dynamic>? _extractAvaliacaoFinal(Map<String, dynamic> d) {
    // 1) Objeto direto em chaves comuns
    const keys = [
      'avaliacaofinal',
      'avaliacaoFinal',
      'final',
      'avaliacao_final',
    ];
    for (final k in keys) {
      final v = d[k];
      if (v is Map) return v.cast<String, dynamic>();
      if (v is List && v.isNotEmpty) {
        final first = v.first;
        if (first is Map) return first.cast<String, dynamic>();
      }
      // Se o servidor devolver um número simples no topo
      if (k != 'final' && (v is num || (v is String && v.trim().isNotEmpty))) {
        final s = v.toString();
        if (num.tryParse(s) != null) {
          return {'titulo': 'Avaliação Final', 'nota': s};
        }
      }
    }
    // 2) Aninhado em cursoSincrono/cursosincrono
    final nested = d['cursosincrono'] ?? d['cursoSincrono'];
    if (nested is Map) {
      for (final k in keys) {
        final v = nested[k];
        if (v is Map) return v.cast<String, dynamic>();
        if (v is List && v.isNotEmpty) {
          final first = v.first;
          if (first is Map) return first.cast<String, dynamic>();
        }
      }
    }
    // 3) Arrays que podem conter a avaliação final
    const arrayKeys = [
      'avaliacoesFinais',
      'avaliacoesfinal',
      'finais',
      'finals',
    ];
    for (final k in arrayKeys) {
      final v = d[k];
      if (v is List && v.isNotEmpty) {
        final first = v.first;
        if (first is Map) return first.cast<String, dynamic>();
      }
    }
    // 4) Procurar em 'avaliacoes' uma marcada como final
    final avals = d['avaliacoes'];
    if (avals is List) {
      for (final it in avals) {
        if (it is Map) {
          final tipo =
              (it['tipo'] ?? it['categoria'] ?? '').toString().toLowerCase();
          final isFinal =
              tipo.contains('final') ||
              it['final'] == true ||
              it['isFinal'] == true;
          if (isFinal) return it.cast<String, dynamic>();
        }
      }
    }
    // 5) Se nada encontrado mas existir nota do aluno no topo, sintetizar objeto mínimo
    final notaTop =
        (d['notaFinal'] ??
            d['classificacaoFinal'] ??
            d['minhaAvaliacaoFinal']?['nota'] ??
            d['minhaavaliacaofinal']?['nota']);
    if (notaTop != null) {
      return {'titulo': 'Avaliação Final', 'nota': notaTop};
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    Future<bool> _onWillPop() async {
      final dest = _isInscrito ? '/home' : '/search_courses';
      if (mounted) context.go(dest);
      return false;
    }

    return WillPopScope(
      onWillPop: _onWillPop,
      child: Scaffold(
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
              onPressed: () {
                final dest = _isInscrito ? '/home' : '/search_courses';
                context.go(dest);
              },
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
      ),
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
              Wrap(
                spacing: 8,
                runSpacing: 8,
                crossAxisAlignment: WrapCrossAlignment.center,
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
                      mainAxisSize: MainAxisSize.min,
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
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: (_courseData!['disponivel'] == true
                              ? Colors.lightGreenAccent.shade700
                              : Colors.deepOrange.shade800)
                          .withOpacity(0.1),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          _courseData!['disponivel'] == true
                              ? Icons.check_circle
                              : Icons.cancel,
                          color:
                              _courseData!['disponivel'] == true
                                  ? Colors.lightGreenAccent.shade700
                                  : Colors.deepOrange.shade800,
                          size: 18,
                        ),
                        const SizedBox(width: 6),
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
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: [
                  _FactChip(
                    icon: Icons.flag,
                    label: 'Estado',
                    value: _resolveEstado(_courseData!),
                  ),
                  _FactChip(
                    icon: Icons.app_registration,
                    label: 'Inscrições',
                    value: _inscricoesPeriodoDT(_courseData!),
                  ),
                  if (_isSincrono(_courseData!)) ...[
                    _FactChip(
                      icon: Icons.event,
                      label: 'Duração do Curso',
                      value: _cursoPeriodoDT(_courseData!),
                    ),
                    _FactChip(
                      icon: Icons.access_time,
                      label: 'Nº de horas',
                      value: _resolveNumeroHoras(_courseData!),
                    ),
                    _FactChip(
                      icon: Icons.people_alt,
                      label: 'Máx. inscrições',
                      value: _resolveMaxInscricoes(_courseData!),
                    ),
                    _FactChip(
                      icon: Icons.group,
                      label: 'Inscritos',
                      value:
                          (_inscritosCountRemote?.toString() ??
                              _resolveInscritosCount(_courseData!)),
                    ),
                  ],
                ],
              ),
              const SizedBox(height: 16),
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
              ],
            ],
          ),
        ),
        const SizedBox(height: 16),
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
        if (_isSincrono(_courseData!) &&
            _resolveProgresso(_courseData!) != null)
          Container(
            margin: const EdgeInsets.only(bottom: 16),
            padding: const EdgeInsets.all(14),
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
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Progresso no Curso',
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 15,
                      ),
                    ),
                    if (_resolveNumeroHoras(_courseData!) != '-')
                      Text(
                        '${_resolveNumeroHoras(_courseData!)}h',
                        style: const TextStyle(
                          color: Color(0xFF8F9BB3),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 8),
                Stack(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: LinearProgressIndicator(
                        minHeight: 14,
                        value: (_resolveProgresso(_courseData!)! / 100.0).clamp(
                          0.0,
                          1.0,
                        ),
                        backgroundColor: const Color(0xFFE6ECF2),
                        valueColor: const AlwaysStoppedAnimation<Color>(
                          Color(0xFF007BFF),
                        ),
                      ),
                    ),
                    Positioned.fill(
                      child: Center(
                        child: Text(
                          '${_resolveProgresso(_courseData!)!.round()}%',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF1D1B20),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        if (_isSincrono(_courseData!))
          Container(
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
            child: DefaultTabController(
              length: 3,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Padding(
                    padding: EdgeInsets.fromLTRB(16, 16, 16, 0),
                    child: Text(
                      'Conteúdos do Curso',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF007BFF),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  const TabBar(
                    labelColor: Color(0xFF007BFF),
                    unselectedLabelColor: Color(0xFF8F9BB3),
                    indicatorColor: Color(0xFF007BFF),
                    tabs: [
                      Tab(text: 'Sessões e materiais', icon: Icon(Icons.event)),
                      Tab(text: 'Av. Contínuas', icon: Icon(Icons.assignment)),
                      Tab(text: 'Av. Final', icon: Icon(Icons.grade)),
                    ],
                  ),
                  SizedBox(
                    height: 320,
                    child: TabBarView(
                      children: [
                        _SessoesTabDetails(
                          sessoes: _extractSessoes(_courseData!),
                        ),
                        _AvaliacoesContinuasTabDetails(
                          avaliacoes: _extractAvaliacoesContinuas(_courseData!),
                        ),
                        _AvaliacaoFinalTabDetails(
                          avaliacaoFinal: _extractAvaliacaoFinal(_courseData!),
                          alunoNota: _resolveStudentFinalNota(_courseData!),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
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
                      clipBehavior: Clip.antiAlias,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: BorderSide(color: Colors.grey.shade200, width: 1),
                      ),
                      child: Theme(
                        data: Theme.of(
                          context,
                        ).copyWith(dividerColor: Colors.transparent),
                        child: ExpansionTile(
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          collapsedShape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          collapsedBackgroundColor: Colors.transparent,
                          backgroundColor: Colors.transparent,
                          tilePadding: const EdgeInsets.symmetric(
                            horizontal: 16,
                          ),
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
                                  ...materiais.map((material) {
                                    final mname =
                                        (material['nome'] ??
                                                material['filename'] ??
                                                material['titulo'] ??
                                                material['designacao'] ??
                                                'Material')
                                            .toString();
                                    final murl =
                                        (material['url'] ??
                                                material['link'] ??
                                                material['referencia'] ??
                                                material['ficheiro'] ??
                                                material['file'] ??
                                                material['path'])
                                            ?.toString();
                                    final mdate =
                                        (material['data'] ??
                                                material['createdAt'] ??
                                                material['updatedAt'] ??
                                                material['at'])
                                            ?.toString();
                                    final isPdf =
                                        murl != null &&
                                        murl.toLowerCase().endsWith('.pdf');
                                    return Padding(
                                      padding: const EdgeInsets.symmetric(
                                        vertical: 4,
                                      ),
                                      child: SubmissionFilePreview(
                                        url: murl ?? '',
                                        filename: mname,
                                        type: isPdf ? 'application/pdf' : null,
                                        date:
                                            mdate != null
                                                ? DateTime.tryParse(mdate)
                                                : null,
                                      ),
                                    );
                                  }),
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

String _fmtDT(dynamic raw) {
  if (raw == null) return '-';
  try {
    final dt = DateTime.tryParse(raw.toString());
    if (dt == null) return raw.toString();
    String two(int n) => n.toString().padLeft(2, '0');
    return '${two(dt.day)}/${two(dt.month)}/${dt.year} ${two(dt.hour)}:${two(dt.minute)}';
  } catch (_) {
    return raw.toString();
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
      constraints: const BoxConstraints(maxWidth: 600),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFFF5F7FA),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE6ECF2)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 16, color: const Color(0xFF007BFF)),
          const SizedBox(width: 6),
          Flexible(
            child: RichText(
              text: TextSpan(
                style: const TextStyle(fontSize: 14, color: Color(0xFF49454F)),
                children: [
                  TextSpan(
                    text: '$label: ',
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF222B45),
                    ),
                  ),
                  TextSpan(text: value),
                ],
              ),
              softWrap: true,
              maxLines: 3,
              overflow: TextOverflow.visible,
            ),
          ),
        ],
      ),
    );
  }
}

// Conteúdo das tabs (só leitura)
class _SessoesTabDetails extends StatelessWidget {
  final List<Map<String, dynamic>> sessoes;
  const _SessoesTabDetails({required this.sessoes});

  @override
  Widget build(BuildContext context) {
    if (sessoes.isEmpty) {
      return const Center(
        child: Text(
          'Sem sessões disponíveis.',
          style: TextStyle(color: Color(0xFF8F9BB3)),
        ),
      );
    }
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
      itemBuilder: (ctx, i) {
        final s = sessoes[i];
        final titulo =
            (s['titulo'] ?? s['assunto'] ?? 'Sessão ${i + 1}').toString();
        final datahora = s['datahora'];
        final inicio = _fmtDT(s['inicio'] ?? s['datainicio'] ?? datahora);
        final fim = _fmtDT(s['fim'] ?? s['datafim']);
        final local =
            (s['local'] ?? s['sala'] ?? s['link'] ?? s['url'] ?? '').toString();
        final plataforma =
            (s['plataformavideoconferencia'] ?? s['plataforma'])?.toString();
        final duracaoHoras =
            (s['duracaohoras'] ?? s['duracao'] ?? s['horas'])?.toString();
        final linkSessao =
            (s['linksessao'] ??
                    s['linkSessao'] ??
                    s['meeting'] ??
                    s['meet'] ??
                    s['url'])
                ?.toString();
        final materiais =
            (s['materiais'] ??
                s['materials'] ??
                s['conteudos'] ??
                s['materiaisSessao'] ??
                s['conteudosSessao']);
        final List<Map<String, dynamic>> mats =
            (materiais is List)
                ? materiais
                    .whereType<Map>()
                    .cast<Map<String, dynamic>>()
                    .toList()
                : const [];
        return Padding(
          padding: const EdgeInsets.symmetric(vertical: 6.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  const Padding(
                    padding: EdgeInsets.only(right: 8.0),
                    child: Icon(
                      Icons.event_available,
                      color: Color(0xFF007BFF),
                    ),
                  ),
                  Expanded(
                    child: Text(
                      titulo,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 16,
                      ),
                    ),
                  ),
                  if (linkSessao != null && linkSessao.isNotEmpty)
                    TextButton.icon(
                      onPressed: () async {
                        final uri = Uri.tryParse(linkSessao);
                        if (uri != null) {
                          await launchUrl(
                            uri,
                            mode: LaunchMode.externalApplication,
                          );
                        }
                      },
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 8,
                        ),
                      ),
                      icon: const Icon(Icons.link, size: 16),
                      label: const Text('Reunião'),
                    ),
                ],
              ),
              const SizedBox(height: 4),
              DefaultTextStyle(
                style: const TextStyle(color: Color(0xFF49454F), fontSize: 13),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (datahora != null)
                      Wrap(
                        spacing: 6,
                        crossAxisAlignment: WrapCrossAlignment.center,
                        children: [
                          Text(inicio != '-' ? inicio : '-'),
                          if (duracaoHoras != null &&
                              duracaoHoras.toString().isNotEmpty)
                            Text('(${duracaoHoras}h)'),
                          if (plataforma != null && plataforma.isNotEmpty)
                            Text('— $plataforma'),
                        ],
                      )
                    else if (inicio != '-' || fim != '-')
                      Text('De $inicio até $fim'),
                    if (local.isNotEmpty) Text('Local: $local'),
                  ],
                ),
              ),
              if (mats.isNotEmpty) ...[
                const SizedBox(height: 8),
                const Text(
                  'Materiais:',
                  style: TextStyle(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 6),
                ...mats.asMap().entries.map((entry) {
                  final idx = entry.key;
                  final m = entry.value;
                  final mname =
                      (m['nome'] ??
                              m['filename'] ??
                              m['titulo'] ??
                              m['designacao'] ??
                              'Material ${idx + 1}')
                          .toString();
                  final murl =
                      (m['url'] ??
                              m['link'] ??
                              m['referencia'] ??
                              m['ficheiro'] ??
                              m['file'] ??
                              m['path'])
                          ?.toString();
                  final mdate =
                      (m['data'] ?? m['createdAt'] ?? m['updatedAt'] ?? m['at'])
                          ?.toString();
                  final isPdf =
                      (murl != null && murl.toLowerCase().endsWith('.pdf'));
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 6.0),
                    child: SubmissionFilePreview(
                      url: murl ?? '',
                      filename: mname,
                      type: isPdf ? 'application/pdf' : null,
                      date: mdate != null ? DateTime.tryParse(mdate) : null,
                    ),
                  );
                }).toList(),
              ] else ...[
                const SizedBox(height: 6),
                const Text(
                  'Sem materiais.',
                  style: TextStyle(color: Color(0xFF8F9BB3)),
                ),
              ],
            ],
          ),
        );
      },
      separatorBuilder: (_, __) => const Divider(height: 1),
      itemCount: sessoes.length,
    );
  }
}

class _AvaliacoesContinuasTabDetails extends StatelessWidget {
  final List<Map<String, dynamic>> avaliacoes;
  const _AvaliacoesContinuasTabDetails({required this.avaliacoes});

  @override
  Widget build(BuildContext context) {
    if (avaliacoes.isEmpty) {
      return const Center(
        child: Text(
          'Sem avaliações contínuas.',
          style: TextStyle(color: Color(0xFF8F9BB3)),
        ),
      );
    }
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
      itemBuilder: (ctx, i) {
        final av = avaliacoes[i];
        final titulo =
            (av['titulo'] ?? av['nome'] ?? 'Avaliação ${i + 1}').toString();
        final descricao = (av['descricao'] ?? '').toString();
        final inicioDisp = _fmtDT(
          av['iniciodisponibilidade'] ?? av['inicioDisponibilidade'],
        );
        final fimDisp = _fmtDT(
          av['fimdisponibilidade'] ?? av['fimDisponibilidade'],
        );
        final inicioSub = _fmtDT(
          av['iniciodesubmissoes'] ?? av['inicioDeSubmissoes'],
        );
        final fimSub = _fmtDT(
          av['fimdesubmissoes'] ?? av['fimDeSubmissoes'] ?? av['deadline'],
        );
        final enunciado =
            (av['enunciado'] ?? av['enunciadoUrl'] ?? av['enunciadoLink'])
                ?.toString();
        // Tentar detetar submissão do utilizador (o servidor pode embutir)
        final sub =
            (av['minhasubmissao'] ?? av['minhaSubmissao'] ?? av['submissao'])
                as dynamic;
        String? subUrl;
        String? subDate;
        String? subNota;
        if (sub is Map) {
          subUrl =
              (sub['submissao'] ?? sub['link'] ?? sub['url'] ?? sub['ficheiro'])
                  ?.toString();
          subDate =
              (sub['data'] ??
                      sub['dataSubmissao'] ??
                      sub['createdAt'] ??
                      sub['at'])
                  ?.toString();
          subNota = (sub['nota'] ?? sub['classificacao'])?.toString();
        } else if (sub is String) {
          subUrl = sub;
        }
        // Algumas APIs colocam a nota na avaliação já resolvida para o aluno
        subNota ??= (av['nota'] ?? av['classificacao'])?.toString();

        return Padding(
          padding: const EdgeInsets.symmetric(vertical: 4.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ListTile(
                contentPadding: const EdgeInsets.symmetric(horizontal: 8),
                leading: const Icon(
                  Icons.assignment_turned_in,
                  color: Color(0xFF5E35B1),
                ),
                title: Text(
                  titulo,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                subtitle: Text(
                  [
                    if (descricao.isNotEmpty) descricao,
                    if (inicioDisp != '-' || fimDisp != '-')
                      'Início disponibilidade: $inicioDisp' +
                          (fimDisp != '-' ? '  |  Fim: $fimDisp' : ''),
                    if (inicioSub != '-' || fimSub != '-')
                      'Início submissões: $inicioSub' +
                          (fimSub != '-' ? '  |  Fim: $fimSub' : ''),
                  ].join('\n'),
                ),
                isThreeLine: true,
              ),
              if (enunciado != null && enunciado.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8.0,
                    vertical: 4.0,
                  ),
                  child: SubmissionFilePreview(
                    url: enunciado,
                    filename: 'Enunciado',
                    type:
                        enunciado.toLowerCase().endsWith('.pdf')
                            ? 'application/pdf'
                            : null,
                  ),
                ),
              if (subUrl != null && subUrl.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8.0,
                    vertical: 4.0,
                  ),
                  child: SubmissionFilePreview(
                    url: subUrl,
                    filename: 'Ficheiro submetido',
                    type:
                        subUrl.toLowerCase().endsWith('.pdf')
                            ? 'application/pdf'
                            : null,
                    date: subDate != null ? DateTime.tryParse(subDate) : null,
                    statusLabel:
                        (subNota != null && subNota.isNotEmpty)
                            ? 'Nota: $subNota'
                            : 'Por avaliar',
                  ),
                )
              else
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 16.0, vertical: 6),
                  child: Text(
                    'Sem submissão (upload apenas na web).',
                    style: TextStyle(color: Color(0xFF8F9BB3)),
                  ),
                ),
              const SizedBox(height: 8),
            ],
          ),
        );
      },
      separatorBuilder: (_, __) => const Divider(height: 1),
      itemCount: avaliacoes.length,
    );
  }
}

class _AvaliacaoFinalTabDetails extends StatelessWidget {
  final Map<String, dynamic>? avaliacaoFinal;
  final String? alunoNota;
  const _AvaliacaoFinalTabDetails({
    required this.avaliacaoFinal,
    this.alunoNota,
  });

  @override
  Widget build(BuildContext context) {
    final data = avaliacaoFinal;
    if ((data == null || data.isEmpty) &&
        (alunoNota == null || alunoNota!.isEmpty)) {
      return const Center(
        child: Text(
          'Sem avaliação final.',
          style: TextStyle(color: Color(0xFF8F9BB3)),
        ),
      );
    }
    final titulo =
        (data?['titulo'] ?? data?['nome'] ?? 'Avaliação Final').toString();
    final descricao = (data?['descricao'] ?? '').toString();
    final inicio = _fmtDT(
      data?['inicio'] ?? data?['datainicio'] ?? data?['abertura'],
    );
    final fim = _fmtDT(data?['fim'] ?? data?['datafim'] ?? data?['fecho']);
    final enunciado =
        (data?['enunciado'] ?? data?['enunciadoUrl'] ?? data?['enunciadoLink'])
            ?.toString();
    final resolvedNota =
        (alunoNota != null && alunoNota!.isNotEmpty)
            ? alunoNota
            : (data?['nota'] ?? data?['classificacao'] ?? data?['valor'])
                ?.toString();
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 16, 12, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Padding(
                padding: EdgeInsets.only(top: 2.0, right: 6.0),
                child: Icon(Icons.grade, color: Color(0xFF2E7D32)),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      titulo,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 16,
                      ),
                    ),
                    if (descricao.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        descricao,
                        style: const TextStyle(color: Color(0xFF49454F)),
                      ),
                    ],
                  ],
                ),
              ),
              if (resolvedNota != null && resolvedNota.isNotEmpty)
                Container(
                  margin: const EdgeInsets.only(left: 8),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.green.withOpacity(0.10),
                    borderRadius: BorderRadius.circular(999),
                    border: Border.all(color: Colors.green.withOpacity(0.20)),
                  ),
                  child: Text(
                    'Nota: $resolvedNota',
                    style: TextStyle(
                      color: Colors.green.shade800,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 8),
          if (inicio != '-' || fim != '-')
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                if (inicio != '-')
                  _InfoChip(
                    icon: Icons.play_circle_fill,
                    label: 'Início',
                    value: inicio,
                  ),
                if (fim != '-')
                  _InfoChip(icon: Icons.flag, label: 'Fim', value: fim),
              ],
            ),
          if (enunciado != null && enunciado.isNotEmpty) ...[
            const SizedBox(height: 12),
            const Text(
              'Enunciado',
              style: TextStyle(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 6),
            SubmissionFilePreview(
              url: enunciado,
              filename: 'Enunciado',
              type:
                  enunciado.toLowerCase().endsWith('.pdf')
                      ? 'application/pdf'
                      : null,
            ),
          ],
          const SizedBox(height: 10),
        ],
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _InfoChip({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0xFFF5F7FA),
        borderRadius: BorderRadius.circular(12),
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
          Flexible(
            child: Text(
              value,
              overflow: TextOverflow.ellipsis,
              maxLines: 1,
              style: const TextStyle(color: Color(0xFF49454F)),
            ),
          ),
        ],
      ),
    );
  }
}
