/**
 * JBB - Javascript Binary Bundles - Chunk Classifiers
 * Copyright (C) 2015 Ioannis Charalampidis <ioannis.charalampidis@cern.ch>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @author Ioannis Charalampidis / https://github.com/wavesoft
 */

/**
 * Generates the initial state for the repeated chunk classifier
 */
export function newState(analysisGroup) {
  return {
    first: 0,
    length: 0,
    group: analysisGroup
  };
}

/**
 * Checks if the current frame passes the test
 */
export function check(ctx, state, obj_byval_comparision) {
  return (ctx.value === ctx.lastValue) || (ctx.lastValue === undefined) ||
         ((ctx.valueType === 'object') && obj_byval_comparision && deepEqual(ctx.value, ctx.lastValue));
}

/**
 * Advances the chunk length by one item
 */
export function advance(state) {
  if (state.length === 0) state.first = i;
  ++state.length;
}

/**
 * Resets the chunk
 */
export function reset(state) {
  state.length = 0;
}
