import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:my_kunba/auth/base_auth_user_provider.dart';
import 'package:my_kunba/flutter_flow/flutter_flow_util.dart';
import 'package:my_kunba/utils/provider/user.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

class CommonFunction {
  Future<String?> getJWT(BuildContext context, BaseAuthUser user) async {
    final response = await http.post(
        Uri.parse('${dotenv.env['BASE_URL']}/api/user/auth/jwt/new'),
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'email': user.email,
          'uid': user.uid,
        }));
    if (response.statusCode == 200) {
      final body = jsonDecode(response.body);
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('access_token', body['token'] ?? '');
      User user = Provider.of<User>(context, listen: false);
      user.token = body['token'];
      return body['token'];
    }
    return null;
  }
}
