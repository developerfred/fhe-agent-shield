const std = @import("std");

pub fn build(b: *std.Build) void {
    const target = b.standardTargetOptions(.{});
    const optimize = b.standardOptimizeOption(.{});

    // FHE Agent Shield SDK for NullClaw
    const lib = b.addModule("fhe_agent_shield", .{
        .root_source_file = b.path("src/main.zig"),
    });
    _ = lib; // suppress unused warning

    // Add tests
    const tests = b.addTest(.{
        .root_source_file = b.path("src/main.zig"),
        .target = target,
        .optimize = optimize,
    });

    const test_run = b.addRunArtifact(tests);
    const test_step = b.step("test", "Run tests");
    test_step.dependOn(&test_run.step);
}
