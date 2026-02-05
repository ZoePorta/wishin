import { add } from "./src";

describe("Shared Package", () => {
  it("should add two numbers", () => {
    expect(add(1, 2)).toBe(3);
  });
});
