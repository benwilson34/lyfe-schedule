import { Dayjs } from "@/lib/dayjs";
import { Modify, Patchable } from "@/util/types";

export type BaseAction = {
  timestamp: string | Date | Dayjs;
};

export type ActionDto = Modify<
  BaseAction,
  {
    timestamp: string;
  }
>;

export type PostponeActionDto = ActionDto & {
  postponeUntilDate: string;
};

export function isPostponeAction<
  BaseAction extends {
    postponeUntilDate?: string | Date | Dayjs;
  },
>(action: BaseAction): boolean {
  return action.postponeUntilDate !== undefined;
}

export function isPostponeActionDto(
  action: ActionDto
): action is PostponeActionDto {
  // sufficient for now, maybe eventually there will be some `action.type` field to check instead
  return (action as PostponeActionDto).postponeUntilDate !== undefined;
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
  tags?: string[];
  completedDate?: string;
  actions?: ActionDto[];
  priority?: number; // calculated field (not part of the data model)
};

export type CreateTaskDto = Omit<
  TaskDto,
  "id" | "userId" | "isProjected" | "priority"
>;

export type PatchTaskDto = Patchable<
  Omit<TaskDto, "id" | "userId" | "isProjected" | "priority" | "actions">
>;
