// lib/components/top_headr_bar.dart

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
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
    print('TopHeaderBar: Attempting to update avatar from prefs...'); 
    final user = my_prefs.currentUserNotifier.value; 
    print('TopHeaderBar: User data from notifier: $user'); 

    final perfil = user?['perfil'];
    String? foto;

    if (perfil is Map<String, dynamic>) {
      foto = (perfil['foto'] != null && perfil['foto'].toString().isNotEmpty)
          ? perfil['foto'] as String
          : null;
    }
    print('TopHeaderBar: Extracted foto URL: $foto'); 

    if (mounted) {
      setState(() {
        _avatarUrl = foto ?? 'https://i.pravatar.cc/150?img=32';
        print('TopHeaderBar: Avatar URL set to: $_avatarUrl'); 
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 20.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          CircleAvatar(
            radius: 24,
            key: ValueKey(_avatarUrl), 
            backgroundImage: NetworkImage(_avatarUrl),
            onBackgroundImageError: (exception, stackTrace) {
              print('Erro ao carregar imagem do avatar: $exception');
              setState(() {
                _avatarUrl = 'https://i.pravatar.cc/150?img=32'; 
              });
            },
          ),
          const Text(
            'THE SOFTSKILLS',
            style: TextStyle(
              color: Color(0xFF007BFF),
              fontWeight: FontWeight.bold,
              fontSize: 16,
            ),
          ),
          IconButton(
            icon: const Icon(Icons.settings, color: Color(0xFF6C757D), size: 28),
            onPressed: () => context.go('/profile'),
          ),
        ],
      ),
    );
  }
}
