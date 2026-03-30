import { countWords } from "../../src/common/utils/word-count";

describe("countWords", () => {
  it("counts words with extra spaces correctly", () => {
    expect(countWords("  This   is   a   test  ")).toBe(4);
  });

  it("returns 0 for empty text", () => {
    expect(countWords("")).toBe(0);
  });
});
