import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../middleware.dart';
import '../backend/server.dart';
import '../backend/shared_preferences.dart' as my_prefs;

class CertificatesPage extends StatefulWidget {
  const CertificatesPage({super.key});

  @override
  State<CertificatesPage> createState() => _CertificatesPageState();
}

class _CertificatesPageState extends State<CertificatesPage> {
  final AppMiddleware _middleware = AppMiddleware();
  bool _loading = true;
  String? _error;
  List<Map<String, dynamic>> _certificados = [];

  @override
  void initState() {
    super.initState();
    _loadCertificates();
  }

  Future<void> _loadCertificates() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final user = await my_prefs.getUser();
      String? userId = user?['idutilizador']?.toString();
      userId ??= user?['id']?.toString();
      userId ??=
          (user?['utilizador'] is Map
              ? user?['utilizador']?['idutilizador']?.toString()
              : null);
      userId ??=
          (user?['user'] is Map
              ? user?['user']?['idutilizador']?.toString()
              : null);
      if (userId == null) {
        if (mounted) context.go('/login');
        return;
      }

      // Always refresh profile for freshest data
      final perfil = await _middleware.fetchUserProfile(userId);

      // Resolve idFormando from various possible shapes
      final idFormando = _resolveIdFormando(perfil) ?? _resolveIdFormando(user);

      List<Map<String, dynamic>> certs = [];

      // Prefer certificados from forming endpoint if we have idFormando
      if (idFormando != null) {
        final endpoints = [
          'utilizador/formando/id/$idFormando',
          'utilizador/formando/$idFormando',
          'formando/id/$idFormando',
        ];
        for (final ep in endpoints) {
          final forming = await Servidor().getData(ep);
          final list = _extractCertificados(forming);
          if (list.isNotEmpty) {
            certs = list;
            break;
          }
        }
      }

      // Fallback: try to get certificados directly from profile payload
      if (certs.isEmpty) {
        final list = _extractCertificados(perfil) + _extractCertificados(user);
        if (list.isNotEmpty) certs = list;
      }

      if (mounted) {
        setState(() {
          _certificados = certs;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Não foi possível carregar os certificados.';
          _loading = false;
        });
      }
    }
  }

  String? _resolveIdFormando(Map<String, dynamic>? m) {
    if (m == null) return null;
    // Direct keys first
    final candidates = [
      m['idformando'],
      m['formando'],
      (m['perfil'] is Map
          ? (m['perfil']['idformando'] ?? m['perfil']['formando'])
          : null),
      (m['utilizador'] is Map
          ? (m['utilizador']['idformando'] ?? m['utilizador']['formando'])
          : null),
      (m['user'] is Map
          ? (m['user']['idformando'] ?? m['user']['formando'])
          : null),
      (m['data'] is Map
          ? ((m['data'] as Map)['idformando'] ?? (m['data'] as Map)['formando'])
          : null),
    ];
    for (final c in candidates) {
      if (c == null) continue;
      final s = c.toString();
      if (s.isNotEmpty && int.tryParse(s) != null) return s;
    }

    // Check roles array like the web does (role object with id)
    String? scanRoles(dynamic src) {
      if (src is Map && src['roles'] is List) {
        for (final r in (src['roles'] as List)) {
          if (r is Map) {
            final roleName =
                (r['role'] ?? r['nome'] ?? r['name'] ?? r['papel'])
                    ?.toString()
                    .toLowerCase();
            if (roleName == 'formando') {
              final rid = r['id'] ?? r['idformando'] ?? r['formando'];
              if (rid != null) {
                final s = rid.toString();
                if (s.isNotEmpty && int.tryParse(s) != null) return s;
              }
            }
          }
        }
      }
      return null;
    }

    // Try roles on root and common nests
    for (final scope in [
      m,
      m['perfil'],
      m['user'],
      m['utilizador'],
      m['data'],
    ]) {
      final r = scanRoles(scope);
      if (r != null) return r;
    }
    return null;
  }

  List<Map<String, dynamic>> _extractCertificados(dynamic src) {
    Map? asMap;
    if (src is Map<String, dynamic>) asMap = src;
    if (src is Map) asMap = Map.from(src);
    if (asMap == null) return [];
    dynamic v = asMap['certificados'] ?? asMap['certificates'];
    if (v == null) {
      // Sometimes nested under forming/profile or data
      for (final k in ['data', 'formando', 'perfil', 'user', 'utilizador']) {
        final n = asMap[k];
        if (n is Map) {
          v = n['certificados'] ?? n['certificates'];
          if (v != null) break;
        }
      }
    }
    if (v is List) {
      return v.whereType<Map>().map((e) => e.cast<String, dynamic>()).toList();
    }
    return [];
  }

  Future<void> _openCert(String chave) async {
    final base = Servidor().urlAPI;
    final url = Uri.parse('$base/certificado/$chave');
    if (!await launchUrl(url, mode: LaunchMode.externalApplication)) {
      await launchUrl(url, mode: LaunchMode.platformDefault);
    }
  }

  String _fmtDate(dynamic raw) {
    if (raw == null) return '-';
    try {
      final dt = DateTime.parse(raw.toString());
      String two(int n) => n.toString().padLeft(2, '0');
      return '${two(dt.day)}/${two(dt.month)}/${dt.year}';
    } catch (_) {
      return raw.toString();
    }
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
          'Certificados',
          style: TextStyle(
            color: Color(0xFF007BFF),
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body:
          _loading
              ? const Center(child: CircularProgressIndicator())
              : _error != null
              ? Center(child: Text(_error!))
              : _certificados.isEmpty
              ? const Center(
                child: Text(
                  'Nenhum certificado disponível.',
                  style: TextStyle(color: Color(0xFF8F9BB3)),
                ),
              )
              : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _certificados.length,
                itemBuilder: (context, i) {
                  final c = _certificados[i];
                  final nome =
                      (c['nome'] ?? c['designacao'] ?? 'Certificado')
                          .toString();
                  final desc =
                      (c['descricao'] ?? c['descricaoCertificado'] ?? '')
                          .toString();
                  final criado = _fmtDate(
                    c['criado'] ??
                        c['createdAt'] ??
                        c['data'] ??
                        c['dataemissao'] ??
                        c['emissao'] ??
                        c['emitidoEm'],
                  );
                  final chave =
                      (c['chave'] ??
                              c['hash'] ??
                              c['codigo'] ??
                              c['uuid'] ??
                              '')
                          .toString();
                  return Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.grey.withOpacity(0.10),
                          blurRadius: 6,
                          offset: const Offset(0, 2),
                        ),
                      ],
                      border: Border.all(color: const Color(0xFFE6ECF2)),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(14),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(
                                Icons.workspace_premium,
                                color: Color(0xFF007BFF),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  nome,
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                          if (desc.isNotEmpty) ...[
                            const SizedBox(height: 6),
                            Text(
                              desc,
                              style: const TextStyle(color: Color(0xFF49454F)),
                            ),
                          ],
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Emitido em: $criado',
                                style: const TextStyle(
                                  color: Color(0xFF8F9BB3),
                                ),
                              ),
                              if (chave.isNotEmpty)
                                ElevatedButton(
                                  onPressed: () => _openCert(chave),
                                  child: const Text('Ver certificado'),
                                ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
    );
  }
}
