import Foundation

/// Una cuenta 2FA guardada en el Keychain.
struct StoredAccount: Codable, Identifiable, Equatable {
    var id = UUID()
    var issuer: String
    var accountName: String
    /// Secreto en Base32. Solo vive en el Keychain de este iPhone.
    var secret: String
}
