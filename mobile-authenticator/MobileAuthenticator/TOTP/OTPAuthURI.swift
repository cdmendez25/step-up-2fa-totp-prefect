import Foundation

/// Lee la URI que viene dentro del QR:
///
///     otpauth://totp/Boveda%202FA:carlos?secret=JBSW...&issuer=Boveda%202FA&algorithm=SHA1&digits=6&period=30
struct OTPAuthURI {
    let issuer: String
    let accountName: String
    let secret: String

    enum ParseError: LocalizedError {
        case notOTPAuth, missingSecret, invalidSecret, unsupported(String)

        var errorDescription: String? {
            switch self {
            case .notOTPAuth: "Ese QR no es de una cuenta 2FA (otpauth://totp)."
            case .missingSecret: "El QR no trae la clave secreta."
            case .invalidSecret: "La clave secreta del QR no es Base32 válido."
            case .unsupported(let detail): "Configuración no soportada: \(detail)."
            }
        }
    }

    init(_ text: String) throws {
        guard let components = URLComponents(string: text),
              components.scheme == "otpauth", components.host == "totp" else {
            throw ParseError.notOTPAuth
        }

        let query = Dictionary(
            (components.queryItems ?? []).map { ($0.name.lowercased(), $0.value ?? "") },
            uniquingKeysWith: { first, _ in first }
        )

        guard let secret = query["secret"], !secret.isEmpty else { throw ParseError.missingSecret }
        guard Base32.decode(secret) != nil else { throw ParseError.invalidSecret }

        // Esta app implementa el estándar que usan Google y Microsoft: SHA1, 6 dígitos, 30 s.
        if let algorithm = query["algorithm"], algorithm.uppercased() != "SHA1" { throw ParseError.unsupported(algorithm) }
        if let digits = query["digits"], digits != "6" { throw ParseError.unsupported("\(digits) dígitos") }
        if let period = query["period"], period != "30" { throw ParseError.unsupported("periodo de \(period) s") }

        // La etiqueta es "Emisor:cuenta" (URLComponents ya la decodifica).
        let label = String(components.path.dropFirst())
        let parts = label.split(separator: ":", maxSplits: 1).map { $0.trimmingCharacters(in: .whitespaces) }
        let labelIssuer = parts.count == 2 ? parts[0] : ""
        let account = parts.last ?? ""

        self.issuer = query["issuer"].flatMap { $0.isEmpty ? nil : $0 } ?? (labelIssuer.isEmpty ? "Cuenta" : labelIssuer)
        self.accountName = account
        self.secret = secret
    }
}
