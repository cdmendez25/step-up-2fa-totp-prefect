import Observation
import SwiftUI
import UIKit

/// Estado de la app: las cuentas guardadas y lo que se muestra encima (toast, errores).
/// Los códigos no se guardan: se recalculan cada segundo a partir del secreto y la hora.
@MainActor
@Observable
final class AccountsViewModel {
    private(set) var accounts: [StoredAccount]
    var toastMessage: String?
    var addError: String?

    init() {
        accounts = KeychainStore.load()
    }

    /// Lo que pintan las tarjetas en este instante. Todo se calcula en el iPhone, sin internet.
    func cards(at date: Date) -> [AccountCardModel] {
        accounts.compactMap { account in
            guard let key = Base32.decode(account.secret) else { return nil }
            return AccountCardModel(
                id: account.id,
                issuer: account.issuer,
                accountName: account.accountName,
                code: TOTP.code(secret: key, at: date),
                secondsRemaining: TOTP.secondsRemaining(at: date),
                period: TOTP.period
            )
        }
    }

    // MARK: - Agregar

    /// Desde el QR. Devuelve true si se agregó.
    @discardableResult
    func addFromQR(_ payload: String) -> Bool {
        do {
            let uri = try OTPAuthURI(payload)
            return add(issuer: uri.issuer, accountName: uri.accountName, secret: uri.secret)
        } catch {
            addError = error.localizedDescription
            return false
        }
    }

    /// Desde el formulario "Ingresar clave". Devuelve true si se agregó.
    @discardableResult
    func addManual(_ entry: ManualAccountEntry) -> Bool {
        let secret = entry.secret.uppercased().filter { !$0.isWhitespace && $0 != "-" }
        guard let key = Base32.decode(secret) else {
            addError = "La clave tiene caracteres que no son Base32 (solo A–Z y 2–7)."
            return false
        }
        guard key.count >= 10 else {
            addError = "La clave es muy corta: revisa que la copiaste completa."
            return false
        }
        let issuer = entry.issuer.trimmingCharacters(in: .whitespaces)
        return add(
            issuer: issuer.isEmpty ? "Cuenta" : issuer,
            accountName: entry.accountName.trimmingCharacters(in: .whitespaces),
            secret: secret
        )
    }

    private func add(issuer: String, accountName: String, secret: String) -> Bool {
        if accounts.contains(where: { $0.secret == secret }) {
            addError = "Esa cuenta ya está agregada."
            return false
        }
        accounts.append(StoredAccount(issuer: issuer, accountName: accountName, secret: secret))
        guard KeychainStore.save(accounts) else {
            accounts.removeLast()
            addError = "No se pudo guardar en el Keychain."
            return false
        }
        addError = nil
        UINotificationFeedbackGenerator().notificationOccurred(.success)
        showToast("Cuenta agregada")
        return true
    }

    // MARK: - Acciones de la tarjeta

    func delete(_ id: UUID) {
        accounts.removeAll { $0.id == id }
        KeychainStore.save(accounts)
        UINotificationFeedbackGenerator().notificationOccurred(.warning)
        showToast("Cuenta eliminada")
    }

    func copy(_ card: AccountCardModel) {
        UIPasteboard.general.string = card.code
        UINotificationFeedbackGenerator().notificationOccurred(.success)
        showToast("Código copiado")
    }

    private func showToast(_ message: String) {
        toastMessage = message
        Task {
            try? await Task.sleep(for: .seconds(2))
            if toastMessage == message { toastMessage = nil }
        }
    }
}
