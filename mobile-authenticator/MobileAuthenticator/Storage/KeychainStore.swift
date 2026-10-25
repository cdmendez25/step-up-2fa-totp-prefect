import Foundation
import Security

/// Guarda las cuentas (con sus secretos) en el Keychain de iOS.
///
/// `kSecAttrAccessibleWhenUnlockedThisDeviceOnly`: solo se puede leer con el
/// iPhone desbloqueado y NUNCA sale de este dispositivo (no va a backups de
/// iCloud ni se migra a otro teléfono). UserDefaults, en cambio, es texto plano.
enum KeychainStore {
    private static let service = "com.cdiazmendez.stepup2fa"
    private static let itemName = "totp-accounts"

    private static var baseQuery: [String: Any] {
        [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: itemName,
        ]
    }

    static func load() -> [StoredAccount] {
        var query = baseQuery
        query[kSecReturnData as String] = true
        query[kSecMatchLimit as String] = kSecMatchLimitOne

        var result: AnyObject?
        guard SecItemCopyMatching(query as CFDictionary, &result) == errSecSuccess,
              let data = result as? Data,
              let accounts = try? JSONDecoder().decode([StoredAccount].self, from: data) else {
            return []
        }
        return accounts
    }

    @discardableResult
    static func save(_ accounts: [StoredAccount]) -> Bool {
        guard let data = try? JSONEncoder().encode(accounts) else { return false }
        SecItemDelete(baseQuery as CFDictionary)

        var item = baseQuery
        item[kSecValueData as String] = data
        item[kSecAttrAccessible as String] = kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        return SecItemAdd(item as CFDictionary, nil) == errSecSuccess
    }
}
