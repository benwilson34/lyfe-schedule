# Tasks

TODO image/anatomy of a task card

## Priority

Priority is automatically assigned based on a task's date(s).

- Blue tasks are upcoming or not pressing (yet).
- Yellow tasks are approaching their end date (only applies to tasks with a date range).
- Red tasks are overdue. The number of days they are overdue is shown next to the date(s) on the task card.

Tasks are sorted by their priority.

::: info
Planned feature: assignable priority
:::

::: info
Planned feature: different sort modes
:::

## Tags

::: info
Planned feature: a task can have zero or more tags. Add an entry in the sidebar for each existing tag; clicking on that
entry lets a user view all tasks with that tag (regardless of their date(s)).
:::

## Complete a task

Click on the white square on the left of a task card to complete it.

::: warning
There is currently no way to "un-complete" a task. I'm thinking about it.
:::

### Complete on a different day

Sometimes you forget to check something off that you did the other day - no problem, we can adjust for that.
For the task in question:

1. Click on the three dots on the right of the task card.
1. Click on **Complete on a previous day**.
1. In the calendar dialog, choose the day to complete the task and click **COMPLETE**.

If applicable, the task will repeat based on this chosen complete date.

## Changing the date of a task

Often, you know you're not going to do something today even though it's on your list. In general, this should be
handled by **postponing** the task, but the entire date range can also be "shifted" by **editing** the task.

### Postpone a task

Postponing a task effectively "moves" it to a day in the future without changing its date range. To postpone:

1. Click on the three dots on the right of the task card.
1. Under **Postpone to**, choose one of the quick days or choose "Another day" to choose a specific day.
1. If "Another day" was chosen, click the target day on the calendar picker dialog then click **POSTPONE**.

::: warning
There is currently no way to "un-postpone" a task. I'm thinking about it.
:::

### Change date range

This is generally discouraged, but if you want to change the entire date range for a task, you can do so by editing the task:

1. Click on the three dots on the right of the task card.
1. Click on **Edit**.
1. Choose the desired date(s) in the edit dialog then click **SAVE**.

::: info
Considered feature: easier "reschedule" action that keeps the number of days in the range but moves the start date.
:::

## Delete a task

If a task isn't needed anymore, it can be deleted:

1. Click on the three dots on the right of the task card.
1. Click on **Delete**.
1. Confirm that the title is the one you want to delete then click **DELETE**.

::: warning
There is currently no way to "un-delete" a task. This action is permanent.
:::

::: info
Considered feature: "soft delete" or recycle bin type pattern. When a user deletes a task, it actually goes to the "Trash" for some
set amount of time, maybe 30 days, before it's deleted for good. During that time, the user can recover the task from the Trash if
it was deleted by accident or another reason.
:::
