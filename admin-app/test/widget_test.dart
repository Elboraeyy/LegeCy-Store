import 'package:flutter_test/flutter_test.dart';
import 'package:admin_app/main.dart';

void main() {
  testWidgets('App starts successfully', (WidgetTester tester) async {
    await tester.pumpWidget(const LegacyAdminApp());
    // Just verify the app can start without crashing
    expect(find.byType(LegacyAdminApp), findsOneWidget);
  });
}
