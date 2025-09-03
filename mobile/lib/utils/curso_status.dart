class CursoStatus {
  final String key; // 'em_curso' | 'terminado' | 'pendente'
  final String label; // 'Em curso' | 'Terminado' | 'Pendente'

  const CursoStatus(this.key, this.label);
}

DateTime? _parseDate(dynamic v) {
  if (v == null) return null;
  try {
    final d = DateTime.tryParse(v.toString());
    return d;
  } catch (_) {
    return null;
  }
}

bool? _normalizeSincrono(Map<String, dynamic> c) {
  final v = c['sincrono'];
  if (v is bool) return v;
  if (v is num) {
    if (v == 1) return true;
    if (v == 0) return false;
  }
  if (v is String) {
    final s = v.toLowerCase();
    if (s == 'true' || s == '1') return true;
    if (s == 'false' || s == '0') return false;
  }
  final t = (c['tipo'] ?? c['tipocurso'] ?? '').toString().toLowerCase();
  if (t.contains('sincrono') || t.contains('síncrono')) return true;
  if (t.contains('assincrono') || t.contains('assíncrono')) return false;
  return null; // desconhecido
}

CursoStatus getCursoStatus(Map<String, dynamic>? cursoLike, {DateTime? now}) {
  final c = cursoLike ?? <String, dynamic>{};
  final current = now ?? DateTime.now();

  final sincrono = _normalizeSincrono(c);
  final nestedSync = (c['cursosincrono'] ?? c['cursoSincrono']) as Map?;
  final nestedAsync = (c['cursoassincrono'] ?? c['cursoAssincrono']) as Map?;

  final inicioInsc = _parseDate(
    c['iniciodeinscricoes'] ??
        c['inicioDeInscricoes'] ??
        (nestedAsync is Map
            ? (nestedAsync['iniciodeinscricoes'] ??
                nestedAsync['inicioDeInscricoes'])
            : null),
  );
  final fimInsc = _parseDate(
    c['fimdeinscricoes'] ??
        c['fimDeInscricoes'] ??
        (nestedAsync is Map
            ? (nestedAsync['fimdeinscricoes'] ?? nestedAsync['fimDeInscricoes'])
            : null),
  );
  final inicioCurso = _parseDate(
    c['inicio'] ??
        c['datainicio'] ??
        (nestedSync is Map
            ? (nestedSync['inicio'] ?? nestedSync['datainicio'])
            : null),
  );
  final fimCurso = _parseDate(
    c['fim'] ??
        c['datafim'] ??
        (nestedSync is Map
            ? (nestedSync['fim'] ?? nestedSync['datafim'])
            : null),
  );

  final disponivel =
      c['disponivel'] ??
      (nestedSync is Map ? nestedSync['disponivel'] : null) ??
      (nestedAsync is Map ? nestedAsync['disponivel'] : null);

  String key = 'pendente';

  if (sincrono == true) {
    final hasBothDates = inicioCurso != null && fimCurso != null;
    if (disponivel == false) {
      key = 'terminado';
    } else if (hasBothDates) {
      key = !current.isBefore(fimCurso) ? 'terminado' : 'em_curso';
    } else {
      key = 'pendente';
    }
  } else if (sincrono == false) {
    if (fimInsc != null) {
      key =
          current.isBefore(fimInsc)
              ? 'em_curso'
              : (disponivel == true ? 'em_curso' : 'terminado');
    } else if (disponivel == true) {
      key = 'em_curso';
    } else if (disponivel == false) {
      key = 'terminado';
    } else {
      key = 'pendente';
    }
  } else {
    if (inicioCurso != null && fimCurso != null) {
      key = !current.isBefore(fimCurso) ? 'terminado' : 'em_curso';
    } else if (fimInsc != null && !current.isBefore(fimInsc)) {
      key = 'terminado';
    } else if (inicioInsc != null && !current.isBefore(inicioInsc)) {
      key = 'em_curso';
    } else if (disponivel == false) {
      key = 'terminado';
    } else if (disponivel == true) {
      key = 'em_curso';
    } else {
      key = 'pendente';
    }
  }

  switch (key) {
    case 'em_curso':
      return const CursoStatus('em_curso', 'Em curso');
    case 'terminado':
      return const CursoStatus('terminado', 'Terminado');
    default:
      return const CursoStatus('pendente', 'Pendente');
  }
}
