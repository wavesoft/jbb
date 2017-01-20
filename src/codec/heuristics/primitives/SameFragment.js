
const a = function(a, b, c) {
  console.log(a + 1, b * c / 2, some_function(c, a));
  if (c) {
    if (b) {
      for (var a = 0; a < 4; a++) {
        if (a == 3) {
          return 'foo';
        }
      }
    }
    return a + 5;
  }
}

function state(a, b, c) {
  for (var i=0; i<3; i++) {
    console.log(i);
  }
}

function open(ctx, state) {
  return ctx + state;
}

export function context(ctx, state) {
  return {a:1, b:2};
}

module.exports = {
  state,
  newfn: a,
  bok(a,b,c) {

  },
  key: function(a,b,c) {

  }
};

// export default class Book {

//   static namec(a,b,c) {

//   }

// }

