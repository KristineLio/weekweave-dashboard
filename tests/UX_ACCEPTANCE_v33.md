# v3.3 UI and UX acceptance checks

1. Overview explains value without a tutorial and shows the contextually correct next action; work-only days do not pressure users to schedule tasks.
2. Creating a 90-minute Study task shows suitable focus blocks first. A 60-minute block with 30 minutes free shows 60 minutes short.
3. Clicking Schedule here assigns the block and chooses the earliest nonoverlapping start time. The task is not saved until the user selects Save task.
4. Changing duration/category immediately recalculates suggestions. Busy blocks never appear in suggestions.
5. Save continues to use the shared capacity, time-overlap and completed-task rules.
6. Task details persist after refresh; merely viewing recommendations does not modify storage.
7. Six pages load at 320, 390, 768 and 1440 px without global horizontal overflow or JS errors.
8. Existing JSON backups, Compass evidence, and weekly review remain intact under `weekweave.v2`.