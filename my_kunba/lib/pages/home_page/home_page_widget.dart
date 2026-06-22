import '/auth/firebase_auth/auth_util.dart';
import '/backend/api_requests/api_calls.dart';
import '/components/menu_side_bar_widget.dart';
import '/components/post_list_tile_widget.dart';
import '/flutter_flow/flutter_flow_icon_button.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/index.dart';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:infinite_scroll_pagination/infinite_scroll_pagination.dart';
import 'package:provider/provider.dart';
import 'home_page_model.dart';
export 'home_page_model.dart';

class HomePageWidget extends StatefulWidget {
  const HomePageWidget({super.key});

  static String routeName = 'HomePage';
  static String routePath = '/homePage';

  @override
  State<HomePageWidget> createState() => _HomePageWidgetState();
}

class _HomePageWidgetState extends State<HomePageWidget>
    with TickerProviderStateMixin {
  late HomePageModel _model;

  final scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => HomePageModel());

    // On page load action.
    SchedulerBinding.instance.addPostFrameCallback((_) async {
      Function() _navigate = () {};
      if (!(FFAppState().jwtToken != '')) {
        GoRouter.of(context).prepareAuthEvent();
        await authManager.signOut();
        GoRouter.of(context).clearRedirectLocation();

        _navigate = () =>
            context.goNamedAuth(WelcomePageWidget.routeName, context.mounted);
        ScaffoldMessenger.of(context).clearSnackBars();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Please log in again!',
              style: TextStyle(
                color: FlutterFlowTheme.of(context).primaryText,
              ),
              textAlign: TextAlign.start,
            ),
            duration: Duration(milliseconds: 4000),
            backgroundColor: FlutterFlowTheme.of(context).primary,
          ),
        );
      }

      _navigate();
    });

    _model.tabBarController = TabController(
      vsync: this,
      length: 5,
      initialIndex: 0,
    )..addListener(() => safeSetState(() {}));
  }

  @override
  void dispose() {
    _model.dispose();

    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    context.watch<FFAppState>();

    return GestureDetector(
      onTap: () {
        FocusScope.of(context).unfocus();
        FocusManager.instance.primaryFocus?.unfocus();
      },
      child: Scaffold(
        key: scaffoldKey,
        backgroundColor: FlutterFlowTheme.of(context).primaryBackground,
        floatingActionButton: Padding(
          padding: EdgeInsetsDirectional.fromSTEB(0.0, 0.0, 5.0, 30.0),
          child: FloatingActionButton(
            onPressed: () async {
              context.pushNamed(CreateBlogWidget.routeName);
            },
            backgroundColor: FlutterFlowTheme.of(context).alternate,
            elevation: 8.0,
            child: Icon(
              Icons.add_rounded,
              color: FlutterFlowTheme.of(context).primaryText,
              size: 24.0,
            ),
          ),
        ),
        drawer: Container(
          width: MediaQuery.sizeOf(context).width * 0.82,
          child: Drawer(
            elevation: 16.0,
            child: wrapWithModel(
              model: _model.menuSideBarModel,
              updateCallback: () => safeSetState(() {}),
              child: MenuSideBarWidget(),
            ),
          ),
        ),
        appBar: AppBar(
          backgroundColor: FlutterFlowTheme.of(context).secondaryBackground,
          automaticallyImplyLeading: false,
          leading: FlutterFlowIconButton(
            borderColor: Color(0x000A0A0A),
            borderRadius: 30.0,
            borderWidth: 1.0,
            buttonSize: 50.0,
            icon: Icon(
              Icons.dehaze_outlined,
              color: FlutterFlowTheme.of(context).primaryText,
              size: 25.0,
            ),
            onPressed: () async {
              scaffoldKey.currentState!.openDrawer();
            },
          ),
          title: Row(
            mainAxisSize: MainAxisSize.max,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                FFLocalizations.of(context).getText(
                  '2mlymmog' /* Posts */,
                ),
                style: FlutterFlowTheme.of(context).headlineMedium.override(
                      font: GoogleFonts.interTight(
                        fontWeight: FlutterFlowTheme.of(context)
                            .headlineMedium
                            .fontWeight,
                        fontStyle: FlutterFlowTheme.of(context)
                            .headlineMedium
                            .fontStyle,
                      ),
                      color: FlutterFlowTheme.of(context).primaryText,
                      fontSize: 22.0,
                      letterSpacing: 0.0,
                      fontWeight: FlutterFlowTheme.of(context)
                          .headlineMedium
                          .fontWeight,
                      fontStyle:
                          FlutterFlowTheme.of(context).headlineMedium.fontStyle,
                    ),
              ),
            ],
          ),
          actions: [],
          centerTitle: false,
          elevation: 0.0,
        ),
        body: SafeArea(
          top: true,
          child: Visibility(
            visible: responsiveVisibility(
              context: context,
              desktop: false,
            ),
            child: Column(
              children: [
                Align(
                  alignment: Alignment(-1.0, 0),
                  child: TabBar(
                    isScrollable: true,
                    labelColor: FlutterFlowTheme.of(context).primaryText,
                    unselectedLabelColor:
                        FlutterFlowTheme.of(context).secondaryText,
                    labelStyle:
                        FlutterFlowTheme.of(context).titleMedium.override(
                              font: GoogleFonts.interTight(
                                fontWeight: FontWeight.bold,
                                fontStyle: FlutterFlowTheme.of(context)
                                    .titleMedium
                                    .fontStyle,
                              ),
                              fontSize: 18.0,
                              letterSpacing: 0.0,
                              fontWeight: FontWeight.bold,
                              fontStyle: FlutterFlowTheme.of(context)
                                  .titleMedium
                                  .fontStyle,
                            ),
                    unselectedLabelStyle:
                        FlutterFlowTheme.of(context).titleMedium.override(
                              font: GoogleFonts.interTight(
                                fontWeight: FlutterFlowTheme.of(context)
                                    .titleMedium
                                    .fontWeight,
                                fontStyle: FlutterFlowTheme.of(context)
                                    .titleMedium
                                    .fontStyle,
                              ),
                              fontSize: 18.0,
                              letterSpacing: 0.0,
                              fontWeight: FlutterFlowTheme.of(context)
                                  .titleMedium
                                  .fontWeight,
                              fontStyle: FlutterFlowTheme.of(context)
                                  .titleMedium
                                  .fontStyle,
                            ),
                    indicatorColor: FlutterFlowTheme.of(context).primary,
                    tabs: [
                      Tab(
                        text: FFLocalizations.of(context).getText(
                          'jplkl1oa' /* Published */,
                        ),
                      ),
                      Tab(
                        text: FFLocalizations.of(context).getText(
                          '4cquzzpq' /* Draft */,
                        ),
                      ),
                      Tab(
                        text: FFLocalizations.of(context).getText(
                          'n4zbuc2k' /* Scheduled */,
                        ),
                      ),
                      Tab(
                        text: FFLocalizations.of(context).getText(
                          '1kux8u4o' /* Trash */,
                        ),
                      ),
                      Tab(
                        text: FFLocalizations.of(context).getText(
                          'wf1y5bur' /* Pending */,
                        ),
                      ),
                    ],
                    controller: _model.tabBarController,
                    onTap: (i) async {
                      [
                        () async {},
                        () async {},
                        () async {},
                        () async {},
                        () async {}
                      ][i]();
                    },
                  ),
                ),
                Expanded(
                  child: TabBarView(
                    controller: _model.tabBarController,
                    children: [
                      Column(
                        mainAxisSize: MainAxisSize.max,
                        children: [
                          Expanded(
                            child: Padding(
                              padding: EdgeInsetsDirectional.fromSTEB(
                                  6.0, 0.0, 6.0, 0.0),
                              child: RefreshIndicator(
                                onRefresh: () async {
                                  safeSetState(() => _model
                                      .listViewPagingController1
                                      ?.refresh());
                                  await _model.waitForOnePageForListView1();
                                },
                                child: PagedListView<ApiPagingParams,
                                    dynamic>.separated(
                                  pagingController:
                                      _model.setListViewController1(
                                    (nextPageMarker) =>
                                        GetAllAdminRelatedBlogsCall.call(
                                      token: FFAppState().jwtToken,
                                      page: valueOrDefault<int>(
                                        nextPageMarker.nextPageNumber + 1,
                                        1,
                                      ),
                                      limit: 10,
                                    ),
                                  ),
                                  padding: EdgeInsets.fromLTRB(
                                    0,
                                    10.0,
                                    0,
                                    10.0,
                                  ),
                                  reverse: false,
                                  scrollDirection: Axis.vertical,
                                  separatorBuilder: (_, __) =>
                                      SizedBox(height: 5.0),
                                  builderDelegate:
                                      PagedChildBuilderDelegate<dynamic>(
                                    // Customize what your widget looks like when it's loading the first page.
                                    firstPageProgressIndicatorBuilder: (_) =>
                                        Center(
                                      child: SizedBox(
                                        width: 40.0,
                                        height: 40.0,
                                        child: CircularProgressIndicator(
                                          valueColor:
                                              AlwaysStoppedAnimation<Color>(
                                            FlutterFlowTheme.of(context)
                                                .primary,
                                          ),
                                        ),
                                      ),
                                    ),
                                    // Customize what your widget looks like when it's loading another page.
                                    newPageProgressIndicatorBuilder: (_) =>
                                        Center(
                                      child: SizedBox(
                                        width: 40.0,
                                        height: 40.0,
                                        child: CircularProgressIndicator(
                                          valueColor:
                                              AlwaysStoppedAnimation<Color>(
                                            FlutterFlowTheme.of(context)
                                                .primary,
                                          ),
                                        ),
                                      ),
                                    ),

                                    itemBuilder: (context, _, blogsIndex) {
                                      final blogsItem = _model
                                          .listViewPagingController1!
                                          .itemList![blogsIndex];
                                      return wrapWithModel(
                                        model:
                                            _model.postListTileModels1.getModel(
                                          blogsIndex.toString(),
                                          blogsIndex,
                                        ),
                                        updateCallback: () =>
                                            safeSetState(() {}),
                                        child: PostListTileWidget(
                                          key: Key(
                                            'Keytkr_${blogsIndex.toString()}',
                                          ),
                                          title: getJsonField(
                                            blogsItem,
                                            r'''$.title''',
                                          ).toString(),
                                          description: getJsonField(
                                            blogsItem,
                                            r'''$.slug''',
                                          ).toString(),
                                          date: getJsonField(
                                            blogsItem,
                                            r'''$.publishDate''',
                                          ).toString(),
                                        ),
                                      );
                                    },
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                      Column(
                        mainAxisSize: MainAxisSize.max,
                        children: [
                          Expanded(
                            child: Padding(
                              padding: EdgeInsetsDirectional.fromSTEB(
                                  6.0, 0.0, 6.0, 0.0),
                              child: ListView(
                                padding: EdgeInsets.fromLTRB(
                                  0,
                                  10.0,
                                  0,
                                  10.0,
                                ),
                                shrinkWrap: true,
                                scrollDirection: Axis.vertical,
                                children: [
                                  wrapWithModel(
                                    model: _model.postListTileModel2,
                                    updateCallback: () => safeSetState(() {}),
                                    child: PostListTileWidget(),
                                  ),
                                  wrapWithModel(
                                    model: _model.postListTileModel3,
                                    updateCallback: () => safeSetState(() {}),
                                    child: PostListTileWidget(),
                                  ),
                                  wrapWithModel(
                                    model: _model.postListTileModel4,
                                    updateCallback: () => safeSetState(() {}),
                                    child: PostListTileWidget(),
                                  ),
                                  wrapWithModel(
                                    model: _model.postListTileModel5,
                                    updateCallback: () => safeSetState(() {}),
                                    child: PostListTileWidget(),
                                  ),
                                  wrapWithModel(
                                    model: _model.postListTileModel6,
                                    updateCallback: () => safeSetState(() {}),
                                    child: PostListTileWidget(),
                                  ),
                                  wrapWithModel(
                                    model: _model.postListTileModel7,
                                    updateCallback: () => safeSetState(() {}),
                                    child: PostListTileWidget(),
                                  ),
                                  wrapWithModel(
                                    model: _model.postListTileModel8,
                                    updateCallback: () => safeSetState(() {}),
                                    child: PostListTileWidget(),
                                  ),
                                  wrapWithModel(
                                    model: _model.postListTileModel9,
                                    updateCallback: () => safeSetState(() {}),
                                    child: PostListTileWidget(),
                                  ),
                                  wrapWithModel(
                                    model: _model.postListTileModel10,
                                    updateCallback: () => safeSetState(() {}),
                                    child: PostListTileWidget(),
                                  ),
                                  wrapWithModel(
                                    model: _model.postListTileModel11,
                                    updateCallback: () => safeSetState(() {}),
                                    child: PostListTileWidget(),
                                  ),
                                ].divide(SizedBox(height: 5.0)),
                              ),
                            ),
                          ),
                        ],
                      ),
                      Column(
                        mainAxisSize: MainAxisSize.max,
                        children: [
                          Expanded(
                            child: Padding(
                              padding: EdgeInsetsDirectional.fromSTEB(
                                  6.0, 0.0, 6.0, 0.0),
                              child: ListView(
                                padding: EdgeInsets.fromLTRB(
                                  0,
                                  10.0,
                                  0,
                                  10.0,
                                ),
                                shrinkWrap: true,
                                scrollDirection: Axis.vertical,
                                children: [
                                  wrapWithModel(
                                    model: _model.postListTileModel12,
                                    updateCallback: () => safeSetState(() {}),
                                    child: PostListTileWidget(),
                                  ),
                                  wrapWithModel(
                                    model: _model.postListTileModel13,
                                    updateCallback: () => safeSetState(() {}),
                                    child: PostListTileWidget(),
                                  ),
                                  wrapWithModel(
                                    model: _model.postListTileModel14,
                                    updateCallback: () => safeSetState(() {}),
                                    child: PostListTileWidget(),
                                  ),
                                  wrapWithModel(
                                    model: _model.postListTileModel15,
                                    updateCallback: () => safeSetState(() {}),
                                    child: PostListTileWidget(),
                                  ),
                                  wrapWithModel(
                                    model: _model.postListTileModel16,
                                    updateCallback: () => safeSetState(() {}),
                                    child: PostListTileWidget(),
                                  ),
                                  wrapWithModel(
                                    model: _model.postListTileModel17,
                                    updateCallback: () => safeSetState(() {}),
                                    child: PostListTileWidget(),
                                  ),
                                  wrapWithModel(
                                    model: _model.postListTileModel18,
                                    updateCallback: () => safeSetState(() {}),
                                    child: PostListTileWidget(),
                                  ),
                                  wrapWithModel(
                                    model: _model.postListTileModel19,
                                    updateCallback: () => safeSetState(() {}),
                                    child: PostListTileWidget(),
                                  ),
                                  wrapWithModel(
                                    model: _model.postListTileModel20,
                                    updateCallback: () => safeSetState(() {}),
                                    child: PostListTileWidget(),
                                  ),
                                  wrapWithModel(
                                    model: _model.postListTileModel21,
                                    updateCallback: () => safeSetState(() {}),
                                    child: PostListTileWidget(),
                                  ),
                                ].divide(SizedBox(height: 5.0)),
                              ),
                            ),
                          ),
                        ],
                      ),
                      Column(
                        mainAxisSize: MainAxisSize.max,
                        children: [
                          Expanded(
                            child: Padding(
                              padding: EdgeInsetsDirectional.fromSTEB(
                                  6.0, 0.0, 6.0, 0.0),
                              child: ListView(
                                padding: EdgeInsets.fromLTRB(
                                  0,
                                  10.0,
                                  0,
                                  10.0,
                                ),
                                shrinkWrap: true,
                                scrollDirection: Axis.vertical,
                                children: [
                                  wrapWithModel(
                                    model: _model.postListTileModel22,
                                    updateCallback: () => safeSetState(() {}),
                                    child: PostListTileWidget(),
                                  ),
                                  wrapWithModel(
                                    model: _model.postListTileModel23,
                                    updateCallback: () => safeSetState(() {}),
                                    child: PostListTileWidget(),
                                  ),
                                  wrapWithModel(
                                    model: _model.postListTileModel24,
                                    updateCallback: () => safeSetState(() {}),
                                    child: PostListTileWidget(),
                                  ),
                                  wrapWithModel(
                                    model: _model.postListTileModel25,
                                    updateCallback: () => safeSetState(() {}),
                                    child: PostListTileWidget(),
                                  ),
                                  wrapWithModel(
                                    model: _model.postListTileModel26,
                                    updateCallback: () => safeSetState(() {}),
                                    child: PostListTileWidget(),
                                  ),
                                  wrapWithModel(
                                    model: _model.postListTileModel27,
                                    updateCallback: () => safeSetState(() {}),
                                    child: PostListTileWidget(),
                                  ),
                                  wrapWithModel(
                                    model: _model.postListTileModel28,
                                    updateCallback: () => safeSetState(() {}),
                                    child: PostListTileWidget(),
                                  ),
                                  wrapWithModel(
                                    model: _model.postListTileModel29,
                                    updateCallback: () => safeSetState(() {}),
                                    child: PostListTileWidget(),
                                  ),
                                  wrapWithModel(
                                    model: _model.postListTileModel30,
                                    updateCallback: () => safeSetState(() {}),
                                    child: PostListTileWidget(),
                                  ),
                                  wrapWithModel(
                                    model: _model.postListTileModel31,
                                    updateCallback: () => safeSetState(() {}),
                                    child: PostListTileWidget(),
                                  ),
                                ].divide(SizedBox(height: 5.0)),
                              ),
                            ),
                          ),
                        ],
                      ),
                      Column(
                        mainAxisSize: MainAxisSize.max,
                        children: [],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
