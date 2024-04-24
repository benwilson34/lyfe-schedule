# Views

<!-- There are multiple views of tasks that LyfeSchedule offers. -->

## Calendar view

This is the main task view. Click a day in the calendar to view the tasks assigned to that day.
Repeating tasks will be "projected" onto future days.

TODO instructions on the calendar widget? Like that you can click the month to drill up?

### Projected repeating tasks

LyfeSchedule automatically "projects" repeating tasks into the future. This means that a repeating 
task's configuration and current conditions are used to calculate the next time it will appear. These are
the assumptions made in order to calculate this:

1. If the task is on today's list, we assume it will be completed today.
1. If the task is in the future (based on its date(s) or postponements), we assume it will be completed that day.

::: info
Considered feature: allow the user to configure this projection calculation, for example by using the average complete
date instead of the first available complete date.
:::

::: info
Considered feature: for a given repeating task, show a list of the next projected repeat dates.
:::
