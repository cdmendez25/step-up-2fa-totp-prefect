import SwiftUI

/// Pantalla principal: lista de cuentas con sus códigos.
struct AccountsListView: View {
    let accounts: [AccountCardModel]
    /// Mensaje flotante temporal, p. ej. "Código copiado". nil = oculto.
    var toastMessage: String?
    var onAdd: () -> Void
    var onCopy: (AccountCardModel) -> Void
    var onDelete: (AccountCardModel) -> Void

    @State private var isEditing = false
    @State private var pendingDeletion: AccountCardModel?
    @State private var emptyBounce = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    init(
        accounts: [AccountCardModel],
        toastMessage: String? = nil,
        onAdd: @escaping () -> Void = {},
        onCopy: @escaping (AccountCardModel) -> Void = { _ in },
        onDelete: @escaping (AccountCardModel) -> Void = { _ in }
    ) {
        self.accounts = accounts
        self.toastMessage = toastMessage
        self.onAdd = onAdd
        self.onCopy = onCopy
        self.onDelete = onDelete
    }

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
                ToolbarItem(placement: .topBarLeading) {
                    if !accounts.isEmpty {
                        Button(isEditing ? "Listo" : "Editar") {
                            withAnimation(.snappy) { isEditing.toggle() }
                        }
                        .fontWeight(isEditing ? .semibold : .regular)
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button(action: onAdd) {
                        Image(systemName: "plus")
                            .fontWeight(.semibold)
                    }
                    .accessibilityLabel("Agregar cuenta")
                    .disabled(isEditing)
                }
            }
            .confirmationDialog(
                "¿Eliminar esta cuenta?",
                isPresented: Binding(
                    get: { pendingDeletion != nil },
                    set: { if !$0 { pendingDeletion = nil } }
                ),
                titleVisibility: .visible,
                presenting: pendingDeletion
            ) { account in
                Button("Eliminar \(account.issuer)", role: .destructive) {
                    onDelete(account)
                    if accounts.count <= 1 { isEditing = false }
                }
                Button("Cancelar", role: .cancel) {}
            } message: { account in
                Text("Este iPhone dejará de generar los códigos de \(account.issuer) (\(account.accountName)). Tu cuenta en el servidor seguirá pidiendo el 2FA: guarda tus códigos de respaldo.")
            }
            .onChange(of: accounts.isEmpty) { _, isEmpty in
                if isEmpty { isEditing = false }
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
                    // En modo edición, tocar la tarjeta no copia: así no hay acciones por accidente.
                    CodeCardView(account: account) { if !isEditing { onCopy(account) } }
                        .overlay(alignment: .topTrailing) {
                            if isEditing {
                                Button {
                                    pendingDeletion = account
                                } label: {
                                    Image(systemName: "minus.circle.fill")
                                        .font(.title)
                                        .symbolRenderingMode(.palette)
                                        .foregroundStyle(.white, Theme.danger)
                                        .frame(width: 44, height: 44)
                                }
                                .accessibilityLabel("Eliminar \(account.issuer)")
                                .offset(x: 12, y: -12)
                                .transition(.scale.combined(with: .opacity))
                            }
                        }
                        .contextMenu {
                            Button("Copiar código", systemImage: "doc.on.doc") { onCopy(account) }
                            Button("Eliminar", systemImage: "trash", role: .destructive) { pendingDeletion = account }
                        }
                        .transition(
                            .asymmetric(
                                insertion: .scale(scale: 0.9).combined(with: .opacity),
                                removal: .scale(scale: 0.85).combined(with: .opacity)
                            )
                        )
                }

                OfflineNote()
                    .padding(.top, 8)
            }
            .padding(.horizontal, 16)
            .padding(.top, 8)
            .padding(.bottom, 32)
            // Anima solo cuando cambia QUÉ cuentas hay (no cada segundo que cambia el código).
            .animation(reduceMotion ? nil : .spring(duration: 0.45, bounce: 0.25), value: accounts.map(\.id))
        }
    }

    private var emptyState: some View {
        VStack(spacing: 24) {
            ContentUnavailableView {
                Label("Sin cuentas todavía", systemImage: "lock.shield")
                    .symbolEffect(.bounce, value: emptyBounce)
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
        .onAppear { emptyBounce.toggle() }
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
