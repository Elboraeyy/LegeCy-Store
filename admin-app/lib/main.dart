import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:admin_app/core/theme/app_theme.dart';
import 'package:admin_app/features/auth/auth_provider.dart';
import 'package:admin_app/features/auth/login_screen.dart';
import 'package:admin_app/features/home/home_shell.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  // Set status bar style
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
    ),
  );

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
      ],
      child: const LegacyAdminApp(),
    ),
  );
}

class LegacyAdminApp extends StatefulWidget {
  const LegacyAdminApp({super.key});

  @override
  State<LegacyAdminApp> createState() => _LegacyAdminAppState();
}

class _LegacyAdminAppState extends State<LegacyAdminApp> {
  bool _initialized = false;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    // Try to restore saved session
    await context.read<AuthProvider>().tryAutoLogin();
    if (mounted) {
      setState(() => _initialized = true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Legacy Admin',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: _initialized
          ? Consumer<AuthProvider>(
              builder: (context, auth, _) {
                if (auth.isLoggedIn) {
                  return const HomeShell();
                }
                return const LoginScreen();
              },
            )
          : const _SplashScreen(),
    );
  }
}

/// Quick branded splash while the app checks for a saved session.
class _SplashScreen extends StatelessWidget {
  const _SplashScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.primaryDark,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Gold bar
            Container(
              width: 32,
              height: 3,
              decoration: BoxDecoration(
                color: AppColors.accent,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'LEGACY',
              style: TextStyle(
                fontFamily: 'PlayfairDisplay',
                fontSize: 32,
                fontWeight: FontWeight.w700,
                color: Colors.white,
                letterSpacing: 4,
              ),
            ),
            const SizedBox(height: 24),
            const SizedBox(
              width: 22,
              height: 22,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: AppColors.accent,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
