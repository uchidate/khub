import { describe, expect, it, vi } from "vitest"

vi.mock("@/lib/prisma", () => ({
    default: {
        blogPost: {
            findFirst: vi.fn().mockResolvedValue(null),
        },
    },
}))

import { buildTrendingCluster } from "@/lib/home/home-clusters"

describe("home clusters", () => {
    it("hides the trending cluster when it only repeats the now strip", async () => {
        const cluster = await buildTrendingCluster({
            artist: {
                id: "artist-1",
                slug: "artist-1",
                nameRomanized: "Artist",
                primaryImageUrl: null,
                trendingScore: 10,
            },
            group: {
                id: "group-1",
                slug: "group-1",
                name: "Group",
                profileImageUrl: null,
                trendingScore: 10,
            },
            production: {
                id: "production-1",
                title: "Production",
                posterUrl: null,
                rank: 1,
            },
            excludeHrefs: new Set([
                "/artists/artist-1",
                "/groups/group-1",
                "/productions/production-1",
            ]),
        })

        expect(cluster).toBeNull()
    })
})
