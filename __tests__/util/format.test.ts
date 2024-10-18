// not going to mock Dayjs
import dayjs from "@/lib/dayjs";

// import the unit under test last to ensure mocks are put in place
import {
  formatDayKey,
  formatFriendlyFullDate,
  formatPercentage,
  formatRepeatInterval,
  formatShownDate,
  formatTimeEstimate,
} from "@/util/format";

describe("utils/format module", () => {
  const testDay = dayjs.utc("2024-10-05T12:34:56.789Z");

  describe("formatDayKey", () => {
    it("returns formatted string", () => {
      const result = formatDayKey(testDay);
      expect(result).toEqual("2024-10-05");
    });
  });

  describe("formatShownDate", () => {
    it("returns formatted string", () => {
      const result = formatShownDate(testDay);
      expect(result).toEqual("Sat Oct 5");
    });
  });

  describe("formatFriendlyFullDate", () => {
    it("returns formatted string", () => {
      const result = formatFriendlyFullDate(testDay);
      expect(result).toEqual("Saturday 2024-10-05 12:34:56 +00:00");
    });
  });

  describe("formatTimeEstimate", () => {
    it("returns empty string when the time estimate = 0", () => {
      const timeEstimateMins = 0;
      const result = formatTimeEstimate(timeEstimateMins);
      expect(result).toEqual("");
    });

    it("returns string with only minutes", () => {
      const timeEstimateMins = 59;
      const result = formatTimeEstimate(timeEstimateMins);
      expect(result).toEqual("59m");
    });

    it("returns string with only hours", () => {
      const timeEstimateMins = 3 * 60;
      const result = formatTimeEstimate(timeEstimateMins);
      expect(result).toEqual("3h");
    });

    it("returns string with hours and minutes", () => {
      const timeEstimateMins = 3 * 60 + 18;
      const result = formatTimeEstimate(timeEstimateMins);
      expect(result).toEqual("3h18m");
    });
  });

  describe("formatPercentage", () => {
    it("returns formatted string", () => {
      const float = 0.03;
      const expectedString = "3%";
      const result = formatPercentage(float);
      expect(result).toEqual(expectedString);
    });

    it("returns rounded formatted string when percentage has a fractional component", () => {
      const float = 0.038;
      const expectedString = "4%";
      const result = formatPercentage(float);
      expect(result).toEqual(expectedString);
    });
  });

  describe("formatRepeatInterval", () => {
    it("returns empty string when repeatDays=0", () => {
      const repeatDays = 0;
      const result = formatRepeatInterval(repeatDays);
      expect(result).toEqual("");
    });

    it("returns formatted string", () => {
      const repeatDays = 100;
      const expectedString = "100d";
      const result = formatRepeatInterval(repeatDays);
      expect(result).toEqual(expectedString);
    });
  });
});
