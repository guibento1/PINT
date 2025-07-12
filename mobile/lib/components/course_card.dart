import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart'; 

// Cartão para apresentar um curso
class CourseCard extends StatelessWidget {
  final Map<String, dynamic> curso;
  final bool isSubscribed;
  final VoidCallback onTap;

  const CourseCard({
    super.key,
    required this.curso,
    this.isSubscribed = false,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final String? thumbnailUrl = curso['thumbnail'] as String?;
    final bool hasThumbnail = thumbnailUrl != null && thumbnailUrl.isNotEmpty;

    final currentRoute = ModalRoute.of(context)?.settings.name;
    final bool showInscritoTag = currentRoute != '/home' && (curso['inscrito'] == true);

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 15),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFFFFFFFF),
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.grey.withOpacity(0.3),
              spreadRadius: 1,
              blurRadius: 1,
              offset: const Offset(1, 3),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(15),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: hasThumbnail
                    ? CachedNetworkImage(
                        imageUrl: thumbnailUrl,
                        width: 72,
                        height: 72,
                        fit: BoxFit.cover,
                        placeholder: (context, url) => const SizedBox(
                          width: 72,
                          height: 72,
                          child: Center(
                            child: CircularProgressIndicator(strokeWidth: 2.0),
                          ),
                        ),
                        errorWidget: (context, url, error) => Container(
                          width: 72,
                          height: 72,
                          color: Colors.grey[200],
                          child: const Icon(Icons.code, color: Color(0xFFFD7E14), size: 48),
                        ),
                      )
                    : Container(
                        width: 72,
                        height: 72,
                        color: Colors.grey[200],
                        child: const Center(
                          child: Icon(Icons.code, color: Color(0xFFFD7E14), size: 48),
                        ),
                      ),
              ),
            ),
            const SizedBox(width: 15),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    curso['nome'] ?? '',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                      color: Color(0xFF222B45),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 5),
                  Text(
                    'Toque para ver os detalhes do curso.',
                    style: const TextStyle(
                      fontSize: 14,
                      color: Color(0xFF8F9BB3),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (showInscritoTag)
                    Padding(
                      padding: const EdgeInsets.only(top: 8.0),
                      child: Chip(
                        label: const Text(
                          'Inscrito',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        backgroundColor: const Color(0xFF007BFF),
                        materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
