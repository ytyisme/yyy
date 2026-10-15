import Foundation
import WebKit

/// A stable, offline origin for the bundled game's modules, saves and media.
final class BundleSchemeHandler: NSObject, WKURLSchemeHandler {
    private let root: URL
    private let queue = DispatchQueue(label: "game.bundle.files", qos: .userInitiated)
    private let lock = NSLock()
    private var active = Set<ObjectIdentifier>()

    init(root: URL) { self.root = root.resolvingSymlinksInPath() }

    func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
        let id = ObjectIdentifier(urlSchemeTask)
        lock.lock(); active.insert(id); lock.unlock()
        let request = urlSchemeTask.request
        queue.async { [self] in
            let result = response(for: request)
            DispatchQueue.main.async { [self] in
                lock.lock(); let live = active.remove(id) != nil; lock.unlock()
                guard live else { return }
                switch result {
                case .success(let (response, data)):
                    urlSchemeTask.didReceive(response)
                    if !data.isEmpty { urlSchemeTask.didReceive(data) }
                    urlSchemeTask.didFinish()
                case .failure(let error): urlSchemeTask.didFailWithError(error)
                }
            }
        }
    }

    func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {
        lock.lock(); active.remove(ObjectIdentifier(urlSchemeTask)); lock.unlock()
    }

    private func response(for request: URLRequest) -> Result<(URLResponse, Data), Error> {
        guard let url = request.url, url.scheme == "lava", url.host == "localhost" else {
            return .failure(URLError(.unsupportedURL))
        }
        var path = url.path
        if path.hasSuffix("/") || path.isEmpty { path += "index.html" }
        let file = root.appendingPathComponent(path.trimmingCharacters(in: CharacterSet(charactersIn: "/")))
            .resolvingSymlinksInPath().standardizedFileURL
        guard file.path.hasPrefix(root.path + "/"),
              !path.split(separator: "/").contains(where: { $0.hasPrefix(".") }),
              ["GET", "HEAD"].contains(request.httpMethod ?? "GET"),
              let data = try? Data(contentsOf: file, options: .mappedIfSafe) else {
            return .success((HTTPURLResponse(url: url, statusCode: 404, httpVersion: "HTTP/1.1",
                headerFields: ["Content-Type": "text/plain"])!, Data("Not found".utf8)))
        }
        var headers = ["Content-Type": Self.mimeType(file.pathExtension),
                       "Access-Control-Allow-Origin": "*", "Accept-Ranges": "bytes",
                       "Cache-Control": "no-cache", "Content-Length": String(data.count)]
        var status = 200
        var body = data
        if let range = request.value(forHTTPHeaderField: "Range"), range.hasPrefix("bytes=") {
            let parts = range.dropFirst(6).split(separator: "-", omittingEmptySubsequences: false)
            if parts.count == 2, !range.contains(",") {
                let start: Int
                let end: Int
                if parts[0].isEmpty, let suffix = Int(parts[1]), suffix > 0 {
                    start = max(0, data.count - suffix); end = data.count - 1
                } else {
                    start = Int(parts[0]) ?? -1
                    end = parts[1].isEmpty ? data.count - 1 : min(Int(parts[1]) ?? -1, data.count - 1)
                }
                guard start >= 0, start <= end, start < data.count else {
                    headers["Content-Range"] = "bytes */\(data.count)"; headers["Content-Length"] = "0"
                    return .success((HTTPURLResponse(url: url, statusCode: 416, httpVersion: "HTTP/1.1", headerFields: headers)!, Data()))
                }
                status = 206; body = data.subdata(in: start..<(end + 1))
                headers["Content-Range"] = "bytes \(start)-\(end)/\(data.count)"
                headers["Content-Length"] = String(body.count)
            }
        }
        if request.httpMethod == "HEAD" { body = Data() }
        return .success((HTTPURLResponse(url: url, statusCode: status, httpVersion: "HTTP/1.1", headerFields: headers)!, body))
    }

    private static func mimeType(_ ext: String) -> String {
        switch ext.lowercased() {
        case "html": return "text/html; charset=utf-8"
        case "js", "mjs": return "text/javascript; charset=utf-8"
        case "css": return "text/css; charset=utf-8"
        case "json", "webmanifest": return "application/json; charset=utf-8"
        case "png": return "image/png"
        case "jpg", "jpeg": return "image/jpeg"
        case "svg": return "image/svg+xml"
        case "mp4": return "video/mp4"
        case "m4a": return "audio/mp4"
        case "mp3": return "audio/mpeg"
        case "wav": return "audio/wav"
        case "ogg": return "audio/ogg"
        case "txt": return "text/plain; charset=utf-8"
        default: return "application/octet-stream"
        }
    }
}
