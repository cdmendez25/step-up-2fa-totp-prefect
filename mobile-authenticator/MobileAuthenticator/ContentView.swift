import SwiftUI

/// Raíz de la app: une las vistas. Aquí se conecta tu lógica.
struct ContentView: View {
    // TODO(tú): reemplaza este arreglo vacío por las cuentas de tu ViewModel
    // (con el código y los segundos restantes que calcule tu TOTP).
    private let accounts: [AccountCardModel] = []

    @State private var isAddingAccount = false

    var body: some View {
        AccountsListView(
            accounts: accounts,
            onAdd: { isAddingAccount = true },
            onCopy: { _ in
                // TODO(tú): copiar el código al portapapeles y mostrar el toast.
            },
            onDelete: { _ in
                // TODO(tú): eliminar la cuenta (y su secreto) del almacenamiento.
            }
        )
        .sheet(isPresented: $isAddingAccount) {
            AddAccountView(
                onCancel: { isAddingAccount = false },
                onSubmitManual: { _ in
                    // TODO(tú): validar el Base32, guardar la cuenta y cerrar la hoja.
                }
            )
        }
    }
}

#Preview {
    ContentView()
}
