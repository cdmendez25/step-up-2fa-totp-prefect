import SwiftUI

/// Anillo que se vacía según los segundos restantes del código.
/// Solo dibuja lo que recibe; calcular `secondsRemaining` es tu lógica.
struct CountdownRing: View {
    let secondsRemaining: Int
    let period: Int

    private var isEnding: Bool { secondsRemaining <= Theme.warningThreshold }

    private var fraction: Double {
        guard period > 0 else { return 0 }
        return Double(secondsRemaining) / Double(period)
    }

    var body: some View {
        ZStack {
            Circle()
                .stroke(Color.secondary.opacity(0.18), lineWidth: 4)

            Circle()
                .trim(from: 0, to: fraction)
                .stroke(isEnding ? Theme.warning : Theme.success, style: StrokeStyle(lineWidth: 4, lineCap: .round))
                .rotationEffect(.degrees(-90))
                .animation(.linear(duration: 1), value: secondsRemaining)

            Text("\(secondsRemaining)")
                .font(.system(.footnote, design: .rounded, weight: .semibold))
                .monospacedDigit()
                .foregroundStyle(isEnding ? Theme.warning : .secondary)
                .contentTransition(.numericText(countsDown: true))
                .animation(.snappy, value: secondsRemaining)
        }
        .frame(width: 44, height: 44)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Quedan \(secondsRemaining) segundos")
    }
}

#Preview("Normal y en alerta") {
    HStack(spacing: 24) {
        CountdownRing(secondsRemaining: 30, period: 30)
        CountdownRing(secondsRemaining: 18, period: 30)
        CountdownRing(secondsRemaining: 4, period: 30)
    }
    .padding()
}
