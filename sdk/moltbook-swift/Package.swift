// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "MoltbookFHE",
    platforms: [
        .macOS(.v13),
        .iOS(.v16)
    ],
    products: [
        .library(
            name: "MoltbookFHE",
            targets: ["MoltbookFHE"]),
    ],
    dependencies: [],
    targets: [
        .target(
            name: "MoltbookFHE",
            dependencies: [],
            path: "Sources"),
        .testTarget(
            name: "MoltbookFHETests",
            dependencies: ["MoltbookFHE"],
            path: "Tests"),
    ]
)
