%ExpandArgs(%ctx, %index, %group); // Expand inline arguments

/**
 * This fragment checks if value is numeric
 */
if (%ctx.valueType === 'number') {
  if (%group.length === 0) { %group.first = %index; }
  ++%group.length;

} else {

  // If bigger than all the sub-groups
  if ((groups[GROUP-1].length <= %group.length) &&
      (groups[GROUP-2].length <= %group.length)) {

    %groups.push(new NumericTypeGroup(%group));

  }

  // Reset group
  %group.length = 0;

}
