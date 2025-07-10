import 'package:flutter/material.dart';
import 'package:curved_navigation_bar/curved_navigation_bar.dart';
import 'package:go_router/go_router.dart';

class NavigationBarClass extends StatefulWidget {
  const NavigationBarClass({super.key});

  @override
  State<NavigationBarClass> createState() => _NavigationBarClassState();
}

class _NavigationBarClassState extends State<NavigationBarClass> {
  final GlobalKey<CurvedNavigationBarState> _bottomNavigationKey = GlobalKey();
  int page = 0;

  @override
  Widget build(BuildContext context) {
    return
      CurvedNavigationBar(
        key: _bottomNavigationKey,
        index: page,
        height: 75.0,
        items: const <Widget>[
          Icon(Icons.home, size: 33, color: Colors.white),
          Icon(Icons.school, size: 33, color: Colors.white),
          Icon(Icons.notifications_active, size: 33, color: Colors.white),
          Icon(Icons.account_circle, size: 33, color: Colors.white),
        ],
        color: Color(0xFF00B0DA),
        buttonBackgroundColor: Color(0xFF00B0DA),
        backgroundColor: Colors.white,
        animationCurve: Curves.easeInOut,
        animationDuration: const Duration(milliseconds: 600),
        onTap: (index) {

          setState(() {
            page = index;
          });

          switch (index) {
            case 0:
              context.go('/home');
              break;
            case 1:
              context.go('/search_courses');
              break;
            case 2:
              context.go('/notifications');
              break;
            case 3:
              context.go('/profile');
              break;
          }
        },
    );
  }
}