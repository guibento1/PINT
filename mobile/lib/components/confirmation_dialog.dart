// lib/components/confirmation_dialog.dart

import 'package:flutter/material.dart';

/// Mostra um diálogo de confirmação e retorna `true` se confirmado, `false` se cancelado.
Future<bool?> mostrarDialogoDeConfirmacao({
  required BuildContext context,
  required String titulo,
  required String conteudo,
  required String textoBotaoConfirmar,
  required String textoBotaoCancelar,
  required Color confirmButtonColor,
}) async {
  return showDialog<bool>(
    context: context,
    barrierDismissible: false,
    builder: (BuildContext dialogContext) {
      return AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16.0),
        ),
        title: Text(
          titulo,
          textAlign: TextAlign.center,
          style: const TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.bold,
            color: Colors.black,
          ),
        ),
        content: Text(
          conteudo,
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 18, color: Colors.black),
        ),
        actions: <Widget>[
          ConstrainedBox(
            constraints: const BoxConstraints(minWidth: 280),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
              child: Row(
                children: [
                  Expanded(
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF007BFF),
                        elevation: 2,
                        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: Text(
                        textoBotaoCancelar,
                        style: const TextStyle(color: Colors.white, fontSize: 16),
                        textAlign: TextAlign.center,
                      ),
                      onPressed: () {
                        // Ao cancelar, o diálogo é fechado e retorna 'false'
                        Navigator.of(dialogContext).pop(false);
                      },
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: confirmButtonColor,
                        elevation: 4,
                        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: Text(
                        textoBotaoConfirmar,
                        style: const TextStyle(color: Colors.white, fontSize: 16),
                        textAlign: TextAlign.center,
                      ),
                      onPressed: () {
                        // Ao confirmar, o diálogo é fechado e retorna 'true'
                        Navigator.of(dialogContext).pop(true);
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      );
    },
  );
}