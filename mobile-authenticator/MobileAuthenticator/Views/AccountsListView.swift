import SwiftUI

/// Pantalla principal: lista de cuentas con sus códigos.
struct AccountsListView: View {
    let accounts: [AccountCardModel]
    /// Mensaje flotante temporal, p. ej. "Código copiado". nil = oculto.
    var toastMessage: String? = nil
    var onAdd: () -> Void = {}
    var onCopy: (AccountCardModel) -> Void = { _ in }
    var onDelete: (AccountCardModel) -> Void = { _ in }

    var body: some View {
        NavigationStack {
            Group {
                if accounts.isEmpty {
                    emptyState
                } else {
                    accountList
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Theme.screenBackground)
            .navigationTitle("Authenticator")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button(action: onAdd) {
                        Image(systemName: "plus")
                            .fontWeight(.semibold)
                    }
                    .accessibilityLabel("Agregar cuenta")
                }
            }
            .overlay(alignment: .bottom) {
                if let toastMessage {
                    Toast(message: toastMessage)
                        .padding(.bottom, 24)
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                }
            }
            .animation(.spring(duration: 0.35), value: toastMessage)
        }
    }

    private var accountList: some View {
        ScrollView {
            LazyVStack(spacing: 14) {
                ForEach(accounts) { account in
                    CodeCardView(account: account) { onCopy(account) }
                        .contextMenu {
                            Button("Copiar código", systemImage: "doc.on.doc") { onCopy(account) }
                            Button("Eliminar", systemImage: "trash", role: .destructive) { onDelete(account) }
                        }
                }

                OfflineNote()
                    .padding(.top, 8)
            }
            .padding(.horizontal, 16)
            .padding(.top, 8)
            .padding(.bottom, 32)
        }
    }

    private var emptyState: some View {
        VStack(spacing: 24) {
            ContentUnavailableView {
                Label("Sin cuentas todavía", systemImage: "lock.shield")
            } description: {
                Text("Activa el 2FA en la web y escanea el código QR, o ingresa la clave a mano.")
            } actions: {
                Button(action: onAdd) {
                    Label("Agregar cuenta", systemImage: "qrcode.viewfinder")
                        .padding(.horizontal, 8)
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
            }
            .frame(maxHeight: 360)

            OfflineNote()
                .padding(.horizontal, 32)
        }
    }
}

/// Recordatorio de que los códigos no dependen de internet.
struct OfflineNote: View {
    var body: some View {
        Label("Los códigos se calculan en este iPhone. Funciona en modo avión.", systemImage: "airplane")
            .font(.footnote)
            .foregroundStyle(.secondary)
            .multilineTextAlignment(.center)
            .frame(maxWidth: .infinity)
    }
}

/// Cápsula flotante para confirmaciones breves.
struct Toast: View {
    let message: String

    var body: some View {
        Label(message, systemImage: "checkmark.circle.fill")
            .font(.subheadline.weight(.semibold))
            .foregroundStyle(.white)
            .padding(.horizontal, 18)
            .padding(.vertical, 12)
            .background(Color.black.opacity(0.85), in: Capsule())
            .accessibilityAddTraits(.isStaticText)
    }
}

#Preview("Vacío") {
    AccountsListView(accounts: [])
}
