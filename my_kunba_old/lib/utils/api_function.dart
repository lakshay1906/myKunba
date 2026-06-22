import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:my_kunba/utils/provider/user.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiFunction {
  Future<http.Response?> register(
      BuildContext context, Map<String, dynamic> data) async {
    User user = Provider.of<User>(context, listen: false);
    if (user.token == null) {
      ScaffoldMessenger.of(context).hideCurrentSnackBar();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("You're not authorized to perform this action")),
      );
      return null;
    }
    final response = await http.post(
        Uri.parse('${dotenv.env['BASE_URL']}/api/user/auth/sign-in'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${user.token}',
        },
        body: jsonEncode(data));
    if (response.statusCode == 200 || response.statusCode == 201) {
      SharedPreferences prefs = await SharedPreferences.getInstance();
      prefs.setString('user_detail', response.body);
      final body = jsonDecode(response.body);
      user.name = body['displayName'];
      user.username = body['username'];
      user.role = body['role'];
      user.bio = body['bio'];
      user.profileImage = body['profileImage'];
      print('signed-in user: ${jsonDecode(response.body)}');
    }
    return response;
  }

  // {id: 12, username: abc_01, displayName: abc, bio: This profile is created by mobile app., profileImage: null, role: user, socialLinks: [], email: abc@gmail.com, uid: k9D8X9ENzFhDdn2GIamUaGrTUrj1, lastLogin: 2025-06-21T12:35:30.382Z, deleted_at: null, updatedAt: 2025-06-21T12:35:30.391Z, createdAt: 2025-06-21T12:35:30.386Z}

  Future<http.Response> loginIn(BuildContext context, String token) async {
    final response = await http.get(
        Uri.parse('${dotenv.env['BASE_URL']}/api/user/auth/login'),
        headers: {'Authorization': 'bearer ${token}'});
    if (response.statusCode == 200 || response.statusCode == 201) {
      User user = Provider.of<User>(context, listen: false);
      SharedPreferences prefs = await SharedPreferences.getInstance();
      prefs.setString('user_detail', response.body);
      final body = jsonDecode(response.body);
      user.name = body['displayName'];
      user.username = body['username'];
      user.role = body['role'];
      user.bio = body['bio'];
      user.profileImage = body['profileImage'];
      print('signed-in user: ${jsonDecode(response.body)}');
    }
    return response;
  }

  Future<http.Response?> fetchBlogs(BuildContext context) async {
    User user = Provider.of<User>(context, listen: false);
    if (user.token == null) {
      ScaffoldMessenger.of(context).hideCurrentSnackBar();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("You're not authorized to perform this action")),
      );
      return null;
    }
    final response = await http.get(
        Uri.parse('${dotenv.env['BASE_URL']}/api/dashboard/blog'),
        headers: {'Authorization': 'bearer ${user.token}'});
    return response;
  }
}
