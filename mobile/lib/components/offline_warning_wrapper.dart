import 'package:flutter/material.dart';
import 'package:flutter_offline/flutter_offline.dart';

class OfflineWarningWrapper extends StatelessWidget {
  final Widget child;

  final double bannerHeight;

  final Color bannerColor;

  final TextStyle textStyle;

  final String offlineMessage;

  const OfflineWarningWrapper({
    Key? key,
    required this.child,
    this.bannerHeight = 32.0,
    this.bannerColor = Colors.red,
    this.textStyle = const TextStyle(color: Colors.white, fontSize: 14.0),
    this.offlineMessage = "Sem conexão á internet",
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return OfflineBuilder(
      connectivityBuilder: (
        BuildContext context,
        List<ConnectivityResult> connectivityResults,
        Widget child,
      ) {
        final bool connected = !connectivityResults.contains(ConnectivityResult.none);

        return Stack(
          children: <Widget>[
            Positioned.fill(
              child: child,
            ),
            Positioned(
              height: bannerHeight,
              left: 0.0,
              right: 0.0,
              top: connected ? -bannerHeight : 0.0,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                color: bannerColor,
                alignment: Alignment.center,
                child: connected
                    ? const SizedBox.shrink()
                    : Text(
                        offlineMessage,
                        style: textStyle,
                      ),
              ),
            ),
          ],
        );
      },
      child: child,
    );
  }
}
