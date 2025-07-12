import 'package:flutter/material.dart';
import 'package:mobile/routes.dart';

import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';
import 'backend/notifications_service.dart';

void main() async {
  try {
    WidgetsFlutterBinding.ensureInitialized();

    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );

    await NotificationService().setupListeners();

    runApp(const MyApp());

  } catch (e) {
    print('ERRO AO INICIALIZAR A APP: $e');
  }
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Projeto Prático PDM',
      theme: ThemeData(
        scaffoldBackgroundColor: const Color(0xFFF6F9FB),
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFF6F9FB)),
        textTheme: const TextTheme(
          bodyLarge: TextStyle(fontFamily: 'ADLaM Display'),
          bodyMedium: TextStyle(fontFamily: 'ADLaM Display'),
          titleLarge: TextStyle(fontFamily: 'ADLaM Display'),
          titleMedium: TextStyle(fontFamily: 'ADLaM Display'),
          titleSmall: TextStyle(fontFamily: 'ADLaM Display'),
          labelLarge: TextStyle(fontFamily: 'ADLaM Display'),
          labelMedium: TextStyle(fontFamily: 'ADLaM Display'),
          labelSmall: TextStyle(fontFamily: 'ADLaM Display'),
          displayLarge: TextStyle(fontFamily: 'ADLaM Display'),
          displayMedium: TextStyle(fontFamily: 'ADLaM Display'),
          displaySmall: TextStyle(fontFamily: 'ADLaM Display'),
        ),
      ),
      debugShowCheckedModeBanner: false,
      routerConfig: rotas,
    );
  }
}
