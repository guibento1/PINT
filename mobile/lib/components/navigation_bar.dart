import 'package:flutter/material.dart';
import 'package:curved_navigation_bar/curved_navigation_bar.dart';
import 'package:go_router/go_router.dart';

// Montagem da barra de navegação
class NavigationBarClass extends StatefulWidget {
  const NavigationBarClass({super.key});

  @override
  State<NavigationBarClass> createState() => _NavigationBarClassState();
}

class _NavigationBarClassState extends State<NavigationBarClass> {
  final GlobalKey<CurvedNavigationBarState> _bottomNavigationKey = GlobalKey();

  int _getPageIndex(BuildContext context) {
    final String location = GoRouterState.of(context).uri.toString();
    if (location.startsWith('/home')) {
      return 0;
    }
    if (location.startsWith('/search_courses')) {
      return 1;
    }
    if (location.startsWith('/forums') || location.startsWith('/forum')) {
      return 2;
    }
    if (location.startsWith('/notifications')) {
      return 3;
    }
    if (location.startsWith('/profile')) {
      return 4;
    }
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    return CurvedNavigationBar(
      key: _bottomNavigationKey,
      index: _getPageIndex(context),
      height: 75.0,
      items: const <Widget>[
        Icon(Icons.home, size: 33, color: Colors.white),
        Icon(Icons.school, size: 33, color: Colors.white),
        Icon(Icons.forum, size: 33, color: Colors.white),
        Icon(Icons.notifications_active, size: 33, color: Colors.white),
        Icon(Icons.account_circle, size: 33, color: Colors.white),
      ],
      color: Color(0xFF00B0DA),
      buttonBackgroundColor: Color(0xFF00B0DA),
      backgroundColor: Color(0xFFF6F9FB),
      animationCurve: Curves.easeInOut,
      animationDuration: const Duration(milliseconds: 600),
      onTap: (index) {
        switch (index) {
          case 0:
            context.go('/home');
            break;
          case 1:
            context.go('/search_courses');
            break;
          case 2:
            context.go('/forums');
            break;
          case 3:
            context.go('/notifications');
            break;
          case 4:
            context.go('/profile');
            break;
        }
      },
    );
  }
}
