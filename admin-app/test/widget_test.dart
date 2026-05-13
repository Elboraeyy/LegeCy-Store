import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:admin_app/main.dart';
import 'package:admin_app/features/auth/auth_provider.dart';

void main() {
  testWidgets('App starts successfully', (WidgetTester tester) async {
    await tester.pumpWidget(
      ChangeNotifierProvider(
        create: (_) => AuthProvider(),
        child: const LegacyAdminApp(),
      ),
    );
    await tester.pump(const Duration(seconds: 3));
    // Just verify the app can start without crashing
    expect(find.byType(LegacyAdminApp), findsOneWidget);
  });
}
