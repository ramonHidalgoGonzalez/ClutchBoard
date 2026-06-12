import { buildMapLookupKeys, cleanMapName } from "@/lib/valorant-content"

describe("valorant-content", () => {
  it("cleans internal Riot map paths", () => {
    expect(cleanMapName("/Game/Maps/Foxtrot/Foxtrot")).toBe("Foxtrot")
    expect(cleanMapName("/Game/Maps/Bonsai/Bonsai")).toBe("Bonsai")
  })

  it("keeps already clean map names", () => {
    expect(cleanMapName("Ascent")).toBe("Ascent")
    expect(cleanMapName("Haven")).toBe("Haven")
  })

  it("builds lookup keys for ids and internal paths", () => {
    expect(buildMapLookupKeys("/Game/Maps/Foxtrot/Foxtrot", "Foxtrot")).toEqual(
      expect.arrayContaining(["/game/maps/foxtrot/foxtrot", "foxtrot"]),
    )
  })
})
