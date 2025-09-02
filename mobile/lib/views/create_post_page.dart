import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/backend/server.dart';
import 'package:mobile/components/upload_file.dart';
import 'package:file_picker/file_picker.dart';

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
  PlatformFile? _file;
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
      final tituloVal = _tituloCtrl.text.trim();
      final conteudoVal = _conteudoCtrl.text.trim();

      final fields = <String, String>{
        'titulo': tituloVal,
        'conteudo': conteudoVal,
        'info': '{"titulo":"$tituloVal","conteudo":"$conteudoVal"}',
      };

      Map<String, dynamic>? res;
      if (_file != null) {
        final path = _file!.path;
        if (path != null && path.isNotEmpty) {
          // Multipart with file by path
          res = await _server.postMultipartData(
            'forum/post/topico/${widget.idtopico}',
            fields,
            'anexo',
            path,
          );
        } else if (_file!.bytes != null) {
          // Multipart with in-memory bytes
          res = await _server.postMultipartDataBytes(
            'forum/post/topico/${widget.idtopico}',
            fields,
            'anexo',
            _file!.bytes!,
            _file!.name,
          );
        }
      }

      // If no file or previous branch didn't set res, send fields-only multipart
      res ??= await _server.postMultipartFieldsOnly(
        'forum/post/topico/${widget.idtopico}',
        fields,
      );

      final created = res ?? <String, dynamic>{};
      final newId = created['idpost'] ?? created['id'];
      if (!mounted) return;
      if (newId != null) {
        context.go('/forum_post/$newId');
      } else {
        context.pop();
      }
    } catch (e) {
      final msg = e.toString();
      setState(
        () =>
            _error =
                msg.isNotEmpty ? msg : 'Erro ao criar post. Tente novamente.',
      );
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF6F9FB),
      appBar: AppBar(
        backgroundColor: const Color(0xFFF6F9FB),
        elevation: 0,
        leading: Container(
          margin: const EdgeInsets.only(left: 8, top: 6, bottom: 6),
          decoration: const BoxDecoration(
            color: Color(0xFF007BFF),
            shape: BoxShape.circle,
          ),
          child: IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.white),
            onPressed: () => context.go('/forums'),
          ),
        ),
        title: const Text(
          'Criar Post',
          style: TextStyle(
            color: Color(0xFF007BFF),
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 20.0),
        children: [
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
                      labelText: 'Título:',
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
                      labelText: 'Conteúdo:',
                      border: OutlineInputBorder(),
                    ),
                    validator:
                        (v) =>
                            (v == null || v.trim().isEmpty)
                                ? 'Campo obrigatório'
                                : null,
                  ),
                  const SizedBox(height: 16),
                  UploadFile(
                    id: 'post-anexo',
                    label: 'Anexo (opcional):',
                    accept: '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,image/*',
                    onSelect: (pf) => setState(() => _file = pf),
                  ),
                  const SizedBox(height: 12),
                  if (_error != null) ...[
                    Text(_error!, style: const TextStyle(color: Colors.red)),
                    const SizedBox(height: 8),
                  ],
                  Row(
                    children: [
                      OutlinedButton(
                        onPressed:
                            _submitting ? null : () => context.go('/forums'),
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
