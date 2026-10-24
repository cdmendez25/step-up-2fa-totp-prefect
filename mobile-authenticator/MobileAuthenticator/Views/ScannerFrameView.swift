import SwiftUI

/// Marco cuadrado con esquinas de guía. Dentro va la vista de la cámara.
///
///     ScannerFrameView { TuVistaDeCamara() }
struct ScannerFrameView<Camera: View>: View {
    @ViewBuilder let camera: () -> Camera

    var body: some View {
        Color.black
            .aspectRatio(1, contentMode: .fit)
            .overlay { camera() }
            .clipShape(RoundedRectangle(cornerRadius: 28, style: .continuous))
            .overlay {
                ViewfinderCorners()
                    .stroke(Theme.success, style: StrokeStyle(lineWidth: 5, lineCap: .round, lineJoin: .round))
                    .padding(32)
            }
            .frame(maxWidth: 320)
            .accessibilityElement(children: .ignore)
            .accessibilityLabel("Visor de la cámara para escanear el código QR")
    }
}

/// Lo que se ve mientras no conectes tu vista de cámara.
struct CameraPlaceholder: View {
    var body: some View {
        VStack(spacing: 10) {
            Image(systemName: "camera.viewfinder")
                .font(.system(size: 44, weight: .light))
            Text("Vista de la cámara")
                .font(.footnote.weight(.medium))
        }
        .foregroundStyle(.white.opacity(0.55))
    }
}

/// Las cuatro esquinas en forma de "L" del visor.
struct ViewfinderCorners: Shape {
    func path(in rect: CGRect) -> Path {
        let length = min(rect.width, rect.height) * 0.18
        var path = Path()

        path.move(to: CGPoint(x: rect.minX, y: rect.minY + length))
        path.addLine(to: CGPoint(x: rect.minX, y: rect.minY))
        path.addLine(to: CGPoint(x: rect.minX + length, y: rect.minY))

        path.move(to: CGPoint(x: rect.maxX - length, y: rect.minY))
        path.addLine(to: CGPoint(x: rect.maxX, y: rect.minY))
        path.addLine(to: CGPoint(x: rect.maxX, y: rect.minY + length))

        path.move(to: CGPoint(x: rect.maxX, y: rect.maxY - length))
        path.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY))
        path.addLine(to: CGPoint(x: rect.maxX - length, y: rect.maxY))

        path.move(to: CGPoint(x: rect.minX + length, y: rect.maxY))
        path.addLine(to: CGPoint(x: rect.minX, y: rect.maxY))
        path.addLine(to: CGPoint(x: rect.minX, y: rect.maxY - length))

        return path
    }
}

#Preview("Visor") {
    ScannerFrameView { CameraPlaceholder() }
        .padding()
}
