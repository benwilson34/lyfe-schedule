/**
 * The data transfer object for the Todo task model. Note that this contract is used for:
 *   - retrieving task objects (GET)
 *   - creating task objects (POST)
 *   - updating 1 or more fields of task object (PATCH)
 *   - deleting task objects (DELETE)
 * 
 * None of these fields are guaranteed by either the frontend or the backend, so they both need
 *   to validate whatever they care about. 
 */
export interface TaskDto {
  id?: string,
  title?: string,
  timeEstimateMins?: number,
  startDate?: Date, // TODO convert to just ISO8601 strings
  rangeDays?: number,
  endDate?: Date, // TODO convert to just ISO8601 strings
  repeatDays?: number,
  repeatIdiom?: string,
  // TODO tags?: string[],
  completedDate?: Date, // TODO convert to just ISO8601 strings
  // TODO postponeUntil?: dayjs.Dayjs
}
