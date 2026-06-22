import '/components/menu_side_bar_widget.dart';
import '/flutter_flow/flutter_flow_util.dart';
import 'notification_widget.dart' show NotificationWidget;
import 'package:flutter/material.dart';

class NotificationModel extends FlutterFlowModel<NotificationWidget> {
  ///  State fields for stateful widgets in this page.

  // Model for MenuSideBar component.
  late MenuSideBarModel menuSideBarModel;

  @override
  void initState(BuildContext context) {
    menuSideBarModel = createModel(context, () => MenuSideBarModel());
  }

  @override
  void dispose() {
    menuSideBarModel.dispose();
  }
}
