import SwiftUI

/// Hoja para agregar una cuenta: escaneando el QR o escribiendo la clave.
struct AddAccountView: View {
    enum Mode: String, CaseIterable, Identifiable {
        case scan = "Escanear QR"
        case manual = "Ingresar clave"

        var id: Self { self }
    }

    /// Error que decidió tu lógica, p. ej. "La clave no es Base32 válido".
    var errorMessage: String?
    /// Tu vista de cámara. nil = se muestra un marcador de posición.
    var cameraView: AnyView?
    var onCancel: () -> Void
    /// Te entrega lo escrito en "Ingresar clave". Validarlo es tu lógica.
    var onSubmitManual: (ManualAccountEntry) -> Void

    @State private var mode: Mode
    @State private var entry = ManualAccountEntry()
    @FocusState private var focusedField: Field?

    private enum Field {
        case issuer, accountName, secret
    }

    init(
        initialMode: Mode = .scan,
        errorMessage: String? = nil,
        cameraView: AnyView? = nil,
        onCancel: @escaping () -> Void = {},
        onSubmitManual: @escaping (ManualAccountEntry) -> Void = { _ in }
    ) {
        _mode = State(initialValue: initialMode)
        self.errorMessage = errorMessage
        self.cameraView = cameraView
        self.onCancel = onCancel
        self.onSubmitManual = onSubmitManual
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                Picker("Método", selection: $mode) {
                    ForEach(Mode.allCases) { mode in
                        Text(mode.rawValue).tag(mode)
                    }
                }
                .pickerStyle(.segmented)
                .padding(.horizontal, 16)
                .padding(.vertical, 12)

                switch mode {
                case .scan:
                    scanSection
                case .manual:
                    manualForm
                }
            }
            .background(Theme.screenBackground)
            .navigationTitle("Agregar cuenta")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancelar", action: onCancel)
                }
            }
        }
    }

    // MARK: - Escanear

    private var scanSection: some View {
        ScrollView {
            VStack(spacing: 24) {
                ScannerFrameView {
                    if let cameraView {
                        cameraView
                    } else {
                        CameraPlaceholder()
                    }
                }
                .padding(.top, 8)

                VStack(spacing: 6) {
                    Text("Apunta al código QR")
                        .font(.title3.weight(.semibold))
                    Text("Lo encuentras en la web, en Seguridad → Activar 2FA.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }

                if let errorMessage {
                    ErrorLabel(message: errorMessage)
                }

                Button {
                    mode = .manual
                } label: {
                    Label("¿Sin cámara? Ingresa la clave a mano", systemImage: "keyboard")
                        .font(.subheadline.weight(.semibold))
                }
                .padding(.top, 4)
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 32)
            .frame(maxWidth: .infinity)
        }
    }

    // MARK: - Ingresar clave

    private var manualForm: some View {
        Form {
            Section("Cuenta") {
                TextField("Emisor (p. ej. Bóveda 2FA)", text: $entry.issuer)
                    .textContentType(.organizationName)
                    .focused($focusedField, equals: .issuer)
                    .submitLabel(.next)
                    .onSubmit { focusedField = .accountName }

                TextField("Usuario o correo", text: $entry.accountName)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .focused($focusedField, equals: .accountName)
                    .submitLabel(.next)
                    .onSubmit { focusedField = .secret }
            }

            Section {
                TextField("JBSW Y3DP EHPK 3PXP", text: $entry.secret, axis: .vertical)
                    .font(.body.monospaced())
                    .textInputAutocapitalization(.characters)
                    .autocorrectionDisabled()
                    .lineLimit(1...3)
                    .focused($focusedField, equals: .secret)
            } header: {
                Text("Clave secreta (Base32)")
            } footer: {
                Text("Es el texto que aparece bajo el QR en la web. Solo usa letras A–Z y números 2–7; los espacios no importan.")
            }

            if let errorMessage {
                Section {
                    ErrorLabel(message: errorMessage)
                }
            }

            Section {
                Button {
                    onSubmitManual(entry)
                } label: {
                    Text("Agregar cuenta")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                }
            }
        }
        .scrollContentBackground(.hidden)
    }
}

/// Mensaje de error con ícono (no depende solo del color).
struct ErrorLabel: View {
    let message: String

    var body: some View {
        Label(message, systemImage: "exclamationmark.triangle.fill")
            .font(.subheadline.weight(.medium))
            .foregroundStyle(Theme.danger)
    }
}

#Preview("Escanear") {
    AddAccountView()
}

#Preview("Ingresar clave") {
    AddAccountView(initialMode: .manual)
}

#Preview("Clave inválida") {
    AddAccountView(initialMode: .manual, errorMessage: "La clave tiene caracteres que no son Base32 (0, 1, 8 o 9).")
}
