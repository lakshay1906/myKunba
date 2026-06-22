import '/backend/api_requests/api_calls.dart';
import '/components/menu_side_bar_widget.dart';
import '/components/post_list_tile_widget.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/index.dart';
import 'dart:async';
import 'home_page_widget.dart' show HomePageWidget;
import 'package:flutter/material.dart';
import 'package:infinite_scroll_pagination/infinite_scroll_pagination.dart';

class HomePageModel extends FlutterFlowModel<HomePageWidget> {
  ///  State fields for stateful widgets in this page.

  // State field(s) for TabBar widget.
  TabController? tabBarController;
  int get tabBarCurrentIndex =>
      tabBarController != null ? tabBarController!.index : 0;
  int get tabBarPreviousIndex =>
      tabBarController != null ? tabBarController!.previousIndex : 0;

  // State field(s) for ListView widget.

  PagingController<ApiPagingParams, dynamic>? listViewPagingController1;
  Function(ApiPagingParams nextPageMarker)? listViewApiCall1;

  // Models for PostListTile dynamic component.
  late FlutterFlowDynamicModels<PostListTileModel> postListTileModels1;
  // Model for PostListTile component.
  late PostListTileModel postListTileModel2;
  // Model for PostListTile component.
  late PostListTileModel postListTileModel3;
  // Model for PostListTile component.
  late PostListTileModel postListTileModel4;
  // Model for PostListTile component.
  late PostListTileModel postListTileModel5;
  // Model for PostListTile component.
  late PostListTileModel postListTileModel6;
  // Model for PostListTile component.
  late PostListTileModel postListTileModel7;
  // Model for PostListTile component.
  late PostListTileModel postListTileModel8;
  // Model for PostListTile component.
  late PostListTileModel postListTileModel9;
  // Model for PostListTile component.
  late PostListTileModel postListTileModel10;
  // Model for PostListTile component.
  late PostListTileModel postListTileModel11;
  // Model for PostListTile component.
  late PostListTileModel postListTileModel12;
  // Model for PostListTile component.
  late PostListTileModel postListTileModel13;
  // Model for PostListTile component.
  late PostListTileModel postListTileModel14;
  // Model for PostListTile component.
  late PostListTileModel postListTileModel15;
  // Model for PostListTile component.
  late PostListTileModel postListTileModel16;
  // Model for PostListTile component.
  late PostListTileModel postListTileModel17;
  // Model for PostListTile component.
  late PostListTileModel postListTileModel18;
  // Model for PostListTile component.
  late PostListTileModel postListTileModel19;
  // Model for PostListTile component.
  late PostListTileModel postListTileModel20;
  // Model for PostListTile component.
  late PostListTileModel postListTileModel21;
  // Model for PostListTile component.
  late PostListTileModel postListTileModel22;
  // Model for PostListTile component.
  late PostListTileModel postListTileModel23;
  // Model for PostListTile component.
  late PostListTileModel postListTileModel24;
  // Model for PostListTile component.
  late PostListTileModel postListTileModel25;
  // Model for PostListTile component.
  late PostListTileModel postListTileModel26;
  // Model for PostListTile component.
  late PostListTileModel postListTileModel27;
  // Model for PostListTile component.
  late PostListTileModel postListTileModel28;
  // Model for PostListTile component.
  late PostListTileModel postListTileModel29;
  // Model for PostListTile component.
  late PostListTileModel postListTileModel30;
  // Model for PostListTile component.
  late PostListTileModel postListTileModel31;
  // Model for MenuSideBar component.
  late MenuSideBarModel menuSideBarModel;

  @override
  void initState(BuildContext context) {
    postListTileModels1 = FlutterFlowDynamicModels(() => PostListTileModel());
    postListTileModel2 = createModel(context, () => PostListTileModel());
    postListTileModel3 = createModel(context, () => PostListTileModel());
    postListTileModel4 = createModel(context, () => PostListTileModel());
    postListTileModel5 = createModel(context, () => PostListTileModel());
    postListTileModel6 = createModel(context, () => PostListTileModel());
    postListTileModel7 = createModel(context, () => PostListTileModel());
    postListTileModel8 = createModel(context, () => PostListTileModel());
    postListTileModel9 = createModel(context, () => PostListTileModel());
    postListTileModel10 = createModel(context, () => PostListTileModel());
    postListTileModel11 = createModel(context, () => PostListTileModel());
    postListTileModel12 = createModel(context, () => PostListTileModel());
    postListTileModel13 = createModel(context, () => PostListTileModel());
    postListTileModel14 = createModel(context, () => PostListTileModel());
    postListTileModel15 = createModel(context, () => PostListTileModel());
    postListTileModel16 = createModel(context, () => PostListTileModel());
    postListTileModel17 = createModel(context, () => PostListTileModel());
    postListTileModel18 = createModel(context, () => PostListTileModel());
    postListTileModel19 = createModel(context, () => PostListTileModel());
    postListTileModel20 = createModel(context, () => PostListTileModel());
    postListTileModel21 = createModel(context, () => PostListTileModel());
    postListTileModel22 = createModel(context, () => PostListTileModel());
    postListTileModel23 = createModel(context, () => PostListTileModel());
    postListTileModel24 = createModel(context, () => PostListTileModel());
    postListTileModel25 = createModel(context, () => PostListTileModel());
    postListTileModel26 = createModel(context, () => PostListTileModel());
    postListTileModel27 = createModel(context, () => PostListTileModel());
    postListTileModel28 = createModel(context, () => PostListTileModel());
    postListTileModel29 = createModel(context, () => PostListTileModel());
    postListTileModel30 = createModel(context, () => PostListTileModel());
    postListTileModel31 = createModel(context, () => PostListTileModel());
    menuSideBarModel = createModel(context, () => MenuSideBarModel());
  }

  @override
  void dispose() {
    tabBarController?.dispose();
    listViewPagingController1?.dispose();
    postListTileModels1.dispose();
    postListTileModel2.dispose();
    postListTileModel3.dispose();
    postListTileModel4.dispose();
    postListTileModel5.dispose();
    postListTileModel6.dispose();
    postListTileModel7.dispose();
    postListTileModel8.dispose();
    postListTileModel9.dispose();
    postListTileModel10.dispose();
    postListTileModel11.dispose();
    postListTileModel12.dispose();
    postListTileModel13.dispose();
    postListTileModel14.dispose();
    postListTileModel15.dispose();
    postListTileModel16.dispose();
    postListTileModel17.dispose();
    postListTileModel18.dispose();
    postListTileModel19.dispose();
    postListTileModel20.dispose();
    postListTileModel21.dispose();
    postListTileModel22.dispose();
    postListTileModel23.dispose();
    postListTileModel24.dispose();
    postListTileModel25.dispose();
    postListTileModel26.dispose();
    postListTileModel27.dispose();
    postListTileModel28.dispose();
    postListTileModel29.dispose();
    postListTileModel30.dispose();
    postListTileModel31.dispose();
    menuSideBarModel.dispose();
  }

  /// Additional helper methods.
  PagingController<ApiPagingParams, dynamic> setListViewController1(
    Function(ApiPagingParams) apiCall,
  ) {
    listViewApiCall1 = apiCall;
    return listViewPagingController1 ??= _createListViewController1(apiCall);
  }

  PagingController<ApiPagingParams, dynamic> _createListViewController1(
    Function(ApiPagingParams) query,
  ) {
    final controller = PagingController<ApiPagingParams, dynamic>(
      firstPageKey: ApiPagingParams(
        nextPageNumber: 0,
        numItems: 0,
        lastResponse: null,
      ),
    );
    return controller
      ..addPageRequestListener(listViewGetAllAdminRelatedBlogsPage1);
  }

  void listViewGetAllAdminRelatedBlogsPage1(ApiPagingParams nextPageMarker) =>
      listViewApiCall1!(nextPageMarker)
          .then((listViewGetAllAdminRelatedBlogsResponse) {
        final pageItems = (GetAllAdminRelatedBlogsCall.blogs(
                  listViewGetAllAdminRelatedBlogsResponse.jsonBody,
                )! ??
                [])
            .toList();
        final newNumItems = nextPageMarker.numItems + pageItems.length;
        listViewPagingController1?.appendPage(
          pageItems,
          (pageItems.length > 0)
              ? ApiPagingParams(
                  nextPageNumber: nextPageMarker.nextPageNumber + 1,
                  numItems: newNumItems,
                  lastResponse: listViewGetAllAdminRelatedBlogsResponse,
                )
              : null,
        );
      });

  Future waitForOnePageForListView1({
    double minWait = 0,
    double maxWait = double.infinity,
  }) async {
    final stopwatch = Stopwatch()..start();
    while (true) {
      await Future.delayed(Duration(milliseconds: 50));
      final timeElapsed = stopwatch.elapsedMilliseconds;
      final requestComplete =
          (listViewPagingController1?.nextPageKey?.nextPageNumber ?? 0) > 0;
      if (timeElapsed > maxWait || (requestComplete && timeElapsed > minWait)) {
        break;
      }
    }
  }
}
