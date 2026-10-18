These small runtime subsets support encrypted multiplayer on HTTP LAN pages,
where browsers do not expose WebCrypto. Secure pages use WebCrypto and the
native app uses its existing native crypto bridge. All paths share SHA-256
room derivation and AES-256-GCM messages.

- `noble-ciphers`: `@noble/ciphers` 2.4.0, official npm package.
  https://github.com/paulmillr/noble-ciphers
- `noble-hashes`: `@noble/hashes` 2.4.0, official npm package.
  https://github.com/paulmillr/noble-hashes

Each directory includes its original MIT license and package metadata. The
copied JavaScript files include only the required AES-GCM/SHA-256 dependency
trees. No build step or remote CDN is needed.
