import { describe, expect, it } from "vitest"
import { productionFreshness, scoreHomeCandidate } from "@/lib/home/home-scoring"

describe("home scoring", () => {
    it("prioritizes direct links over weaker fallbacks", () => {
        const direct = scoreHomeCandidate({ reason: "linked_directly" })
        const fallback = scoreHomeCandidate({ reason: "artist_cast", voteAverage: 10, year: 2026, now: new Date("2026-05-17") })

        expect(direct.total).toBeGreaterThan(fallback.total)
    })

    it("caps trend contribution", () => {
        const score = scoreHomeCandidate({ reason: "trending_artist", trendingScore: 999 })
        expect(score.trend).toBe(25)
    })

    it("rewards fresher productions", () => {
        expect(productionFreshness(2026, new Date("2026-05-17"))).toBeGreaterThan(
            productionFreshness(2010, new Date("2026-05-17"))
        )
    })

    it("rewards stronger streaming ranks", () => {
        const rankOne = scoreHomeCandidate({ reason: "streaming_rank", rank: 1 })
        const rankTen = scoreHomeCandidate({ reason: "streaming_rank", rank: 10 })

        expect(rankOne.total).toBeGreaterThan(rankTen.total)
    })
})
