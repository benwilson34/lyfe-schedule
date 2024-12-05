import { type TaskViewModel as Task } from "@/types/task.viewModel";
import type {
  ActionDto,
  BaseAction,
  PostponeActionDto,
} from "@/types/task.dto";
// not going to mock isPostponeAction
import dayjs from "@/lib/dayjs";
// not going to mock Dayjs
// not going to mock lodash
import { asEndDate } from "@/util/date";
import MockCurrentDate from "mockdate";

// import the unit under test last to ensure mocks are put in place
import {
  calculatePriority,
  calculateRangeDays,
  getLastPostponeUntilDay,
  getTasksForDay,
  isPostponeDateValid,
  sortTasksByEndDate,
  sortTasksByRange,
  sortTasksByRepeatInterval,
  sortTasksByStartDate,
  sortTasksByTimeEstimate,
} from "@/util/task";

describe("utils/task module", () => {
  describe("calculateRangeDays", () => {
    it("returns 1 when the startDate and endDate are the same", () => {
      const date = dayjs("2024-10-01");
      const result = calculateRangeDays(date, date);
      expect(result).toBe(1);
    });

    it("returns the calculated range when startDate and endDate are different", () => {
      const startDate = dayjs("2024-10-01");
      const endDate = dayjs("2024-10-05");
      const result = calculateRangeDays(startDate, endDate);
      expect(result).toBe(5);
    });
  });

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

  describe("getTasksForDay", () => {
    function prepareTaskArray(tasks: { id: number }[]) {
      return tasks.map((task) => task.id).sort();
    }

    it("returns incomplete tasks from the target day and before and completed tasks from target day when target day is before current day", () => {
      const tasks = [
        {
          id: 1,
          startDate: dayjs("2024-11-12"),
          endDate: dayjs("2024-11-13"),
          completedDate: dayjs("2024-11-13"),
        },
        {
          id: 2,
          startDate: dayjs("2024-11-14"),
          endDate: dayjs("2024-11-15"),
        },
        {
          id: 3,
          startDate: dayjs("2024-11-16"),
          endDate: dayjs("2024-11-17"),
          completedDate: dayjs("2024-11-18"),
        },
        {
          id: 4,
          startDate: dayjs("2024-11-18"),
          endDate: dayjs("2024-11-19"),
        },
        {
          id: 5,
          startDate: dayjs("2024-11-20"),
          endDate: dayjs("2024-11-21"),
        },
      ];
      const expectedTasks = [{ id: 2 }, { id: 3 }, { id: 4 }];
      const targetDay = dayjs("2024-11-18");
      const currentDay = dayjs("2024-11-20");
      const resultTasks = getTasksForDay(tasks, targetDay, currentDay);
      expect(prepareTaskArray(resultTasks)).toEqual(
        prepareTaskArray(expectedTasks)
      );
    });

    it("returns incomplete tasks from the target day and before and completed tasks from target day when target day equals current day", () => {
      const tasks = [
        {
          id: 1,
          startDate: dayjs("2024-11-12"),
          endDate: dayjs("2024-11-13"),
          completedDate: dayjs("2024-11-13"),
        },
        {
          id: 2,
          startDate: dayjs("2024-11-14"),
          endDate: dayjs("2024-11-15"),
        },
        {
          id: 3,
          startDate: dayjs("2024-11-16"),
          endDate: dayjs("2024-11-17"),
          completedDate: dayjs("2024-11-18"),
        },
        {
          id: 4,
          startDate: dayjs("2024-11-18"),
          endDate: dayjs("2024-11-19"),
        },
        {
          id: 5,
          startDate: dayjs("2024-11-20"),
          endDate: dayjs("2024-11-21"),
        },
      ];
      const expectedTasks = [{ id: 2 }, { id: 3 }, { id: 4 }];
      const targetDay = dayjs("2024-11-18");
      const currentDay = dayjs("2024-11-18");
      const resultTasks = getTasksForDay(tasks, targetDay, currentDay);
      expect(prepareTaskArray(resultTasks)).toEqual(
        prepareTaskArray(expectedTasks)
      );
    });

    it("returns incomplete tasks from the target day when target day is after current day", () => {
      const tasks = [
        {
          id: 1,
          startDate: dayjs("2024-11-12"),
          endDate: dayjs("2024-11-13"),
          completedDate: dayjs("2024-11-13"),
        },
        {
          id: 2,
          startDate: dayjs("2024-11-14"),
          endDate: dayjs("2024-11-15"),
        },
        {
          id: 3,
          startDate: dayjs("2024-11-16"),
          endDate: dayjs("2024-11-17"),
          completedDate: dayjs("2024-11-18"),
        },
        {
          id: 4,
          startDate: dayjs("2024-11-18"),
          endDate: dayjs("2024-11-19"),
        },
        {
          id: 5,
          startDate: dayjs("2024-11-20"),
          endDate: dayjs("2024-11-21"),
        },
      ];
      const expectedTasks = [{ id: 4 }];
      const targetDay = dayjs("2024-11-18");
      const currentDay = dayjs("2024-11-16");
      const resultTasks = getTasksForDay(tasks, targetDay, currentDay);
      expect(prepareTaskArray(resultTasks)).toEqual(
        prepareTaskArray(expectedTasks)
      );
    });

    it("returns projected repeating tasks for the target day when target day is after current day", () => {
      const tasks = [
        {
          id: 1,
          startDate: dayjs("2024-11-12"),
          endDate: dayjs("2024-11-13"),
          // completedDate: dayjs("2024-11-13"),
          repeatDays: 6,
        },
        {
          id: 2,
          startDate: dayjs("2024-11-14"),
          endDate: dayjs("2024-11-15"),
        },
        {
          id: 3,
          startDate: dayjs("2024-11-16"),
          endDate: dayjs("2024-11-17"),
          completedDate: dayjs("2024-11-18"),
        },
        // {
        //   id: 4,
        //   startDate: dayjs("2024-11-18"),
        //   endDate: dayjs("2024-11-19"),
        // },
        {
          id: 5,
          startDate: dayjs("2024-11-20"),
          endDate: dayjs("2024-11-21"),
        },
        {
          id: 6,
          startDate: dayjs("2024-11-01"),
          endDate: dayjs("2024-11-01"),
          repeatDays: 1,
        },
      ];
      const expectedTasks = [{ id: 1 }, { id: 6 }];
      const targetDay = dayjs("2024-11-18");
      const currentDay = dayjs("2024-11-10");
      const resultTasks = getTasksForDay(tasks, targetDay, currentDay);
      expect(prepareTaskArray(resultTasks)).toEqual(
        prepareTaskArray(expectedTasks)
      );
    });
  });

  describe("getTasksForDayRange", () => {
    it.todo("");
  });

  describe("getLastPostponeUntilDay", () => {
    it("returns undefined when there are no actions", () => {
      const actions: ActionDto[] = [];
      const result = getLastPostponeUntilDay(actions as any[]); // TODO fix typing
      expect(result).toBeUndefined();
    });

    it("returns undefined when there are actions, but no postponements", () => {
      const actions: ActionDto[] = [
        {
          timestamp: "2024-10-01",
          mockActionTitle: "not a postponement",
        } as ActionDto,
      ];
      const result = getLastPostponeUntilDay(actions as any[]); // TODO fix typing
      expect(result).toBeUndefined();
    });

    it("returns the postponeUntilDate of the most recent postponement", () => {
      const mockLastPostponeUntilDate = dayjs("2024-10-25");
      const actions = [
        {
          timestamp: dayjs("2024-10-01"),
          mockActionTitle: "not a postponement",
        },
        {
          timestamp: dayjs("2024-10-02"),
          postponeUntilDate: dayjs("2024-10-20"),
        },
        {
          timestamp: dayjs("2024-10-03"),
          postponeUntilDate: mockLastPostponeUntilDate,
        },
        {
          timestamp: dayjs("2024-10-04"),
          mockActionTitle: "not a postponement",
        },
      ];
      const result = getLastPostponeUntilDay(actions as any[]); // TODO fix typing
      expect(result).toBe(mockLastPostponeUntilDate);
    });
  });

  describe("isPostponeDateValid", () => {
    it("returns false when the postpone day is not after the current date", () => {
      const task: Partial<Task> = {
        startDate: dayjs("2024-10-03"),
      };
      const postponeDay = dayjs("2024-10-04");
      const currentDay = dayjs("2024-10-05");
      const result = isPostponeDateValid(task as Task, postponeDay, currentDay);
      expect(result).toBe(false);
    });

    it("returns false when the postpone day is not after the task start date", () => {
      const task: Partial<Task> = {
        startDate: dayjs("2024-10-07"),
      };
      const postponeDay = dayjs("2024-10-06");
      const currentDay = dayjs("2024-10-05");
      const result = isPostponeDateValid(task as Task, postponeDay, currentDay);
      expect(result).toBe(false);
    });

    it("returns false when the postpone day is not after the task's last postponeUntilDate", () => {
      const task: Partial<Task> = {
        startDate: dayjs("2024-10-03"),
        actions: [
          {
            timestamp: dayjs("2024-10-01"),
            postponeUntilDate: dayjs("2024-10-08"),
          },
        ],
      };
      const postponeDay = dayjs("2024-10-06");
      const currentDay = dayjs("2024-10-05");
      const result = isPostponeDateValid(task as Task, postponeDay, currentDay);
      expect(result).toBe(false);
    });

    it("returns true when the postpone day is valid", () => {
      const task: Partial<Task> = {
        startDate: dayjs("2024-10-03"),
      };
      const postponeDay = dayjs("2024-10-06");
      const currentDay = dayjs("2024-10-05");
      const result = isPostponeDateValid(task as Task, postponeDay, currentDay);
      expect(result).toBe(true);
    });

    it("returns true when the postpone day is valid, even when the task has been postponed before", () => {
      const task: Partial<Task> = {
        startDate: dayjs("2024-10-03"),
        actions: [
          {
            timestamp: dayjs("2024-10-01"),
            postponeUntilDate: dayjs("2024-10-07"),
          },
        ],
      };
      const postponeDay = dayjs("2024-10-08");
      const currentDay = dayjs("2024-10-05");
      const result = isPostponeDateValid(task as Task, postponeDay, currentDay);
      expect(result).toBe(true);
    });
  });

  describe("sortTasksByStartDate", () => {
    it("sorts tasks", () => {
      const unsortedArray: Partial<Task>[] = [
        { startDate: dayjs("2024-10-03") },
        { startDate: dayjs("2024-10-01") },
        { startDate: dayjs("2024-10-08") },
        { startDate: dayjs("2024-10-02") },
        { startDate: dayjs("2024-10-06") },
      ];
      const expectedArray: Partial<Task>[] = [
        { startDate: dayjs("2024-10-01") },
        { startDate: dayjs("2024-10-02") },
        { startDate: dayjs("2024-10-03") },
        { startDate: dayjs("2024-10-06") },
        { startDate: dayjs("2024-10-08") },
      ];
      // need to clone unsortedArray since `Array.sort` mutates the input array
      const resultArray = ([...unsortedArray] as Task[]).sort(
        sortTasksByStartDate
      );
      const getStartDateValue = (e: Task) => e.startDate.valueOf();
      expect(resultArray.map(getStartDateValue)).toEqual(
        (expectedArray as Task[]).map(getStartDateValue)
      );
    });
  });

  describe("sortTasksByEndDate", () => {
    it("sorts tasks", () => {
      const unsortedArray: Partial<Task>[] = [
        { endDate: dayjs("2024-10-03") },
        { endDate: dayjs("2024-10-01") },
        { endDate: dayjs("2024-10-08") },
        { endDate: dayjs("2024-10-02") },
        { endDate: dayjs("2024-10-06") },
      ];
      const expectedArray: Partial<Task>[] = [
        { endDate: dayjs("2024-10-01") },
        { endDate: dayjs("2024-10-02") },
        { endDate: dayjs("2024-10-03") },
        { endDate: dayjs("2024-10-06") },
        { endDate: dayjs("2024-10-08") },
      ];
      // need to clone unsortedArray since `Array.sort` mutates the input array
      const resultArray = ([...unsortedArray] as Task[]).sort(
        sortTasksByEndDate
      );
      const getEndDateValue = (e: Task) => e.endDate.valueOf();
      expect(resultArray.map(getEndDateValue)).toEqual(
        (expectedArray as Task[]).map(getEndDateValue)
      );
    });
  });

  describe("sortTasksByRange", () => {
    it("sorts tasks", () => {
      const unsortedArray: Partial<Task>[] = [
        { rangeDays: 3 },
        { rangeDays: 1 },
        { rangeDays: 8 },
        { rangeDays: 2 },
        { rangeDays: 6 },
      ];
      const expectedArray: Partial<Task>[] = [
        { rangeDays: 1 },
        { rangeDays: 2 },
        { rangeDays: 3 },
        { rangeDays: 6 },
        { rangeDays: 8 },
      ];
      // need to clone unsortedArray since `Array.sort` mutates the input array
      const resultArray = ([...unsortedArray] as Task[]).sort(sortTasksByRange);
      expect(resultArray).toEqual(expectedArray);
    });
  });

  describe("sortTasksByTimeEstimate", () => {
    it("sorts tasks that all have time estimate", () => {
      const unsortedArray: Partial<Task>[] = [
        { timeEstimateMins: 30 },
        { timeEstimateMins: 0 },
        { timeEstimateMins: 15 },
        { timeEstimateMins: 80 },
        { timeEstimateMins: 5 },
        { timeEstimateMins: 15 },
      ];
      const expectedArray: Partial<Task>[] = [
        { timeEstimateMins: 0 },
        { timeEstimateMins: 5 },
        { timeEstimateMins: 15 },
        { timeEstimateMins: 15 },
        { timeEstimateMins: 30 },
        { timeEstimateMins: 80 },
      ];
      // need to clone unsortedArray since `Array.sort` mutates the input array
      const resultArray = ([...unsortedArray] as Task[]).sort(
        sortTasksByTimeEstimate
      );
      expect(resultArray).toEqual(expectedArray);
    });

    it("sorts tasks with no time estimate first", () => {
      const unsortedArray: Partial<Task>[] = [
        { timeEstimateMins: 60 },
        {},
        { timeEstimateMins: 15 },
        { timeEstimateMins: 80 },
        {},
        { timeEstimateMins: 15 },
      ];
      const expectedArray: Partial<Task>[] = [
        {},
        {},
        { timeEstimateMins: 15 },
        { timeEstimateMins: 15 },
        { timeEstimateMins: 60 },
        { timeEstimateMins: 80 },
      ];
      // need to clone unsortedArray since `Array.sort` mutates the input array
      const resultArray = ([...unsortedArray] as Task[]).sort(
        sortTasksByTimeEstimate
      );
      expect(resultArray).toEqual(expectedArray);
    });
  });

  describe("sortTasksByRepeatInterval", () => {
    it("sorts tasks that all have repeat interval", () => {
      const unsortedArray: Partial<Task>[] = [
        { repeatDays: 30 },
        { repeatDays: 0 },
        { repeatDays: 15 },
        { repeatDays: 80 },
        { repeatDays: 5 },
        { repeatDays: 15 },
      ];
      const expectedArray: Partial<Task>[] = [
        { repeatDays: 0 },
        { repeatDays: 5 },
        { repeatDays: 15 },
        { repeatDays: 15 },
        { repeatDays: 30 },
        { repeatDays: 80 },
      ];
      // need to clone unsortedArray since `Array.sort` mutates the input array
      const resultArray = ([...unsortedArray] as Task[]).sort(
        sortTasksByRepeatInterval
      );
      expect(resultArray).toEqual(expectedArray);
    });

    it("sorts tasks with no repeat interval first", () => {
      const unsortedArray: Partial<Task>[] = [
        { repeatDays: 60 },
        {},
        { repeatDays: 15 },
        { repeatDays: 80 },
        {},
        { repeatDays: 15 },
      ];
      const expectedArray: Partial<Task>[] = [
        {},
        {},
        { repeatDays: 15 },
        { repeatDays: 15 },
        { repeatDays: 60 },
        { repeatDays: 80 },
      ];
      // need to clone unsortedArray since `Array.sort` mutates the input array
      const resultArray = ([...unsortedArray] as Task[]).sort(
        sortTasksByRepeatInterval
      );
      expect(resultArray).toEqual(expectedArray);
    });
  });
});
