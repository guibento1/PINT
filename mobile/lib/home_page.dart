import 'package:flutter/material.dart';
import 'server.dart';
import 'shared_preferences.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int currentPageIndex = 0;
  String serverResult = '';
  String email = '';
  String password = '';
  bool isLoading = false;

  @override
  void initState() {
    super.initState();
    _testServer();
  }

  Future<void> _testServer({String? customEmail, String? customPassword}) async {
    setState(() { isLoading = true; });
    final servidor = Servidor();
    final loginResult = await servidor.login(
      customEmail ?? "pedro.martins@email.com",
      customPassword ?? "pedromartinspm",
    );
    if (loginResult != null) {
      await saveToken(loginResult);
      // Buscar dados do utilizador após login
      final userData = await servidor.getData('users/me');
      if (userData != null && userData is Map<String, dynamic>) {
        await saveUser(userData);
        setState(() {
          serverResult = 'Login certo, token e utilizador guardados';
          isLoading = false;
        });
      } else {
        setState(() {
          serverResult = 'Login certo, token guardado, mas falha ao buscar utilizador';
          isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        title: const Text('Home'),
      ),
      bottomNavigationBar: NavigationBar(
        onDestinationSelected: (int index) {
          setState(() {
            currentPageIndex = index;
          });
        },
        indicatorColor: Colors.amber,
        selectedIndex: currentPageIndex,
        destinations: const <Widget>[
          NavigationDestination(
            selectedIcon: Icon(Icons.home),
            icon: Icon(Icons.home_outlined),
            label: 'Início',
          ),
          NavigationDestination(
            icon: Icon(Icons.arrow_forward),
            label: 'Ecran 2',
          ),
          NavigationDestination(
            icon: Icon(Icons.bar_chart),
            label: 'Ecran 3',
          ),
        ],
      ),
      body: <Widget>[
        Padding(
          padding: const EdgeInsets.all(24.0),
          child: Center(
            child: SingleChildScrollView(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text('Ecrã 1', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 24),
                  TextField(
                    decoration: const InputDecoration(labelText: 'Email'),
                    onChanged: (value) => email = value,
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    decoration: const InputDecoration(labelText: 'Password'),
                    obscureText: true,
                    onChanged: (value) => password = value,
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: isLoading
                        ? null
                        : () => _testServer(customEmail: email, customPassword: password),
                    child: isLoading
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                        : const Text('Testar Login'),
                  ),
                  const SizedBox(height: 24),
                  Text(serverResult),
                ],
              ),
            ),
          ),
        ),
        const Center(child: Text('Ecrã 2')),
        const Center(child: Text('Ecrã 3')),
      ][currentPageIndex],
    );
  }
}
