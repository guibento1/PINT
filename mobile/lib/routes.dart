import 'package:go_router/go_router.dart';
import 'package:flutter/material.dart';

import 'views/course_details_page.dart';
import 'views/search_courses_page.dart';
import 'views/home_page.dart';
import 'views/login_page.dart';
import 'views/profile_page.dart';

import 'backend/shared_preferences.dart' as my_prefs;

import 'components/navigation_bar.dart';
import 'components/top_headr_bar.dart';

final rotas = GoRouter(
  initialLocation: '/',
  redirect: (context, state) async {
    final token = await my_prefs.getToken();
    final loc = state.uri.toString();

    final bool isLoggingIn = loc == '/login';
    final bool isPublicRoute = isLoggingIn;

    if (token == null || token.isEmpty) {
      if (!isPublicRoute) { 
        return '/login';
      }
    } else {
      if (isLoggingIn || loc == '/') { 
        return '/home'; 
      }
    }
    return null;
  },
  routes: [
    GoRoute(
      path: '/login',
      name: 'login',
      builder: (context, state) => LoginPage(),
    ),

    ShellRoute(
      builder: (context, state, child) {
        return Scaffold(
          backgroundColor: const Color(0xFFF0F4FD), 
          body: SafeArea( 
            child: Column( 
              children: [
                const TopHeaderBar(),
                Expanded(
                  child: child,
                ),
              ],
            ),
          ),
          bottomNavigationBar: NavigationBarClass(),
        );
      },
      routes: [
        GoRoute(
          path: '/home',
          name: 'home',
          builder: (context, state) => const HomePage(), 
        ),
        GoRoute(
          path: '/search_courses',
          name: 'search_courses',
          builder: (context, state) => SearchCoursesPage(),
        ),
        GoRoute(
          path: '/groups',
          name: 'groups',
          builder: (context, state) => const Placeholder(child: Center(child: Text('Grupos Page'))),
        ),
        GoRoute(
          path: '/notifications',
          name: 'notifications',
          builder: (context, state) => const Placeholder(child: Center(child: Text('Notificações Page'))),
        ),
        GoRoute(
          path: '/profile',
          name: 'profile',
          builder: (context, state) => ProfilePage(),
        ),
        GoRoute(
          path: '/course_details/:id',
          name: 'course_details',
          builder: (context, state) {
            final String? idString = state.pathParameters['id'];
            if (idString != null) {
              final int? id = int.tryParse(idString);
              if (id != null) {
                return CourseDetailsPage(id: id);
              }
            }
            return const Scaffold(
              body: Center(
                child: Text('Erro: ID do curso inválido ou ausente.'),
              ),
            );
          },
        ),
      ],
    ),

    GoRoute(
      path: '/:anything',
      builder: (context, state) => const Scaffold(
        body: Center(
          child: Text('Página não encontrada.'),
        ),
      ),
    ),
  ],
);
