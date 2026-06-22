import 'package:flutter/material.dart';

class User extends ChangeNotifier {
  String? _token = null;
  String _role = 'user';
  String username = '';
  String name = '';
  String bio = '';
  String? profileImage = '';

  String? get token => _token;
  String get role => _role;

  set token(String? val) {
    _token = val;
  }

  set role(String val) {
    if (val == 'user' || val == 'author') {
      _role = val;
    }
  }
}
