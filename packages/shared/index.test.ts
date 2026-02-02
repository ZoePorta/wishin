import { add } from "@wishin/shared";

describe("Shared Package", () => {
  it("should add two numbers", () => {
    expect(add(1, 2)).toBe(3);
  });
});
