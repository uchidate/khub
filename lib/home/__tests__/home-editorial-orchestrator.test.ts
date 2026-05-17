import { describe, expect, it } from "vitest"
import { orchestrateEditorialSelection } from "@/lib/home/home-editorial-orchestrator"

const post = (id: string, category: string) => ({
    id,
    featured: false,
    publishedAt: new Date("2026-05-17"),
    viewCount: 0,
    category: { slug: category },
})

describe("home editorial orchestrator", () => {
    it("respects the category cap before relaxing it", () => {
        const result = orchestrateEditorialSelection({
            posts: [post("a", "news"), post("b", "news"), post("c", "groups")],
            count: 2,
            maxPerCategory: 1,
        })

        expect(result.items.map((item) => item.id)).toEqual(["a", "c"])
        expect(result.meta.relaxedCategoryCap).toBe(false)
    })

    it("relaxes the category cap when inventory is insufficient", () => {
        const result = orchestrateEditorialSelection({
            posts: [post("a", "news"), post("b", "news")],
            count: 2,
            maxPerCategory: 1,
        })

        expect(result.items.map((item) => item.id)).toEqual(["a", "b"])
        expect(result.meta.relaxedCategoryCap).toBe(true)
    })

    it("excludes posts already reserved by another slot", () => {
        const result = orchestrateEditorialSelection({
            posts: [post("a", "news"), post("b", "groups")],
            count: 1,
            maxPerCategory: 1,
            excludeIds: new Set(["a"]),
        })

        expect(result.items.map((item) => item.id)).toEqual(["b"])
    })
})
