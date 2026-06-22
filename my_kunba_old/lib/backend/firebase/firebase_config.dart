import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';

Future initFirebase() async {
  if (kIsWeb) {
    await Firebase.initializeApp(
        options: FirebaseOptions(
            apiKey: "AIzaSyC4WN-I24Eotzv5dvhyqblYG_hMb0MZ7bc",
            authDomain: "my-kunba.firebaseapp.com",
            projectId: "my-kunba",
            storageBucket: "my-kunba.firebasestorage.app",
            messagingSenderId: "436194971066",
            appId: "1:436194971066:web:a2a7bf548daa55ca162183",
            measurementId: "G-94FD9JL7PP"));
  } else {
    await Firebase.initializeApp();
  }
}
