import SwiftUI

/// Raíz de la app: conecta las vistas con el ViewModel.
struct ContentView: View {
    @State private var viewModel = AccountsViewModel()
    @State private var isAddingAccount = false

    var body: some View {
        // Se redibuja cada segundo: código y anillo se recalculan en el iPhone, sin internet.
        TimelineView(.periodic(from: .now, by: 1)) { context in
            AccountsListView(
                accounts: viewModel.cards(at: context.date),
                toastMessage: viewModel.toastMessage,
                onAdd: {
                    viewModel.addError = nil
                    isAddingAccount = true
                },
                onCopy: { viewModel.copy($0) },
                onDelete: { viewModel.delete($0.id) }
            )
        }
        .sheet(isPresented: $isAddingAccount) {
            AddAccountView(
                initialMode: QRScannerView.isAvailable ? .scan : .manual,
                errorMessage: viewModel.addError,
                cameraView: QRScannerView.isAvailable ? AnyView(scanner) : nil,
                onCancel: { isAddingAccount = false },
                onSubmitManual: { entry in
                    if viewModel.addManual(entry) { isAddingAccount = false }
                }
            )
        }
    }

    private var scanner: some View {
        QRScannerView { payload in
            let added = viewModel.addFromQR(payload)
            if added { isAddingAccount = false }
            return added
        }
    }
}
