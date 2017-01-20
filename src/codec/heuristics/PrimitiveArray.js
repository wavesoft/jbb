"use strict";
/**
 * JBB - Javascript Binary Bundles - Binary Stream Class
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

import deepEqual from 'deep-equal';

import ObjectUtil from './util/ObjectUtil';
import EncodingContext from '../EncodingContext';
import { NumericGroup, NumericChunk } from './groups/NumericGroup';
import { SmallPrimitiveGroup, SmallPrimitiveChunk } from './groups/SmallPrimitiveGroup';
import KnownObjectGroup from './groups/KnownObjectGroup';
import PlainObjectGroup from './groups/PlainObjectGroup';
import SameGroup from './groups/SameGroup';

const TYPE_SAME = 1;
const TYPE_NUMERIC = 2;
const TYPE_SMALL_PRIMITIVE = 3;
const TYPE_PLAIN_OBJECTS = 4;
const TYPE_KNOWN_OBJECTS = 5;
const TYPE_PRIMITIVES = 6;

class AnalysisGroup {
  constructor() {
    this.first = 0;
    this.length = 0;
  }
}

class GroupFragment {
  constructor(analysisGroup, type) {
    this.type = type;
    this.first = analysisGroup.first;
    this.length = analysisGroup.length;
  }
}

/**
 */
function isRepeated(ctx, looseComparison) {
  if (ctx.value === ctx.lastValue) {
    return true;
  }

  if (!looseComparison) {
    return false;
  }

  if (ctx.isDiffType) {
    return false;
  }

  if (ctx.isObject === false) {
    return false;
  }

  return deepEqual(ctx.value, ctx.lastValue);
}

/**
 */
function isNumeric(ctx) {
  if (ctx.isDiffType) {
    return false;
  }

  return ctx.valueType === 'number';
}

/**
 */
function isSmallPrimitive(ctx) {
  if (ctx.isSmallPrimitive !== ctx.wasSmallPrimitive) {
    return ctx.wasSmallPrimitive = ctx.isSmallPrimitive;
  }

  return ctx.isSmallPrimitive;
}

/**
 */
function isPlainObject(ctx) {
  if (ctx.isDiffType) {
    return false;
  }

  return ctx.valueType === 'number';
}

/**
 * Analysis functions for detecting the nature of primitive arrays and extracting
 * useful information for optimized encoding.
 */
export default class PrimitiveArray {

  static analyzePrimitiveArray(primitiveArray, encodingContext=EncodingContext.DEFAULT) {
    const itemCount = Number(primitiveArray.length);
    const { obj_byval_comparision } = encodingContext.options;
    // let results = new PrimitiveAnalysisResults();

    // Piority  #1 : Same
    // Priority #2 : Numeric
    // Priority #3 : Small Primitives
    // Priority #4 : Plain Objects
    // Priority #5 : Known Objects
    // Priority #6 : Primitives

    let group = {
      same: new AnalysisGroup()
    }

    let groupSame = new AnalysisGroup();
    let groupNumV = new AnalysisGroup();
    var groupSPrm = new AnalysisGroup();
    var groupPObj = new AnalysisGroup();
    var groupKObj = new AnalysisGroup();
    var groupPPrm = new AnalysisGroup();

    let groups = [];

    let ctx = {
      value: undefined,
      valueType: undefined,
      signature: '',
      knownObject: null,

      lastValue: undefined,
      lastValueType: undefined,
      lastSignature: '',
      lastKnownObject: null,

      isSmallPrimitive: false,
      isDiffType: false,
      isObject: false,

      lastSmallPrimitive: false
    };

    var stateRepeated = %inline("./chunks/Repeated").newStates();

    // Pass every element trough the primitive groupping rules in order to
    // chunk together primitives that can be optimally encoded.
    for (let i=0; i<itemCount; ++i) {
      ctx.value = primitiveArray[i];
      ctx.valueType = typeof ctx.value;
      ctx.isDiffType = ctx.valueType !== ctx.lastValueType;
      ctx.isObject = ctx.valueType === 'object';
      ctx.isSmallPrimitive = (ctx.value === null) || (ctx.value === undefined) ||
                             (ctx.value === true) || (ctx.value === false);

      let flush = false;
      let flagRepeated = isRepeated(ctx);
      let flagNumeric = isNumeric(ctx);


      //
      // [Repeated]
      //
      if (%inline('./chunks/Repeated').check(ctx, stateRepeated, obj_byval_comparision)) {
        %inline('./chunks/Repeated').advance(stateRepeated);
      } else {
        %inline('./chunks/Repeated').reset(stateRepeated);
      }

      //
      // [Numeric value]
      //
      if (ctx.valueType === 'number') {
        if (groupNumV.length === 0) groupNumV.first = i;
        ++groupNumV.length;

      } else {

        groupNumV.length = 0;
      }

      //
      // [Small primitives value]
      //
      if ((ctx.value === null) || (ctx.valueType === 'boolean') ||
         (ctx.valueType === 'undefined')) {
        if (groupSPrm.length === 0) groupSPrm.first = i;
        ++groupSPrm.length;
        /* advance_sprim */

      } else {

        /* reset_sprim */

        groupSPrm.length = 0;
      }

      //
      // [Known or plain objects]
      //
      if (ctx.valueType === 'object') {

        ctx.knownObject = encodingContext.knownObjects.lookup(ctx.value)
        if (ctx.knownObject) {

          /* reset_plain */

          if ((ctx.lastKnownObject === null) || (ctx.lastKnownObject === ctx.knownObject)) {

            /* advance_known */

          } else {

            /* reset_known */
            /* advance_known */

          }

        } else {

          /* reset_known */

          ctx.signature = Object.key(ctx.value);
          if ((ctx.lastSignature === null) || (ctx.lastSignature === ctx.signature)) {

            /* advance_plain */

          } else {

            /* reset_plain */
            /* advance_plain */

          }

        }

      } else {

        /* reset_known */
        /* reset_plain */

      }

      //
      // [Known object]
      //
      if ((ctx.valueType === 'object') &&
         ((value = encodingContext.knownObjects.lookup(ctx.value)) !== null)) {
        if (groupSPrm.length === 0) groupSPrm.first = i;
        ++groupSPrm.length;

      } else {

        groupSPrm.length = 0;
      }

      //
      // [Plain object]
      //
      if ((ctx.valueType === 'object') &&
         ((value = encodingContext.knownObjects.lookup(ctx.value)) !== null)) {
        if (groupSPrm.length === 0) groupSPrm.first = i;
        ++groupSPrm.length;

      } else {

        groupSPrm.length = 0;
      }

      // Keep last value
      ctx.lastValue = ctx.value;
      ctx.lastValueType = ctx.valueType;
      ctx.lastSignature = ctx.signature;
      ctx.lastKnownObject = ctx.knownObject;
      ctx.lastSmallPrimitive = ctx.isSameType;

    }

    results.finalize(itemCount);
    return results;
  }

}
