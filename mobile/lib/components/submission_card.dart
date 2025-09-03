import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

class SubmissionCard extends StatelessWidget {
  final String filename;
  final String? type;
  final DateTime? date;
  final String? url; 
  final String? statusLabel;
  final bool dense;

  const SubmissionCard({
    super.key,
    required this.filename,
    this.type,
    this.date,
    this.url,
    this.statusLabel,
    this.dense = false,
  });

  String _format(DateTime? d) {
    if (d == null) return '';
    final f = DateFormat('dd/MM/yyyy, HH:mm', 'pt_PT');
    return f.format(d);
  }

  Future<void> _openUrl(String u) async {
    final uri = Uri.tryParse(u);
    if (uri == null) return;
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      await launchUrl(uri, mode: LaunchMode.platformDefault);
    }
  }

  @override
  Widget build(BuildContext context) {
    final body = Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        const Text('📎', style: TextStyle(fontSize: 20)),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Wrap(
                spacing: 8,
                crossAxisAlignment: WrapCrossAlignment.center,
                children: [
                  Text(
                    filename.isNotEmpty ? filename : 'Ficheiro submetido',
                    style: const TextStyle(fontWeight: FontWeight.w600),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (statusLabel != null && statusLabel!.isNotEmpty)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade200,
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        statusLabel!,
                        style: TextStyle(
                          color: Colors.grey.shade800,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 2),
              DefaultTextStyle(
                style: Theme.of(context).textTheme.bodySmall!.copyWith(
                  color: Theme.of(context).hintColor,
                ),
                child: Wrap(
                  spacing: 8,
                  children: [
                    if (type != null && type!.isNotEmpty) Text('Tipo: $type'),
                    if (date != null) Text('Submetido: ${_format(date)}'),
                  ],
                ),
              ),
            ],
          ),
        ),
        if (url != null && url!.isNotEmpty) ...[
          const SizedBox(width: 12),
          ElevatedButton(
            onPressed: () => _openUrl(url!),
            child: const Text('Descarregar'),
          ),
        ],
      ],
    );

    return Container(
      margin: EdgeInsets.only(bottom: dense ? 8 : 12),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
        border: Border.all(
          color: Theme.of(context).dividerColor.withOpacity(0.5),
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        child: body,
      ),
    );
  }
}
