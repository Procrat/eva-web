/* eslint-disable import/prefer-default-export */

/**
 * A mixin providing equality and comparison functions, assuming the result of
 * valueOf() is comparable.
 */
export function TotalOrderMixin(Base) {
  return class extends Base {
    eq(other) {
      return this.constructor === other.constructor
        && this.valueOf() === other.valueOf();
    }

    ne(other) {
      return !this.eq(other);
    }

    lt(other) {
      console.assert(this.constructor === other.constructor);
      return this.valueOf() < other.valueOf();
    }

    le(other) {
      return this.lt(other) || this.eq(other);
    }

    gt(other) {
      return !this.le(other);
    }

    ge(other) {
      return !this.lt(other);
    }
  };
}
