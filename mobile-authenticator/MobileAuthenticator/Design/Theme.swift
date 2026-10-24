import SwiftUI

/// Tokens de diseño: los mismos colores que la web, con variante clara y oscura.
enum Theme {
    static let brand = Color(light: 0x1E3A5F, dark: 0x60A5FA)
    static let success = Color(light: 0x047857, dark: 0x34D399)
    static let warning = Color(light: 0xB45309, dark: 0xFBBF24)
    static let danger = Color(light: 0xB91C1C, dark: 0xF87171)

    static let screenBackground = Color(uiColor: .systemGroupedBackground)
    static let cardBackground = Color(uiColor: .secondarySystemGroupedBackground)

    static let cardCornerRadius: CGFloat = 22

    /// A partir de cuántos segundos restantes el anillo se pinta en alerta.
    static let warningThreshold = 5
}

extension Color {
    /// Color que cambia solo entre modo claro y oscuro. Recibe hex: 0x1E3A5F.
    init(light: UInt32, dark: UInt32) {
        self.init(uiColor: UIColor { traits in
            UIColor(hex: traits.userInterfaceStyle == .dark ? dark : light)
        })
    }
}

private extension UIColor {
    convenience init(hex: UInt32) {
        self.init(
            red: CGFloat((hex >> 16) & 0xFF) / 255,
            green: CGFloat((hex >> 8) & 0xFF) / 255,
            blue: CGFloat(hex & 0xFF) / 255,
            alpha: 1
        )
    }
}
