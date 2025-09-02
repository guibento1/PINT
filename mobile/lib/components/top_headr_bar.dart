import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../backend/shared_preferences.dart' as my_prefs;
import '../middleware.dart';

// Montagem do barra superior
class TopHeaderBar extends StatefulWidget {
  const TopHeaderBar({super.key});

  @override
  State<TopHeaderBar> createState() => _TopHeaderBarState();
}

class _TopHeaderBarState extends State<TopHeaderBar> {
  String _avatarUrl = '';
  final AppMiddleware _middleware = AppMiddleware();
  bool _refreshing = false;
  DateTime? _lastProfileFetch;

  @override
  void initState() {
    super.initState();
    _updateAvatarFromPrefs();

    my_prefs.currentUserNotifier.addListener(_onUserDataChanged);
  }

  @override
  void dispose() {
    my_prefs.currentUserNotifier.removeListener(_onUserDataChanged);
    super.dispose();
  }

  void _onUserDataChanged() {
    _updateAvatarFromPrefs();
  }

  Future<void> _updateAvatarFromPrefs() async {
    final user = my_prefs.currentUserNotifier.value;

    final perfil = user;
    String? foto;

    if (perfil is Map<String, dynamic>) {
      foto =
          (perfil['foto'] != null && perfil['foto'].toString().isNotEmpty)
              ? perfil['foto'] as String
              : null;
    }

    if (mounted) {
      setState(() {
        _avatarUrl = foto ?? '';
      });
    }

    // If we have a SAS URL with an expiry and it's expired or close to expiring, refresh profile
    if (_avatarUrl.isNotEmpty && _looksLikeSasUrl(_avatarUrl)) {
      final exp = _extractSasExpiry(_avatarUrl);
      final now = DateTime.now().toUtc();
      // Refresh if expired or expiring within 10 minutes
      if (exp != null && exp.isBefore(now.add(const Duration(minutes: 10)))) {
        _attemptRefreshProfileOnce();
      }
    }
  }

  bool _looksLikeSasUrl(String url) {
    return url.contains('sv=') && url.contains('se=');
  }

  DateTime? _extractSasExpiry(String url) {
    try {
      final uri = Uri.parse(url);
      final se = uri.queryParameters['se'];
      if (se == null || se.isEmpty) return null;
      // se is typically UTC in ISO-8601
      return DateTime.parse(se).toUtc();
    } catch (_) {
      return null;
    }
  }

  Future<void> _attemptRefreshProfileOnce() async {
    if (_refreshing) return;
    final last = _lastProfileFetch;
    if (last != null &&
        DateTime.now().difference(last) < const Duration(minutes: 2)) {
      return;
    }
    _refreshing = true;
    _lastProfileFetch = DateTime.now();
    try {
      final userId = await my_prefs.getUserId();
      if (userId == null || userId.isEmpty) return;
      final fresh = await _middleware.fetchUserProfile(userId);
      final newFoto = _extractAvatarFromMap(fresh);
      if (newFoto != null && newFoto.isNotEmpty && mounted) {
        setState(() {
          _avatarUrl = newFoto;
        });
      }
    } catch (_) {
      // ignore
    } finally {
      _refreshing = false;
    }
  }

  String? _extractAvatarFromMap(Map<String, dynamic> map) {
    for (final key in const [
      'foto',
      'avatar',
      'avatarUrl',
      'imagem',
      'profile',
      'fotoPerfil',
    ]) {
      final v = map[key];
      if (v != null && v.toString().isNotEmpty) return v.toString();
    }
    // try nested common keys
    for (final container in const ['perfil', 'utilizador', 'user']) {
      final nested = map[container];
      if (nested is Map<String, dynamic>) {
        for (final key in const [
          'foto',
          'avatar',
          'avatarUrl',
          'imagem',
          'profile',
          'fotoPerfil',
        ]) {
          final v = nested[key];
          if (v != null && v.toString().isNotEmpty) return v.toString();
        }
      }
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 72,
      padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 10.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Align(
            alignment: Alignment.center,
            child: Container(
              padding: const EdgeInsets.all(3),
              decoration: BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: Colors.grey.withOpacity(0.2),
                    blurRadius: 8,
                    offset: Offset(0, 2),
                  ),
                ],
              ),
              child: GestureDetector(
                onTap: () => context.go('/profile'),
                child:
                    _avatarUrl.isEmpty
                        ? const CircleAvatar(
                          radius: 24,
                          backgroundColor: Color(0xFF00B0DA),
                          child: Icon(Icons.person, color: Colors.white),
                        )
                        : ClipOval(
                          child: Image.network(
                            _avatarUrl,
                            key: ValueKey(_avatarUrl),
                            width: 48,
                            height: 48,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stack) {
                              // Likely expired SAS or network issue; try one refresh
                              _attemptRefreshProfileOnce();
                              return const CircleAvatar(
                                radius: 24,
                                backgroundColor: Color(0xFF00B0DA),
                                child: Icon(Icons.person, color: Colors.white),
                              );
                            },
                          ),
                        ),
              ),
            ),
          ),
          Align(
            alignment: Alignment.center,
            child: Container(
              height: 52,
              width: 162,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: Colors.transparent,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.grey.withOpacity(0.2),
                    blurRadius: 8,
                    offset: Offset(0, 2),
                  ),
                ],
              ),
              child: SvgPicture.asset(
                'lib/assets/thesoftskillsLogo.svg',
                height: 52,
                width: 162,
                fit: BoxFit.contain,
                alignment: Alignment.center,
              ),
            ),
          ),
          Align(
            alignment: Alignment.center,
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(25),
                boxShadow: [
                  BoxShadow(
                    color: Colors.grey.withOpacity(0.2),
                    blurRadius: 8,
                    offset: Offset(0, 2),
                  ),
                ],
              ),
              child: IconButton(
                icon: const Icon(
                  Icons.settings,
                  color: Color(0xFF007BFF),
                  size: 28,
                ),
                onPressed: () => context.go('/settings'),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
