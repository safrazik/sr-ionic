import * as faker from 'faker';
import * as fs from 'fs';

function createRandomUser() {
	let gender = faker.name.prefix().indexOf('Mr.') !== -1 ? 'male' : 'female';
	return {
		first_name: faker.name.firstName(),
		last_name: faker.name.lastName(),
		address: faker.address.streetAddress(),
		lng: parseFloat(faker.address.longitude()),
		lat: parseFloat(faker.address.latitude()),
		email: faker.internet.email(),
		phone: faker.phone.phoneNumber(),
		description: faker.lorem.sentences(2),
		email_visible: faker.random.boolean() ? 1 : 0,
		phone_visible: faker.random.boolean() ? 1 : 0,
		gender_visible: faker.random.boolean() ? 1 : 0,
		gender: gender,
		title: faker.name.title(),
		region_id: faker.random.number({min: 1, max: 4}),
		category_id: faker.random.number({min: 1, max: 43}),
	};
}

function createUserSql(user){
	let sql = 'INSERT INTO users SET ';
	let fields = [];
	for(var field in user){
		fields.push(field + " = '" + user[field] + "'");
	}
	sql += fields.join(', ');
	return sql;
}

function getUserSql() {
	let sql = '';
	for(var i = 1; i <= 100; i++){
		let user = createRandomUser();
		sql += createUserSql(user);
		sql += ';\r\n\r\n';
		// console.log(sql);
		// console.log(JSON.stringify(user));
		// console.log(user);
	}
	return sql;
}


function getRateSql(){
	// let sql = "INSERT INTO rates SET value = '" + faker.random.number({min: 10, max: 550}) + "', user_id = '" + faker.random.number({min: 1, max: 483}) + "', rate_type_id = '" + faker.random.number({min: 1, max: 3}) + "'";
	let sql = "";
	for(var user_id = 1; user_id <= 483; user_id++){
		for(var rate_type_id = 1; rate_type_id <= faker.random.number({min: 1, max: 3}); rate_type_id++){
			sql += "INSERT INTO rates SET value = '" + faker.random.number({min: 10, max: 550}) + "', user_id = '" + user_id + "', rate_type_id = '" + rate_type_id + "'";
			sql += ';\r\n\r\n';
		}
	}
	return sql;
}


export function run(){
		// let fileContent = getUserSql();
		let fileContent = getRateSql();
		fs.writeFile('sql.txt', fileContent, function(err) {
	    if(err) {
	        console.log(err);
	        return;
	    }
	    console.log('sql file was saved!');
	});
}