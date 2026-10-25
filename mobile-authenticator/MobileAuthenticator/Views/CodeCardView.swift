import SwiftUI

/// Tarjeta de una cuenta: emisor, código grande y cuenta regresiva.
struct CodeCardView: View {
    let account: AccountCardModel
    /// Se llama al tocar la tarjeta. Qué hacer (copiar, avisar) es tu lógica.
    var onCopy: () -> Void = {}

    /// "482913" → "482 913" para leerlo de un vistazo.
    private var displayCode: String {
        guard account.code.count == 6 else { return account.code }
        return "\(account.code.prefix(3)) \(account.code.suffix(3))"
    }

    /// VoiceOver lee los dígitos uno por uno: "4 8 2 9 1 3".
    private var spokenCode: String {
        account.code.map(String.init).joined(separator: " ")
    }

    var body: some View {
        Button(action: onCopy) {
            VStack(alignment: .leading, spacing: 14) {
                HStack(spacing: 12) {
                    IssuerAvatar(issuer: account.issuer)

                    VStack(alignment: .leading, spacing: 2) {
                        Text(account.issuer)
                            .font(.headline)
                            .foregroundStyle(.primary)
                        Text(account.accountName)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                    .lineLimit(1)

                    Spacer(minLength: 8)

                    CountdownRing(secondsRemaining: account.secondsRemaining, period: account.period)
                }

                Text(displayCode)
                    .font(.system(size: 46, weight: .semibold, design: .monospaced))
                    .monospacedDigit()
                    .foregroundStyle(Theme.brand)
                    .contentTransition(.numericText())
                    .animation(.snappy, value: account.code)
                    .lineLimit(1)
                    .minimumScaleFactor(0.6)

                Label("Toca para copiar", systemImage: "doc.on.doc")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .padding(20)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Theme.cardBackground, in: RoundedRectangle(cornerRadius: Theme.cardCornerRadius, style: .continuous))
        }
        .buttonStyle(PressableCardStyle())
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("\(account.issuer), \(account.accountName)")
        .accessibilityValue("Código \(spokenCode). Quedan \(account.secondsRemaining) segundos")
        .accessibilityHint("Toca dos veces para copiar el código")
    }
}

/// Círculo con la inicial del emisor.
struct IssuerAvatar: View {
    let issuer: String

    var body: some View {
        Text(issuer.prefix(1).uppercased())
            .font(.system(.headline, design: .rounded, weight: .bold))
            .foregroundStyle(Theme.brand)
            .frame(width: 40, height: 40)
            .background(Theme.brand.opacity(0.12), in: Circle())
            .accessibilityHidden(true)
    }
}

/// Se encoge un poco al presionar, para que el toque se sienta.
struct PressableCardStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
            .animation(.spring(duration: 0.2), value: configuration.isPressed)
    }
}
