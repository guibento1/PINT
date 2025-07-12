// lib/components/course_card.dart
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

    final currentRoute = ModalRoute.of(context)?.settings.name;
    final bool showInscritoTag = currentRoute != '/home' && (curso['inscrito'] == true);

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 15), // Consistent spacing between cards
        padding: const EdgeInsets.all(16), // Padding for the entire card content
        decoration: BoxDecoration(
          color: const Color(0xFFFFFFFF), // Changed to white background
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
              padding: const EdgeInsets.all(8), // Padding inside the image container
              decoration: BoxDecoration(
                color: Colors.white, // Inner background white
                borderRadius: BorderRadius.circular(15),
              ),
              child: hasThumbnail
                  ? ClipRRect( // Added ClipRRect for rounded image corners
                      borderRadius: BorderRadius.circular(10),
                      child: Image.network(
                        curso['thumbnail'],
                        width: 72, // Larger image as per friend's style
                        height: 72, // Larger image as per friend's style
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) =>
                            const Icon(Icons.code, color: Color(0xFFFD7E14), size: 48), // Larger icon if error
                      ),
                    )
                  : const Icon(Icons.code, color: Color(0xFFFD7E14), size: 48), // Larger icon
            ),
            const SizedBox(width: 15), // Spacing between image and text
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    curso['nome'] ?? '',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                      color: Color(0xFF222B45), // New main text color
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 5),
                  Text(
                    'Toque para ver os detalhes do curso.', // Your fixed description
                    style: const TextStyle( // Use const if possible
                      fontSize: 14,
                      color: Color(0xFF8F9BB3), // New secondary text color
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (showInscritoTag) // Conditionally display the tag
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
                        backgroundColor: const Color(0xFF007BFF), // Orange color
                        materialTapTargetSize: MaterialTapTargetSize.shrinkWrap, // Compact size
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
