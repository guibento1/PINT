// lib/components/top_headr_bar.dart

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../backend/shared_preferences.dart' as my_prefs;

class TopHeaderBar extends StatefulWidget {
  const TopHeaderBar({super.key});

  @override
  State<TopHeaderBar> createState() => _TopHeaderBarState();
}

class _TopHeaderBarState extends State<TopHeaderBar> {
  String _avatarUrl = 'https://i.pravatar.cc/150?img=32'; // URL padrão

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
      foto = (perfil['foto'] != null && perfil['foto'].toString().isNotEmpty)
          ? perfil['foto'] as String
          : null;
    }

    if (mounted) {
      setState(() {
        _avatarUrl = foto ?? 'https://i.pravatar.cc/150?img=32';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 72,
      padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 10.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.center, // Garante alinhamento pelo centro
        children: [
          // Avatar com sombra
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
                child: CircleAvatar(
                  radius: 24,
                  backgroundColor: Colors.transparent,
                  key: ValueKey(_avatarUrl),
                  backgroundImage: NetworkImage(_avatarUrl),
                  onBackgroundImageError: (exception, stackTrace) {
                    setState(() {
                      _avatarUrl = 'https://i.pravatar.cc/150?img=32';
                    });
                  },
                ),
              ),
            ),
          ),
          // Logo SVG com sombra
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
          // Botão de settings com sombra
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
                icon: const Icon(Icons.settings, color: Color(0xFF007BFF), size: 28),
                onPressed: () => context.go('/'),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
