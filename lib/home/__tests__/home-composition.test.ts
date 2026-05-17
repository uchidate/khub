import { describe, expect, it } from "vitest"
import { buildHomeComposition } from "@/lib/home/home-composition"

describe("home composition", () => {
    it("prioritizes editorial flow when recent publishing is strong", () => {
        expect(buildHomeComposition({
            recentArticleCount: 6,
            streamingPlatformCount: 3,
            streamingShowCount: 20,
        }).mode).toBe("editorial")
    })

    it("prioritizes watch flow when streaming activity is strong", () => {
        expect(buildHomeComposition({
            recentArticleCount: 2,
            streamingPlatformCount: 2,
            streamingShowCount: 6,
        }).mode).toBe("watch")
    })

    it("keeps a balanced flow when no signal dominates", () => {
        expect(buildHomeComposition({
            recentArticleCount: 3,
            streamingPlatformCount: 1,
            streamingShowCount: 4,
        }).mode).toBe("balanced")
    })
})
