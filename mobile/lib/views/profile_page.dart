import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '/middleware.dart';
import '../components/confirmation_dialog.dart';
import '../backend/shared_preferences.dart' as my_prefs;

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  final AppMiddleware _middleware = AppMiddleware();
  late Future<Map<String, dynamic>?> _userDataFuture;

  bool _isEditing = false;
  final _formKey = GlobalKey<FormState>();

  String _name = '';
  String _email = '';
  String _address = '';
  String _phone = '';
  File? _profileImage;
  String? _currentProfileImageUrl;

  @override
  void initState() {
    super.initState();
    _userDataFuture = _loadUserData();
  }

  Future<Map<String, dynamic>?> _loadUserData() async {
    final user = await my_prefs.getUser();
    final userId = user?['idutilizador']?.toString();

    if (userId == null) {
      if (mounted) context.go('/login');
      return null;
    }

    try {
      final perfilResp = await _middleware.fetchUserProfile(userId);
      if (mounted) {
        setState(() {
          _name = perfilResp['nome'] as String? ?? '';
          _email = perfilResp['email'] as String? ?? '';
          _address = perfilResp['morada'] as String? ?? '';
          _phone = perfilResp['telefone'] as String? ?? '';
          _currentProfileImageUrl = perfilResp['foto'] as String?;
        });
      }
      return perfilResp;
    } catch (e) {
      _showSnackBar('Erro ao carregar dados do perfil: $e', isError: true);
      return null;
    }
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      setState(() => _profileImage = File(pickedFile.path));
    }
  }

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) return;
    _formKey.currentState!.save();

    final user = await my_prefs.getUser();
    final userId = user?['idutilizador']?.toString();
    if (userId == null) {
      if (mounted) context.go('/login');
      return;
    }

    Map<String, String> fields = {
      'nome': _name,
      'morada': _address,
      'telefone': _phone,
    };

    try {
      final response = await _middleware.updateUserProfile(userId, fields, profileImage: _profileImage);
      if (user != null) {
        await my_prefs.saveUser({...user, ...response});
      }
      if (mounted) {
        setState(() {
          _isEditing = false;
          _profileImage = null;
          _currentProfileImageUrl = response['foto'] as String?;
          _name = response['nome'] as String? ?? _name;
          _address = response['morada'] as String? ?? _address;
          _phone = response['telefone'] as String? ?? _phone;
        });
      }
      _showSnackBar('Perfil atualizado com sucesso!');
    } catch (e) {
      _showSnackBar('Erro ao atualizar perfil: $e', isError: true);
    }
  }

  Future<void> _logout() async {
    await my_prefs.removeToken();
    if (mounted) context.go('/login');
  }

  void _showSnackBar(String message, {bool isError = false}) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(message),
          backgroundColor: isError ? Colors.red : Colors.green,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: FutureBuilder<Map<String, dynamic>?>(
        future: _userDataFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError || !snapshot.hasData || snapshot.data == null) {
            return const Center(child: Text('Erro ao carregar os dados.'));
          }

          final userData = snapshot.data!;
          return LayoutBuilder(
            builder: (context, constraints) {
              return SingleChildScrollView(
                padding: const EdgeInsets.all(16.0),
                child: ConstrainedBox(
                  constraints: BoxConstraints(minHeight: constraints.maxHeight),
                  child: IntrinsicHeight(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Text(
                          _isEditing ? 'Editar Perfil' : 'Perfil do Utilizador',
                          style: Theme.of(context).textTheme.headlineMedium,
                        ),
                        const SizedBox(height: 20),
                        GestureDetector(
                          onTap: _isEditing ? _pickImage : null,
                          child: CircleAvatar(
                            radius: 75,
                            backgroundImage: _profileImage != null
                                ? FileImage(_profileImage!)
                                : (_currentProfileImageUrl != null && _currentProfileImageUrl!.isNotEmpty
                                ? NetworkImage(_currentProfileImageUrl!)
                                : const AssetImage('assets/placeholder_profile.png') as ImageProvider),
                          ),
                        ),
                        if (_isEditing)
                          const Padding(
                            padding: EdgeInsets.only(top: 8.0),
                            child: Text('Apenas JPG/PNG são aceites.', style: TextStyle(fontSize: 12, color: Colors.grey)),
                          ),
                        const SizedBox(height: 30),
                        Form(
                          key: _formKey,
                          child: Column(
                            children: [
                              if (!_isEditing) ...[
                                _buildInfoRow('Nome:', _name),
                                _buildInfoRow('Email:', _email),
                                _buildInfoRow('Morada:', _address.isNotEmpty ? _address : 'Não especificada'),
                                _buildInfoRow('Telefone:', _phone.isNotEmpty ? _phone : 'Não especificado'),
                                _buildInfoRow(
                                  'Roles:',
                                  (userData['roles'] != null && (userData['roles'] as List).isNotEmpty)
                                      ? (userData['roles'] as List).map((r) => r['role']).join(', ')
                                      : 'Nenhum',
                                ),
                                _buildInfoRow(
                                  'Membro desde:',
                                  userData['dataregisto'] != null
                                      ? DateTime.parse(userData['dataregisto']).toLocaleDateString('pt-PT')
                                      : 'N/A',
                                ),
                              ] else ...[
                                TextFormField(
                                  initialValue: _name,
                                  decoration: const InputDecoration(labelText: 'Nome'),
                                  validator: (value) => value == null || value.isEmpty ? 'Por favor, insira o nome' : null,
                                  onSaved: (value) => _name = value!,
                                ),
                                const SizedBox(height: 10),
                                // --- CAMPO DE EMAIL AGORA NÃO-EDITÁVEL ---
                                TextFormField(
                                  initialValue: _email,
                                  decoration: InputDecoration(
                                    labelText: 'Email (não pode ser alterado)',
                                    filled: true,
                                    fillColor: Colors.grey.shade200,
                                    border: const OutlineInputBorder(),
                                  ),
                                  readOnly: true,
                                ),
                                const SizedBox(height: 10),
                                TextFormField(
                                  initialValue: _address,
                                  decoration: const InputDecoration(labelText: 'Morada'),
                                  onSaved: (value) => _address = value!,
                                ),
                                const SizedBox(height: 10),
                                TextFormField(
                                  initialValue: _phone,
                                  decoration: const InputDecoration(labelText: 'Telefone'),
                                  keyboardType: TextInputType.phone,
                                  onSaved: (value) => _phone = value!,
                                ),
                              ],
                              const SizedBox(height: 20),
                              _isEditing
                                  ? Row(
                                mainAxisAlignment: MainAxisAlignment.end,
                                children: [
                                  TextButton(
                                    onPressed: () {
                                      setState(() {
                                        _isEditing = false;
                                        _profileImage = null;
                                        _userDataFuture = _loadUserData();
                                      });
                                    },
                                    child: const Text('Cancelar'),
                                  ),
                                  const SizedBox(width: 10),
                                  ElevatedButton(
                                    onPressed: _saveProfile,
                                    child: const Text('Guardar Alterações'),
                                  ),
                                ],
                              )
                                  : SizedBox(
                                width: double.infinity,
                                child: ElevatedButton(
                                  onPressed: () => setState(() => _isEditing = true),
                                  child: const Text('Editar Perfil'),
                                ),
                              ),
                            ],
                          ),
                        ),
                        Expanded(child: Container()),
                        SizedBox(
                          width: 200,
                          child: ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFFF0004),
                              foregroundColor: Colors.white,
                              elevation: 4,
                              minimumSize: const Size(0, 55),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                              ),
                            ),
                            onPressed: () async {
                              final confirmou = await mostrarDialogoDeConfirmacao(
                                context: context,
                                titulo: 'Terminar Sessão',
                                conteudo: 'Tem a certeza que deseja sair?',
                                textoBotaoConfirmar: 'Sair',
                                textoBotaoCancelar: 'Cancelar',
                                confirmButtonColor: const Color(0xFFFF0004),
                              );

                              if (confirmou == true) {
                                await _logout();
                              }
                            },
                            child: const Text(
                              "Sair",
                              style: TextStyle(fontSize: 22, fontWeight: FontWeight.w500),
                            ),
                          ),
                        ),
                        const SizedBox(height: 32),
                      ],
                    ),
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(width: 10),
          Expanded(child: Text(value, style: const TextStyle(fontSize: 16))),
        ],
      ),
    );
  }
}

extension DateTimeExtension on DateTime {
  String toLocaleDateString(String locale) {
    return '$day/$month/$year';
  }
}