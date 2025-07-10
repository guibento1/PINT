import 'package:flutter/material.dart';

class CourseDetailsPage extends StatelessWidget {
  // Make 'id' required if the page fundamentally needs it.
  final int id;

  // The 'Key' should be passed to the super constructor.
  const CourseDetailsPage({super.key, required this.id});

  @override
  Widget build(BuildContext context) {
    // Replace Placeholder with your actual UI that uses the 'id'
    return Scaffold(
      appBar: AppBar(
        title: Text('Detalhes do Curso ID: $id'),
      ),
      body: Center(
        child: Text('Carregando detalhes para o curso com ID: $id'),
        // Here you would typically fetch course details using the 'id'
      ),
    );
  }
}
