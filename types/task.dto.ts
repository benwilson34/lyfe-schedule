export type Action = {
  timestamp: Date;
};

export type PostponeAction = Action & {
  postponeUntilDate: Date;
};

export function isPostponeAction(action: Action): action is PostponeAction {
  return (action as PostponeAction).postponeUntilDate !== undefined;
}

/**
 * The data transfer object for the Todo task model. Note that this contract is used for:
 *   - retrieving task objects (GET)
 *   - creating task objects (POST)
 *   - updating 1 or more fields of task object (PATCH)
 *   - deleting task objects (DELETE)
 */
export type TaskDto = {
  id?: string,
  title: string,
  timeEstimateMins?: number,
  startDate: string, // TODO use some IsoDateString type
  useStartTime?: boolean, 
  rangeDays: number,
  endDate: string, // TODO use some IsoDateString type
  useEndTime?: boolean, 
  repeatDays?: number,
  // repeatIdiom?: string,
  isProjected?: boolean, // calculated field (not part of the data model)
  // TODO tags?: string[],
  completedDate?: string, // TODO use some IsoDateString type
  actions?: Action[];
}
