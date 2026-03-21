// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "FHEMoltis",
    platforms: [
        .macOS(.v13),
        .iOS(.v16)
    ],
    products: [
        .library(
            name: "FHEMoltis",
            targets: ["FHEMoltis"]),
    ],
    dependencies: [],
    targets: [
        .target(
            name: "FHEMoltis",
            dependencies: [],
            path: "Sources"),
        .testTarget(
            name: "FHEMoltisTests",
            dependencies: ["FHEMoltis"],
            path: "Tests"),
    ]
)
