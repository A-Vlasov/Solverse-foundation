import 'package:flutter/material.dart';
import '../utils/constants.dart';
import '../widgets/chat_widget.dart';

class ChatScreen extends StatelessWidget {
  const ChatScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(AppConstants.appName),
        elevation: 0,
        centerTitle: true,
      ),
      body: const SafeArea(
        child: ChatWidget(),
      ),
    );
  }
} 