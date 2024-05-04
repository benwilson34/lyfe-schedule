/**
 * see https://github.com/iamkun/dayjs/issues/1577#issuecomment-1863489977
 */

import dayjs, { Dayjs, isDayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
// import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
// dayjs.extend(timezone);

// dayjs.tz.setDefault('UTC'); // I'm not convinced this is necessary

export default dayjs;
export { Dayjs, isDayjs };
