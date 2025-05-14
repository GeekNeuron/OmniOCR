import SwiftUI
import shared
import UIKit

struct ComposeView: UIViewControllerRepresentable {
    func makeUIViewController(context: Context) -> UIViewController {
        Main_iosKt.MainScreenViewController(
            engine: OcrEngine(),
            onShare: { text in
                let vc = UIActivityViewController(activityItems: [text], applicationActivities: nil)
                if let topVC = UIApplication.shared.windows.first?.rootViewController {
                    topVC.present(vc, animated: true)
                }
            }
        )
    }

    func updateUIViewController(_ uiViewController: UIViewController, context: Context) {}
}