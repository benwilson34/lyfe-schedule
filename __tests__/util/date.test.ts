// not going to mock Dayjs
import dayjs from "@/lib/dayjs";
// not going to mock lerp

// import the unit under test last to ensure mocks are put in place
import { asEndDate, calculatePriority, getCanonicalDatestring, stripOffset } from "@/util/date";

describe("utils/date module", () => {
  describe("calculatePriority", () => {
    it("returns 0.0 when currentDay is the same as startDate", () => {
      const startDate = dayjs("2024-10-05");
      const endDate = dayjs("2024-10-08");
      const currentDay = startDate;
      const result = calculatePriority(startDate, endDate, currentDay);
      expect(result).toEqual(0.0);
    });

    it("returns 1.0 when currentDay is same as endDate", () => {
      const startDate = dayjs("2024-10-05");
      const endDate = dayjs("2024-10-08");
      const currentDay = asEndDate(endDate);
      const result = calculatePriority(startDate, endDate, currentDay);
      expect(result).toEqual(1.0);
    });

    it("returns proportionate value when currentDay is between startDate and endDate", () => {
      const startDate = dayjs("2024-10-05");
      const endDate = dayjs("2024-10-08");
      const currentDay = asEndDate(dayjs("2024-10-07"));
      const result = calculatePriority(startDate, endDate, currentDay);
      expect(result).toEqual(0.75);
    });

    it("returns proportionate value when currentDay is after endDate", () => {
      const startDate = dayjs("2024-10-05");
      const endDate = dayjs("2024-10-08");
      const currentDay = asEndDate(dayjs("2024-10-11"));
      const result = calculatePriority(startDate, endDate, currentDay);
      expect(result).toEqual(1.75);
    });
  });

  describe("stripOffset", () => {
    // TODO revisit the usage of this function and sanity check
    it.todo("returns the date without the timezone offset");
    // it("returns the date without the timezone offset", () => {
    //   const date = dayjs.utc("2024-10-05T12:34:56+04:00");
    //   const expectedDate = dayjs.utc("2024-10-05T12:34:56Z");
    //   const result = stripOffset(date);
    //   expect(result).toEqual(expectedDate);
    // })
  })

  describe("getCanonicalDatestring", () => {
    it("returns the canonical datestring", () => {
      const date = dayjs.utc("2024-10-05T12:34:56Z");
      const result = getCanonicalDatestring(date);
      expect(result).toEqual("2024-10-05T12:34:56.000");
    });
  });
});
