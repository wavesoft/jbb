%ExpandArgs(%ctx, %index, %group); // Expand inline arguments

/**
 * This fragment checks for small primitives
 */
if (if ((%ctx.value === null) || (%ctx.valueType === 'boolean') || (%ctx.valueType === 'undefined')) {
  if (%group.length === 0) { %group.first = %index; }
  ++%group.length;

} else {

  // If bigger than all the sub-groups
  if ((groups[GROUP-1].length <= %group.length) &&
      (groups[GROUP-2].length <= %group.length)) {

    groups.push(new SmallPrimitiveGroup(%group));

  }

  // Reset group
  %group.length = 0;

}
