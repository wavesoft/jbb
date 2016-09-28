import {NotImplementedError} from '../errors/Common';

export default class BundleReader {

  constructor() {
    this.s08 = null;
    this.s16 = null;
    this.s32 = null;
    this.s64 = null;
  }

  /**
   * This function is implemented by the child classes to open
   * the streams.
   */
  openStreams() {
    throw new NotImplementedError();
  }

};
