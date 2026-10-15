import SwiftUI
import WebKit
import CryptoKit

// The bundled lava:// pages use this bridge when Web Crypto requires HTTPS.
final class RoomCryptoBridge: NSObject, WKScriptMessageHandlerWithReply {
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage, replyHandler: @escaping (Any?, String?) -> Void) {
        guard message.frameInfo.isMainFrame, message.frameInfo.request.url?.scheme == "lava",
              let body = message.body as? [String: String], let op = body["op"],
              let encoded = body["data"], let data = Data(base64Encoded: encoded), data.count <= 16384 else {
            replyHandler(nil, "Invalid room crypto request"); return
        }
        do {
            let result: Data
            if op == "digest" { result = Data(SHA256.hash(data: data)) }
            else {
                guard let rawKey = body["key"], let keyData = Data(base64Encoded: rawKey), keyData.count == 32,
                      let rawIV = body["iv"], let iv = Data(base64Encoded: rawIV), iv.count == 12 else {
                    replyHandler(nil, "Invalid room key"); return
                }
                let key = SymmetricKey(data: keyData), nonce = try AES.GCM.Nonce(data: iv)
                if op == "seal" {
                    let sealed = try AES.GCM.seal(data, using: key, nonce: nonce)
                    result = sealed.ciphertext + sealed.tag
                } else if op == "open", data.count >= 16 {
                    let sealed = try AES.GCM.SealedBox(nonce: nonce, ciphertext: data.dropLast(16), tag: data.suffix(16))
                    result = try AES.GCM.open(sealed, using: key)
                } else { replyHandler(nil, "Unknown room crypto operation"); return }
            }
            replyHandler(result.base64EncodedString(), nil)
        } catch { replyHandler(nil, "Invalid room message") }
    }
}

@MainActor
final class GameBrowser: NSObject, ObservableObject, WKNavigationDelegate, WKUIDelegate {
    @Published var errorMessage: String?
    let webView: WKWebView
    private let roomCrypto = RoomCryptoBridge()

    override init() {
        let config = WKWebViewConfiguration()
        config.setURLSchemeHandler(BundleSchemeHandler(root: Bundle.main.url(forResource: "Web", withExtension: nil)!), forURLScheme: "lava")
        config.websiteDataStore = .default()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        config.userContentController.addUserScript(WKUserScript(source: "window.GAME_NATIVE_APP=true;", injectionTime: .atDocumentStart, forMainFrameOnly: true))
        webView = WKWebView(frame: .zero, configuration: config)
        super.init()
        webView.navigationDelegate = self
        webView.uiDelegate = self
        config.userContentController.addScriptMessageHandler(roomCrypto, contentWorld: .page, name: "roomCrypto")
        webView.isOpaque = false
        webView.backgroundColor = UIColor(red: 0.08, green: 0.18, blue: 0.21, alpha: 1)
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.scrollView.keyboardDismissMode = .interactive
        webView.allowsBackForwardNavigationGestures = true
        #if DEBUG
        webView.isInspectable = true
        #endif
        open("phone-login/index.html")
    }

    func open(_ path: String) {
        errorMessage = nil
        webView.load(URLRequest(url: URL(string: "lava://localhost/" + path)!))
    }

    func guest() {
        webView.evaluateJavaScript("localStorage.setItem('lava-demo-phone-session',JSON.stringify({displayName:'玩家0000',maskedPhone:'游客',expires:Date.now()+604800000})); location.href='lava://localhost/app.html';")
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url else { decisionHandler(.cancel); return }
        if url.scheme == "lava", url.host == "localhost" { decisionHandler(.allow); return }
        if navigationAction.targetFrame?.isMainFrame == false { decisionHandler(.allow); return }
        if ["https", "http"].contains(url.scheme ?? "") { UIApplication.shared.open(url) }
        decisionHandler(.cancel)
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        if (error as NSError).code != NSURLErrorCancelled { errorMessage = "游戏暂时无法打开，请重试。" }
    }
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        if (error as NSError).code != NSURLErrorCancelled { errorMessage = "游戏页面加载失败，请重试。" }
    }
    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) { webView.reload() }
    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let url = navigationAction.request.url, ["https", "http"].contains(url.scheme ?? "") { UIApplication.shared.open(url) }
        return nil
    }
    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        presentAlert(message, completion: completionHandler)
    }
    private func presentAlert(_ message: String, completion: @escaping () -> Void) {
        guard let root = webView.window?.rootViewController else { completion(); return }
        let alert = UIAlertController(title: "岩浆跑酷", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "好", style: .default) { _ in completion() })
        root.present(alert, animated: true)
    }
}

struct GameWebView: UIViewRepresentable {
    let browser: GameBrowser
    func makeUIView(context: Context) -> WKWebView { browser.webView }
    func updateUIView(_ view: WKWebView, context: Context) {}
}

struct GameView: View {
    @StateObject private var browser = GameBrowser()
    var body: some View {
        ZStack(alignment: .topTrailing) {
            GameWebView(browser: browser).ignoresSafeArea(edges: .bottom)
            Menu {
                Button("游戏主页", systemImage: "house") { browser.open("app.html") }
                Button("游客试玩", systemImage: "play.circle") { browser.guest() }
                Button("返回上一页", systemImage: "arrow.left") { if browser.webView.canGoBack { browser.webView.goBack() } }
                Button("重新加载", systemImage: "arrow.clockwise") { browser.webView.reload() }
                Button("隐私说明", systemImage: "hand.raised") { browser.open("native-privacy.html") }
            } label: {
                Image(systemName: "ellipsis.circle.fill")
                    .font(.system(size: 30)).symbolRenderingMode(.palette)
                    .foregroundStyle(.white, Color(red: 0.15, green: 0.31, blue: 0.33))
                    .padding(10)
            }.accessibilityLabel("游戏菜单")
            if let message = browser.errorMessage {
                VStack(spacing: 16) {
                    Text(message).foregroundStyle(.white)
                    Button("重新打开") { browser.open("phone-login/index.html") }.buttonStyle(.borderedProminent)
                }.frame(maxWidth: .infinity, maxHeight: .infinity).background(Color(red: 0.08, green: 0.18, blue: 0.21))
            }
        }.background(Color(red: 0.08, green: 0.18, blue: 0.21))
    }
}
