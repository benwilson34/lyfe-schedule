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
 * The main data transfer object for the Todo task model.
 */
export type TaskDto = {
  id?: string;
  userId: string;
  title: string;
  timeEstimateMins?: number;
  startDate: string;
  useStartTime?: boolean;
  rangeDays: number;
  endDate: string;
  useEndTime?: boolean;
  repeatDays?: number;
  // repeatIdiom?: string,
  isProjected?: boolean; // calculated field (not part of the data model)
  // TODO tags?: string[],
  completedDate?: string;
  actions?: Action[];
  priority?: number; // calculated field (not part of the data model)
};

export type CreateTaskDto = Omit<
  TaskDto,
  "id" | "userId" | "isProjected" | "priority"
>;

export type UpdateTaskDto = Partial<
  Omit<TaskDto, "id" | "userId" | "isProjected" | "priority" | "actions">
>;
