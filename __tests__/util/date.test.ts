// not going to mock Dayjs
import dayjs from "@/lib/dayjs";
// not going to mock lerp

// import the unit under test last to ensure mocks are put in place
import { asEndDate, getCanonicalDatestring, stripOffset } from "@/util/date";

describe("utils/date module", () => {
  describe("stripOffset", () => {
    // TODO revisit the usage of this function and sanity check
    it.todo("returns the date without the timezone offset");
    // it("returns the date without the timezone offset", () => {
    //   const date = dayjs.utc("2024-10-05T12:34:56+04:00");
    //   const expectedDate = dayjs.utc("2024-10-05T12:34:56Z");
    //   const result = stripOffset(date);
    //   expect(result).toEqual(expectedDate);
    // })
  });

  describe("getCanonicalDatestring", () => {
    it("returns the canonical datestring", () => {
      const date = dayjs.utc("2024-10-05T12:34:56Z");
      const result = getCanonicalDatestring(date);
      expect(result).toEqual("2024-10-05T12:34:56.000");
    });
  });
});
