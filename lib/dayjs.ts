/**
 * see https://github.com/iamkun/dayjs/issues/1577#issuecomment-1863489977
 */

import dayjs, { Dayjs, isDayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
// import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
// dayjs.extend(timezone);

export default dayjs;
export { Dayjs, isDayjs };
