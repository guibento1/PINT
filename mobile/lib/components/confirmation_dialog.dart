import 'package:flutter/material.dart';

Future<void> mostrarDialogoDeConfirmacao({
  required BuildContext context,
  required String titulo,
  required String conteudo,
  String textoBotaoConfirmar = 'Confirmar',
  String textoBotaoCancelar = 'Cancelar',
  required VoidCallback onConfirm,
}) async {
  return showDialog<void>(
    context: context,
    barrierDismissible: false,
    builder: (BuildContext dialogContext) {
      return AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16.0),
        ),
        title: Text(titulo),
        content: Text(
          conteudo,
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 18, color: Colors.black),
        ),
        actions: <Widget>[
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.grey,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                child: Text(textoBotaoCancelar, style: const TextStyle(color: Colors.white)),
                onPressed: () {
                  Navigator.of(dialogContext).pop();
                },
              ),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Theme.of(context).colorScheme.error,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                child: Text(textoBotaoConfirmar, style: const TextStyle(color: Colors.white)),
                onPressed: () {
                  Navigator.of(dialogContext).pop();
                  onConfirm();
                },
              ),
            ],
          ),
        ],
      );
    },
  );
}