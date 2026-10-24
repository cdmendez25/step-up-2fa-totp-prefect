import Foundation

/// Lo que una tarjeta necesita para pintarse.
///
/// Es un modelo de PRESENTACIÓN: no contiene el secreto ni hace cálculos.
/// Tu ViewModel lo construye a partir de tus cuentas guardadas y del código
/// que calcule tu implementación de TOTP.
struct AccountCardModel: Identifiable, Equatable {
    let id: UUID
    var issuer: String
    var accountName: String
    /// Código actual de 6 dígitos, sin espacios: "482913".
    var code: String
    /// Segundos que le quedan al código actual (de `period` a 1).
    var secondsRemaining: Int
    var period: Int = 30
}

/// Lo que el usuario escribió en el formulario de "Ingresar clave".
/// Validarlo y decodificar el Base32 es trabajo de tu lógica.
struct ManualAccountEntry: Equatable {
    var issuer = ""
    var accountName = ""
    var secret = ""
}
