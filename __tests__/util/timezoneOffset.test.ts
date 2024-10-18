// not going to mock next/NextApiRequest
import type { NextApiRequest } from "next";
import { setupMockDate, MockDateSetup } from "@/util/test-helpers";

// import the unit under test last to ensure mocks are put in place
import {
  getTimezoneOffsetFromHeader,
  getTimezoneOffsetHeader,
} from "@/util/timezoneOffset";

describe("utils/timezoneOffset module", () => {
  describe("getTimezoneOffsetHeader", () => {
    let mockDate: MockDateSetup;

    beforeEach(() => {
      mockDate = setupMockDate();
    });

    afterEach(() => {
      mockDate.reset();
    });

    it("returns a dictionary with the timezone offset header defined", () => {
      mockDate.set({ isoDate: "2024-10-05T12:34:56Z", offset: -360 }); // idk why offset has to be negative
      const result1 = getTimezoneOffsetHeader();
      expect(result1).toEqual({ "X-Timezone-Offset": "360" });

      mockDate.set({ isoDate: "2024-10-05T12:34:56Z", offset: -480 }); // idk why offset has to be negative
      const result2 = getTimezoneOffsetHeader();
      expect(result2).toEqual({ "X-Timezone-Offset": "480" });
    });
  });

  describe("getTimezoneOffsetFromHeader", () => {
    it("returns null if the header is not defined", () => {
      const testReq: Partial<NextApiRequest> = {
        headers: {},
      };
      const result = getTimezoneOffsetFromHeader(testReq as NextApiRequest);
      expect(result).toBeNull();
    });

    it("returns the offset in minutes if the header is defined", () => {
      const testReq: Partial<NextApiRequest> = {
        headers: { "x-timezone-offset": "480" },
      };
      const result = getTimezoneOffsetFromHeader(testReq as NextApiRequest);
      expect(result).toEqual(480);
    });
  });
});
