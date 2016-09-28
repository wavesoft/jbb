
export default class TypeIndex {

  constructor(typeSize = 1, offset = 0) {
    this.typeSize = typeSize;
    this.offset = offset / typeSize;
    this.typeOffset = offset;
  }

  next() {
    return this.offset++;
  }

  get offset() {

  }

  set offset(value) {

  }

};
