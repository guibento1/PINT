import 'package:flutter/material.dart';
import 'package:mobile/routes.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Projeto Prático PDM',
      theme: ThemeData(
        scaffoldBackgroundColor: const Color(0xFFF6F9FB),
      ),
      routerConfig: rotas,
    );
  }
}
