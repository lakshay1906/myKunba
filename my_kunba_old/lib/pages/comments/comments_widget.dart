import 'package:my_kunba/components/menu_side_bar_widget.dart';

import '/components/comments_tile_widget.dart';
import '/flutter_flow/flutter_flow_icon_button.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'comments_model.dart';
export 'comments_model.dart';

class CommentsWidget extends StatefulWidget {
  const CommentsWidget({super.key});

  static String routeName = 'Comments';
  static String routePath = '/comments';

  @override
  State<CommentsWidget> createState() => _CommentsWidgetState();
}

class _CommentsWidgetState extends State<CommentsWidget>
    with TickerProviderStateMixin {
  late CommentsModel _model;

  final scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => CommentsModel());

    _model.tabBarController = TabController(
      vsync: this,
      length: 6,
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
    return GestureDetector(
      onTap: () {
        FocusScope.of(context).unfocus();
        FocusManager.instance.primaryFocus?.unfocus();
      },
      child: Scaffold(
        key: scaffoldKey,
        drawer: MenuSideBarWidget(),
        backgroundColor: FlutterFlowTheme.of(context).primaryBackground,
        appBar: AppBar(
          backgroundColor: FlutterFlowTheme.of(context).secondaryBackground,
          automaticallyImplyLeading: false,
          leading: Builder(builder: (context) {
            return FlutterFlowIconButton(
              borderColor: Color(0x000A0A0A),
              borderRadius: 30.0,
              borderWidth: 1.0,
              buttonSize: 50.0,
              icon: Icon(
                Icons.dehaze_outlined,
                color: FlutterFlowTheme.of(context).primaryText,
                size: 25.0,
              ),
              onPressed: () {
                Scaffold.of(context).openDrawer();
              },
            );
          }),
          title: Row(
            mainAxisSize: MainAxisSize.max,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Comments',
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
          child: Stack(
            children: [
              Align(
                alignment: AlignmentDirectional(0.0, -1.0),
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
                                    fontWeight: FlutterFlowTheme.of(context)
                                        .titleMedium
                                        .fontWeight,
                                    fontStyle: FlutterFlowTheme.of(context)
                                        .titleMedium
                                        .fontStyle,
                                  ),
                                  letterSpacing: 0.0,
                                  fontWeight: FlutterFlowTheme.of(context)
                                      .titleMedium
                                      .fontWeight,
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
                                  letterSpacing: 0.0,
                                  fontWeight: FlutterFlowTheme.of(context)
                                      .titleMedium
                                      .fontWeight,
                                  fontStyle: FlutterFlowTheme.of(context)
                                      .titleMedium
                                      .fontStyle,
                                ),
                        indicatorColor: FlutterFlowTheme.of(context).primary,
                        indicatorWeight: 2.0,
                        tabs: [
                          Tab(
                            text: 'All',
                          ),
                          Tab(
                            text: 'Pending',
                          ),
                          Tab(
                            text: 'Unreplied',
                          ),
                          Tab(
                            text: 'Approved',
                          ),
                          Tab(
                            text: 'Spam',
                          ),
                          Tab(
                            text: 'Trashed',
                          ),
                        ],
                        controller: _model.tabBarController,
                        onTap: (i) async {
                          [
                            () async {},
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
                          Padding(
                            padding: EdgeInsetsDirectional.fromSTEB(
                                10.0, 0.0, 10.0, 0.0),
                            child: Column(
                              mainAxisSize: MainAxisSize.max,
                              children: [
                                Expanded(
                                  child: ListView(
                                    padding: EdgeInsets.fromLTRB(
                                      0,
                                      12.0,
                                      0,
                                      12.0,
                                    ),
                                    shrinkWrap: true,
                                    scrollDirection: Axis.vertical,
                                    children: [
                                      wrapWithModel(
                                        model: _model.commentsTileModel1,
                                        updateCallback: () =>
                                            safeSetState(() {}),
                                        child: CommentsTileWidget(),
                                      ),
                                      wrapWithModel(
                                        model: _model.commentsTileModel2,
                                        updateCallback: () =>
                                            safeSetState(() {}),
                                        child: CommentsTileWidget(),
                                      ),
                                      wrapWithModel(
                                        model: _model.commentsTileModel3,
                                        updateCallback: () =>
                                            safeSetState(() {}),
                                        child: CommentsTileWidget(),
                                      ),
                                      wrapWithModel(
                                        model: _model.commentsTileModel4,
                                        updateCallback: () =>
                                            safeSetState(() {}),
                                        child: CommentsTileWidget(),
                                      ),
                                      wrapWithModel(
                                        model: _model.commentsTileModel5,
                                        updateCallback: () =>
                                            safeSetState(() {}),
                                        child: CommentsTileWidget(),
                                      ),
                                      wrapWithModel(
                                        model: _model.commentsTileModel6,
                                        updateCallback: () =>
                                            safeSetState(() {}),
                                        child: CommentsTileWidget(),
                                      ),
                                      wrapWithModel(
                                        model: _model.commentsTileModel7,
                                        updateCallback: () =>
                                            safeSetState(() {}),
                                        child: CommentsTileWidget(),
                                      ),
                                      wrapWithModel(
                                        model: _model.commentsTileModel8,
                                        updateCallback: () =>
                                            safeSetState(() {}),
                                        child: CommentsTileWidget(),
                                      ),
                                    ].divide(SizedBox(height: 8.0)),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Padding(
                            padding: EdgeInsetsDirectional.fromSTEB(
                                10.0, 0.0, 10.0, 0.0),
                            child: Column(
                              mainAxisSize: MainAxisSize.max,
                              children: [
                                Expanded(
                                  child: ListView(
                                    padding: EdgeInsets.fromLTRB(
                                      0,
                                      12.0,
                                      0,
                                      12.0,
                                    ),
                                    shrinkWrap: true,
                                    scrollDirection: Axis.vertical,
                                    children: [
                                      wrapWithModel(
                                        model: _model.commentsTileModel9,
                                        updateCallback: () =>
                                            safeSetState(() {}),
                                        child: CommentsTileWidget(),
                                      ),
                                      wrapWithModel(
                                        model: _model.commentsTileModel10,
                                        updateCallback: () =>
                                            safeSetState(() {}),
                                        child: CommentsTileWidget(),
                                      ),
                                      wrapWithModel(
                                        model: _model.commentsTileModel11,
                                        updateCallback: () =>
                                            safeSetState(() {}),
                                        child: CommentsTileWidget(),
                                      ),
                                      wrapWithModel(
                                        model: _model.commentsTileModel12,
                                        updateCallback: () =>
                                            safeSetState(() {}),
                                        child: CommentsTileWidget(),
                                      ),
                                      wrapWithModel(
                                        model: _model.commentsTileModel13,
                                        updateCallback: () =>
                                            safeSetState(() {}),
                                        child: CommentsTileWidget(),
                                      ),
                                      wrapWithModel(
                                        model: _model.commentsTileModel14,
                                        updateCallback: () =>
                                            safeSetState(() {}),
                                        child: CommentsTileWidget(),
                                      ),
                                      wrapWithModel(
                                        model: _model.commentsTileModel15,
                                        updateCallback: () =>
                                            safeSetState(() {}),
                                        child: CommentsTileWidget(),
                                      ),
                                      wrapWithModel(
                                        model: _model.commentsTileModel16,
                                        updateCallback: () =>
                                            safeSetState(() {}),
                                        child: CommentsTileWidget(),
                                      ),
                                    ].divide(SizedBox(height: 8.0)),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Column(
                            mainAxisSize: MainAxisSize.max,
                            children: [],
                          ),
                          Padding(
                            padding: EdgeInsetsDirectional.fromSTEB(
                                10.0, 0.0, 10.0, 0.0),
                            child: Column(
                              mainAxisSize: MainAxisSize.max,
                              children: [
                                Expanded(
                                  child: ListView(
                                    padding: EdgeInsets.fromLTRB(
                                      0,
                                      12.0,
                                      0,
                                      12.0,
                                    ),
                                    shrinkWrap: true,
                                    scrollDirection: Axis.vertical,
                                    children: [
                                      wrapWithModel(
                                        model: _model.commentsTileModel17,
                                        updateCallback: () =>
                                            safeSetState(() {}),
                                        child: CommentsTileWidget(),
                                      ),
                                      wrapWithModel(
                                        model: _model.commentsTileModel18,
                                        updateCallback: () =>
                                            safeSetState(() {}),
                                        child: CommentsTileWidget(),
                                      ),
                                      wrapWithModel(
                                        model: _model.commentsTileModel19,
                                        updateCallback: () =>
                                            safeSetState(() {}),
                                        child: CommentsTileWidget(),
                                      ),
                                      wrapWithModel(
                                        model: _model.commentsTileModel20,
                                        updateCallback: () =>
                                            safeSetState(() {}),
                                        child: CommentsTileWidget(),
                                      ),
                                      wrapWithModel(
                                        model: _model.commentsTileModel21,
                                        updateCallback: () =>
                                            safeSetState(() {}),
                                        child: CommentsTileWidget(),
                                      ),
                                      wrapWithModel(
                                        model: _model.commentsTileModel22,
                                        updateCallback: () =>
                                            safeSetState(() {}),
                                        child: CommentsTileWidget(),
                                      ),
                                      wrapWithModel(
                                        model: _model.commentsTileModel23,
                                        updateCallback: () =>
                                            safeSetState(() {}),
                                        child: CommentsTileWidget(),
                                      ),
                                      wrapWithModel(
                                        model: _model.commentsTileModel24,
                                        updateCallback: () =>
                                            safeSetState(() {}),
                                        child: CommentsTileWidget(),
                                      ),
                                    ].divide(SizedBox(height: 8.0)),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Column(
                            mainAxisSize: MainAxisSize.max,
                            children: [],
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
            ],
          ),
        ),
      ),
    );
  }
}
