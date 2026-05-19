import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:admin_app/core/theme/app_theme.dart';

enum AppToastTone { success, error, warning, info }

class AppToast {
  AppToast._();

  static SnackBar snackBar({
    Key? key,
    required Widget content,
    Color? backgroundColor,
    double? elevation,
    EdgeInsetsGeometry? margin,
    EdgeInsetsGeometry? padding,
    double? width,
    ShapeBorder? shape,
    SnackBarBehavior? behavior,
    SnackBarAction? action,
    Duration duration = const Duration(seconds: 4),
    Animation<double>? animation,
    VoidCallback? onVisible,
    DismissDirection dismissDirection = DismissDirection.up,
    Clip clipBehavior = Clip.hardEdge,
  }) {
    final tone = _toneFromColor(backgroundColor);
    final message = _messageFromContent(content);
    final normalized = _normalizeMessage(message, tone);
    final placement = _bottomPlacement();

    return SnackBar(
      key: key,
      behavior: SnackBarBehavior.floating,
      elevation: elevation ?? 0,
      backgroundColor: Colors.transparent,
      width: width,
      margin: margin ?? placement.margin,
      padding: padding ?? EdgeInsets.zero,
      shape:
          shape ??
          RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
      duration: duration,
      animation: animation,
      onVisible: onVisible,
      dismissDirection: dismissDirection == DismissDirection.up
          ? DismissDirection.down
          : dismissDirection,
      clipBehavior: clipBehavior,
      content: _ToastCard(
        tone: tone,
        title: normalized.title,
        originalContent: message == null ? content : null,
        action: action,
      ),
    );
  }

  static SnackBar success(String message) =>
      snackBar(content: Text(message), backgroundColor: AppColors.success);

  static SnackBar error(String message) =>
      snackBar(content: Text(message), backgroundColor: AppColors.error);

  static SnackBar info(String message) =>
      snackBar(content: Text(message), backgroundColor: AppColors.info);

  static SnackBar warning(String message) =>
      snackBar(content: Text(message), backgroundColor: AppColors.warning);

  static AppToastTone _toneFromColor(Color? color) {
    if (color == AppColors.success) return AppToastTone.success;
    if (color == AppColors.error) return AppToastTone.error;
    if (color == AppColors.warning) return AppToastTone.warning;
    if (color == AppColors.info) return AppToastTone.info;
    return AppToastTone.info;
  }

  static String? _messageFromContent(Widget content) {
    if (content is Text) {
      return content.data ?? content.textSpan?.toPlainText();
    }
    return null;
  }

  static _NormalizedToast _normalizeMessage(String? raw, AppToastTone tone) {
    final fallbackTitle = switch (tone) {
      AppToastTone.success => 'Done',
      AppToastTone.error => 'Could not complete action',
      AppToastTone.warning => 'Please review',
      AppToastTone.info => 'Update',
    };

    if (raw == null || raw.trim().isEmpty) {
      return _NormalizedToast(title: fallbackTitle);
    }

    var message = raw.trim();
    if (tone == AppToastTone.error) {
      message = message
          .replaceFirst(
            RegExp(r'^(Error|Failed|Failure):\s*', caseSensitive: false),
            '',
          )
          .replaceFirst(
            RegExp(r'^(Upload failed|Failed):\s*', caseSensitive: false),
            '',
          );
    }

    return _NormalizedToast(title: message);
  }

  static _ToastPlacement _bottomPlacement() {
    const horizontalGap = 16.0;
    return _ToastPlacement(
      margin: const EdgeInsets.only(
        left: horizontalGap,
        right: horizontalGap,
        bottom: 24,
      ),
    );
  }
}

class _ToastCard extends StatelessWidget {
  final AppToastTone tone;
  final String title;
  final Widget? originalContent;
  final SnackBarAction? action;

  const _ToastCard({
    required this.tone,
    required this.title,
    this.originalContent,
    this.action,
  });

  @override
  Widget build(BuildContext context) {
    final colors = _ToastColors.forTone(tone);

    return Container(
      key: const ValueKey('app-toast-card'),
      constraints: const BoxConstraints(minHeight: 50),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: colors.border),
        boxShadow: [
          BoxShadow(
            color: AppColors.primaryDark.withValues(alpha: 0.14),
            blurRadius: 28,
            offset: const Offset(0, 14),
          ),
          BoxShadow(
            color: colors.accent.withValues(alpha: 0.08),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(17),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Container(width: 4, height: 50, color: colors.accent),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(12, 8, 10, 8),
                child: Row(
                  children: [
                    Container(
                      width: 28,
                      height: 28,
                      decoration: BoxDecoration(
                        color: colors.badge,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        _iconForTone(tone),
                        color: colors.accent,
                        size: 16,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: originalContent != null
                          ? DefaultTextStyle(
                              style: GoogleFonts.inter(
                                color: AppColors.textPrimary,
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                height: 1.35,
                              ),
                              child: originalContent!,
                            )
                          : Column(
                              mainAxisSize: MainAxisSize.min,
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  title,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: GoogleFonts.inter(
                                    color: AppColors.textPrimary,
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700,
                                    height: 1.25,
                                  ),
                                ),
                              ],
                            ),
                    ),
                    if (action != null) ...[const SizedBox(width: 8), action!],
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  static IconData _iconForTone(AppToastTone tone) {
    return switch (tone) {
      AppToastTone.success => Icons.check_rounded,
      AppToastTone.error => Icons.priority_high_rounded,
      AppToastTone.warning => Icons.warning_amber_rounded,
      AppToastTone.info => Icons.info_outline_rounded,
    };
  }
}

class _ToastColors {
  final Color surface;
  final Color border;
  final Color badge;
  final Color accent;

  const _ToastColors({
    required this.surface,
    required this.border,
    required this.badge,
    required this.accent,
  });

  static _ToastColors forTone(AppToastTone tone) {
    return switch (tone) {
      AppToastTone.success => _ToastColors(
        surface: const Color(0xFFF0FDF4),
        border: const Color(0xFFBBF7D0),
        badge: const Color(0xFFD1FAE5),
        accent: AppColors.success,
      ),
      AppToastTone.error => _ToastColors(
        surface: const Color(0xFFFEF2F2),
        border: const Color(0xFFFECACA),
        badge: const Color(0xFFFEE2E2),
        accent: AppColors.error,
      ),
      AppToastTone.warning => _ToastColors(
        surface: const Color(0xFFFFFBEB),
        border: const Color(0xFFFDE68A),
        badge: const Color(0xFFFEF3C7),
        accent: AppColors.warning,
      ),
      AppToastTone.info => _ToastColors(
        surface: AppColors.surface,
        border: AppColors.cardBorder,
        badge: AppColors.primaryLight,
        accent: AppColors.primaryDark,
      ),
    };
  }
}

class _NormalizedToast {
  final String title;

  const _NormalizedToast({required this.title});
}

class _ToastPlacement {
  final EdgeInsetsGeometry margin;

  const _ToastPlacement({required this.margin});
}
