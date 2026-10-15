# 岩浆跑酷 · iPhone / iPad 应用

2026-10-11 14:20（北京时间），Xcode 已确认版本 **1.0 (1)** 上传 App Store Connect
成功，应用记录名称为“岩浆跑酷 · 自由城市”。尚未提交 App Review，也未公开上架。
机器可读上传记录保存在 `upload-status.json`。签名归档保存在 `LavaCity.xcarchive`。

Xcode 工程：`LavaCity.xcodeproj`，共享 Scheme：`LavaCity`。
最低版本 iOS / iPadOS 17。版本 1.0，Bundle ID `com.yangtianyu.lavagame`，
签名团队 `455Q9Y5K6Z`（Tianyu Yang）。无需 CocoaPods 或其他第三方原生依赖。

## 构建

```sh
rtk proxy python3 scripts/prepare-ios-app.py
rtk proxy env DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer xcodebuild \
  -project ios/LavaCity.xcodeproj -scheme LavaCity -configuration Release \
  -destination 'generic/platform=iOS' -archivePath ios/LavaCity.xcarchive \
  -derivedDataPath ios/build-ios -allowProvisioningUpdates archive
rtk proxy env DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer xcodebuild \
  -exportArchive -archivePath ios/LavaCity.xcarchive -exportPath ios/export \
  -exportOptionsPlist ios/ExportOptions.plist -allowProvisioningUpdates
```

构建阶段自动执行资源准备脚本；上述命令在仓库根目录运行。
资源只包含游戏运行文件，排除服务器代码、环境配置、验证码数据库和密钥。
过大的音频优先使用既有网站发布副本，原始文件保留。

应用用公开的 `WKURLSchemeHandler` 加载内置文件，包含 Three.js、两季关卡、
自由城市和本地影音。设备上的 `WKWebsiteDataStore` 保存进度。网络电影和在线联机
仍需要网络。演示登录不发短信，支持虚拟号码 `13800000000`，也可游客试玩。
右上角原生游戏菜单提供主页、返回、重新加载和隐私说明。

## 上传和上架

生成签名归档及 IPA 只代表本地打包成功。请以 Xcode Organizer 的
“Uploaded to Apple”或 App Store Connect 的构建记录为上传成功证据。
公开上架还需要应用记录、商店说明、真实 iPhone/iPad 截图、年龄分级、隐私和支持网址、
审核联系信息及适用地区所需资料，再提交 Apple 审核。

用户已确认游戏现有歌曲和电影片段有应用分发授权。提交时仍须按实际内容回答
年龄分级、网络电影和联机聊天的数据使用问题，不要填写虚构的资质或联系信息。
现有私人网站的访问权限与 App Store 发行独立，工程不会修改网站权限。

本机未安装 iOS 模拟器运行时；Mac Catalyst 测试版已经启动，游客登录和
Three.js 自由城市画面可正常加载。iPhone / iPad 真机交互仍需验证。

本机 Mac Catalyst 测试时，macOS 27 WebKit 的文本输入辅助功能操作曾触发
WebContent 的数组越界崩溃。游客入口和城市运行正常；后续真机测试应重点验证
演示码输入，不能把 Mac 辅助功能测试结果当作 iPhone 已测试。

`export/LavaCity.ipa` 是首次成功导出的副本。上传使用随后更新的签名归档，
已移除原生主页里的浏览器安装提示。第二次本地导出在 Mac 锁屏后停在钥匙串
签名步骤，已停止；解锁后可运行上面的导出命令取得与上传版本一致的 IPA。

2026-10-11：已同步城市扩建资源，项目下一次构建号改为2。现有归档和App Store Connect已上传构建仍是1；构建2尚未归档或上传。网页版本已加入医院、银行、城际高速、游戏手机与写字楼工资。
