import { describe, expect, it } from "vitest"
import {
    collectHomeEntityKeys,
    homeEntityKey,
    selectDistinctItems,
    selectDistinctRotatingItem,
} from "@/lib/home/home-diversity"

describe("home diversity", () => {
    it("collects canonical entity keys", () => {
        const keys = collectHomeEntityKeys([
            { type: "artist", href: "/artists/jisoo" },
            { type: "group", href: "/groups/blackpink" },
        ])

        expect(keys.has(homeEntityKey("artist", "/artists/jisoo"))).toBe(true)
        expect(keys.has(homeEntityKey("group", "/groups/blackpink"))).toBe(true)
    })

    it("rotates to the first non-excluded candidate", () => {
        const items = ["a", "b", "c"]
        const result = selectDistinctRotatingItem({
            items,
            getKey: (item) => item,
            excludedKeys: new Set(["b"]),
            startIndex: 1,
        })

        expect(result).toBe("c")
    })

    it("falls back to the rotated item when every candidate is excluded", () => {
        const result = selectDistinctRotatingItem({
            items: ["a", "b"],
            getKey: (item) => item,
            excludedKeys: new Set(["a", "b"]),
            startIndex: 1,
        })

        expect(result).toBe("b")
    })

    it("selects unique candidates before filling from excluded ones", () => {
        const result = selectDistinctItems({
            items: ["a", "b", "c"],
            getKey: (item) => item,
            excludedKeys: new Set(["a"]),
            limit: 3,
        })

        expect(result).toEqual(["b", "c", "a"])
    })
})
