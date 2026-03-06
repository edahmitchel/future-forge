// // variableone = 1;
// clause = 2;
// clausetwo = 1 + 2;
// console.log(clausetwo);

// // var , let , const
// // var variabletwo = 23;
// // var variablethree;

// // console.log("var", variablethree);
// // let
// // let variableone;
// // console.log("ver", variableone);
// // variableone = 15;
// // console.log("ver2", variableone);
// // const

// // const variableone = 2;
// // console.log("ver", variableone);
// // variableone = 15;
// // console.log("ver2", variableone);
// // // operators

// // // assignment
// //  arri
// let sum = 2 + 2;
// console.log(sum);
// let sub = 4 - 4;
// let mul = 4 * 3;
// let dv = 8 / 2;
// let mod = 18 % 3;

// console.log(sum, sub, mul, dv, mod);
// // ass
// let x = 5;
// x = x + 4;
// x += 4;
// x -= 4;
// console.log(x);

// // comp

// let a = 2 == 2;
// let b = 2 === 2;
// let c = 2 != 2;
// let d = 2 !== 2;
// let e = 2 > 2;
// let f = 2 < 2;
// let g = 2 >= 2;
// let h = 2 <= 2;

// let m = 5 === "5";
// let n = 5 == "5";

// // logic

// let z = true && false;
// let y = true || false;
// let o = !true;

// console.log({ a, b, c, d, e, f, g, h, m, n, z, y, o });
// // 1- primitives

// // INT
// variableone = 1;
// clause = 2;

// // Bigint
// varInt = 1234567890123456789012345555555n;
// console.log(typeof varInt);

// // string
// STR = "two";
// strtwo = "2";
// console.log(typeof STR, typeof strtwo);

// // boolean

// BOOL = true;
// BOOL2 = false;

// console.log(typeof BOOL);

// // UNDEFINED
// var variablethree;

// console.log("var", variablethree);

// // NULL

// let nullval = null;
// console.log(nullval, typeof nullval);

// // Object types
// // 1. object
// let person = {
//   firstName: "mitch",
//   lastname: "Ayo",
//   sleeping: false,
//   age: 22,
// };
// console.log(person.sleeping);

// person.age = 52;
// console.log(person);

// // 2. array

// let arrcolors = ["pink", "yellow", "red"];
// console.log(arrcolors);
// arrcolors[0] = "green";
// console.log(arrcolors[0]);

// // 3 function
// let variableone = 6;
// {
//   {
//     // let variableone = 2;
//     console.log(variableone);
//   }
//   //   let variableone = 6;
//   console.log("secscope", variableone);
// }
// console.log("second", variableone);

// function read(params) {
//   return;
// }
// let varfun = read();
// console.log("rea", varfun);
// console.log(read);
// read();
// console.log(read());

// 4 set

// 5 map
// scope

//

let users = [];
let user1 = {
  firstName: "oma",
  balance: 300,
  isActive: true,
  call: function call(params) {
    console.log("hello");
  },
};
console.log(users);
users.push(user1);
console.log(users);
console.log(users[0]);

function createUser(name, balance) {
  return {
    name: name,
    balance: balance,
    isActive: true,
  };
}
let user2 = createUser("dee", 7000);
let user3 = createUser("ayo", 900);
console.log(user3);
users.push(user3);
console.log(users);
