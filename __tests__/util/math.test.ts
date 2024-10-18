// import the unit under test last to ensure mocks are put in place
import { lerp } from "@/util/math";

describe("utils/math module", () => {
  describe("lerp", () => {
    const TEST_MIN_VALUE = 4;
    const TEST_MAX_VALUE = 12;

    it("returns the minimum value in the range when t=0", () => {
      const testT = 0;
      const result = lerp(TEST_MIN_VALUE, TEST_MAX_VALUE, testT);
      expect(result).toEqual(TEST_MIN_VALUE);
    });

    it("returns the maximum value in the range when t=1", () => {
      const testT = 1;
      const result = lerp(TEST_MIN_VALUE, TEST_MAX_VALUE, testT);
      expect(result).toEqual(TEST_MAX_VALUE);
    });
    
    it("returns the lerp'd value when 0<t<1", () => {
      const testT = 0.25;
      const expectedValue = 6;
      const result = lerp(TEST_MIN_VALUE, TEST_MAX_VALUE, testT);
      expect(result).toEqual(expectedValue);
    });
    
    it("returns the lerp'd value when t>1", () => {
      const testT = 1.25;
      const expectedValue = 14;
      const result = lerp(TEST_MIN_VALUE, TEST_MAX_VALUE, testT);
      expect(result).toEqual(expectedValue);
    });
  });
});
