import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

const _kLocaleStorageKey = '__locale_key__';

class FFLocalizations {
  FFLocalizations(this.locale);

  final Locale locale;

  static FFLocalizations of(BuildContext context) =>
      Localizations.of<FFLocalizations>(context, FFLocalizations)!;

  static List<String> languages() => ['en', 'hi'];

  static late SharedPreferences _prefs;
  static Future initialize() async =>
      _prefs = await SharedPreferences.getInstance();
  static Future storeLocale(String locale) =>
      _prefs.setString(_kLocaleStorageKey, locale);
  static Locale? getStoredLocale() {
    final locale = _prefs.getString(_kLocaleStorageKey);
    return locale != null && locale.isNotEmpty ? createLocale(locale) : null;
  }

  String get languageCode => locale.toString();
  String? get languageShortCode =>
      _languagesWithShortCode.contains(locale.toString())
          ? '${locale.toString()}_short'
          : null;
  int get languageIndex => languages().contains(languageCode)
      ? languages().indexOf(languageCode)
      : 0;

  String getText(String key) =>
      (kTranslationsMap[key] ?? {})[locale.toString()] ?? '';

  String getVariableText({
    String? enText = '',
    String? hiText = '',
  }) =>
      [enText, hiText][languageIndex] ?? '';

  static const Set<String> _languagesWithShortCode = {
    'ar',
    'az',
    'ca',
    'cs',
    'da',
    'de',
    'dv',
    'en',
    'es',
    'et',
    'fi',
    'fr',
    'gr',
    'he',
    'hi',
    'hu',
    'it',
    'km',
    'ku',
    'mn',
    'ms',
    'no',
    'pt',
    'ro',
    'ru',
    'rw',
    'sv',
    'th',
    'uk',
    'vi',
  };
}

/// Used if the locale is not supported by GlobalMaterialLocalizations.
class FallbackMaterialLocalizationDelegate
    extends LocalizationsDelegate<MaterialLocalizations> {
  const FallbackMaterialLocalizationDelegate();

  @override
  bool isSupported(Locale locale) => _isSupportedLocale(locale);

  @override
  Future<MaterialLocalizations> load(Locale locale) async =>
      SynchronousFuture<MaterialLocalizations>(
        const DefaultMaterialLocalizations(),
      );

  @override
  bool shouldReload(FallbackMaterialLocalizationDelegate old) => false;
}

/// Used if the locale is not supported by GlobalCupertinoLocalizations.
class FallbackCupertinoLocalizationDelegate
    extends LocalizationsDelegate<CupertinoLocalizations> {
  const FallbackCupertinoLocalizationDelegate();

  @override
  bool isSupported(Locale locale) => _isSupportedLocale(locale);

  @override
  Future<CupertinoLocalizations> load(Locale locale) =>
      SynchronousFuture<CupertinoLocalizations>(
        const DefaultCupertinoLocalizations(),
      );

  @override
  bool shouldReload(FallbackCupertinoLocalizationDelegate old) => false;
}

class FFLocalizationsDelegate extends LocalizationsDelegate<FFLocalizations> {
  const FFLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) => _isSupportedLocale(locale);

  @override
  Future<FFLocalizations> load(Locale locale) =>
      SynchronousFuture<FFLocalizations>(FFLocalizations(locale));

  @override
  bool shouldReload(FFLocalizationsDelegate old) => false;
}

Locale createLocale(String language) => language.contains('_')
    ? Locale.fromSubtags(
        languageCode: language.split('_').first,
        scriptCode: language.split('_').last,
      )
    : Locale(language);

bool _isSupportedLocale(Locale locale) {
  final language = locale.toString();
  return FFLocalizations.languages().contains(
    language.endsWith('_')
        ? language.substring(0, language.length - 1)
        : language,
  );
}

final kTranslationsMap = <Map<String, Map<String, String>>>[
  // WelcomePage
  {
    '0eekuytv': {
      'en': 'Log In with Google',
      'hi': '',
    },
    'krx1y413': {
      'en': 'Log In with Google',
      'hi': '',
    },
    '0v89s1hh': {
      'en': 'OR',
      'hi': '',
    },
    '32nzxau3': {
      'en': 'Email address',
      'hi': '',
    },
    'wwgqiu8r': {
      'en': 'Password',
      'hi': '',
    },
    'vgybaeun': {
      'en': 'Submit',
      'hi': '',
    },
    '1xaedrvh': {
      'en': 'Forgot Password',
      'hi': '',
    },
    'ug1qw0g2': {
      'en': 'Don\'t have an account? ',
      'hi': '',
    },
    'lslbn01j': {
      'en': 'Sign Up',
      'hi': '',
    },
    'tvcum3cg': {
      'en': 'Home',
      'hi': '',
    },
  },
  // Details14Destination
  {
    '077l4fnx': {
      'en': 'Firenze - Giardino Bardini',
      'hi': '',
    },
    '2tc4or4p': {
      'en': '4 Night Stay',
      'hi': '',
    },
    'gstzw5s3': {
      'en': '4.7',
      'hi': '',
    },
    'guymz1qk': {
      'en': '\$220 USD',
      'hi': '',
    },
    '8mkr1o0u': {
      'en': 'Description',
      'hi': '',
    },
    'ilz1bfww': {
      'en':
          'Non so se la bellezza salverà il mondo ma sicuramente aiuta. Sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
      'hi': '',
    },
    'gza8mew7': {
      'en': 'Home',
      'hi': '',
    },
  },
  // HomePage
  {
    '2mlymmog': {
      'en': 'Posts',
      'hi': '',
    },
    'jplkl1oa': {
      'en': 'Published',
      'hi': '',
    },
    '4cquzzpq': {
      'en': 'Draft',
      'hi': '',
    },
    'n4zbuc2k': {
      'en': 'Scheduled',
      'hi': '',
    },
    '1kux8u4o': {
      'en': 'Trash',
      'hi': '',
    },
    'wf1y5bur': {
      'en': 'Pending',
      'hi': '',
    },
    'fmy8nhen': {
      'en': 'Home',
      'hi': '',
    },
  },
  // CreateBlog
  {
    'wih6bzva': {
      'en': 'Title',
      'hi': '',
    },
    '4g506mtd': {
      'en': 'Enter blog title',
      'hi': '',
    },
    'hjeti8i1': {
      'en': 'Slug',
      'hi': '',
    },
    'oauu0fl3': {
      'en': 'Enter blog slug',
      'hi': '',
    },
    '2l4x9cy0': {
      'en': 'Excerpt',
      'hi': '',
    },
    '81xerllj': {
      'en': 'Enter blog slug',
      'hi': '',
    },
    'rb6royb8': {
      'en': 'Feature Image',
      'hi': '',
    },
    'of7fndn0': {
      'en': 'TextField',
      'hi': '',
    },
    'y6f4c38z': {
      'en': 'OR',
      'hi': '',
    },
    'llvnef4n': {
      'en': 'Proceed',
      'hi': '',
    },
    '852v8tii': {
      'en': 'Create Blog',
      'hi': '',
    },
    's9c5fd87': {
      'en': 'Home',
      'hi': '',
    },
  },
  // CreateBlogContent
  {
    'ko8w7gga': {
      'en': 'Content',
      'hi': '',
    },
    'xu0tgr07': {
      'en': 'Proceed',
      'hi': '',
    },
    '5ysttiba': {
      'en': 'Home',
      'hi': '',
    },
  },
  // CreateBlogSettings
  {
    'xbfm8tdz': {
      'en': 'Status',
      'hi': '',
    },
    'fto5vuzu': {
      'en': 'Draft',
      'hi': '',
    },
    '8qxf93gf': {
      'en': 'Select...',
      'hi': '',
    },
    'jrxk8blw': {
      'en': 'Search...',
      'hi': '',
    },
    '8r2yl3yw': {
      'en': 'Draft',
      'hi': '',
    },
    'jd7u3dd1': {
      'en': 'Published',
      'hi': '',
    },
    'd180j8o8': {
      'en': 'Publish Date',
      'hi': '',
    },
    '5pkwd706': {
      'en': 'Pick a date',
      'hi': '',
    },
    'egc1uxp8': {
      'en': 'When the post should be published.',
      'hi': '',
    },
    'qda3ku5l': {
      'en': 'Template',
      'hi': '',
    },
    '6fugy949': {
      'en': 'Standard',
      'hi': '',
    },
    'fjxo3uqd': {
      'en': 'Select...',
      'hi': '',
    },
    '1ad9umjx': {
      'en': 'Search...',
      'hi': '',
    },
    '072zfh5j': {
      'en': 'Standard',
      'hi': '',
    },
    'euogl29t': {
      'en': 'Full Width',
      'hi': '',
    },
    'k9aessmi': {
      'en': 'The layout template for this post.',
      'hi': '',
    },
    'l9r4qiwg': {
      'en': 'Category',
      'hi': '',
    },
    'c62sqii0': {
      'en': 'Draft',
      'hi': '',
    },
    '6gryenj3': {
      'en': 'None',
      'hi': '',
    },
    'loiqwq3x': {
      'en': 'Search...',
      'hi': '',
    },
    'wflgfqd6': {
      'en': 'Category 01',
      'hi': '',
    },
    '0o2191f7': {
      'en': 'Category 02',
      'hi': '',
    },
    'sm2f95tw': {
      'en': 'Category 03',
      'hi': '',
    },
    '4cdj09jq': {
      'en': 'Meta Title',
      'hi': '',
    },
    'hf5e4h04': {
      'en': 'SEO title (optional)',
      'hi': '',
    },
    'ryfmbhwk': {
      'en':
          'Title used for SEO purposes. Defaults to post title if left empty.',
      'hi': '',
    },
    'fd1bxufm': {
      'en': 'Meta Description',
      'hi': '',
    },
    'bq7cx29s': {
      'en': 'SEO description (optional)',
      'hi': '',
    },
    'pveqpu1n': {
      'en':
          'Description used for SEO purposes. Defaults to excerpt of left empty.',
      'hi': '',
    },
    'qh4j7yi2': {
      'en': 'Proceed',
      'hi': '',
    },
    'yx7tmp4b': {
      'en': 'Setting',
      'hi': '',
    },
    'kve17val': {
      'en': 'Home',
      'hi': '',
    },
  },
  // Notification
  {
    '7ru41dt7': {
      'en': 'Check-in evaluated',
      'hi': '',
    },
    'vf437tgl': {
      'en': 'Mar 8, 2022',
      'hi': '',
    },
    '2zt673q0': {
      'en': 'Check-in evaluated',
      'hi': '',
    },
    '4mgd2ub0': {
      'en': 'Mar 8, 2022',
      'hi': '',
    },
    'kam40dek': {
      'en': 'Check-in evaluated',
      'hi': '',
    },
    '20qpc585': {
      'en': 'Mar 8, 2022',
      'hi': '',
    },
    'vuzogdw5': {
      'en': 'New Event added to your calendar',
      'hi': '',
    },
    'a0z0m91o': {
      'en': 'Mar 8, 2022',
      'hi': '',
    },
    'alkhg8y0': {
      'en': 'Profile Modified',
      'hi': '',
    },
    'ez51k41u': {
      'en': 'Mar 8, 2022',
      'hi': '',
    },
    'd5uyw80b': {
      'en': 'Notifications',
      'hi': '',
    },
    '7dnr9ug5': {
      'en': 'Home',
      'hi': '',
    },
  },
  // Comments
  {
    'uydo28z0': {
      'en': 'Comments',
      'hi': '',
    },
    'peuei47v': {
      'en': 'All',
      'hi': '',
    },
    '55wlsj8a': {
      'en': 'Pending',
      'hi': '',
    },
    'h95w05g7': {
      'en': 'Unreplied',
      'hi': '',
    },
    '2ri0iyh8': {
      'en': 'Approved',
      'hi': '',
    },
    '5jxxui8r': {
      'en': 'Spam',
      'hi': '',
    },
    'sfa9wsz3': {
      'en': 'Trashed',
      'hi': '',
    },
    'cszkqxhg': {
      'en': 'Home',
      'hi': '',
    },
  },
  // Media
  {
    'g3pwodxw': {
      'en': 'Media',
      'hi': '',
    },
    '2iabd76z': {
      'en': 'Home',
      'hi': '',
    },
  },
  // PreviewBlog
  {
    'f8jk1ql1': {
      'en': 'Zion Limited',
      'hi': '',
    },
    'nlfv6swz': {
      'en': '\$156.00',
      'hi': '',
    },
    'vz3q4wc4': {
      'en': 'Retailed by Nike',
      'hi': '',
    },
    'lnor6l0p': {
      'en': '4/5 Reviews',
      'hi': '',
    },
    'llp79rad': {
      'en': 'DESCRIPTION',
      'hi': '',
    },
    'kaozn98z': {
      'en':
          'With a down-to-earth persona and abilities that are out of this world, Zion is unlike anybody else. On court, the gentle spirit who\'s all about family transforms into an unmatched force of unstoppable athleticism and speed.',
      'hi': '',
    },
    'uh14xm11': {
      'en': 'SIZE',
      'hi': '',
    },
    'atgbzt5y': {
      'en': '4',
      'hi': '',
    },
    'v4h0tthh': {
      'en': '5',
      'hi': '',
    },
    'iwgtb6hd': {
      'en': '6',
      'hi': '',
    },
    'f484l52x': {
      'en': '7',
      'hi': '',
    },
    'ynjcet0j': {
      'en': '8',
      'hi': '',
    },
    'ap5of2bv': {
      'en': '9',
      'hi': '',
    },
    'hho9osqn': {
      'en': '10',
      'hi': '',
    },
    'd3yu162x': {
      'en': '11',
      'hi': '',
    },
    'lgel82rm': {
      'en': '12',
      'hi': '',
    },
    '96huk1bh': {
      'en': '13',
      'hi': '',
    },
    'fkwcyu5j': {
      'en': '14',
      'hi': '',
    },
    'iptyefzg': {
      'en': 'Create',
      'hi': '',
    },
    'zoktk70x': {
      'en': 'Home',
      'hi': '',
    },
  },
  // ReplyToComment
  {
    'e9vftgva': {
      'en': 'Comment',
      'hi': '',
    },
    'zwxv5epo': {
      'en': 'SuperPH26',
      'hi': '',
    },
    'matyct2j': {
      'en': 'on Mock Drills for war tim...',
      'hi': '',
    },
    'ug18kclm': {
      'en': '14 hr. ago',
      'hi': '',
    },
    '8l1qxme1': {
      'en': 'Pending',
      'hi': '',
    },
    'l6ngohac': {
      'en':
          'Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old.',
      'hi': '',
    },
    '5j1zojxz': {
      'en': 'Approve',
      'hi': '',
    },
    'cawz8n03': {
      'en': 'Spam',
      'hi': '',
    },
    'gchsyfse': {
      'en': 'More',
      'hi': '',
    },
    '6knnrdmg': {
      'en': 'Reply to comment....',
      'hi': '',
    },
    'u5e2whje': {
      'en': 'Home',
      'hi': '',
    },
  },
  // SignUp
  {
    '6wcgpd5l': {
      'en': 'Log In with Google',
      'hi': '',
    },
    'vbwk8518': {
      'en': 'Log In with Google',
      'hi': '',
    },
    'kmqungba': {
      'en': 'OR',
      'hi': '',
    },
    'h71xs85h': {
      'en': 'Email address',
      'hi': '',
    },
    'mgzp7kga': {
      'en': 'Password',
      'hi': '',
    },
    'twge6t6u': {
      'en': 'Confirm password',
      'hi': '',
    },
    '6szfh892': {
      'en': 'Submit',
      'hi': '',
    },
    'anjm2a6x': {
      'en': 'Already have account? ',
      'hi': '',
    },
    'djn5ihob': {
      'en': 'Log In',
      'hi': '',
    },
    'h5esci7n': {
      'en': 'Home',
      'hi': '',
    },
  },
  // Registration
  {
    'xvec0942': {
      'en': 'Complete Registration',
      'hi': '',
    },
    'd0to2aau': {
      'en': 'Display Name',
      'hi': '',
    },
    '9vxoeuoo': {
      'en': 'Enter your name',
      'hi': '',
    },
    'cpcxp58w': {
      'en': 'This is how your name will appear publicly.',
      'hi': '',
    },
    '6sls39mj': {
      'en': 'Username',
      'hi': '',
    },
    'zljf459s': {
      'en': 'Enter your username',
      'hi': '',
    },
    'd1vovyt4': {
      'en': 'This will be your unique identifier on the platform.',
      'hi': '',
    },
    'oe9wjhvo': {
      'en': 'username_01',
      'hi': '',
    },
    'evdbm3vd': {
      'en': 'username_02',
      'hi': '',
    },
    'yglccn2h': {
      'en': 'username_03',
      'hi': '',
    },
    '8i1i3t74': {
      'en': 'username_04',
      'hi': '',
    },
    'eqnaidnq': {
      'en': 'Email',
      'hi': '',
    },
    'sa0lh93x': {
      'en': 'Enter your email',
      'hi': '',
    },
    'hidouy0f': {
      'en': 'Bio',
      'hi': '',
    },
    'xr0f84g0': {
      'en': 'Tell about yourself....',
      'hi': '',
    },
    'cy0il09p': {
      'en': 'Social Links',
      'hi': '',
    },
    'o08xig05': {
      'en': 'Add',
      'hi': '',
    },
    'ajaicrdp': {
      'en': 'Platform',
      'hi': '',
    },
    '8j7aosro': {
      'en': 'LinkedIn',
      'hi': '',
    },
    't2ujow5h': {
      'en': 'URL',
      'hi': '',
    },
    'bqkes00w': {
      'en': 'www.linkedin.com/in/your~name',
      'hi': '',
    },
    '0tct8my8': {
      'en': 'Complete',
      'hi': '',
    },
    'o2t0iert': {
      'en': 'Home',
      'hi': '',
    },
  },
  // ProfilePage
  {
    'u8cebw6o': {
      'en': '24k',
      'hi': '',
    },
    'rluesukw': {
      'en': 'Followers',
      'hi': '',
    },
    'a7divxjk': {
      'en': '152',
      'hi': '',
    },
    '1tsvsop9': {
      'en': 'Following',
      'hi': '',
    },
    'uv6ekc81': {
      'en': 'David Jerome',
      'hi': '',
    },
    'nyfswhze': {
      'en': 'David.j@gmail.com',
      'hi': '',
    },
    'p02z4lmk': {
      'en':
          'I exist to design pixels, beyond that my life is void and meaningless... i\'m just kidding I live to make other peoples lives easier.',
      'hi': '',
    },
    't884es3l': {
      'en': 'My Stats',
      'hi': '',
    },
    '6tdr3zzi': {
      'en': '56.4k',
      'hi': '',
    },
    'z70jtgm0': {
      'en': 'Customers',
      'hi': '',
    },
    'gyzjaq9a': {
      'en': '56.4k',
      'hi': '',
    },
    'hvs2492w': {
      'en': 'Customers',
      'hi': '',
    },
    '9qydosee': {
      'en': '56.4k',
      'hi': '',
    },
    'tm8f9mas': {
      'en': 'Customers',
      'hi': '',
    },
    '4yw2qmf3': {
      'en': '56.4k',
      'hi': '',
    },
    'b9taj553': {
      'en': 'Customers',
      'hi': '',
    },
    '4m8kfg6r': {
      'en': 'Home',
      'hi': '',
    },
  },
  // MenuSideBar
  {
    'trbocotc': {
      'en': 'myKunba.org',
      'hi': '',
    },
    'ijliyrhk': {
      'en': 'Andrew D.',
      'hi': '',
    },
    'c5090gl1': {
      'en': 'admin@gmail.com',
      'hi': '',
    },
    '93fcppu1': {
      'en': 'Content',
      'hi': '',
    },
    's8231k0m': {
      'en': 'Posts',
      'hi': '',
    },
    'o0t3odeu': {
      'en': 'Pages',
      'hi': '',
    },
    'eoaap6sq': {
      'en': 'Media',
      'hi': '',
    },
    'kajo91zm': {
      'en': 'Comments',
      'hi': '',
    },
    'tyj0jyub': {
      'en': 'Settings',
      'hi': '',
    },
    'w1rigcm3': {
      'en': 'Notifications',
      'hi': '',
    },
    'qhtqzfnx': {
      'en': '12',
      'hi': '',
    },
    'oppnyers': {
      'en': 'Site Settings',
      'hi': '',
    },
    'kqo2zpbi': {
      'en': 'Explore',
      'hi': '',
    },
    'jiz3tmma': {
      'en': 'Light Mode',
      'hi': '',
    },
    'jsekv1bo': {
      'en': 'Dark Mode',
      'hi': '',
    },
  },
  // CommentsTile
  {
    '0hb6pk4f': {
      'en': 'SuperPH26 on Delhi-NCR Traffic Restrictions: No Entry...',
      'hi': '',
    },
    '0ek0tdly': {
      'en': 'SuperPH26 offers a top-tier slot experience with 1034 way...',
      'hi': '',
    },
  },
  // dropdownaccount
  {
    'fiix9ejv': {
      'en': 'Account Options',
      'hi': '',
    },
    'r40i2rfg': {
      'en': 'Randy Peterson',
      'hi': '',
    },
    'xox5na3t': {
      'en': 'randy.p@domainname.com',
      'hi': '',
    },
    'ihs7js9g': {
      'en': 'My Account',
      'hi': '',
    },
    'jbb7dp7d': {
      'en': 'Settings',
      'hi': '',
    },
    '01s9rv66': {
      'en': 'Billing Details',
      'hi': '',
    },
    'wy1cvg1h': {
      'en': 'Log out',
      'hi': '',
    },
  },
  // Miscellaneous
  {
    'neddivc2': {
      'en': '',
      'hi': '',
    },
    'r3xcr8li': {
      'en': '',
      'hi': '',
    },
    'slzo88n7': {
      'en': '',
      'hi': '',
    },
    'fmiuilxd': {
      'en': '',
      'hi': '',
    },
    'm3woqsig': {
      'en': '',
      'hi': '',
    },
    'mj0dfm93': {
      'en': '',
      'hi': '',
    },
    '8ljkiq2h': {
      'en': '',
      'hi': '',
    },
    '3l6nlxv0': {
      'en': '',
      'hi': '',
    },
    'w3o0bd1p': {
      'en': '',
      'hi': '',
    },
    'nf2t8zq1': {
      'en': '',
      'hi': '',
    },
    'wzylf5w7': {
      'en': '',
      'hi': '',
    },
    'c1nwak7h': {
      'en': '',
      'hi': '',
    },
    'jv9p7iuu': {
      'en': '',
      'hi': '',
    },
    'z4l9aycy': {
      'en': '',
      'hi': '',
    },
    'pu3jsf01': {
      'en': '',
      'hi': '',
    },
    '4bgmk3ft': {
      'en': '',
      'hi': '',
    },
    '43qq2l9s': {
      'en': '',
      'hi': '',
    },
    'nqgeor4y': {
      'en': '',
      'hi': '',
    },
    '4346dxex': {
      'en': '',
      'hi': '',
    },
    'c9mxxkwb': {
      'en': '',
      'hi': '',
    },
    '9xn7oqlx': {
      'en': '',
      'hi': '',
    },
    '4uk0c4um': {
      'en': '',
      'hi': '',
    },
    'nvvmdni8': {
      'en': '',
      'hi': '',
    },
    'cpccgzlg': {
      'en': '',
      'hi': '',
    },
    'j4ltoxx5': {
      'en': '',
      'hi': '',
    },
    'va9duxoz': {
      'en': '',
      'hi': '',
    },
    'u25yepui': {
      'en': '',
      'hi': '',
    },
  },
].reduce((a, b) => a..addAll(b));
