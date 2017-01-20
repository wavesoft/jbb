
# Writing a Fast Primitive Array Optimizer

Besides the numerical arrays, primitive arrays are the second most used types in JBB. Such arrays contain anything but numerical values, such as booleans, strings, or even mixed types. Optimally processing and storing them is of uttermost importance, since they play another cruicial role, storing each object properties.

JBB encoder uses the `PrimitiveArray` analyzer to find out what's the best way to chunk consecutive primtivies together in order for them to occupy the least possible space on disk, with the smallest performance impact.

There are six array types in JBB, that the array analyzer should try to match against. If we sort them by their disk size footprint, we have:

1. Arrays of repeating values
2. Arrays of numbers
3. Arrays of small primitives (Boolean, `null`, `undefiend`)
4. Arrays of plain objects with the same signature
5. Arrays of known objects of same type
6. Arrays of other primitives

`PrimitiveArray` was quite tricky to build, since I had to come up with a very fast yet optimal classification algorithm. Since any solution with complexity bigger than `O(n)` is out of the question, the complete analysis had to be done in a single pass.

This means that the item classification, optimal group selection and chunk forming has to be performed in a single pass. In the following paragraphs I am going to explain how this was achieved.

## Forming Chunks

To achieve rapid classification, the algorithm had to be quick on it's decisions. Since an item might belong to more than one chunk at the same time, it is tracking concurrently the status of 6 _intermediate_ chunks and on every iteration it decides which one to extend.

The actual information kept for every intermediate chunk is quite straightforward:

```js
{
	offset: 0,
	length: 0
}
```

When two consecutive items pass the conditions to belong in a chunk, it increments the length property of the respective intermediate chunk. But what happens if they don't? Of course the chunk length will be reset to zero length, but should we create an output chunk or not?

Let's illustrate this problem with the following example:

```js
var items1 = [1, 1, 1, 2, 2, 3, false, true, null ];
```

One way of groupping them would be to favour repetitions:

1. `[1, 1, 1]` : Repeating
2. `[2, 2]` : Repeating
3. `[3]` : Primtive
4. `[false, true, null]` : Small primitives

But another one would be to favour similar types:

1. `[1, 1, 1, 2, 2, 3]` : Numerical (`UINT8`)
2. `[false, true, null]` : Small primitives

Which one is more optimal? For sure the second one is faster, since fewer chunk headers will be written.

But what about this:

```js
var items2 = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, false ];
```

Again, if we favour repetitions we have this solution:

1. `[1, 1, 1, 1, 1, 1, 1, 1, 1, 1]` : Repeating
2. `[2, false]` : Primitives

Or the similar type solution:

1. `[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2]` : Numeric (`UINT8`)
2. `[false]` : Primitive

However this time, the first one is better. The number is repeating enough times to make the use of the repeating group more performant than the use of the numerical group.

So how can the algorhtm pick the correct solution?

### Weighting

Since all of the previous decisions were based on the disk size footprint let's introduce a _weight_ property for each intermediate chunk. The bigger the disk footprint, the bigger the weight should be.

With this extra pice of information in mind, let's have a look on the last example once again:

```js
var items2 = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, false ];
```

While processing it, and while on the 10rd item, the intermediate chunks would have accepted the following items

* Repeating: `1, 1, 1, 1, 1, 1, 1, 1, 1, 1`
* Numeric: `1, 1, 1, 1, 1, 1, 1, 1, 1, 1`

Then 11th item `2` arrives the "Repeating" chunk will have to reset. But should the algorithm now extract the "Repeating" chunk into the output, or should it just ignore it and keep stacking numbers in the "Numeric" Chunk? 

Adding a _weight_ value to help us decide, we realize that the "Repeating" chunk has constant size, so we assign the constant number `2` (1 header + 1 data), while the "Numeric" chunk weight depends on it's length, so we assign the expression `1 + length`. Therefore:

* Repeating: `1, 1, 1, 1, 1, 1, 1, 1, 1, 1`, w = 2
* Numeric: `1, 1, 1, 1, 1, 1, 1, 1, 1, 1`, w = 11

Which makes the first option more size-efficient. This means that since the "Repeating" chunk is about to collapse, and it's weight is the smallest amongst the _intermediate_ chunks, it should be extracted to the output. Note that this action will also reset all the currently tracked chunks.

### Calculating the weights

In the previous paragraph we tried to estimate the weight for the "Repeating" and "Numeric" chunks. But let's elaborate a bit more on all the different chunk types:

* **Repeat** chunks have a `O(1)` memory footprint, since we keep only the first item of the list. However we also need a header and a repeat counter, so their weight should be `1 + 1 + 1 = 3`

* **Number** and **Object** (Known or Plain) chunks nave a `O(n)` memory footprint and they also need a header, so it's weight should be `1 + length`

* **Small primitive** chunks occupy 2 bits per element. So they have a `O(n/4)` memory footprint. Adding the header, their weight is `1 + length/4`.

* **Other primitive** chunks needs an additional op-code for every element, costing `O(2n)` memory. Adding a header, their weight is `1 + 2*length`

We can ommit the header since it appears in all the expressions, so we have the following summarised table of weights for the individual chunk types: 

| Chunk Type               | Weight     |
|--------------------------|------------|
| Repeat                   | `2`        |
| Numeric                  | `length`   |
| Objects (Known or Plain) | `length`   |
| Small Primitives         | `length/4` |
| Other Primitives         | `2*length` |

## Classification

Now that we know when to create groups, let's focus a bot on how we are going to classify the items on a single pass. 

Since we are groupping items together, we only care about any two consecutive items: the `previous` and the `current`. This looks like a sliding window with size=2, so let's have this repersentation in mind:

<table>
	<tr>
		<td>...</td>
		<td><code>previous</code></td>
		<td><code>current</code></td>
		<td>...</td>
	</tr>
</table>

And if you consider that we need one flag (accepter or not accepted) for every intermediate chunk, we could consider using a Finite State Machine to model the classifier.

Such FSM will have 2 values as input and 1 value as output. They must also be _resetable_, since they must be restarted when a chunk is formed. Let's try to create a State Transition Table for this FSM:



Now we only need to decide to which chunks these two items belong into.

Using this frame and an optional state object, each classifier has to come up with some result. For example, implementing the 'Repeat' classifier is quite straightforward:

```js
if (last === current) {
	// Start new chunk if new
	// Increment length by 1
} else {
	// Emmit group to output
	// Reset group
}
```



Any of these consecutive items can belong to one or more groups. So, for every step we have to check in which group an item belongs and to form the output groups.

The first task is quite easy: for every step, the group classification rules will be applied on the current window, deciding if the two items are compatible or not. If they are, the length of the respective group is incremented.

```js
let collapse = null;

...

if (conditionA) {
  if (groupA.length === 0) {
    groupA.offset = i;
  }
  ++groupA.length;
} else if (groupA.length !== 0) {
  if ((groupA.weight < groupB.weight) && 
      (groupA.weight < groupC.weight) ... ) {
    groups.push(new Group(groupA));
    reset = true;
  }
  groupA.length = 0;
}

...


```
