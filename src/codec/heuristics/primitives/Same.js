%ExpandArgs(%ctx, %index, %group); // Expand inline arguments

/**
 * This fragment checks if consecutive values are the same
 */
if (%ctx.value === %ctx.lastValue) {
  if (%group.length === 0) { %group.first = %index; }
  ++%group.length;

} else {

  // If bigger than all the sub-groups
  if ((groups[GROUP-1].length <= %group.length) &&
      (groups[GROUP-2].length <= %group.length)) {

    groups.push(new SameTypeGroup(%group));

  }

  // Reset group
  %group.length = 0;

}
