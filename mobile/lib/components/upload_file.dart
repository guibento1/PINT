import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';

class UploadFile extends StatefulWidget {
  final String id;
  final String label;
  final String? accept;
  final bool disabled;
  final ValueChanged<PlatformFile?>? onSelect;
  final String? hint;
  final double? height;

  const UploadFile({
    super.key,
    required this.id,
    required this.label,
    this.accept,
    this.disabled = false,
    this.onSelect,
    this.hint,
    this.height,
  });

  @override
  State<UploadFile> createState() => _UploadFileState();
}

class _UploadFileState extends State<UploadFile> {
  PlatformFile? _selected;
  bool _picking = false;

  static String _humanSize(int bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    var size = bytes.toDouble();
    var unit = 0;
    while (size >= 1024 && unit < units.length - 1) {
      size /= 1024;
      unit++;
    }
    return '${size.toStringAsFixed(size < 10 && unit > 0 ? 1 : 0)} ${units[unit]}';
  }

  static List<String> _allowedExtensionsFromAccept(String? accept) {
    if (accept == null || accept.trim().isEmpty) return [];
    final tokens = accept.split(',').map((s) => s.trim().toLowerCase());
    final exts = <String>{};
    for (final t in tokens) {
      if (t == 'image/*') {
        exts.addAll(['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic']);
      } else if (t.startsWith('.')) {
        exts.add(t.substring(1));
      } else if (t.contains('/')) {
        final slash = t.indexOf('/');
        if (slash != -1 && slash + 1 < t.length) {
          exts.add(t.substring(slash + 1));
        }
      } else if (t.isNotEmpty) {
        exts.add(t);
      }
    }
    return exts.toList();
  }

  Future<void> _openPicker() async {
    if (_picking || widget.disabled) return;
    setState(() => _picking = true);
    try {
      final allowed = _allowedExtensionsFromAccept(widget.accept);
      final type = allowed.isEmpty ? FileType.any : FileType.custom;
      final result = await FilePicker.platform.pickFiles(
        allowMultiple: false,
        type: type,
        allowedExtensions: allowed.isEmpty ? null : allowed,
        withData: true,
      );
      if (result != null && result.files.isNotEmpty) {
        final file = result.files.single;
        setState(() => _selected = file);
        widget.onSelect?.call(file);
      }
    } finally {
      if (mounted) setState(() => _picking = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final height = widget.height ?? 64.0;
    final borderColor = Theme.of(context).dividerColor;
    final hintStyle = Theme.of(
      context,
    ).textTheme.bodySmall?.copyWith(color: Theme.of(context).hintColor);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (widget.label.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(bottom: 8.0),
            child: Text(
              widget.label,
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
          ),
        InkWell(
          onTap: widget.disabled ? null : _openPicker,
          borderRadius: BorderRadius.circular(8),
          child: Container(
            height: height,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              border: Border.all(color: borderColor),
              borderRadius: BorderRadius.circular(8),
              color:
                  widget.disabled
                      ? Theme.of(context).disabledColor.withOpacity(0.06)
                      : null,
            ),
            child: Row(
              children: [
                Text(
                  '📄',
                  style: TextStyle(
                    fontSize: 22,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: LayoutBuilder(
                    builder: (context, constraints) {
                      final isNarrow = constraints.maxWidth < 140;
                      if (_selected != null) {
                        return Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              _selected!.name,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '${_selected!.extension ?? 'tipo desconhecido'} · ${_humanSize(_selected!.size)}',
                              style: hintStyle,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        );
                      }
                      if (isNarrow) {
                        return Text(
                          'Selecionar ficheiro',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontWeight: FontWeight.w600),
                        );
                      }
                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Text(
                            'Solte aqui o ficheiro',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(fontWeight: FontWeight.w600),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'ou toque para selecionar',
                            style: hintStyle,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      );
                    },
                  ),
                ),
                const SizedBox(width: 8),
                OutlinedButton(
                  onPressed: widget.disabled ? null : _openPicker,
                  child: Text(_picking ? 'A abrir…' : 'Procurar'),
                ),
                if (_selected != null) ...[
                  const SizedBox(width: 8),
                  TextButton(
                    onPressed:
                        widget.disabled
                            ? null
                            : () {
                              setState(() => _selected = null);
                              widget.onSelect?.call(null);
                            },
                    child: const Text('Remover'),
                  ),
                ],
              ],
            ),
          ),
        ),
        if (widget.hint != null) ...[
          const SizedBox(height: 6),
          Text(widget.hint!, style: hintStyle),
        ],
      ],
    );
  }
}
