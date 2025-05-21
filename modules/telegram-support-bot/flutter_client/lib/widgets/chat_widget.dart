import 'package:flutter/material.dart';
import 'package:flutter_chat_types/flutter_chat_types.dart' as types;
import 'package:flutter_chat_ui/flutter_chat_ui.dart';
import 'package:provider/provider.dart';
import '../providers/chat_provider.dart';

class ChatWidget extends StatelessWidget {
  const ChatWidget({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Consumer<ChatProvider>(
      builder: (context, chatProvider, _) {
        // Преобразуем сообщения в формат для flutter_chat_ui
        final uiMessages = chatProvider.messages
            .map((message) => message.toUiMessage())
            .toList()
            .cast<types.Message>();
        
        // Сортируем сообщения по времени (от новых к старым)
        uiMessages.sort((a, b) => b.createdAt?.compareTo(a.createdAt ?? 0) ?? 0);

        return Column(
          children: [
            // Удаляем или комментируем информацию о chatId
            // Padding(
            //   padding: const EdgeInsets.symmetric(vertical: 8.0, horizontal: 16.0),
            //   child: Row(
            //     children: [
            //       Icon(Icons.info_outline, size: 16, color: Colors.blue[300]),
            //       const SizedBox(width: 8),
            //       Expanded(
            //         child: Text(
            //           'Chat ID: ${chatProvider.chatId ?? "загрузка..."}',
            //           style: TextStyle(
            //             fontSize: 12,
            //             color: Colors.blue[300],
            //           ),
            //         ),
            //       ),
            //       if (chatProvider.messages.length > 2)
            //         TextButton.icon(
            //           icon: const Icon(Icons.delete_outline, size: 16),
            //           label: const Text('Очистить'),
            //           onPressed: () {
            //             showDialog(
            //               context: context,
            //               builder: (context) => AlertDialog(
            //                 title: const Text('Очистить историю чата?'),
            //                 content: const Text('Все сообщения будут удалены. Это действие нельзя отменить.'),
            //                 actions: [
            //                   TextButton(
            //                     onPressed: () => Navigator.of(context).pop(),
            //                     child: const Text('Отмена'),
            //                   ),
            //                   TextButton(
            //                     onPressed: () {
            //                       chatProvider.clearChat();
            //                       Navigator.of(context).pop();
            //                     },
            //                     child: const Text('Очистить'),
            //                   ),
            //                 ],
            //               ),
            //             );
            //           },
            //           style: TextButton.styleFrom(
            //             foregroundColor: Colors.red[300],
            //             padding: const EdgeInsets.symmetric(horizontal: 8),
            //             visualDensity: VisualDensity.compact,
            //           ),
            //         ),
            //     ],
            //   ),
            // ),
            
            // Индикатор загрузки
            if (chatProvider.isLoading)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 8.0),
                child: LinearProgressIndicator(
                  backgroundColor: Colors.blue[100],
                  color: Colors.blue[400],
                ),
              ),
            
            // Основной виджет чата
            Expanded(
              child: Chat(
                messages: uiMessages,
                onSendPressed: (message) {
                  final textMessage = message as types.PartialText;
                  chatProvider.sendMessage(textMessage.text);
                },
                user: const types.User(id: 'user'),
                theme: DefaultChatTheme(
                  backgroundColor: Theme.of(context).scaffoldBackgroundColor,
                  inputBackgroundColor: Colors.grey[100]!,
                  inputTextColor: Colors.black,
                  primaryColor: Colors.grey[400]!,
                  secondaryColor: Colors.grey[300]!,
                  sentMessageBodyTextStyle: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                  ),
                  receivedMessageBodyTextStyle: const TextStyle(
                    color: Colors.black,
                    fontSize: 16,
                  ),
                  inputBorderRadius: BorderRadius.circular(8.0),
                  inputPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  attachmentButtonIcon: Icon(
                    Icons.add,
                    color: Colors.grey[600],
                  ),
                  sendButtonIcon: Icon(
                    Icons.send,
                    color: Colors.blue,
                  ),
                ),
                // Отключаем некоторые функции, которые не будем использовать
                showUserAvatars: false,
                showUserNames: true,
                disableImageGallery: true,
                inputOptions: const InputOptions(
                  enableSuggestions: true,
                ),
              ),
            ),
          ],
        );
      },
    );
  }
} 