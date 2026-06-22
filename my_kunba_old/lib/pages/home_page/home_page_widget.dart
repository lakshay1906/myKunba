import 'package:my_kunba/components/menu_side_bar_widget.dart';
import 'package:my_kunba/utils/api_function.dart';
import 'package:my_kunba/utils/provider/user.dart';
import 'package:provider/provider.dart';

import '/components/post_list_tile_widget.dart';
import '/flutter_flow/flutter_flow_icon_button.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/index.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
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
  final af = ApiFunction();
  final scaffoldKey = GlobalKey<ScaffoldState>();
  bool loading = true;
  List<Map<String, dynamic>> allBlogs = [];

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => HomePageModel());
    fetchBlog();
    _model.tabBarController = TabController(
      vsync: this,
      length: 5,
      initialIndex: 0,
    )..addListener(() => safeSetState(() {}));
  }

  Future<void> fetchBlog() async {
    final response = await af.fetchBlogs(context);
    if (response == null) {
      print('response is null');
      // ScaffoldMessenger.of(context).hideCurrentSnackBar();
      // ScaffoldMessenger.of(context).showSnackBar(
      //   SnackBar(content: Text("You're not authorized to perform this action")),
      // );
      safeSetState(() {
        loading = false;
      });
      return null;
    }
    if (response.statusCode == 200) {
      print(jsonDecode(response.body));
      safeSetState(() {
        loading = false;
      });
    }
  }

  @override
  void dispose() {
    _model.dispose();

    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    User user = Provider.of<User>(context, listen: false);
    return GestureDetector(
      onTap: () {
        FocusScope.of(context).unfocus();
        FocusManager.instance.primaryFocus?.unfocus();
      },
      child: Scaffold(
        key: scaffoldKey,
        drawer: MenuSideBarWidget(),
        backgroundColor: FlutterFlowTheme.of(context).primaryBackground,
        floatingActionButton: user.role == 'author'
            ? Padding(
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
              )
            : SizedBox(),
        appBar: AppBar(
          backgroundColor: FlutterFlowTheme.of(context).secondaryBackground,
          automaticallyImplyLeading: false,
          leading: Builder(
            builder: (context) => FlutterFlowIconButton(
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
                Scaffold.of(context).openDrawer();
              },
            ),
          ),
          title: Row(
            mainAxisSize: MainAxisSize.max,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Posts',
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
                        text: 'Published',
                      ),
                      Tab(
                        text: 'Draft',
                      ),
                      Tab(
                        text: 'Scheduled',
                      ),
                      Tab(
                        text: 'Trash',
                      ),
                      Tab(
                        text: 'Pending',
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
                                    model: _model.postListTileModel1,
                                    updateCallback: () => safeSetState(() {}),
                                    child: PostListTileWidget(),
                                  ),
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
                                    model: _model.postListTileModel11,
                                    updateCallback: () => safeSetState(() {}),
                                    child: PostListTileWidget(),
                                  ),
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
                                    model: _model.postListTileModel21,
                                    updateCallback: () => safeSetState(() {}),
                                    child: PostListTileWidget(),
                                  ),
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
                                    model: _model.postListTileModel31,
                                    updateCallback: () => safeSetState(() {}),
                                    child: PostListTileWidget(),
                                  ),
                                  wrapWithModel(
                                    model: _model.postListTileModel32,
                                    updateCallback: () => safeSetState(() {}),
                                    child: PostListTileWidget(),
                                  ),
                                  wrapWithModel(
                                    model: _model.postListTileModel33,
                                    updateCallback: () => safeSetState(() {}),
                                    child: PostListTileWidget(),
                                  ),
                                  wrapWithModel(
                                    model: _model.postListTileModel34,
                                    updateCallback: () => safeSetState(() {}),
                                    child: PostListTileWidget(),
                                  ),
                                  wrapWithModel(
                                    model: _model.postListTileModel35,
                                    updateCallback: () => safeSetState(() {}),
                                    child: PostListTileWidget(),
                                  ),
                                  wrapWithModel(
                                    model: _model.postListTileModel36,
                                    updateCallback: () => safeSetState(() {}),
                                    child: PostListTileWidget(),
                                  ),
                                  wrapWithModel(
                                    model: _model.postListTileModel37,
                                    updateCallback: () => safeSetState(() {}),
                                    child: PostListTileWidget(),
                                  ),
                                  wrapWithModel(
                                    model: _model.postListTileModel38,
                                    updateCallback: () => safeSetState(() {}),
                                    child: PostListTileWidget(),
                                  ),
                                  wrapWithModel(
                                    model: _model.postListTileModel39,
                                    updateCallback: () => safeSetState(() {}),
                                    child: PostListTileWidget(),
                                  ),
                                  wrapWithModel(
                                    model: _model.postListTileModel40,
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
