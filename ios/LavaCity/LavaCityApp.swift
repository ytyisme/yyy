import SwiftUI

@main
struct LavaCityApp: App {
    var body: some Scene {
        WindowGroup {
            GameView()
                .statusBarHidden()
        }
    }
}
