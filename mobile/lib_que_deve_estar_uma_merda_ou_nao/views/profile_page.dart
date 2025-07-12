import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '../backend/server.dart';
import '../backend/shared_preferences.dart' as my_prefs;

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  final Servidor servidor = Servidor();
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
      if (mounted) {
        context.go('/login');
      }
      return null;
    }

    try {
      final dynamic perfilResp = await servidor.getData('utilizador/id/$userId');
      if (perfilResp is Map<String, dynamic>) {
        setState(() {
          _name = perfilResp['nome'] as String? ?? '';
          _email = perfilResp['email'] as String? ?? '';
          _address = perfilResp['morada'] as String? ?? '';
          _phone = perfilResp['telefone'] as String? ?? '';
          _currentProfileImageUrl = perfilResp['foto'] as String?;
        });
        return perfilResp;
      } else {
        throw Exception('Failed to load user data or data is not in expected format.');
      }
    } catch (e) {
      _showSnackBar('Erro ao carregar dados do perfil: $e', isError: true);
      return null;
    }
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery);

    if (pickedFile != null) {
      setState(() {
        _profileImage = File(pickedFile.path);
      });
    }
  }

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    _formKey.currentState!.save();

    final user = await my_prefs.getUser();
    final userId = user?['idutilizador']?.toString();

    if (userId == null) {
      if (mounted) {
        context.go('/login');
      }
      return;
    }

    Map<String, String> fields = {
      'nome': _name,
      'email': _email,
      'morada': _address,
      'telefone': _phone,
    };

    setState(() {
      // Optionally show a loading indicator
    });

    try {
      Map<String, dynamic>? response;
      if (_profileImage != null) {
        response = await servidor.putMultipartData(
          'utilizador/id/$userId',
          fields,
          'foto',
          _profileImage!.path,
        );
      } else {
        response = await servidor.putData(
          'utilizador/id/$userId',
          fields,
        );
      }

      if (response != null) {
        // Promote response to a non-nullable local variable
        final Map<String, dynamic> finalResponse = response;

        // Update local user data in SharedPreferences
        if (user != null) {
          final updatedUser = {...user, ...finalResponse}; // Use finalResponse here
          await my_prefs.saveUser(updatedUser);
        }

        setState(() {
          _isEditing = false;
          _profileImage = null; // Clear the selected image after upload
          // Use finalResponse for safe access
          _currentProfileImageUrl = finalResponse['foto'] as String?;
          _name = finalResponse['nome'] as String? ?? _name;
          _email = finalResponse['email'] as String? ?? _email;
          _address = finalResponse['morada'] as String? ?? _address;
          _phone = finalResponse['telefone'] as String? ?? _phone;
        });
        _showSnackBar('Perfil atualizado com sucesso!');
      } else {
        _showSnackBar('Falha ao atualizar o perfil. Tente novamente.', isError: true);
      }
    } catch (e) {
      _showSnackBar('Erro ao atualizar perfil: $e', isError: true);
    } finally {
      setState(() {
        // Hide loading indicator
      });
    }
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
    return FutureBuilder<Map<String, dynamic>?>(
      future: _userDataFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        } else if (snapshot.hasError) {
          return Center(child: Text('Erro: ${snapshot.error}'));
        } else if (!snapshot.hasData || snapshot.data == null) {
          return const Center(child: Text('Nenhum dado de utilizador encontrado.'));
        }

        final userData = snapshot.data!;

        return SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
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
                  backgroundColor: Colors.blueAccent,
                  backgroundImage: _profileImage != null
                      ? FileImage(_profileImage!)
                      : (_currentProfileImageUrl != null && _currentProfileImageUrl!.isNotEmpty
                              ? NetworkImage(_currentProfileImageUrl!)
                              : const AssetImage('assets/placeholder_profile.png') as ImageProvider),
                  child: _profileImage == null && (_currentProfileImageUrl == null || _currentProfileImageUrl!.isEmpty)
                      ? const Icon(
                          Icons.person,
                          size: 80,
                          color: Colors.white,
                        )
                      : null,
                ),
              ),
              if (_isEditing)
                const Padding(
                  padding: EdgeInsets.only(top: 8.0),
                  child: Text(
                    'Apenas JPG/PNG são aceites.',
                    style: TextStyle(fontSize: 12, color: Colors.grey),
                  ),
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
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Por favor, insira o nome';
                          }
                          return null;
                        },
                        onSaved: (value) => _name = value!,
                      ),
                      const SizedBox(height: 10),
                      TextFormField(
                        initialValue: _email,
                        decoration: const InputDecoration(labelText: 'Email'),
                        keyboardType: TextInputType.emailAddress,
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Por favor, insira o email';
                          }
                          if (!RegExp(r'^[^@]+@[^@]+\.[^@]+').hasMatch(value)) {
                            return 'Por favor, insira um email válido';
                          }
                          return null;
                        },
                        onSaved: (value) => _email = value!,
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
                                    _name = userData['nome'] as String? ?? '';
                                    _email = userData['email'] as String? ?? '';
                                    _address = userData['morada'] as String? ?? '';
                                    _phone = userData['telefone'] as String? ?? '';
                                    _currentProfileImageUrl = userData['foto'] as String?;
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
                        : Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: ElevatedButton(
                                  onPressed: () {
                                    setState(() {
                                      _isEditing = true;
                                    });
                                  },
                                  child: const Text('Editar Perfil'),
                                ),
                              ),
                            ],
                          ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontSize: 16),
            ),
          ),
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
