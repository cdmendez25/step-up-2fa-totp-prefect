import Foundation

/// Datos FALSOS solo para los #Preview del canvas de Xcode.
/// La app real nunca los muestra; no los uses en tu lógica.
enum PreviewData {
    static let main = AccountCardModel(
        id: UUID(),
        issuer: "Bóveda 2FA",
        accountName: "carlos",
        code: "482913",
        secondsRemaining: 18
    )

    // Solo para ver el anillo en alerta. En la vida real todas las cuentas
    // con periodo de 30 s comparten la misma cuenta regresiva. ¿Sabes por qué?
    static let ending = AccountCardModel(
        id: UUID(),
        issuer: "Bóveda 2FA (staging)",
        accountName: "carlos@uni.edu",
        code: "930418",
        secondsRemaining: 4
    )

    static let accounts: [AccountCardModel] = [
        main,
        AccountCardModel(id: UUID(), issuer: "GitHub", accountName: "cdmendez25", code: "071552", secondsRemaining: 18),
        ending,
    ]
}
