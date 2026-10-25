import CryptoKit
import Foundation

/// TOTP (RFC 6238) desde cero. CryptoKit solo aporta el HMAC-SHA1 nativo,
/// como permite la guía; el resto (contador, truncamiento) es nuestro.
///
///     código = Truncar( HMAC-SHA1( secreto, floor(tiempo_unix / 30) ) )
enum TOTP {
    static let period = 30
    static let digits = 6

    static func code(secret: Data, at date: Date) -> String {
        let counter = UInt64(floor(date.timeIntervalSince1970 / Double(period)))

        // El contador como 8 bytes big-endian.
        var bigEndianCounter = counter.bigEndian
        let message = withUnsafeBytes(of: &bigEndianCounter) { Data($0) }

        let mac = HMAC<Insecure.SHA1>.authenticationCode(for: message, using: SymmetricKey(data: secret))
        let hash = Array(mac)  // 20 bytes

        // Truncamiento dinámico: los últimos 4 bits dicen desde dónde leer 4 bytes.
        let offset = Int(hash[hash.count - 1] & 0x0F)
        let number = (UInt32(hash[offset]) & 0x7F) << 24  // bit más alto apagado
            | UInt32(hash[offset + 1]) << 16
            | UInt32(hash[offset + 2]) << 8
            | UInt32(hash[offset + 3])

        let code = number % 1_000_000
        return String(format: "%06u", code)
    }

    /// Segundos que le quedan al código actual: de 30 a 1.
    static func secondsRemaining(at date: Date) -> Int {
        period - Int(date.timeIntervalSince1970) % period
    }
}
