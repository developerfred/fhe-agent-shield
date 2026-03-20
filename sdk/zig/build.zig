const std = @import("std");

pub fn build(b: *std.Build) void {
    const target = b.standardTargetOptions(.{});
    const optimize = b.standardOptimizeOption(.{});

    // FHE Agent Shield SDK for NullClaw
    const sdk = b.addStaticLibrary(.{
        .name = "fhe_agent_shield_zig",
        .root_source_file = b.path("src/main.zig"),
        .target = target,
        .optimize = optimize,
    });

    sdk.linkLibC();

    b.installArtifact(sdk);

    // Add tests
    const tests = b.addTest(.{
        .root_source_file = b.path("src/main.zig"),
        .target = target,
        .optimize = optimize,
    });

    const test_run = b.addRunArtifact(tests);
    test_run.step.dependOn(b.getInstallTestStep());

    const test_step = b.step("test", "Run tests");
    test_step.dependOn(&test_run.step);
}
