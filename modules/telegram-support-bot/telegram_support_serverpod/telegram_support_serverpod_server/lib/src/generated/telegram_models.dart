/* AUTOMATICALLY GENERATED CODE DO NOT MODIFY */
/*   To generate run: "serverpod generate"    */

// ignore_for_file: implementation_imports
// ignore_for_file: library_private_types_in_public_api
// ignore_for_file: non_constant_identifier_names
// ignore_for_file: public_member_api_docs
// ignore_for_file: type_literal_in_constant_pattern
// ignore_for_file: use_super_parameters

// ignore_for_file: no_leading_underscores_for_library_prefixes
import 'package:serverpod/serverpod.dart' as _i1;

abstract class ChatMessageResponse
    implements _i1.SerializableModel, _i1.ProtocolSerialization {
  ChatMessageResponse._({
    required this.reply,
    required this.forwarded,
    required this.status,
    this.errorMessage,
  });

  factory ChatMessageResponse({
    required String reply,
    required bool forwarded,
    required String status,
    String? errorMessage,
  }) = _ChatMessageResponseImpl;

  factory ChatMessageResponse.fromJson(Map<String, dynamic> jsonSerialization) {
    return ChatMessageResponse(
      reply: jsonSerialization['reply'] as String,
      forwarded: jsonSerialization['forwarded'] as bool,
      status: jsonSerialization['status'] as String,
      errorMessage: jsonSerialization['errorMessage'] as String?,
    );
  }

  String reply;

  bool forwarded;

  String status;

  String? errorMessage;

  /// Returns a shallow copy of this [ChatMessageResponse]
  /// with some or all fields replaced by the given arguments.
  @_i1.useResult
  ChatMessageResponse copyWith({
    String? reply,
    bool? forwarded,
    String? status,
    String? errorMessage,
  });
  @override
  Map<String, dynamic> toJson() {
    return {
      'reply': reply,
      'forwarded': forwarded,
      'status': status,
      if (errorMessage != null) 'errorMessage': errorMessage,
    };
  }

  @override
  Map<String, dynamic> toJsonForProtocol() {
    return {
      'reply': reply,
      'forwarded': forwarded,
      'status': status,
      if (errorMessage != null) 'errorMessage': errorMessage,
    };
  }

  @override
  String toString() {
    return _i1.SerializationManager.encode(this);
  }
}

class _Undefined {}

class _ChatMessageResponseImpl extends ChatMessageResponse {
  _ChatMessageResponseImpl({
    required String reply,
    required bool forwarded,
    required String status,
    String? errorMessage,
  }) : super._(
          reply: reply,
          forwarded: forwarded,
          status: status,
          errorMessage: errorMessage,
        );

  /// Returns a shallow copy of this [ChatMessageResponse]
  /// with some or all fields replaced by the given arguments.
  @_i1.useResult
  @override
  ChatMessageResponse copyWith({
    String? reply,
    bool? forwarded,
    String? status,
    Object? errorMessage = _Undefined,
  }) {
    return ChatMessageResponse(
      reply: reply ?? this.reply,
      forwarded: forwarded ?? this.forwarded,
      status: status ?? this.status,
      errorMessage: errorMessage is String? ? errorMessage : this.errorMessage,
    );
  }
}
