let abc: string;

abc = '8tech00';

// npm run task hello Safraz 26
export function run(name, age = 16) {
	name = name || abc;
	console.log('Hello ' + name + '. You are ' + age + ' years old!');
}