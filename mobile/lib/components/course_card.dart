import 'package:flutter/material.dart';

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
    final hasThumbnail =
        curso['thumbnail'] != null && (curso['thumbnail'] as String).isNotEmpty;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 15), 
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFFE0F7FA), 
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
              padding: const EdgeInsets.all(16), 
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(15),
              ),
              child: hasThumbnail
                  ? Image.network(
                      curso['thumbnail'],
                      width: 32,
                      height: 32,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) =>
                          const Icon(Icons.code, color: Color(0xFFFD7E14), size: 32),
                    )
                  : const Icon(Icons.code, color: Color(0xFFFD7E14), size: 32),
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
                      color: Color(0xFF0D47A1), 
                    ),
                    maxLines: 1, // Limiting for list view
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 5),
                  Text(
                    'Toque para ver os detalhes do curso.', // Fixed description
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey[700], // Darker grey for secondary text
                    ),
                    maxLines: 1, // Limiting for list view
                    overflow: TextOverflow.ellipsis,
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
