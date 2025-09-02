import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/backend/server.dart';

class CreatePostPage extends StatefulWidget {
  final String idtopico;
  const CreatePostPage({super.key, required this.idtopico});

  @override
  State<CreatePostPage> createState() => _CreatePostPageState();
}

class _CreatePostPageState extends State<CreatePostPage> {
  final _formKey = GlobalKey<FormState>();
  final _tituloCtrl = TextEditingController();
  final _conteudoCtrl = TextEditingController();
  bool _submitting = false;
  String? _error;

  final Servidor _server = Servidor();

  @override
  void dispose() {
    _tituloCtrl.dispose();
    _conteudoCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      final payload = {
        'titulo': _tituloCtrl.text.trim(),
        'conteudo': _conteudoCtrl.text.trim(),
      };
      final res = await _server.postData(
        'forum/post/topico/${widget.idtopico}',
        payload,
      );
      final created = (res is Map<String, dynamic>) ? res : <String, dynamic>{};
      final newId = created['idpost'] ?? created['id'];
      if (mounted) {
        if (newId != null) {
          context.go('/forum/post/$newId');
        } else {
          context.pop();
        }
      }
    } catch (e) {
      _error = 'Erro ao criar post. Tente novamente.';
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF6F9FB),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 20.0),
        children: [
          const Text(
            'Criar Post',
            style: TextStyle(
              fontSize: 25,
              fontWeight: FontWeight.bold,
              color: Color(0xFF007BFF),
            ),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.grey.withOpacity(0.3),
                  spreadRadius: 1,
                  blurRadius: 1,
                  offset: const Offset(1, 3),
                ),
              ],
            ),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  TextFormField(
                    controller: _tituloCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Título',
                      border: OutlineInputBorder(),
                    ),
                    validator:
                        (v) =>
                            (v == null || v.trim().isEmpty)
                                ? 'Campo obrigatório'
                                : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _conteudoCtrl,
                    maxLines: 8,
                    decoration: const InputDecoration(
                      labelText: 'Conteúdo',
                      border: OutlineInputBorder(),
                    ),
                    validator:
                        (v) =>
                            (v == null || v.trim().isEmpty)
                                ? 'Campo obrigatório'
                                : null,
                  ),
                  const SizedBox(height: 16),
                  if (_error != null) ...[
                    Text(_error!, style: const TextStyle(color: Colors.red)),
                    const SizedBox(height: 8),
                  ],
                  Row(
                    children: [
                      OutlinedButton(
                        onPressed: _submitting ? null : () => context.pop(),
                        child: const Text('Cancelar'),
                      ),
                      const Spacer(),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF00B0DA),
                          foregroundColor: Colors.white,
                        ),
                        onPressed: _submitting ? null : _submit,
                        child: Text(_submitting ? 'A criar...' : 'Criar Post'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
