import 'dart:convert'; 
import 'package:http/http.dart' as http; 

class Servidor {
  final String urlAPI = 'https://api.thesoftskills.xyz'; 

  Future<Map<String, dynamic>> fetchData(String endpoint) async {
    try {
      final uri = Uri.parse('$urlAPI/$endpoint');
      final response = await http.get(uri);

      if (response.statusCode == 200) {
        return jsonDecode(response.body) as Map<String, dynamic>;
      } else {
        throw Exception('Failed to load data: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error fetching data: $e');
    }
  }

  Future<void> getSoftSkillsData() async {
    try {
      print('Attempting to fetch data from: $urlAPI/sendemail');
      final data = await fetchData('skills'); 
      print('Data received: $data');
    } catch (e) {
      print('Failed to get soft skills data: $e');
    }
  }
}

void main() async {
  final servidor = Servidor();
  await servidor.getSoftSkillsData();
}
