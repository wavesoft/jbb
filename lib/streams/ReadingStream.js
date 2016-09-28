
export default class ReadingStream {

  constructor(signedClass, unsignedClass, typeSize) {
    this.offset = 0;
    this.signedClass = signedClass;
    this.unsignedClass = unsignedClass;
    this.typeSize = typeSize;

    this.buffer = null;
    this.signedView = null;
    this.unsignedView = null;
  }

  /**
   * Create a stream from buffer
   */
  setBuffer(buffer, offset = 0) {
    this.offset = offset;
    this.buffer = buffer;

    this.signedView = new this.signedClass( this.buffer, offset / this.typeSize );
    this.unsignedView = new this.unsignedClass( this.buffer, offset / this.typeSize );
  }

  /**
   * Return one component from the array and increment
   * index by one.
   */
  getOne() {
    return this.array[this.offset++];
  }

  getArray(length) {
    let offset = this.offset;
    this.offset += length;
    return this.subarray(offset, offset + length);
  }

};
