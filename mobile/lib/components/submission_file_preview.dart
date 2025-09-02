import 'package:flutter/material.dart';
import 'submission_card.dart';

class SubmissionFilePreview extends StatelessWidget {
  final String url;
  final String? filename;
  final String? type; // mime
  final DateTime? date;
  final String? statusLabel;

  const SubmissionFilePreview({
    super.key,
    required this.url,
    this.filename,
    this.type,
    this.date,
    this.statusLabel,
  });

  String _deriveName(String? provided, String url) {
    if (provided != null && provided.trim().isNotEmpty) return provided;
    try {
      final uri = Uri.parse(url);
      final qp = uri.queryParameters['filename'] ?? uri.queryParameters['name'];
      if (qp != null && qp.trim().isNotEmpty) return qp;
      final last = uri.pathSegments.isNotEmpty ? uri.pathSegments.last : '';
      if (last.isNotEmpty) return Uri.decodeComponent(last);
    } catch (_) {}
    return 'ficheiro';
  }

  @override
  Widget build(BuildContext context) {
    if (url.isEmpty) return const SizedBox.shrink();
    final name = _deriveName(filename, url);
    return SubmissionCard(
      filename: name,
      type: type,
      date: date,
      url: url,
      statusLabel: statusLabel,
    );
  }
}
