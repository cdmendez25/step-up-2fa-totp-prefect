import SwiftUI
import VisionKit

/// Cámara que detecta códigos QR con VisionKit (DataScannerViewController).
/// Entrega el texto del QR; `onScan` devuelve true si lo aceptó (y entonces deja de escanear).
struct QRScannerView: UIViewControllerRepresentable {
    let onScan: @MainActor (String) -> Bool

    /// false si el iPhone no tiene cámara compatible o se negó el permiso.
    static var isAvailable: Bool {
        DataScannerViewController.isSupported && DataScannerViewController.isAvailable
    }

    func makeUIViewController(context: Context) -> DataScannerViewController {
        let scanner = DataScannerViewController(
            recognizedDataTypes: [.barcode(symbologies: [.qr])],
            qualityLevel: .balanced,
            recognizesMultipleItems: false,
            isHighFrameRateTrackingEnabled: false,
            isHighlightingEnabled: true
        )
        scanner.delegate = context.coordinator
        return scanner
    }

    func updateUIViewController(_ scanner: DataScannerViewController, context: Context) {
        if !scanner.isScanning && !context.coordinator.finished {
            try? scanner.startScanning()
        }
    }

    static func dismantleUIViewController(_ scanner: DataScannerViewController, coordinator: Coordinator) {
        scanner.stopScanning()
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(onScan: onScan)
    }

    @MainActor
    final class Coordinator: NSObject, DataScannerViewControllerDelegate {
        let onScan: @MainActor (String) -> Bool
        var finished = false
        private var lastRejected: String?

        init(onScan: @escaping @MainActor (String) -> Bool) {
            self.onScan = onScan
        }

        func dataScanner(_ dataScanner: DataScannerViewController, didAdd addedItems: [RecognizedItem], allItems: [RecognizedItem]) {
            guard !finished else { return }
            for item in addedItems {
                guard case .barcode(let barcode) = item, let payload = barcode.payloadStringValue else { continue }
                if payload == lastRejected { continue }  // no repetir el mismo error en bucle
                if onScan(payload) {
                    finished = true
                    dataScanner.stopScanning()
                } else {
                    lastRejected = payload
                }
                return
            }
        }
    }
}
