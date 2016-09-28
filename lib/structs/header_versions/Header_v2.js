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

const Header_v2 = {

  version: 2,

  fields: [
    { name: 'magic',      size: 2, fixed: 0x3142 },
    { name: 'version',    size: 1, fixed: 2 },
    { name: 'reserved',   size: 1 },
    { name: 's64_length', size: 4 },
    { name: 's32_length', size: 4 },
    { name: 's16_length', size: 4 },
    { name: 's8_length',  size: 4 },
    { name: 'fd_length',  size: 4 },
  ]

};

export default Header_v2;
