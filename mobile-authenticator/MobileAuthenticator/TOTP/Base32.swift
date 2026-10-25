import Foundation

/// Decodificador Base32 (RFC 4648) escrito desde cero.
///
/// Cada carácter vale 5 bits. Se van acumulando bits y, cada vez que hay 8,
/// sale un byte.
enum Base32 {
    private static let alphabet = Array("ABCDEFGHIJKLMNOPQRSTUVWXYZ234567")
    private static let values: [Character: Int] = Dictionary(
        uniqueKeysWithValues: alphabet.enumerated().map { ($1, $0) }
    )

    /// Acepta minúsculas, espacios, guiones y el relleno '='. Devuelve nil si hay caracteres inválidos.
    static func decode(_ text: String) -> Data? {
        let cleaned = text.uppercased().filter { !$0.isWhitespace && $0 != "-" && $0 != "=" }
        guard !cleaned.isEmpty else { return nil }

        var bytes: [UInt8] = []
        var buffer = 0
        var bitCount = 0

        for character in cleaned {
            guard let value = values[character] else { return nil }
            buffer = (buffer << 5) | value
            bitCount += 5
            if bitCount >= 8 {
                bitCount -= 8
                bytes.append(UInt8((buffer >> bitCount) & 0xFF))
                buffer &= (1 << bitCount) - 1  // descarta los bits ya usados
            }
        }
        return Data(bytes)
    }
}
