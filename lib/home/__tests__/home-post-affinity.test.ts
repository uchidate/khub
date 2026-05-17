import { describe, expect, it } from "vitest"
import { getHomePostAffinity, getHomePostAffinityScore, rankPostsByHomeAffinity } from "@/lib/home/home-post-affinity"

const signals = {
    artistIds: new Set(["artist-1"]),
    groupIds: new Set(["group-1"]),
    productionIds: new Set(["production-1"]),
}

describe("home post affinity", () => {
    it("scores posts related to currently important entities", () => {
        expect(getHomePostAffinityScore({
            relatedArtists: [{ artist: { id: "artist-1" } }],
            relatedGroups: [{ group: { id: "group-1" } }],
            relatedProductions: [{ production: { id: "production-1" } }],
        }, signals)).toBe(8)
    })

    it("describes which signals matched", () => {
        expect(getHomePostAffinity({
            relatedArtists: [{ artist: { id: "artist-1" } }],
            relatedProductions: [{ production: { id: "production-1" } }],
        }, signals)).toEqual({
            score: 5,
            matchedSignals: ["artist", "production"],
        })
    })

    it("uses custom weights when provided", () => {
        expect(getHomePostAffinity({
            relatedArtists: [{ artist: { id: "artist-1" } }],
            relatedProductions: [{ production: { id: "production-1" } }],
        }, signals, {
            artist: 5,
            group: 1,
            production: 4,
        }).score).toBe(9)
    })

    it("ranks affinity-matched posts first", () => {
        const ranked = rankPostsByHomeAffinity([
            { id: "plain" },
            { id: "artist", relatedArtists: [{ artist: { id: "artist-1" } }] },
            { id: "group", relatedGroups: [{ group: { id: "group-1" } }] },
        ], signals)

        expect(ranked.map((post) => post.id)).toEqual(["artist", "group", "plain"])
    })
})
