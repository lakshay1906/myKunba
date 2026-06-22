import '/flutter_flow/flutter_flow_util.dart';
import '/index.dart';
import 'create_blog_content_widget.dart' show CreateBlogContentWidget;
import 'package:flutter/material.dart';

class CreateBlogContentModel extends FlutterFlowModel<CreateBlogContentWidget> {
  FocusNode? quillFocusNode;

  @override
  void initState(BuildContext context) {}

  @override
  void dispose() {
    quillFocusNode?.dispose();
  }
}
